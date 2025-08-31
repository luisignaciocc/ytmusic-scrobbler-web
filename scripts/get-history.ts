import {
  fetchYTMusicHistoryPage,
  parseYTMusicPageResponse,
  getYTMusicHistoryFromPage,
} from "../apps/worker/src/utils/functions";
import * as fs from "fs";

// Define your YouTube Music cookie here
const cookie = ``;

async function main() {
  try {
    console.log("=== Testing YouTube Music Page Parsing Functions ===");
    console.log(`Cookie length: ${cookie.length} characters\n`);

    // Test 1: Fetch the HTML page
    console.log("1. Testing fetchYTMusicHistoryPage...");
    const html = await fetchYTMusicHistoryPage(cookie);
    console.log(`✅ Successfully fetched HTML page`);
    console.log(`   HTML size: ${html.length} characters`);

    // Save the raw HTML for inspection
    fs.writeFileSync("./yt-music-page.html", html);
    console.log(`   Raw HTML saved to ./yt-music-page.html`);

    // Also save the decoded data from the second entry for manual inspection
    const allPushRegex = /initialData\.push\(\{[^}]*data:\s*'([^']+)'/g;
    const matches = [...html.matchAll(allPushRegex)];
    if (matches.length > 1) {
      const hexData = matches[1][1]; // Second entry
      const decoded = hexData.replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
      });
      fs.writeFileSync("./yt-music-decoded-data.json", decoded);
      console.log(
        `   Decoded data from entry 2 saved to ./yt-music-decoded-data.json\n`,
      );
    }

    // Test 2: Parse the HTML to extract data
    console.log("2. Testing parseYTMusicPageResponse...");
    const songs = parseYTMusicPageResponse(html);
    console.log(`✅ Successfully parsed page data`);
    console.log(`   Found ${songs.length} songs in history`);

    if (songs.length > 0) {
      console.log(`   First song example:`);
      console.log(`   - Title: ${songs[0].title}`);
      console.log(`   - Artist: ${songs[0].artist}`);
      console.log(`   - Album: ${songs[0].album}`);
      console.log(`   - Played at: ${songs[0].playedAt || "Unknown"}`);
    }

    // Save the parsed songs
    const songsPath = "./yt-music-parsed-songs.json";
    fs.writeFileSync(songsPath, JSON.stringify(songs, null, 2));
    console.log(`   Parsed songs saved to ${songsPath}\n`);

    // Test 3: Test the convenience function
    console.log(
      "3. Testing getYTMusicHistoryFromPage (convenience function)...",
    );
    const songsFromConvenience = await getYTMusicHistoryFromPage({ cookie });
    console.log(`✅ Convenience function works!`);
    console.log(
      `   Found ${songsFromConvenience.length} songs (should match previous result)`,
    );

    // Save convenience function result
    const conveniencePath = "./yt-music-convenience-result.json";
    fs.writeFileSync(
      conveniencePath,
      JSON.stringify(songsFromConvenience, null, 2),
    );
    console.log(`   Convenience result saved to ${conveniencePath}`);

    console.log("\n=== Summary ===");
    console.log(`✅ All functions working correctly!`);
    console.log(`📊 Total songs found: ${songs.length}`);
    console.log(`📁 Files created:`);
    console.log(`   - ./yt-music-page.html (raw HTML)`);
    console.log(`   - ./yt-music-parsed-songs.json (parsed songs)`);
    console.log(
      `   - ./yt-music-convenience-result.json (convenience function result)`,
    );
  } catch (error) {
    console.error("❌ Error testing YouTube Music page parsing:");
    console.error(error);
    process.exit(1);
  }
}

main();
