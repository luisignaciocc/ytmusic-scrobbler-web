import { PrismaClient } from "@prisma/client";
import { getYTMusicHistoryFromPage } from "../apps/worker/src/utils/functions";

/**
 * Test script to simulate silent authentication failure
 * Uses malformed cookie to trigger empty response
 */

const prisma = new PrismaClient();

async function testSilentAuthFailure() {
  console.log("🧪 Testing Silent Authentication Failure Detection");
  console.log("=".repeat(60));
  
  try {
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: "luisignacioccp@gmail.com" },
    });
    
    if (!user) {
      console.log("❌ User not found");
      return;
    }
    
    console.log(`👤 Testing with user: ${user.name} (${user.email})`);
    
    // Test with malformed cookie (from our previous test - we know this returns 0 songs)
    const malformedCookie = user.ytmusicCookie?.replace(/;/g, ' ; ').replace(/=/g, ' = ');
    
    if (!malformedCookie) {
      console.log("❌ No cookie available for testing");
      return;
    }
    
    console.log(`\n🔍 Using malformed cookie to simulate silent auth failure...`);
    console.log(`   Original length: ${user.ytmusicCookie?.length}`);
    console.log(`   Malformed length: ${malformedCookie.length}`);
    
    const startTime = Date.now();
    const songs = await getYTMusicHistoryFromPage({ cookie: malformedCookie });
    const endTime = Date.now();
    
    console.log(`\n📊 Results:`);
    console.log(`   Request time: ${endTime - startTime}ms`);
    console.log(`   Songs returned: ${songs.length}`);
    console.log(`   HTTP Status: Success (no exception thrown)`);
    
    if (songs.length === 0) {
      console.log(`\n✅ SILENT AUTH FAILURE REPRODUCED!`);
      console.log(`   🎯 This is exactly what we need to detect`);
      console.log(`   🎯 Current system would mark this as AUTH failure`);
      console.log(`   🎯 User would be auto-deactivated after 3 consecutive instances`);
    } else {
      console.log(`\n❌ Expected 0 songs but got ${songs.length}`);
      console.log(`   This test case may not be reliable`);
    }
    
  } catch (error) {
    console.log(`\n❌ Unexpected error: ${error.message}`);
    console.log(`   This would be caught by existing error handling`);
  } finally {
    await prisma.$disconnect();
  }
}

testSilentAuthFailure().catch(console.error);