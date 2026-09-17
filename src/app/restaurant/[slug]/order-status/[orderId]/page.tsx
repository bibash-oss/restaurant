"use client";

import { useEffect, useState, use } from "react";
import { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, Clock, ArrowLeft, Receipt, Utensils } from "lucide-react";
import Link from "next/link";

export default function OrderStatusPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const search = typeof window !== "undefined" ? window.location.search : "";
      const res = await fetch(`/api/orders/${orderId}${search}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (err) {
      console.error("Failed to fetch order details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // If order is still pending, poll a couple times to catch Stripe confirmation
    const interval = setInterval(() => {
      fetchOrder();
    }, 2500);

    return () => clearInterval(interval);
  }, [orderId]);

  const isPending = order?.status === "PENDING";
  const tableNumber = order?.tables?.table_number || "Your Table";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
        {/* Header */}
        <div
          className={`p-8 text-center relative ${
            isPending ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-3 shadow-inner">
            {isPending ? (
              <Clock className="w-9 h-9 text-white animate-pulse" />
            ) : (
              <CheckCircle2 className="w-9 h-9 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {isPending ? "Confirming Payment..." : "Order Received & Paid!"}
          </h1>
          <p className="text-white/85 text-xs mt-1.5 max-w-xs mx-auto">
            {isPending
              ? "Verifying payment with Stripe. This takes just a moment..."
              : `Your order has been sent to the kitchen. Please relax while we prepare your meal.`}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-[11px] font-medium backdrop-blur-xs">
            <Utensils className="w-3 h-3" />
            <span>{tableNumber}</span>
            <span>•</span>
            <span>Order #{orderId.slice(-6)}</span>
          </div>
        </div>

        {/* Order Receipt Details */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
              <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Order Summary</span>
            </div>
            {order?.created_at && (
              <span className="text-[11px] text-zinc-400 font-mono">
                {new Date(order.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>

          {loading && !order ? (
            <div className="py-8 text-center text-xs text-zinc-400">Loading order details...</div>
          ) : (
            <div className="space-y-3 text-xs">
              {order?.order_items && order.order_items.length > 0 ? (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {order.order_items.map((it) => (
                    <div key={it.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-[11px] text-zinc-700 dark:text-zinc-300">
                          {it.quantity}
                        </span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {it.item_name}
                        </span>
                      </div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                        {formatCurrency(it.unit_price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400 text-center py-4">No items listed</p>
              )}

              {order?.customer_notes && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
                  <span className="font-bold">Kitchen Note:</span> &quot;{order.customer_notes}&quot;
                </div>
              )}

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex justify-between items-center text-zinc-500 text-xs">
                  <span>Payment Status</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isPending ? "Pending" : "Paid via Stripe"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-black text-zinc-900 dark:text-zinc-100 pt-1">
                  <span>Total Amount</span>
                  <span className="text-base text-emerald-600 dark:text-emerald-400 font-mono">
                    {order ? formatCurrency(order.total_amount) : "$0.00"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back to Menu / Order More */}
        <div className="p-5 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <Link
            href={`/restaurant/${slug}`}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold transition-all shadow-sm active:scale-[0.99]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Order More Dishes or Drinks</span>
          </Link>
          <p className="text-[11px] text-zinc-400 mt-2">
            A staff member will bring your order to {tableNumber}.
          </p>
        </div>
      </div>
    </div>
  );
}
