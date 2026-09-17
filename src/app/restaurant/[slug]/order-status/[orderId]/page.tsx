"use client";

import { useEffect, useState, use } from "react";
import { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  ArrowLeft,
  Receipt,
  Utensils,
  ChefHat,
  CreditCard,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function OrderStatusPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRedirectingToPay, setIsRedirectingToPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const fetchOrder = async () => {
    try {
      const search = typeof window !== "undefined" ? window.location.search : "";
      const res = await fetch(`/api/orders/${orderId}${search}`);
      if (res.ok) {
        const data: Order = await res.json();
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

    // Poll every 3 seconds so status updates immediately when kitchen dispatches or Stripe completes
    const interval = setInterval(() => {
      fetchOrder();
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  const handlePayNow = async () => {
    setIsRedirectingToPay(true);
    setPayError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          restaurantSlug: slug,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate payment session");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment error occurred";
      setPayError(msg);
      setIsRedirectingToPay(false);
    }
  };

  const status = order?.status || "PREPARING";
  const isPaid = status === "PAID" || status === "COMPLETED";
  const isDispatched = (status === "DISPATCHED" || status === "READY") && !isPaid;
  const isCooking = status === "PREPARING" || status === "PENDING";
  const tableNumber = order?.tables?.table_number || "Your Table";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
        {/* Header Dynamic Status */}
        <div
          className={`p-6 sm:p-8 text-center relative transition-colors duration-300 ${
            isPaid
              ? "bg-emerald-600 text-white"
              : isDispatched
              ? "bg-amber-500 text-zinc-950"
              : "bg-blue-600 text-white"
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-3 shadow-inner">
            {isPaid ? (
              <CheckCircle2 className="w-9 h-9 text-white" />
            ) : isDispatched ? (
              <Sparkles className="w-9 h-9 text-zinc-950 animate-bounce" />
            ) : (
              <ChefHat className="w-9 h-9 text-white animate-pulse" />
            )}
          </div>

          <h1 className="text-2xl font-black tracking-tight leading-tight">
            {isPaid
              ? "Payment Verified & Paid!"
              : isDispatched
              ? "Food Dispatched to Table!"
              : "Order Received in Kitchen"}
          </h1>

          <p
            className={`text-xs mt-2 max-w-xs mx-auto leading-relaxed ${
              isDispatched ? "text-zinc-900 font-medium" : "text-white/85"
            }`}
          >
            {isPaid
              ? "Thank you! Your payment is confirmed. Enjoy your dining experience!"
              : isDispatched
              ? "Your food is ready & on its way to your table. Please complete payment below."
              : "Our chefs have received your ticket and are preparing your food now."}
          </p>

          <div
            className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-xs ${
              isDispatched
                ? "bg-zinc-950/15 text-zinc-950"
                : "bg-white/15 text-white"
            }`}
          >
            <Utensils className="w-3 h-3" />
            <span>{tableNumber}</span>
            <span>•</span>
            <span>Order #{orderId.slice(-6).toUpperCase()}</span>
          </div>
        </div>

        {/* Dynamic 3-Step Progress Tracker */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>1. Confirmed</span>
            </div>
            <div
              className={`flex items-center gap-1 ${
                isDispatched || isPaid
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-blue-600 dark:text-blue-400 animate-pulse"
              }`}
            >
              {isDispatched || isPaid ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              <span>2. Cooking (KOT)</span>
            </div>
            <div
              className={`flex items-center gap-1 ${
                isPaid
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isDispatched
                  ? "text-amber-600 dark:text-amber-400 font-black animate-pulse"
                  : "text-zinc-400"
              }`}
            >
              {isPaid ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <CreditCard className="w-3.5 h-3.5" />
              )}
              <span>3. Dispatched &amp; Pay</span>
            </div>
          </div>
        </div>

        {/* Payment Action Section (ONLY SHOWN WHEN DISPATCHED) */}
        {isDispatched && (
          <div className="p-5 sm:p-6 bg-amber-500/10 dark:bg-amber-400/10 border-b border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Ready for Payment
                </span>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                  Bill Total: {order ? formatCurrency(order.total_amount) : "$0.00"}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-zinc-950 shadow-xs">
                Dispatched
              </span>
            </div>

            {payError && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
                {payError}
              </div>
            )}

            <button
              type="button"
              onClick={handlePayNow}
              disabled={isRedirectingToPay}
              className="w-full py-3.5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isRedirectingToPay ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading Stripe Payment...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>
                    Pay with Stripe ({order ? formatCurrency(order.total_amount) : ""})
                  </span>
                </>
              )}
            </button>
            <p className="text-[10px] text-zinc-400 text-center font-medium">
              Card payment powered by Stripe. Apple Pay &amp; Google Pay supported.
            </p>
          </div>
        )}

        {/* Waiting on Kitchen Notice (WHEN COOKING) */}
        {isCooking && (
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 text-center">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center gap-1.5">
              <ChefHat className="w-4 h-4 shrink-0" />
              <span>Payment option will unlock here as soon as food is dispatched.</span>
            </p>
          </div>
        )}

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
            <div className="py-8 text-center text-xs text-zinc-400">Loading ticket details...</div>
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
                  <span>Billing Status</span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      isPaid
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isDispatched
                        ? "text-amber-600 dark:text-amber-400 font-bold"
                        : "text-zinc-500"
                    }`}
                  >
                    {isPaid ? "Paid via Stripe ✓" : isDispatched ? "Ready to Pay" : "Unpaid (Cooking)"}
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
            Dishes are served directly to {tableNumber}.
          </p>
        </div>
      </div>
    </div>
  );
}
