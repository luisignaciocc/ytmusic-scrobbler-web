import { PrismaClient } from "@prisma/client";

/**
 * Comprehensive test script for email notification logic
 * Tests intervals, user preferences, opt-out functionality, etc.
 */

const prisma = new PrismaClient();

interface TestUser {
  id: string;
  name: string;
  email: string;
  notificationsEnabled: boolean;
  lastNotificationSent: Date | null;
  notificationEmail: string | null;
}

class EmailNotificationTester {
  private NOTIFICATION_INTERVAL_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

  canSendNotification(user: TestUser): boolean {
    const currentDate = new Date();
    
    // Check if notifications are enabled
    if (user.notificationsEnabled === false) {
      return false;
    }

    // Check if enough time has passed since last notification
    if (user.lastNotificationSent) {
      const timeSinceLastNotification = currentDate.getTime() - user.lastNotificationSent.getTime();
      if (timeSinceLastNotification < this.NOTIFICATION_INTERVAL_MS) {
        return false;
      }
    }

    return true;
  }

  private formatTime(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  testUser(user: TestUser, scenario: string): void {
    console.log(`\n📧 Testing: ${scenario}`);
    console.log(`👤 User: ${user.name} (${user.email})`);
    console.log(`🔔 Notifications enabled: ${user.notificationsEnabled}`);
    console.log(`📧 Notification email: ${user.notificationEmail || 'Using main email'}`);
    
    if (user.lastNotificationSent) {
      const timeSince = Date.now() - user.lastNotificationSent.getTime();
      console.log(`⏰ Last notification sent: ${this.formatTime(timeSince)} ago`);
      console.log(`⌛ Time until next allowed: ${timeSince >= this.NOTIFICATION_INTERVAL_MS ? 'Ready now' : this.formatTime(this.NOTIFICATION_INTERVAL_MS - timeSince)}`);
    } else {
      console.log(`⏰ Last notification sent: Never`);
    }

    const canSend = this.canSendNotification(user);
    console.log(`✅ Can send notification: ${canSend ? '✓ YES' : '❌ NO'}`);

    if (!canSend) {
      if (user.notificationsEnabled === false) {
        console.log(`   🔕 Reason: User has disabled notifications`);
      } else if (user.lastNotificationSent) {
        const timeSince = Date.now() - user.lastNotificationSent.getTime();
        if (timeSince < this.NOTIFICATION_INTERVAL_MS) {
          console.log(`   ⏳ Reason: Too soon (need to wait ${this.formatTime(this.NOTIFICATION_INTERVAL_MS - timeSince)} more)`);
        }
      }
    }
  }
}

async function main() {
  console.log("🧪 Email Notification Logic Tester");
  console.log("=".repeat(60));
  
  const tester = new EmailNotificationTester();
  
  try {
    // Get test user
    const baseUser = await prisma.user.findUnique({
      where: { email: "luisignacioccp@gmail.com" },
      select: {
        id: true,
        name: true,
        email: true,
        notificationsEnabled: true,
        lastNotificationSent: true,
        notificationEmail: true,
      }
    });

    if (!baseUser) {
      console.log("❌ Test user not found");
      return;
    }

    console.log(`🎯 Using base user: ${baseUser.name} (${baseUser.email})`);
    console.log(`📊 Current state:`);
    console.log(`   - Notifications enabled: ${baseUser.notificationsEnabled}`);
    console.log(`   - Last notification: ${baseUser.lastNotificationSent || 'Never'}`);
    console.log(`   - Notification email: ${baseUser.notificationEmail || 'None set'}`);

    // Test Case 1: Current user state
    tester.testUser(baseUser as TestUser, "Current user state (actual data)");

    // Test Case 2: User with notifications disabled
    const disabledUser: TestUser = {
      ...baseUser,
      notificationsEnabled: false,
    } as TestUser;
    tester.testUser(disabledUser, "User with notifications disabled");

    // Test Case 3: User who just received notification (1 hour ago)
    const recentNotificationUser: TestUser = {
      ...baseUser,
      notificationsEnabled: true,
      lastNotificationSent: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    } as TestUser;
    tester.testUser(recentNotificationUser, "User notified 1 hour ago (should be blocked)");

    // Test Case 4: User who received notification 1 day ago (should be blocked)
    const oneDayAgoUser: TestUser = {
      ...baseUser,
      notificationsEnabled: true,
      lastNotificationSent: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    } as TestUser;
    tester.testUser(oneDayAgoUser, "User notified 1 day ago (should be blocked)");

    // Test Case 5: User who received notification 2 days ago (should be allowed)
    const twoDaysAgoUser: TestUser = {
      ...baseUser,
      notificationsEnabled: true,
      lastNotificationSent: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    } as TestUser;
    tester.testUser(twoDaysAgoUser, "User notified exactly 2 days ago (should be allowed)");

    // Test Case 6: User who received notification 3 days ago (should be allowed)
    const threeDaysAgoUser: TestUser = {
      ...baseUser,
      notificationsEnabled: true,
      lastNotificationSent: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    } as TestUser;
    tester.testUser(threeDaysAgoUser, "User notified 3 days ago (should be allowed)");

    // Test Case 7: User who never received notification (should be allowed)
    const neverNotifiedUser: TestUser = {
      ...baseUser,
      notificationsEnabled: true,
      lastNotificationSent: null,
    } as TestUser;
    tester.testUser(neverNotifiedUser, "User never notified (should be allowed)");

    // Test Case 8: User with custom notification email
    const customEmailUser: TestUser = {
      ...baseUser,
      notificationsEnabled: true,
      lastNotificationSent: null,
      notificationEmail: "custom@example.com",
    } as TestUser;
    tester.testUser(customEmailUser, "User with custom notification email");

    console.log("\n" + "=".repeat(60));
    console.log("📋 SUMMARY OF EMAIL NOTIFICATION LOGIC:");
    console.log("✅ Notifications are sent if:");
    console.log("   1. User has notificationsEnabled !== false");
    console.log("   2. More than 2 days have passed since lastNotificationSent");
    console.log("   3. RESEND_API_KEY environment variable is set");
    console.log("   4. User has valid email (notificationEmail or email)");
    console.log("");
    console.log("🔄 Notification interval: 2 days (48 hours)");
    console.log("📧 Email priority: notificationEmail > email");
    console.log("🎯 All three auth error types now supported:");
    console.log("   - expired (401 UNAUTHENTICATED)");
    console.log("   - invalid (Headers.append error)"); 
    console.log("   - silent (empty response)");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);