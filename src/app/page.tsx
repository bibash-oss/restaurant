import Link from "next/link";
import {
  QrCode,
  UtensilsCrossed,
  ShieldCheck,
  CreditCard,
  ChefHat,
  Database,
  Terminal,
  FileText,
  Store,
  ArrowRight,
} from "lucide-react";
import { LandingTableQRSection } from "@/components/landing/LandingTableQRSection";
import { DEMO_RESTAURANT, DEMO_TABLES } from "@/lib/mock-data";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function Home() {
  let restaurant = DEMO_RESTAURANT;
  let tables = DEMO_TABLES;

  const isLiveSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  if (isLiveSupabase) {
    try {
      const { data: restData } = await supabaseAdmin
        .from("restaurants")
        .select("*")
        .limit(1)
        .single();

      if (restData) {
        restaurant = restData;
        const { data: tableData } = await supabaseAdmin
          .from("tables")
          .select("*")
          .eq("restaurant_id", restData.id)
          .eq("is_active", true)
          .order("table_number", { ascending: true });

        if (tableData && tableData.length > 0) {
          tables = tableData;
        }
      }
    } catch (e) {
      console.error("Failed to fetch live Supabase data on landing, using fallback:", e);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950">
      {/* Top bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-zinc-50">
                TableDine<span className="text-amber-500">QR</span>
              </span>
              <span className="block text-[10px] text-zinc-400 font-mono">
                {restaurant.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/admin/orders"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-emerald-400 border border-zinc-800 transition-colors"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kitchen Display</span>
            </Link>
            <Link
              href="/admin"
              className="px-3 sm:px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
            >
              Admin Console
            </Link>
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center text-center">
        {/* Hero headline */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Production-Ready QR Dining &amp; Payments Stack
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-3xl leading-[1.1] text-zinc-50">
          Scan. Order. Pay.{" "}
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
            No Apps, No Waiting.
          </span>
        </h1>

        <p className="mt-4 text-zinc-400 max-w-2xl text-sm sm:text-base leading-relaxed">
          Fast contactless dining powered by dynamic table cryptographic tokens, PostgreSQL price validation,
          and instant Stripe checkout directly to kitchen order displays.
        </p>

        {/* Prominent QR Code for Customers (Commented) */}
        {/* <LandingTableQRSection restaurant={restaurant} /> */}

        {/* Go to Menu Button */}
        <div className="my-10 flex flex-col items-center justify-center">
          <Link
            href={`/restaurant/${restaurant.slug}`}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-base sm:text-lg shadow-2xl shadow-amber-500/30 active:scale-95 transition-all"
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span>Go to Menu</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-zinc-400 mt-3">
            Select your table and explore our contactless dine-in menu
          </p>
        </div>

        {/* 4 Feature Pillars */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left w-full">
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-zinc-100">Dynamic Table QRs</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Every table has a unique cryptographic token. Guests scan directly into their designated table with zero manual input.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-zinc-100">Zero Price Tampering</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Browser totals are presentation only. The checkout API validates items and recalculates cent amounts directly against PostgreSQL.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-zinc-100">Stripe Webhook Sync</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Upon successful payment, Stripe webhooks trigger state transition from <code>PENDING</code> to <code>PAID</code> instantly.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-zinc-100">Supabase RLS &amp; Storage</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              PostgreSQL schema with Row-Level Security, pre-seeded restaurant &amp; dishes, and full owner authentication guardrails.
            </p>
          </div>
        </div>

        {/* Architecture Flow Diagram */}
        <div className="mt-16 w-full p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-left">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-100">End-to-End Transaction Flow</h2>
              <p className="text-xs text-zinc-400 mt-0.5">How customer scans turn into paid kitchen tickets</p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              Deterministic Architecture
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-center text-xs font-semibold">
            <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex flex-col items-center justify-center">
              <span className="text-amber-400 font-mono text-[11px] mb-1">Step 1</span>
              <span>Customer Phone</span>
              <span className="text-[10px] text-zinc-400 mt-1">Scans Table QR</span>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex flex-col items-center justify-center">
              <span className="text-amber-400 font-mono text-[11px] mb-1">Step 2</span>
              <span>Next.js Menu</span>
              <span className="text-[10px] text-zinc-400 mt-1">Loads Table X Dishes</span>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex flex-col items-center justify-center">
              <span className="text-amber-400 font-mono text-[11px] mb-1">Step 3</span>
              <span>/api/checkout</span>
              <span className="text-[10px] text-zinc-400 mt-1">DB Price Verification</span>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex flex-col items-center justify-center">
              <span className="text-amber-400 font-mono text-[11px] mb-1">Step 4</span>
              <span>Stripe Checkout</span>
              <span className="text-[10px] text-zinc-400 mt-1">Card / Apple Pay</span>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex flex-col items-center justify-center">
              <span className="text-amber-400 font-mono text-[11px] mb-1">Step 5</span>
              <span>Stripe Webhook</span>
              <span className="text-[10px] text-zinc-400 mt-1">Order marked PAID</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 flex flex-col items-center justify-center">
              <span className="text-emerald-400 font-mono text-[11px] mb-1">Step 6</span>
              <span>Kitchen Screen</span>
              <span className="text-[10px] text-emerald-200 mt-1">Live Order Flips to Paid</span>
            </div>
          </div>
        </div>

        {/* Quick Links to Documentation */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-amber-500" />
            Check <code>SETUP_GUIDE.md</code> for commands &amp; webhook setup
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-500" />
            Database migrations in <code>supabase/migrations/01_schema.sql</code>
          </span>
          <Link
            href="/restaurant/golden-olive"
            className="flex items-center gap-1.5 text-zinc-300 hover:text-amber-400 transition-colors"
          >
            <Store className="w-4 h-4 text-amber-500" />
            Direct Restaurant Storefront
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500">
        <p>Built for production restaurant table ordering • Open source MIT license</p>
      </footer>
    </div>
  );
}
