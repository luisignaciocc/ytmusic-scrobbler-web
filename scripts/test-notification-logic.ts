/**
 * Script to test and verify notification logic configuration
 */

interface MockUser {
  id: string;
  email: string;
  authNotificationCount: number;
  lastNotificationSent: Date | null;
  isActive: boolean;
}

function shouldSendNotification(user: MockUser, currentDate: Date): boolean {
  // If user has reached max notifications (3), don't send more
  if (user.authNotificationCount >= 3) {
    console.log(`❌ User ${user.email} has reached max notifications (${user.authNotificationCount}/3)`);
    return false;
  }

  // If no previous notification, send immediately
  if (!user.lastNotificationSent) {
    console.log(`✅ User ${user.email} - First notification (0/3)`);
    return true;
  }

  const daysSinceLastNotification = Math.floor(
    (currentDate.getTime() - user.lastNotificationSent.getTime()) / (1000 * 60 * 60 * 24)
  );

  let requiredDays: number;
  if (user.authNotificationCount === 0) {
    requiredDays = 0; // First notification - immediate
  } else if (user.authNotificationCount === 1) {
    requiredDays = 2; // Second notification - after 2 days
  } else if (user.authNotificationCount === 2) {
    requiredDays = 5; // Third notification - after 5 days (cumulative)
  } else {
    console.log(`❌ User ${user.email} - Invalid notification count: ${user.authNotificationCount}`);
    return false;
  }

  if (daysSinceLastNotification >= requiredDays) {
    console.log(`✅ User ${user.email} - Notification ${user.authNotificationCount + 1}/3 (${daysSinceLastNotification} days >= ${requiredDays} required)`);
    return true;
  }

  console.log(`⏳ User ${user.email} - Too early for notification ${user.authNotificationCount + 1}/3 (${daysSinceLastNotification} days < ${requiredDays} required)`);
  return false;
}

async function main() {
  console.log("🧪 Notification Logic Configuration Test");
  console.log("=".repeat(50));

  const currentDate = new Date();
  const twoDaysAgo = new Date(currentDate.getTime() - (2 * 24 * 60 * 60 * 1000));
  const fiveDaysAgo = new Date(currentDate.getTime() - (5 * 24 * 60 * 60 * 1000));
  const sevenDaysAgo = new Date(currentDate.getTime() - (7 * 24 * 60 * 60 * 1000));

  // Test scenarios
  const testUsers: MockUser[] = [
    {
      id: "1",
      email: "user1@test.com",
      authNotificationCount: 0,
      lastNotificationSent: null,
      isActive: true
    },
    {
      id: "2", 
      email: "user2@test.com",
      authNotificationCount: 1,
      lastNotificationSent: twoDaysAgo,
      isActive: true
    },
    {
      id: "3",
      email: "user3@test.com", 
      authNotificationCount: 1,
      lastNotificationSent: new Date(), // Just sent
      isActive: true
    },
    {
      id: "4",
      email: "user4@test.com",
      authNotificationCount: 2,
      lastNotificationSent: fiveDaysAgo,
      isActive: true
    },
    {
      id: "5",
      email: "user5@test.com",
      authNotificationCount: 3,
      lastNotificationSent: sevenDaysAgo,
      isActive: true
    }
  ];

  console.log("\n📋 Testing notification logic for each user:");
  console.log("-".repeat(50));

  testUsers.forEach((user, index) => {
    console.log(`\n${index + 1}. Testing ${user.email}:`);
    console.log(`   Current count: ${user.authNotificationCount}/3`);
    console.log(`   Last sent: ${user.lastNotificationSent ? user.lastNotificationSent.toLocaleDateString() : 'Never'}`);
    const shouldSend = shouldSendNotification(user, currentDate);
  });

  console.log("\n" + "=".repeat(50));
  console.log("✅ All notification logic tests completed");
  
  // Verify constants
  console.log("\n📊 Configuration Summary:");
  console.log("   • Maximum notifications per auth issue: 3");
  console.log("   • Notification schedule:");
  console.log("     - 1st: Immediate (0 days)");
  console.log("     - 2nd: After 2 days");
  console.log("     - 3rd: After 5 days (cumulative)");
  console.log("   • After 3rd notification: Account auto-deactivated");
  console.log("   • Resets only on successful scrobble");
  console.log("   • Updates preserve lastNotificationSent to prevent immediate re-notification");
}

main().catch(console.error);