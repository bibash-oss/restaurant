import { OrderStatus } from "@/lib/types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, { label: string; bg: string; text: string; dot: string }> = {
    PENDING: {
      label: "Pending Payment",
      bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
      text: "text-amber-700 dark:text-amber-400",
      dot: "bg-amber-500",
    },
    PAID: {
      label: "Paid / New Order",
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500 animate-pulse",
    },
    PREPARING: {
      label: "In Kitchen",
      bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
      text: "text-blue-700 dark:text-blue-400",
      dot: "bg-blue-500",
    },
    READY: {
      label: "Ready to Serve",
      bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
      text: "text-purple-700 dark:text-purple-400",
      dot: "bg-purple-500",
    },
    COMPLETED: {
      label: "Completed",
      bg: "bg-zinc-100 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700",
      text: "text-zinc-700 dark:text-zinc-300",
      dot: "bg-zinc-400",
    },
    CANCELLED: {
      label: "Cancelled",
      bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
      text: "text-rose-700 dark:text-rose-400",
      dot: "bg-rose-500",
    },
  };

  const style = styles[status] || styles.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
