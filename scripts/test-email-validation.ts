/**
 * Script to test email validation logic for notifications
 */

interface TestUser {
  email: string;
  notificationEmail: string | null;
  description: string;
}

class EmailValidator {
  private getValidNotificationEmail(user: { notificationEmail: string | null; email: string }): string | null {
    // Priority 1: Use notificationEmail if it exists and is valid
    if (user.notificationEmail && this.isValidEmailAddress(user.notificationEmail)) {
      return user.notificationEmail;
    }

    // Priority 2: Use main email only if it's valid and not a Google Pages account
    if (this.isValidEmailAddress(user.email) && !this.isGooglePagesEmail(user.email)) {
      return user.email;
    }

    // No valid email found
    return null;
  }

  private isValidEmailAddress(email: string): boolean {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isGooglePagesEmail(email: string): boolean {
    // Check for Google Pages or other non-personal Google accounts
    const googlePagesPatterns = [
      /pages\.google\.com$/i,
      /googleusercontent\.com$/i,
      /noreply.*google/i,
      /donotreply.*google/i,
      // Add more patterns as needed based on what you observe
    ];

    return googlePagesPatterns.some(pattern => pattern.test(email));
  }

  public testUser(user: TestUser): void {
    console.log(`\n📧 Testing: ${user.description}`);
    console.log(`   Auth email: ${user.email}`);
    console.log(`   Notification email: ${user.notificationEmail || 'None'}`);
    
    const isValidAuth = this.isValidEmailAddress(user.email);
    const isGooglePages = this.isGooglePagesEmail(user.email);
    const validNotificationEmail = this.getValidNotificationEmail(user);
    
    console.log(`   ✓ Auth email valid: ${isValidAuth}`);
    console.log(`   ✓ Is Google Pages: ${isGooglePages}`);
    console.log(`   📬 Final recipient: ${validNotificationEmail || 'NONE - No email will be sent!'}`);
    
    if (!validNotificationEmail) {
      console.log(`   ⚠️  WARNING: This user won't receive notifications!`);
    }
  }
}

async function main() {
  console.log("🧪 Email Notification Address Validation Test");
  console.log("=".repeat(60));

  const validator = new EmailValidator();

  const testUsers: TestUser[] = [
    {
      email: "user@gmail.com",
      notificationEmail: null,
      description: "Normal Gmail user without custom notification email"
    },
    {
      email: "user@gmail.com", 
      notificationEmail: "notifications@customdomain.com",
      description: "Gmail user with valid custom notification email"
    },
    {
      email: "business@pages.google.com",
      notificationEmail: null,
      description: "Google Pages account without custom notification email"
    },
    {
      email: "business@pages.google.com",
      notificationEmail: "contact@mybusiness.com",
      description: "Google Pages account with valid custom notification email"
    },
    {
      email: "app@googleusercontent.com",
      notificationEmail: null,
      description: "Google App account without custom notification email"
    },
    {
      email: "invalid-email",
      notificationEmail: null,
      description: "Invalid email format"
    },
    {
      email: "user@company.com",
      notificationEmail: "invalid-notification-email",
      description: "Valid auth email but invalid notification email"
    },
    {
      email: "noreply@google.com",
      notificationEmail: null,
      description: "Google noreply account"
    },
    {
      email: "user@outlook.com",
      notificationEmail: "",
      description: "Outlook user with empty notification email"
    }
  ];

  testUsers.forEach(user => validator.testUser(user));

  console.log("\n" + "=".repeat(60));
  console.log("📋 Summary of Logic:");
  console.log("   1. Use notificationEmail if valid");
  console.log("   2. Fallback to main email if valid AND not Google Pages");
  console.log("   3. Skip sending if no valid email found");
  console.log("\n🎯 Google Pages patterns detected:");
  console.log("   • *.pages.google.com");
  console.log("   • *.googleusercontent.com");
  console.log("   • *noreply*google*");
  console.log("   • *donotreply*google*");
  console.log("=".repeat(60));
}

main().catch(console.error);