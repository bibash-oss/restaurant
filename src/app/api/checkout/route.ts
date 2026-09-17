import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DEMO_MENU_ITEMS, DEMO_RESTAURANT, DEMO_TABLES, DEMO_ORDERS } from "@/lib/mock-data";

interface CartRequestItem {
  menuItemId: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const isLiveSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

    const isStripeConfigured =
      process.env.STRIPE_SECRET_KEY &&
      !process.env.STRIPE_SECRET_KEY.includes("placeholder");

    if (!isStripeConfigured) {
      return NextResponse.json(
        {
          error:
            "Stripe is not configured yet! Please add your real STRIPE_SECRET_KEY into .env.local.",
        },
        { status: 400 }
      );
    }

    // A. PAYING FOR AN EXISTING DISPATCHED ORDER (KOT FLOW)
    if (body.orderId) {
      const orderId = body.orderId as string;
      const restaurantSlug = (body.restaurantSlug as string) || "golden-olive";

      let existingOrder;
      if (isLiveSupabase) {
        const { data: dbOrder } = await supabaseAdmin
          .from("orders")
          .select("*, tables(table_number), order_items(*)")
          .eq("id", orderId)
          .single();
        existingOrder = dbOrder;
      } else {
        existingOrder = DEMO_ORDERS.find((o) => o.id === orderId);
      }

      if (!existingOrder) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const tableNum =
        existingOrder.tables && typeof existingOrder.tables === "object"
          ? "table_number" in existingOrder.tables
            ? existingOrder.tables.table_number
            : "Table"
          : "Table";

      const lineItems = (existingOrder.order_items || []).map((it: { item_name: string; unit_price: number; quantity: number }) => ({
        price_data: {
          currency: existingOrder.currency || "aud",
          product_data: {
            name: `${it.item_name} (${tableNum})`,
          },
          unit_amount: it.unit_price,
        },
        quantity: it.quantity,
      }));

      // Pre-create customer with Australia default country
      const customer = await stripe.customers.create({
        address: { country: "AU" },
      });

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        customer_update: { address: "auto", name: "auto" },
        payment_method_types: ["card"],
        line_items: lineItems.length > 0 ? lineItems : [
          {
            price_data: {
              currency: existingOrder.currency || "aud",
              product_data: { name: `Dine-In Order (${tableNum})` },
              unit_amount: existingOrder.total_amount || 1000,
            },
            quantity: 1,
          }
        ],
        mode: "payment",
        metadata: {
          order_id: existingOrder.id,
          restaurant_slug: restaurantSlug,
          table_number: tableNum,
        },
        success_url: `${appUrl}/restaurant/${restaurantSlug}/order-status/${existingOrder.id}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/restaurant/${restaurantSlug}/order-status/${existingOrder.id}?canceled=true`,
      });

      if (isLiveSupabase) {
        await supabaseAdmin
          .from("orders")
          .update({ stripe_session_id: session.id })
          .eq("id", existingOrder.id);
      } else {
        existingOrder.stripe_session_id = session.id;
      }

      return NextResponse.json({ checkoutUrl: session.url, orderId: existingOrder.id });
    }

    // B. NEW CART CHECKOUT FLOW
    const { items, restaurantSlug, qrToken, customerNotes } = body as {
      items: CartRequestItem[];
      restaurantSlug: string;
      qrToken: string;
      customerNotes?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 1. Authoritative Restaurant & Table Lookup
    let restaurantId: string;
    let tableId: string;
    let tableNumber: string;
    let currency = "aud";

    if (isLiveSupabase) {
      // Fetch restaurant
      const { data: restData, error: restErr } = await supabaseAdmin
        .from("restaurants")
        .select("id, slug, currency")
        .eq("slug", restaurantSlug)
        .single();

      if (restErr || !restData) {
        return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
      }

      if (qrToken === "takeout" || !qrToken) {
        const { data: firstTable } = await supabaseAdmin
          .from("tables")
          .select("id, table_number")
          .eq("restaurant_id", restData.id)
          .limit(1)
          .single();

        tableId = firstTable?.id || restData.id;
        tableNumber = "🥡 Takeout / Pickup";
      } else {
        // Fetch table by qrToken
        const { data: tableData, error: tableErr } = await supabaseAdmin
          .from("tables")
          .select("id, table_number, is_active")
          .eq("restaurant_id", restData.id)
          .eq("qr_token", qrToken)
          .single();

        if (tableErr || !tableData || !tableData.is_active) {
          return NextResponse.json({ error: "Table not found or inactive" }, { status: 404 });
        }

        tableId = tableData.id;
        tableNumber = tableData.table_number;
      }
      restaurantId = restData.id;
      currency = restData.currency || "usd";
    } else {
      // Fallback demo mode
      restaurantId = DEMO_RESTAURANT.id;
      if (qrToken === "takeout" || !qrToken) {
        tableId = DEMO_TABLES[0].id;
        tableNumber = "🥡 Takeout / Pickup";
      } else {
        const matchedTable = DEMO_TABLES.find((t) => t.qr_token === qrToken) || DEMO_TABLES[0];
        tableId = matchedTable.id;
        tableNumber = matchedTable.table_number;
      }
    }

    // 2. CRITICAL SERVER-SIDE PRICE VALIDATION
    // Never trust client price or client total! Query database directly.
    const itemIds = items.map((i) => i.menuItemId);
    let verifiedMenuItems: { id: string; name: string; price: number; is_available: boolean }[] = [];

    if (isLiveSupabase) {
      const { data: dbItems, error: itemsErr } = await supabaseAdmin
        .from("menu_items")
        .select("id, name, price, is_available")
        .in("id", itemIds);

      if (itemsErr || !dbItems || dbItems.length === 0) {
        return NextResponse.json({ error: "Failed to retrieve authoritative menu prices" }, { status: 400 });
      }
      verifiedMenuItems = dbItems;
    } else {
      verifiedMenuItems = DEMO_MENU_ITEMS.filter((i) => itemIds.includes(i.id));
    }

    // Compute verified line items & authoritative total in cents
    const lineItemsForStripe: {
      price_data: {
        currency: string;
        product_data: { name: string };
        unit_amount: number;
      };
      quantity: number;
    }[] = [];

    const orderItemsToInsert: {
      menu_item_id: string;
      quantity: number;
      unit_price: number;
      item_name: string;
    }[] = [];

    let totalAmountInCents = 0;

    for (const reqItem of items) {
      const dbItem = verifiedMenuItems.find((v) => v.id === reqItem.menuItemId);
      if (!dbItem || !dbItem.is_available) {
        return NextResponse.json(
          { error: `Item "${dbItem?.name || reqItem.menuItemId}" is no longer available.` },
          { status: 400 }
        );
      }

      const qty = Math.max(1, Math.floor(reqItem.quantity));
      const authoritativePrice = dbItem.price; // Cent amount guaranteed from database

      totalAmountInCents += authoritativePrice * qty;

      lineItemsForStripe.push({
        price_data: {
          currency,
          product_data: {
            name: `${dbItem.name} (${tableNumber})`,
          },
          unit_amount: authoritativePrice,
        },
        quantity: qty,
      });

      orderItemsToInsert.push({
        menu_item_id: dbItem.id,
        quantity: qty,
        unit_price: authoritativePrice,
        item_name: dbItem.name,
      });
    }

    // 3. Create initial order in PENDING status in Supabase
    let orderId: string;

    if (isLiveSupabase) {
      const { data: orderData, error: orderErr } = await supabaseAdmin
        .from("orders")
        .insert({
          restaurant_id: restaurantId,
          table_id: tableId,
          status: "PENDING",
          total_amount: totalAmountInCents,
          currency,
          customer_notes: customerNotes || null,
        })
        .select("id")
        .single();

      if (orderErr || !orderData) {
        console.error("Order creation failed:", orderErr);
        return NextResponse.json({ error: "Failed to create order record" }, { status: 500 });
      }

      orderId = orderData.id;

      // Insert order items
      const itemsPayload = orderItemsToInsert.map((it) => ({
        ...it,
        order_id: orderId,
      }));

      const { error: itemsInsertErr } = await supabaseAdmin.from("order_items").insert(itemsPayload);
      if (itemsInsertErr) {
        console.error("Order items insert failed:", itemsInsertErr);
      }
    } else {
      orderId = `demo-ord-${Date.now()}`;
      DEMO_ORDERS.unshift({
        id: orderId,
        restaurant_id: DEMO_RESTAURANT.id,
        table_id: tableId || DEMO_TABLES[0].id,
        status: "PENDING",
        total_amount: totalAmountInCents,
        currency,
        customer_notes: customerNotes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tables: { table_number: tableNumber || "Table 1" },
        order_items: orderItemsToInsert.map((it, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          order_id: orderId,
          quantity: it.quantity,
          unit_price: it.unit_price,
          item_name: it.item_name,
        })),
      });
    }

    // 4. Create Stripe Checkout Session (STRICT - NO DEMO BYPASS)
    // Pre-create customer with Australia default country
    const customer = await stripe.customers.create({
      address: {
        country: "AU",
      },
    });

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      customer_update: {
        address: "auto",
        name: "auto",
      },
      payment_method_types: ["card"],
      line_items: lineItemsForStripe,
      mode: "payment",
      metadata: {
        order_id: orderId,
        restaurant_slug: restaurantSlug,
        table_number: tableNumber,
      },
      success_url: `${appUrl}/restaurant/${restaurantSlug}/order-status/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/restaurant/${restaurantSlug}/table/${qrToken}?canceled=true`,
    });

    if (isLiveSupabase) {
      await supabaseAdmin
        .from("orders")
        .update({ stripe_session_id: session.id })
        .eq("id", orderId);
    } else {
      const demoOrder = DEMO_ORDERS.find((o) => o.id === orderId);
      if (demoOrder) {
        demoOrder.stripe_session_id = session.id;
      }
    }

    return NextResponse.json({ checkoutUrl: session.url, orderId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Checkout API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
