import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "Stripe webhook secret is missing from server environment" },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Invalid webhook signature";
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  // Handle specific Stripe events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (!orderId) {
        console.warn("checkout.session.completed received without order_id in metadata");
        break;
      }

      console.log(`Payment confirmed for Order ${orderId}. Updating status to PAID.`);

      const isLiveSupabase =
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

      if (isLiveSupabase) {
        // Update Supabase order status from PENDING to PAID
        const { error: updateErr } = await supabaseAdmin
          .from("orders")
          .update({
            status: "PAID",
            stripe_session_id: session.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (updateErr) {
          console.error(`Failed to update order ${orderId} to PAID in Supabase:`, updateErr);
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }
      } else {
        const { DEMO_ORDERS } = await import("@/lib/mock-data");
        const demoOrder = DEMO_ORDERS.find((o) => o.id === orderId);
        if (demoOrder) {
          demoOrder.status = "PAID";
          demoOrder.updated_at = new Date().toISOString();
        }
      }

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.warn(`Payment failed for PaymentIntent: ${paymentIntent.id}`);
      break;
    }

    default:
      // Other unhandled events
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
