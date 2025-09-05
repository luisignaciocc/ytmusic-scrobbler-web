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
    const subscriptionsCollection = paddle.subscriptions.list({
      status: ["active", "trialing", "past_due"]
    });
    
    // Get customers
    const customersCollection = paddle.customers.list();
    
    // Get recent transactions for revenue data  
    const transactionsCollection = paddle.transactions.list({
      status: ["completed"],
      orderBy: "created_at[desc]"
    });
    
    // Extract data using the iterator pattern
    const subscriptionsData = await subscriptionsCollection.next();
    const customersData = await customersCollection.next();
    const transactionsData = await transactionsCollection.next();
    
    // Calculate metrics
    const activeSubscriptions = subscriptionsData.filter(sub => sub.status === "active").length;
    const trialingSubscriptions = subscriptionsData.filter(sub => sub.status === "trialing").length;
    const totalCustomers = customersData.length;
    
    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    subscriptionsData.forEach(subscription => {
      if (subscription.status === "active" && subscription.items) {
        subscription.items.forEach(item => {
          if (item.price && item.price.billingCycle) {
            const unitPrice = parseFloat(item.price.unitPrice?.amount || "0");
            const quantity = item.quantity || 1;
            const interval = item.price.billingCycle.interval;
            
            // Convert to monthly
            let monthlyAmount = 0;
            if (interval === "month") {
              monthlyAmount = unitPrice * quantity;
            } else if (interval === "year") {
              monthlyAmount = (unitPrice * quantity) / 12;
            }
            mrr += monthlyAmount;
          }
        });
      }
    });
    
    // Calculate total revenue from completed transactions
    const totalRevenue = transactionsData
      .filter(t => t.status === "completed")
      .reduce((total, transaction) => {
        return total + parseFloat(transaction.details?.totals?.total || "0");
      }, 0);
    
    // Calculate revenue for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const monthlyRevenue = transactionsData
      .filter(t => t.status === "completed" && t.createdAt?.startsWith(currentMonth))
      .reduce((total, transaction) => {
        return total + parseFloat(transaction.details?.totals?.total || "0");
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