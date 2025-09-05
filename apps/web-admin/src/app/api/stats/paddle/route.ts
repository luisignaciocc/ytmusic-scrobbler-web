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
    // Check if API key is available
    if (!process.env.PADDLE_API_KEY) {
      return NextResponse.json({
        error: "PADDLE_API_KEY not configured",
        subscriptions: { active: 0, trialing: 0, total: 0 },
        customers: { total: 0 },
        revenue: { mrr: 0, arr: 0, totalRevenue: 0, monthlyRevenue: 0 },
        lastUpdated: new Date().toISOString()
      });
    }

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
    let mrrCents = 0;
    subscriptionsData.forEach(subscription => {
      if (subscription.status === "active" && subscription.items) {
        subscription.items.forEach(item => {
          if (item.price && item.price.billingCycle) {
            // Paddle amounts are in cents
            const unitPriceCents = parseFloat(item.price.unitPrice?.amount || "0");
            const quantity = item.quantity || 1;
            const interval = item.price.billingCycle.interval;
            
            // Convert to monthly cents
            let monthlyAmountCents = 0;
            if (interval === "month") {
              monthlyAmountCents = unitPriceCents * quantity;
            } else if (interval === "year") {
              monthlyAmountCents = (unitPriceCents * quantity) / 12;
            }
            mrrCents += monthlyAmountCents;
          }
        });
      }
    });
    
    // Convert cents to dollars for MRR
    const mrr = mrrCents / 100;
    
    // Debug logging (remove in production)
    console.log("Paddle Debug:", {
      activeSubscriptions,
      subscriptionsCount: subscriptionsData.length,
      customersCount: customersData.length,
      transactionsCount: transactionsData.length,
      mrrCents,
      mrrUSD: mrr,
      sampleSubscription: subscriptionsData[0] ? {
        id: subscriptionsData[0].id,
        status: subscriptionsData[0].status,
        items: subscriptionsData[0].items?.map(item => ({
          priceAmount: item.price?.unitPrice?.amount,
          interval: item.price?.billingCycle?.interval,
          quantity: item.quantity
        }))
      } : null,
      sampleTransaction: transactionsData[0] ? {
        id: transactionsData[0].id,
        status: transactionsData[0].status,
        total: transactionsData[0].details?.totals?.total
      } : null
    });
    
    // Calculate total revenue from completed transactions  
    const totalRevenueCents = transactionsData
      .filter(t => t.status === "completed")
      .reduce((total, transaction) => {
        // Paddle totals are in cents
        return total + parseFloat(transaction.details?.totals?.total || "0");
      }, 0);
    
    const totalRevenue = totalRevenueCents / 100;
    
    // Calculate revenue for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const monthlyRevenueCents = transactionsData
      .filter(t => t.status === "completed" && t.createdAt?.startsWith(currentMonth))
      .reduce((total, transaction) => {
        return total + parseFloat(transaction.details?.totals?.total || "0");
      }, 0);
    
    const monthlyRevenue = monthlyRevenueCents / 100;
    
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
        mrr: Number(mrr.toFixed(2)),
        arr: Number((mrr * 12).toFixed(2)),
        totalRevenue: Number(totalRevenue.toFixed(2)),
        monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
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