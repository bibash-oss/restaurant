import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DEMO_ORDERS } from "@/lib/mock-data";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const isLiveSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  if (isLiveSupabase) {
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        restaurant_id,
        table_id,
        status,
        total_amount,
        currency,
        customer_notes,
        created_at,
        updated_at,
        tables (
          table_number
        ),
        order_items (
          id,
          quantity,
          unit_price,
          item_name
        )
      `)
      .eq("id", orderId)
      .single();

    if (error || !order) {
      // Fallback check demo orders
      const demoOrder = DEMO_ORDERS.find((o) => o.id === orderId);
      if (demoOrder) {
        return NextResponse.json(demoOrder);
      }
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = order;

    // Direct Stripe Session Verification Fallback:
    // If Stripe redirected here with ?session_id=cs_..., verify payment directly with Stripe
    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (
      sessionId &&
      sessionId.startsWith("cs_") &&
      process.env.STRIPE_SECRET_KEY &&
      !process.env.STRIPE_SECRET_KEY.includes("placeholder")
    ) {
      try {
        const { stripe } = await import("@/lib/stripe");
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === "paid" && orderData.status === "PENDING") {
          await supabaseAdmin
            .from("orders")
            .update({ status: "PAID", stripe_session_id: session.id })
            .eq("id", orderId);
          orderData.status = "PAID";
        }
      } catch (err) {
        console.error("Stripe session check error:", err);
      }
    }

    return NextResponse.json(orderData);
  }

  // Fallback check demo orders
  let demoOrder = DEMO_ORDERS.find((o) => o.id === orderId);
  if (!demoOrder) {
    demoOrder = {
      id: orderId,
      restaurant_id: DEMO_ORDERS[0]?.restaurant_id || "00000000-0000-0000-0000-000000000001",
      table_id: DEMO_ORDERS[0]?.table_id || "10000000-0000-0000-0000-000000000001",
      status: "PENDING",
      total_amount: 0,
      currency: "usd",
      customer_notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tables: { table_number: "Table 1" },
      order_items: [],
    };
    DEMO_ORDERS.unshift(demoOrder);
  }

  // Also verify Stripe session for non-database fallback orders
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (
    sessionId &&
    sessionId.startsWith("cs_") &&
    process.env.STRIPE_SECRET_KEY &&
    !process.env.STRIPE_SECRET_KEY.includes("placeholder")
  ) {
    try {
      const { stripe } = await import("@/lib/stripe");
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items"],
      });
      if (session.payment_status === "paid") {
        demoOrder.status = "PAID";
        demoOrder.updated_at = new Date().toISOString();

        if (session.amount_total) {
          demoOrder.total_amount = session.amount_total;
        }
        if (session.metadata?.table_number) {
          demoOrder.tables = { table_number: session.metadata.table_number };
        }
        if (session.line_items?.data && session.line_items.data.length > 0) {
          demoOrder.order_items = session.line_items.data.map((li, idx) => ({
            id: `li-${idx}-${Date.now()}`,
            order_id: orderId,
            quantity: li.quantity || 1,
            unit_price:
              li.price?.unit_amount ?? Math.round((li.amount_total || 0) / (li.quantity || 1)),
            item_name: (li.description || "Menu Item").replace(/\s*\([^)]*\)\s*$/, ""),
          }));
        }
      }
    } catch (err) {
      console.error("Stripe session check error:", err);
    }
  }

  return NextResponse.json(demoOrder);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  try {
    const body = await req.json();
    const { status } = body;

    const allowedStatuses = [
      "PENDING",
      "PAID",
      "PREPARING",
      "READY",
      "DISPATCHED",
      "COMPLETED",
      "CANCELLED",
    ];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }

    const isLiveSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

    if (isLiveSupabase) {
      let { data, error } = await supabaseAdmin
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .select()
        .single();

      // If live Supabase rejects DISPATCHED due to original check constraint, fallback to READY
      if (error && (error.message.includes("check constraint") || error.code === "23514") && status === "DISPATCHED") {
        const retry = await supabaseAdmin
          .from("orders")
          .update({ status: "READY", updated_at: new Date().toISOString() })
          .eq("id", orderId)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    const demoOrder = DEMO_ORDERS.find((o) => o.id === orderId);
    if (demoOrder) {
      demoOrder.status = status;
      demoOrder.updated_at = new Date().toISOString();
    }

    return NextResponse.json({ id: orderId, status, updated_at: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
