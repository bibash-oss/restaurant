import { CustomerMenuView } from "@/components/customer/CustomerMenuView";
import { DEMO_RESTAURANT, DEMO_TABLES, DEMO_CATEGORIES, DEMO_MENU_ITEMS } from "@/lib/mock-data";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function TableMenuPage({
  params,
}: {
  params: Promise<{ slug: string; qrToken: string }>;
}) {
  const { slug, qrToken } = await params;

  let restaurant = DEMO_RESTAURANT;
  let table = DEMO_TABLES.find((t) => t.qr_token === qrToken) || {
    ...DEMO_TABLES[4],
    table_number: "Table 5",
    qr_token: qrToken,
  };
  let allTables = DEMO_TABLES;
  let categories = DEMO_CATEGORIES;
  let menuItems = DEMO_MENU_ITEMS;

  const isLiveSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  if (isLiveSupabase) {
    try {
      const { data: restData } = await supabaseAdmin
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .single();

      if (restData) {
        restaurant = restData;

        const { data: tablesData } = await supabaseAdmin
          .from("tables")
          .select("*")
          .eq("restaurant_id", restData.id)
          .eq("is_active", true)
          .order("table_number", { ascending: true });

        if (tablesData) allTables = tablesData;

        const matchedTable = tablesData?.find((t) => t.qr_token === qrToken);
        if (matchedTable) table = matchedTable;

        const { data: catData } = await supabaseAdmin
          .from("categories")
          .select("*")
          .eq("restaurant_id", restData.id)
          .order("sort_order", { ascending: true });

        if (catData) categories = catData;

        const { data: itemData } = await supabaseAdmin
          .from("menu_items")
          .select("*")
          .eq("restaurant_id", restData.id)
          .order("created_at", { ascending: true });

        if (itemData) menuItems = itemData;
      }
    } catch (e) {
      console.error("Failed to fetch live Supabase data, using fallback:", e);
    }
  }

  return (
    <CustomerMenuView
      restaurant={restaurant}
      table={table}
      allTables={allTables}
      categories={categories}
      menuItems={menuItems}
      isTableLocked={false}
    />
  );
}
