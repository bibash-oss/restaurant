import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DEMO_ORDERS } from "@/lib/mock-data";

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
