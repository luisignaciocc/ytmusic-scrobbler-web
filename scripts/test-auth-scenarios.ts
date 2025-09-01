import { getYTMusicHistoryFromPage } from "../apps/worker/src/utils/functions";

/**
 * Script to test different authentication scenarios with YouTube Music
 * to identify cases where requests succeed but return empty/invalid data
 */

async function testAuthScenario(name: string, cookie: string | null) {
  console.log(`\n=== Testing: ${name} ===`);
  
  try {
    if (!cookie) {
      console.log("❌ No cookie provided, skipping test");
      return;
    }

    console.log(`🔍 Cookie length: ${cookie.length} characters`);
    console.log(`🔍 Cookie preview: ${cookie.substring(0, 100)}...`);
    
    const startTime = Date.now();
    const songs = await getYTMusicHistoryFromPage({ cookie });
    const endTime = Date.now();
    
    console.log(`✅ Request completed in ${endTime - startTime}ms`);
    console.log(`📊 Songs returned: ${songs.length}`);
    
    if (songs.length === 0) {
      console.log("⚠️  WARNING: No songs returned - possible auth issue!");
    } else {
      console.log(`🎵 Sample songs:`);
      songs.slice(0, 3).forEach((song, i) => {
        console.log(`   ${i + 1}. "${song.title}" by ${song.artist} - ${song.playedAt}`);
      });
      
      // Analyze playedAt values
      const playedAtValues = new Set(songs.map(s => s.playedAt).filter(Boolean));
      console.log(`📅 Unique playedAt values: ${Array.from(playedAtValues).join(', ')}`);
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    console.log(`🔍 Error type: ${error.constructor.name}`);
    
    // Analyze error patterns
    if (error.message.includes('401')) {
      console.log("🔍 Analysis: 401 Unauthorized - Clear auth failure");
    } else if (error.message.includes('Headers.append')) {
      console.log("🔍 Analysis: Invalid header format");
    } else if (error.message.includes('Failed to fetch')) {
      console.log("🔍 Analysis: Network/connection issue");
    } else {
      console.log("🔍 Analysis: Unknown error pattern");
    }
  }
}

async function main() {
  console.log("🧪 YouTube Music Authentication Scenarios Tester");
  console.log("=".repeat(60));
  
  // Get a valid cookie from environment or user input
  const validCookie = process.env.VALID_COOKIE || process.argv[2];
  
  if (!validCookie) {
    console.log("❌ No valid cookie provided. Usage:");
    console.log("   tsx scripts/test-auth-scenarios.ts '<your-valid-cookie>'");
    console.log("   or set VALID_COOKIE environment variable");
    process.exit(1);
  }
  
  // Test 1: Valid cookie (baseline)
  await testAuthScenario("Valid Cookie (Baseline)", validCookie);
  
  // Test 2: Empty cookie
  await testAuthScenario("Empty Cookie", "");
  
  // Test 3: Null cookie
  await testAuthScenario("Null Cookie", null);
  
  // Test 4: Malformed cookie (random string)
  await testAuthScenario("Random String Cookie", "invalid_random_cookie_123456789");
  
  // Test 5: Partially corrupted cookie (remove last 100 chars)
  const partialCookie = validCookie.slice(0, -100);
  await testAuthScenario("Partially Corrupted Cookie", partialCookie);
  
  // Test 6: Cookie with wrong domain/format but valid-looking
  const fakeCookie = validCookie.replace(/__Secure-3PAPISID=[^;]+/, "__Secure-3PAPISID=fake_value_12345");
  await testAuthScenario("Fake PAPISID Cookie", fakeCookie);
  
  // Test 7: Very old cookie format (simulate expired)
  const expiredLookingCookie = validCookie.replace(/SAPISID=[^;]+/, "SAPISID=expired_session_123");
  await testAuthScenario("Expired-Looking Cookie", expiredLookingCookie);
  
  // Test 8: Cookie with missing essential parts
  const incompleteCookie = validCookie.split(';').slice(0, 3).join(';'); // Take only first 3 parts
  await testAuthScenario("Incomplete Cookie", incompleteCookie);
  
  // Test 9: Cookie with extra spaces/formatting issues
  const malformattedCookie = validCookie.replace(/;/g, ' ; ').replace(/=/g, ' = ');
  await testAuthScenario("Malformatted Cookie (extra spaces)", malformattedCookie);
  
  console.log("\n" + "=".repeat(60));
  console.log("🎯 KEY INSIGHTS TO LOOK FOR:");
  console.log("   • Cases where request succeeds but returns 0 songs");
  console.log("   • Cases where response looks valid but is actually empty");
  console.log("   • Silent authentication failures that don't throw errors");
  console.log("   • Patterns we should add to our error detection logic");
  console.log("=".repeat(60));
}

main().catch(console.error);