import { NextRequest, NextResponse } from "next/server";
import { Paddle, Environment, PaddleOptions } from "@paddle/paddle-node-sdk";

function getPaddleInstance() {
  const paddleOptions: PaddleOptions = {
    environment:
      process.env.NODE_ENV === "production" ? Environment.production : Environment.sandbox,
  };

  return new Paddle(process.env.PADDLE_API_KEY!, paddleOptions);
}

export async function GET(request: NextRequest) {
  try {
    const paddle = getPaddleInstance();
    
    // Get subscriptions for revenue calculations
    const subscriptions = await paddle.subscriptions.list({
      status: ["active", "trialing", "past_due"]
    });
    
    // Get customers
    const customers = await paddle.customers.list();
    
    // Get recent transactions for revenue data
    const transactions = await paddle.transactions.list({
      status: ["completed"],
      orderBy: "created_at[desc]"
    });
    
    // Calculate metrics
    const activeSubscriptions = subscriptions.data.filter(sub => sub.status === "active").length;
    const trialingSubscriptions = subscriptions.data.filter(sub => sub.status === "trialing").length;
    const totalCustomers = customers.data.length;
    
    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    subscriptions.data.forEach(subscription => {
      if (subscription.status === "active" && subscription.recurringTransactionDetails) {
        const intervals = subscription.recurringTransactionDetails.interval;
        const amount = parseFloat(subscription.recurringTransactionDetails.taxRatesUsed?.[0]?.totals.subtotal || "0");
        
        // Convert to monthly
        if (intervals === "month") {
          mrr += amount;
        } else if (intervals === "year") {
          mrr += amount / 12;
        }
      }
    });
    
    // Calculate total revenue from completed transactions
    const totalRevenue = transactions.data
      .filter(t => t.status === "completed")
      .reduce((total, transaction) => {
        return total + parseFloat(transaction.details?.totals.grandTotal || "0");
      }, 0);
    
    // Calculate revenue for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const monthlyRevenue = transactions.data
      .filter(t => t.status === "completed" && t.createdAt?.startsWith(currentMonth))
      .reduce((total, transaction) => {
        return total + parseFloat(transaction.details?.totals.grandTotal || "0");
      }, 0);
    
    const stats = {
      subscriptions: {
        active: activeSubscriptions,
        trialing: trialingSubscriptions,
        total: activeSubscriptions + trialingSubscriptions,
      },
      customers: {
        total: totalCustomers,
      },
      revenue: {
        mrr: mrr.toFixed(2),
        arr: (mrr * 12).toFixed(2),
        totalRevenue: totalRevenue.toFixed(2),
        monthlyRevenue: monthlyRevenue.toFixed(2),
      },
      lastUpdated: new Date().toISOString(),
    };
    
    return NextResponse.json(stats);
    
  } catch (error) {
    console.error("Error fetching Paddle stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch Paddle statistics" },
      { status: 500 }
    );
  }
}