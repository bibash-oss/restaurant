"use client";

import { useEffect, useState } from "react";
import { Order } from "@/lib/types";
import {
  ChefHat,
  RefreshCw,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Utensils,
  StickyNote,
} from "lucide-react";

export default function KotKitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"ACTIVE" | "DISPATCHED" | "ALL">("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data: Order[] = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to load KOT tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 3500);
    return () => clearInterval(timer);
  }, []);

  const handleDispatchFood = async (orderId: string) => {
    setDispatchingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DISPATCHED" }),
      });

      if (res.ok) {
        const updated = await res.json();
        const nextStatus = updated.status || "DISPATCHED";
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Failed to dispatch food:", errData);
      }
    } catch (err) {
      console.error("Failed to dispatch food:", err);
    } finally {
      setDispatchingId(null);
    }
  };

  // Kitchen tickets: Focus on cooking (PREPARING / PENDING) and recently dispatched
  const kitchenTickets = orders.filter((o) => {
    if (filter === "ACTIVE") {
      return o.status === "PREPARING" || o.status === "PENDING";
    }
    if (filter === "DISPATCHED") {
      return o.status === "DISPATCHED" || o.status === "READY";
    }
    return o.status !== "CANCELLED";
  });

  const activeCount = orders.filter(
    (o) => o.status === "PREPARING" || o.status === "PENDING"
  ).length;

  const dispatchedCount = orders.filter(
    (o) => o.status === "DISPATCHED" || o.status === "READY"
  ).length;

  return (
    <div className="space-y-6">
      {/* KOT Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>KOT — Kitchen Order Tickets</span>
                {activeCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
                    {activeCount} Cooking
                  </span>
                )}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Real-time kitchen order display for chefs &amp; line cooks
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh KOT</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setFilter("ACTIVE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === "ACTIVE"
              ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20"
              : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Active Cooking ({activeCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("DISPATCHED")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === "DISPATCHED"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
              : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Dispatched ({dispatchedCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("ALL")}
          className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            filter === "ALL"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          All Tickets
        </button>
      </div>

      {/* KOT Tickets Grid */}
      {loading && orders.length === 0 ? (
        <div className="py-20 text-center text-zinc-400 text-xs font-medium">
          Loading live kitchen tickets...
        </div>
      ) : kitchenTickets.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-xs">
          <ChefHat className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-base">
            Kitchen Board Clear!
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {filter === "ACTIVE"
              ? "No pending tickets in the kitchen right now. As soon as guests confirm an order from their table, tickets appear here with a bell chime."
              : "No tickets in this tab."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {kitchenTickets.map((ticket) => {
            const isDispatched = ticket.status === "DISPATCHED" || ticket.status === "READY";
            const tableNum = ticket.tables?.table_number || "Table";
            const elapsedMins = Math.floor(
              (Date.now() - new Date(ticket.created_at).getTime()) / 60000
            );

            return (
              <div
                key={ticket.id}
                className={`rounded-3xl border-2 flex flex-col justify-between overflow-hidden shadow-md transition-all duration-200 ${
                  isDispatched
                    ? "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 opacity-80"
                    : "bg-white dark:bg-zinc-900 border-amber-500/80 ring-2 ring-amber-500/15"
                }`}
              >
                {/* Ticket Header */}
                <div
                  className={`p-4 sm:p-5 border-b flex items-start justify-between ${
                    isDispatched
                      ? "bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800"
                      : "bg-amber-500 text-zinc-950 border-amber-600"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">
                      KOT Ticket #{ticket.id.slice(-6).toUpperCase()}
                    </span>
                    <h2
                      className={`text-2xl font-black tracking-tight leading-none mt-0.5 ${
                        isDispatched
                          ? "text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-950"
                      }`}
                    >
                      {tableNum}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold opacity-85">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsedMins <= 0 ? "Just now" : `${elapsedMins}m ago`}</span>
                  </div>
                </div>

                {/* Ticket Items (Culinary focus - NO prices) */}
                <div className="p-5 flex-1 space-y-3">
                  <div className="space-y-2.5">
                    {ticket.order_items && ticket.order_items.length > 0 ? (
                      ticket.order_items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="flex items-start gap-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800/80 last:border-none"
                        >
                          <span
                            className={`px-2.5 py-1 rounded-lg text-sm font-black min-w-8 text-center shrink-0 shadow-2xs ${
                              isDispatched
                                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
                                : "bg-amber-500/20 text-amber-950 dark:text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {item.quantity}x
                          </span>
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pt-0.5 leading-snug">
                            {item.item_name}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400">Order items logged</span>
                    )}
                  </div>

                  {/* Customer Cooking Notes */}
                  {ticket.customer_notes && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2 mt-3">
                      <StickyNote className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                      <div>
                        <strong className="block text-[10px] font-black uppercase tracking-wider">
                          Kitchen Instruction:
                        </strong>
                        <p className="mt-0.5 font-medium leading-relaxed">
                          &ldquo;{ticket.customer_notes}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ticket Footer Actions (NO payment info) */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/90 border-t border-zinc-100 dark:border-zinc-800">
                  {isDispatched ? (
                    <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold px-1 py-1">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Food Dispatched</span>
                      </span>
                      <span className="text-[11px] text-zinc-400">Sent to table</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDispatchFood(ticket.id)}
                      disabled={dispatchingId === ticket.id}
                      className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {dispatchingId === ticket.id
                          ? "Dispatching..."
                          : "Dispatch Food (Send to Table)"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
