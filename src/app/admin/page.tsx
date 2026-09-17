import Link from "next/link";
import {
  DollarSign,
  ClipboardList,
  QrCode,
  BookOpen,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function AdminOverviewPage() {
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  const isStripeConfigured =
    process.env.STRIPE_SECRET_KEY &&
    !process.env.STRIPE_SECRET_KEY.includes("placeholder");

  const isStripeWebhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
          Restaurant Overview
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          The Golden Olive Bistro • Live Service Dashboard
        </p>
      </div>

      {/* Configuration Status Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <span>Backend Configuration Status</span>
          <span className="text-[11px] font-normal text-zinc-400">
            (From Environment Variables)
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Supabase Database
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {isSupabaseConfigured ? "Connected to PostgreSQL" : "Demo Mode (Mock Data Active)"}
              </p>
            </div>
            {isSupabaseConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Stripe Payments
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {isStripeConfigured ? "Live / Test Mode Ready" : "Demo Mode (Placeholder Key)"}
              </p>
            </div>
            {isStripeConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Stripe Webhook
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {isStripeWebhookConfigured ? "Secret Configured" : "Awaiting Stripe CLI / URL"}
              </p>
            </div>
            {isStripeWebhookConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Shift Revenue</p>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1">$1,482.50</h3>
          <span className="text-[11px] text-emerald-600 font-medium">+18% from yesterday</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-3">
            <ClipboardList className="w-5 h-5" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Orders Today</p>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1">42</h3>
          <span className="text-[11px] text-zinc-400">2 active in kitchen</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mb-3">
            <QrCode className="w-5 h-5" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Active Tables</p>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1">5 Tables</h3>
          <span className="text-[11px] text-zinc-400">All QR codes active</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Menu Dishes</p>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1">11 Items</h3>
          <span className="text-[11px] text-emerald-600 font-medium">All in stock</span>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/admin/orders"
          className="group bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200 mb-4 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Kitchen & Floor Orders
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Monitor incoming paid orders, advance status from Paid to In Kitchen, Ready, or Completed.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-xs font-bold text-emerald-600">
            <span>Manage Orders</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          href="/admin/tables"
          className="group bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200 mb-4 group-hover:scale-105 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Tables & QR Codes
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Generate high-resolution QR codes, download table tent cards, and create new restaurant tables.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-xs font-bold text-amber-600">
            <span>View Tables</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          href="/admin/menu"
          className="group bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200 mb-4 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Menu & Pricing
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Add new dishes, update prices in cents/dollars, upload photos, and toggle sold-out statuses.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-xs font-bold text-blue-600">
            <span>Edit Menu</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
