"use client";

import { useEffect, useState } from "react";
import { RestaurantTable, Restaurant } from "@/lib/types";
import { QRCodeModal } from "@/components/admin/QRCodeModal";
import { generateQRToken } from "@/lib/utils";
import { DEMO_TABLES, DEMO_RESTAURANT } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { QrCode, Plus, ExternalLink, Printer } from "lucide-react";

export default function AdminTablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant>(DEMO_RESTAURANT);
  const [selectedTableForQR, setSelectedTableForQR] = useState<RestaurantTable | null>(null);
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTables = async () => {
    try {
      const supabase = createClient();
      const isLiveSupabase =
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

      if (isLiveSupabase) {
        const { data: restData } = await supabase
          .from("restaurants")
          .select("*")
          .limit(1)
          .single();

        if (restData) {
          setRestaurant(restData);
          const { data: tableData } = await supabase
            .from("tables")
            .select("*")
            .eq("restaurant_id", restData.id)
            .order("table_number", { ascending: true });

          if (tableData) {
            setTables(tableData);
            return;
          }
        }
      }

      setTables(DEMO_TABLES);
    } catch (err) {
      console.error("Failed to load tables:", err);
      setTables(DEMO_TABLES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) return;

    const qrToken = generateQRToken(`table-${newTableNumber.toLowerCase().replace(/\s+/g, "-")}`);

    const isLiveSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

    if (isLiveSupabase) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tables")
        .insert({
          restaurant_id: restaurant.id,
          table_number: newTableNumber.trim(),
          qr_token: qrToken,
          is_active: true,
        })
        .select()
        .single();

      if (!error && data) {
        setTables((prev) => [...prev, data]);
        setNewTableNumber("");
        setIsAddingTable(false);
        return;
      }
    }

    // Fallback local addition
    const newLocalTable: RestaurantTable = {
      id: `table-local-${Date.now()}`,
      restaurant_id: restaurant.id,
      table_number: newTableNumber.trim(),
      qr_token: qrToken,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTables((prev) => [...prev, newLocalTable]);
    setNewTableNumber("");
    setIsAddingTable(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <QrCode className="w-6 h-6 text-purple-500" />
            <span>Tables & QR Code Generator</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage restaurant dining tables and generate printable scan codes
          </p>
        </div>

        <button
          onClick={() => setIsAddingTable(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Table</span>
        </button>
      </div>

      {/* Add Table Modal */}
      {isAddingTable && (
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-md">
          <form onSubmit={handleCreateTable} className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Table Identifier / Name
              </label>
              <input
                type="text"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                placeholder="e.g. Table 6, Patio 2, Bar 1..."
                className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Create & Generate QR
              </button>
              <button
                type="button"
                onClick={() => setIsAddingTable(false)}
                className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-semibold rounded-xl hover:bg-zinc-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tables Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-zinc-400">Loading tables...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => {
            const tableUrl = `/restaurant/${restaurant.slug}/table/${table.qr_token}`;
            return (
              <div
                key={table.id}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {table.table_number}
                      </h3>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        Token: {table.qr_token}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>

                  <div className="my-4 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-1">
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Scan URL:</p>
                    <p className="font-mono text-zinc-400 truncate">
                      ...{tableUrl}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTableForQR(table)}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-purple-100 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View / Print QR</span>
                  </button>

                  <a
                    href={tableUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    title="Open Customer Menu in New Tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {selectedTableForQR && (
        <QRCodeModal
          table={selectedTableForQR}
          restaurantSlug={restaurant.slug}
          restaurantName={restaurant.name}
          onClose={() => setSelectedTableForQR(null)}
        />
      )}
    </div>
  );
}
