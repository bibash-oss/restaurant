"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Order } from "@/lib/types";
import { playOrderBellSound, playPaidTickSound } from "@/lib/sound";
import {
  UtensilsCrossed,
  LayoutDashboard,
  QrCode,
  BookOpen,
  ClipboardList,
  ChefHat,
  ExternalLink,
  Volume2,
  VolumeX,
  Bell,
  CheckCircle2,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevOrdersRef = useRef<Order[] | null>(null);

  // Monitor live orders across all admin pages
  useEffect(() => {
    const pollOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data: Order[] = await res.json();

          if (prevOrdersRef.current && soundEnabled) {
            // Check for brand new live order
            const hasNewOrder = data.some(
              (newOrd) => !prevOrdersRef.current!.some((oldOrd) => oldOrd.id === newOrd.id)
            );

            // Check for order status becoming PAID from Stripe
            const hasNewPaid = data.some((newOrd) => {
              const old = prevOrdersRef.current!.find((o) => o.id === newOrd.id);
              return old && old.status !== "PAID" && newOrd.status === "PAID";
            });

            if (hasNewOrder) {
              playOrderBellSound();
            } else if (hasNewPaid) {
              playPaidTickSound();
            }
          }

          prevOrdersRef.current = data;
        }
      } catch (err) {
        console.warn("Admin order audio monitor poll error:", err);
      }
    };

    pollOrders();
    const interval = setInterval(pollOrders, 3500);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/kot", label: "KOT (Kitchen)", icon: ChefHat },
    { href: "/admin/orders", label: "Live Orders", icon: ClipboardList },
    { href: "/admin/tables", label: "Tables & QR Codes", icon: QrCode },
    { href: "/admin/menu", label: "Menu Management", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex flex-col md:flex-row text-zinc-900 dark:text-zinc-100">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight">Admin Console</h2>
              <span className="text-[11px] text-zinc-400">The Golden Olive</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sound Alerts Controls */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              Audio Alerts
            </span>
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playOrderBellSound();
              }}
              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3 h-3" />
                  <span>ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3 h-3" />
                  <span>MUTED</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => playOrderBellSound()}
              title="Test new order bell sound"
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <Bell className="w-3 h-3 text-amber-500" />
              <span>Bell</span>
            </button>
            <button
              type="button"
              onClick={() => playPaidTickSound()}
              title="Test Stripe paid tick sound"
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Tick</span>
            </button>
          </div>
        </div>

        {/* Quick Customer Demo Link */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
          <Link
            href="/restaurant/golden-olive"
            target="_blank"
            className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors"
          >
            <span>Open Menu (Customer)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
