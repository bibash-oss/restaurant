"use client";

import { useEffect, useState, useRef } from "react";
import { Order, OrderStatus } from "@/lib/types";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { formatCurrency } from "@/lib/utils";
import {
  ClipboardList,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Bell,
} from "lucide-react";
import { playOrderBellSound, playPaidTickSound } from "@/lib/sound";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data: Order[] = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return o.status !== "COMPLETED" && o.status !== "CANCELLED";
    return o.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-amber-500" />
            <span>Live Kitchen & Floor Orders</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time incoming orders from customer table QR scans
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">

          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["ALL", "ACTIVE", "COMPLETED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === f
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
            }`}
          >
            {f === "ALL" ? "All Orders" : f === "ACTIVE" ? "Active / In Kitchen" : "Completed Orders"}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-zinc-400">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <ClipboardList className="w-12 h-12 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
          <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">No orders yet</h3>
          <p className="text-xs text-zinc-400 mt-1">Orders placed by customers will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="text-base font-black text-zinc-900 dark:text-zinc-100">
                      {order.tables?.table_number || "Table"}
                    </span>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      #{order.id.slice(-6)} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Items List */}
                <div className="py-3 space-y-1.5 text-xs">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-zinc-800 dark:text-zinc-200">
                      <span className="font-medium">
                        <strong className="text-amber-600 dark:text-amber-400 font-bold mr-1">
                          {item.quantity}x
                        </strong>
                        {item.item_name}
                      </span>
                      <span className="text-zinc-500 font-mono">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {order.customer_notes && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 mt-2">
                    <strong>Note:</strong> {order.customer_notes}
                  </div>
                )}
              </div>

              {/* Total & Action Controls */}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="text-zinc-500">Order Total</span>
                  <span className="font-black text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>

                {/* Action Button */}
                <div className="flex items-center gap-1.5">
                  {order.status !== "COMPLETED" && order.status !== "CANCELLED" ? (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                        disabled={updatingId === order.id}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as Done</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                        disabled={updatingId === order.id}
                        className="p-2.5 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Cancel Order"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{order.status === "COMPLETED" ? "Order Completed" : "Order Cancelled"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
