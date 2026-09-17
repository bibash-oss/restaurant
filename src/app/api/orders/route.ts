import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DEMO_ORDERS, DEMO_MENU_ITEMS, DEMO_RESTAURANT, DEMO_TABLES } from "@/lib/mock-data";

export async function GET() {
  try {
    const isLiveSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin
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
        .order("created_at", { ascending: false });

      if (!error && data) {
        const formatted = data.map((o) => ({
          ...o,
          tables: Array.isArray(o.tables) ? o.tables[0] : o.tables,
        }));
        return NextResponse.json(formatted);
      }
    }

    // Return in-memory server orders
    return NextResponse.json(DEMO_ORDERS);
  } catch (err: unknown) {
    console.error("Failed to fetch orders:", err);
    return NextResponse.json(DEMO_ORDERS);
  }
}

interface CartRequestItem {
  menuItemId: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, restaurantSlug, qrToken, customerNotes } = body as {
      items: CartRequestItem[];
      restaurantSlug: string;
      qrToken: string;
      customerNotes?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    let restaurantId: string;
    let tableId: string;
    let tableNumber: string;
    let currency = "aud";

    const isLiveSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

    if (isLiveSupabase) {
      const { data: restData, error: restErr } = await supabaseAdmin
        .from("restaurants")
        .select("id, slug, currency")
        .eq("slug", restaurantSlug)
        .single();

      if (restErr || !restData) {
        return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
      }

      if (!qrToken) {
        const { data: firstTable } = await supabaseAdmin
          .from("tables")
          .select("id, table_number")
          .eq("restaurant_id", restData.id)
          .limit(1)
          .single();

        tableId = firstTable?.id || restData.id;
        tableNumber = "Table 1";
      } else {
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
      currency = restData.currency || "aud";
    } else {
      restaurantId = DEMO_RESTAURANT.id;
      const matchedTable = DEMO_TABLES.find((t) => t.qr_token === qrToken) || DEMO_TABLES[0];
      tableId = matchedTable.id;
      tableNumber = matchedTable.table_number;
      currency = "aud";
    }

    // Validate prices
    const itemIds = items.map((i) => i.menuItemId);
    let verifiedMenuItems: { id: string; name: string; price: number; is_available: boolean }[] = [];

    if (isLiveSupabase) {
      const { data: dbItems, error: itemsErr } = await supabaseAdmin
        .from("menu_items")
        .select("id, name, price, is_available")
        .in("id", itemIds);

      if (itemsErr || !dbItems || dbItems.length === 0) {
        return NextResponse.json({ error: "Failed to retrieve menu prices" }, { status: 400 });
      }
      verifiedMenuItems = dbItems;
    } else {
      verifiedMenuItems = DEMO_MENU_ITEMS.filter((i) => itemIds.includes(i.id));
    }

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
      const authoritativePrice = dbItem.price;

      totalAmountInCents += authoritativePrice * qty;

      orderItemsToInsert.push({
        menu_item_id: dbItem.id,
        quantity: qty,
        unit_price: authoritativePrice,
        item_name: dbItem.name,
      });
    }

    // Create KOT order in PREPARING status
    let orderId: string;

    if (isLiveSupabase) {
      const { data: orderData, error: orderErr } = await supabaseAdmin
        .from("orders")
        .insert({
          restaurant_id: restaurantId,
          table_id: tableId,
          status: "PREPARING",
          total_amount: totalAmountInCents,
          currency,
          customer_notes: customerNotes || null,
        })
        .select("id")
        .single();

      if (orderErr || !orderData) {
        console.error("Order creation failed:", orderErr);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
      }

      orderId = orderData.id;

      const itemsPayload = orderItemsToInsert.map((it) => ({
        ...it,
        order_id: orderId,
      }));

      await supabaseAdmin.from("order_items").insert(itemsPayload);
    } else {
      orderId = `kot-${Date.now()}`;
      DEMO_ORDERS.unshift({
        id: orderId,
        restaurant_id: DEMO_RESTAURANT.id,
        table_id: tableId,
        status: "PREPARING",
        total_amount: totalAmountInCents,
        currency,
        customer_notes: customerNotes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tables: { table_number: tableNumber },
        order_items: orderItemsToInsert.map((it, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          order_id: orderId,
          quantity: it.quantity,
          unit_price: it.unit_price,
          item_name: it.item_name,
        })),
      });
    }

    return NextResponse.json({ success: true, orderId, status: "PREPARING" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("POST /api/orders error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
