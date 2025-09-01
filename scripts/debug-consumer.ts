import { PrismaClient } from "@prisma/client";
import {
  getYTMusicHistoryFromPage,
  scrobbleSong,
} from "../apps/worker/src/utils/functions";
import { 
  isTodaySong, 
  isYesterdaySong,
  getUnknownDateValues, 
  detectDateValue,
  getAllTodayVariants,
  getAllYesterdayVariants 
} from "../apps/worker/src/utils/date-detection";

const prisma = new PrismaClient();

async function debugConsumerForUser(email: string) {
  console.log(`=== Debugging Consumer Process for ${email} ===\n`);

  try {
    // 1. Find the user
    console.log("1. Finding user...");
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }

    console.log(`✅ User found: ${user.name} (ID: ${user.id})`);
    console.log(`   - Last.fm Username: ${user.lastFmUsername}`);
    console.log(`   - Has Last.fm Session Key: ${!!user.lastFmSessionKey}`);
    console.log(`   - Has YT Music Cookie: ${!!user.ytmusicCookie}`);
    console.log(
      `   - Cookie length: ${user.ytmusicCookie?.length || 0} characters`,
    );
    console.log(
      `   - Notifications enabled: ${user.notificationsEnabled !== false}`,
    );
    console.log(
      `   - Last notification sent: ${user.lastNotificationSent || "Never"}`,
    );
    console.log(
      `   - Last successful scrobble: ${user.lastSuccessfulScrobble || "Never"}\n`,
    );

    // 2. Check environment variables
    console.log("2. Checking environment variables...");
    const { LAST_FM_API_KEY, LAST_FM_API_SECRET } = process.env;

    if (!LAST_FM_API_KEY) {
      console.log("❌ Missing LAST_FM_API_KEY");
      return;
    }
    if (!LAST_FM_API_SECRET) {
      console.log("❌ Missing LAST_FM_API_SECRET");
      return;
    }
    console.log("✅ Environment variables present\n");

    // 3. Check user credentials
    console.log("3. Validating user credentials...");
    if (!user.lastFmSessionKey) {
      console.log("❌ User has no Last.fm session key");
      return;
    }
    console.log("✅ Last.fm session key present");

    if (!user.ytmusicCookie) {
      console.log("❌ User has no YouTube Music cookie");
      return;
    }
    console.log("✅ YouTube Music cookie present\n");

    // 4. Try to fetch YouTube Music history
    console.log("4. Fetching YouTube Music history...");
    let songs: {
      title: string;
      artist: string;
      album: string;
      playedAt?: string;
    }[] = [];

    try {
      songs = await getYTMusicHistoryFromPage({
        cookie: user.ytmusicCookie,
      });
      
      if (songs.length === 0) {
        console.log(`⚠️  SILENT AUTH FAILURE: Request succeeded but returned 0 songs`);
        console.log(`   🔍 This indicates invalid/expired credentials without HTTP error`);
        console.log(`   🔍 User would be auto-deactivated after 3 consecutive failures`);
        return;
      }
      
      console.log(
        `✅ Successfully fetched ${songs.length} songs from YouTube Music`,
      );

      // Show some examples
      if (songs.length > 0) {
        console.log("\n   📱 Recent songs from YT Music:");
        songs.slice(0, 5).forEach((song, i) => {
          console.log(
            `   ${i + 1}. "${song.title}" by ${song.artist} - ${song.playedAt || "Unknown time"}`,
          );
        });
      }
    } catch (error) {
      console.log(`❌ Failed to fetch YouTube Music history:`);
      console.log(`   Error: ${error.message}`);

      // Analyze the error
      if (
        error.message?.includes("401") &&
        error.message?.includes("UNAUTHENTICATED")
      ) {
        console.log("   🔍 Analysis: Authentication credentials expired");
      } else if (
        error.message?.includes("Headers.append") &&
        error.message?.includes("invalid header value")
      ) {
        console.log("   🔍 Analysis: YouTube Music headers are malformed");
      } else if (
        error.message?.includes("Failed to fetch YouTube Music history page")
      ) {
        console.log("   🔍 Analysis: Network or server error");
      } else {
        console.log("   🔍 Analysis: Unknown error type");
      }

      console.log(`\n   📋 Full error details:`);
      console.log(error);
      return;
    }

    // 5. Get songs from database
    console.log("\n5. Fetching saved songs from database...");
    const songsOnDB = await prisma.song.findMany({
      where: { userId: user.id },
    });
    console.log(`✅ Found ${songsOnDB.length} songs in database for this user`);

    // Show some examples from DB
    if (songsOnDB.length > 0) {
      console.log("\n   💾 Recent songs from database:");
      songsOnDB.slice(0, 5).forEach((song, i) => {
        console.log(
          `   ${i + 1}. "${song.title}" by ${song.artist} - Position: ${song.arrayPosition}`,
        );
      });
    }

    // 6. Comprehensive date analysis with multilingual support
    console.log("\n6. Advanced multilingual date analysis...");
    
    // Show all unique values found
    const playedAtValues = new Set(songs.map(song => song.playedAt).filter(Boolean));
    console.log(`📊 Unique playedAt values found: ${Array.from(playedAtValues).join(', ')}`);
    
    // Detect and categorize all songs
    const todaySongs = songs.filter(song => isTodaySong(song.playedAt));
    const yesterdaySongs = songs.filter(song => isYesterdaySong(song.playedAt));
    const unknownValues = getUnknownDateValues(songs);
    
    console.log(`✅ Found ${todaySongs.length} songs played TODAY`);
    console.log(`📅 Found ${yesterdaySongs.length} songs played YESTERDAY`);
    
    if (unknownValues.length > 0) {
      console.log(`❓ Unknown date formats found: ${unknownValues.join(', ')}`);
      console.log(`   Please report these to admin for future updates!`);
    }
    
    // Show language detection for today's songs
    if (todaySongs.length > 0) {
      const detectedLanguages = new Set<string>();
      todaySongs.forEach(song => {
        const detection = detectDateValue(song.playedAt);
        if (detection.detectedLanguage) {
          detectedLanguages.add(`${detection.originalValue} (${detection.detectedLanguage})`);
        }
      });
      
      if (detectedLanguages.size > 0) {
        console.log(`🌍 Language detection for today: ${Array.from(detectedLanguages).join(', ')}`);
      }
    }
    
    console.log(`\n📚 System supports ${getAllTodayVariants().length} "Today" translations and ${getAllYesterdayVariants().length} "Yesterday" translations`);
    
    // Filter today's songs for scrobbling analysis
    console.log("\n7. Analyzing today's songs for scrobbling...");

    if (todaySongs.length > 0) {
      console.log("\n   🎵 Today's songs:");
      todaySongs.slice(0, 10).forEach((song, i) => {
        console.log(`   ${i + 1}. "${song.title}" by ${song.artist}`);
      });
    }

    // 8. Check which songs would be scrobbled
    console.log("\n8. Analyzing which songs would be scrobbled...");
    let songsToScrobble = 0;
    let newSongs = 0;
    let repositionedSongs = 0;

    for (let i = 0; i < todaySongs.length; i++) {
      const song = todaySongs[i];
      const songsReproducedToday = i + 1;

      if (songsOnDB.length === 0) {
        // First time - no songs would be scrobbled
        newSongs++;
        continue;
      }

      const savedSong = songsOnDB.find(
        (dbSong) =>
          dbSong.title === song.title &&
          dbSong.artist === song.artist &&
          dbSong.album === song.album,
      );

      if (!savedSong) {
        // New song - would be scrobbled
        songsToScrobble++;
        newSongs++;
        console.log(
          `   🆕 NEW: "${song.title}" by ${song.artist} (would scrobble)`,
        );
      } else if (savedSong.arrayPosition > songsReproducedToday) {
        // Song moved up in position - would be scrobbled again
        songsToScrobble++;
        repositionedSongs++;
        console.log(
          `   🔄 REPOSITIONED: "${song.title}" by ${song.artist} (${savedSong.arrayPosition} -> ${songsReproducedToday}, would scrobble)`,
        );
      }
    }

    console.log(`\n   📊 Summary:`);
    console.log(`   - Songs that would be scrobbled: ${songsToScrobble}`);
    console.log(`   - New songs: ${newSongs}`);
    console.log(`   - Repositioned songs: ${repositionedSongs}`);

    if (songsOnDB.length === 0) {
      console.log(
        `   ℹ️  First-time user: No songs would be scrobbled (initialization mode)`,
      );
    }

    // 9. Test Last.fm scrobbling (optional - just test one song)
    if (songsToScrobble > 0 && todaySongs.length > 0) {
      console.log("\n9. Testing Last.fm scrobbling with one song...");
      const testSong = todaySongs[0];

      try {
        const scrobbleResult = await scrobbleSong({
          song: testSong,
          lastFmApiKey: LAST_FM_API_KEY,
          lastFmApiSecret: LAST_FM_API_SECRET,
          lastFmSessionKey: user.lastFmSessionKey!,
          timestamp: Math.floor(Date.now() / 1000).toString(),
        });

        console.log(
          `✅ Test scrobble ${scrobbleResult ? "succeeded" : "failed"} for "${testSong.title}"`,
        );
      } catch (scrobbleError) {
        console.log(`❌ Test scrobble failed: ${scrobbleError.message}`);
      }
    }

    console.log("\n=== Debug Complete ===");
  } catch (error) {
    console.log(`❌ Unexpected error during debugging:`);
    console.log(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log("Usage: tsx scripts/debug-consumer.ts <email>");
  console.log(
    "Example: tsx scripts/debug-consumer.ts luisignacioccp@gmail.com",
  );
  process.exit(1);
}

debugConsumerForUser(email);
