import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Note: Resend doesn't have a direct analytics API endpoint yet
// This implementation uses available endpoints and webhook data patterns
// For comprehensive analytics, you'd need to store webhook events in your database

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    // Get domains (to show active domains)
    const domainsResponse = await resend.domains.list();
    const domains = domainsResponse.data || [];
    
    // Get API keys info (for usage tracking)
    const apiKeysResponse = await resend.apiKeys.list();
    const apiKeys = apiKeysResponse.data || [];
    
    // Since Resend doesn't have direct analytics endpoints yet,
    // we'll provide basic account information and suggest webhook implementation
    const stats = {
      account: {
        domains: {
          total: domains.length,
          verified: domains.filter(d => d.status === "verified").length,
          pending: domains.filter(d => d.status === "pending").length,
        },
        apiKeys: {
          total: apiKeys.length,
          active: apiKeys.filter(k => !k.createdAt || new Date(k.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length, // Active in last 30 days
        },
      },
      emails: {
        // These would come from webhook data stored in your database
        sent: "N/A - Implement webhooks to track",
        delivered: "N/A - Implement webhooks to track", 
        bounced: "N/A - Implement webhooks to track",
        opened: "N/A - Implement webhooks to track",
        clicked: "N/A - Implement webhooks to track",
        complained: "N/A - Implement webhooks to track",
      },
      engagement: {
        openRate: "N/A - Implement webhooks to track",
        clickRate: "N/A - Implement webhooks to track",
        bounceRate: "N/A - Implement webhooks to track",
      },
      implementation: {
        note: "For detailed email analytics, implement Resend webhooks to track email events",
        webhookEvents: [
          "email.sent",
          "email.delivered", 
          "email.delivery_delayed",
          "email.bounced",
          "email.opened",
          "email.clicked",
          "email.complained"
        ],
        suggestedTable: "CREATE TABLE email_events (id, event_type, email_id, created_at, data)"
      },
      lastUpdated: new Date().toISOString(),
    };
    
    return NextResponse.json(stats);
    
  } catch (error) {
    console.error("Error fetching Resend stats:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch Resend statistics",
        message: error instanceof Error ? error.message : "Unknown error",
        note: "Make sure RESEND_API_KEY is set in environment variables"
      },
      { status: 500 }
    );
  }
}