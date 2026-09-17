"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Link from "next/link";
import { Restaurant } from "@/lib/types";
import { ArrowRight, QrCode } from "lucide-react";

interface LandingTableQRSectionProps {
  restaurant: Restaurant;
}

export function LandingTableQRSection({
  restaurant,
}: LandingTableQRSectionProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Network IP / Origin determination
  const [origin, setOrigin] = useState<string>(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentOrigin = window.location.origin;
      const isLocalHost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const envAppUrl = process.env.NEXT_PUBLIC_APP_URL;

      if (isLocalHost && envAppUrl && !envAppUrl.includes("localhost")) {
        setOrigin(envAppUrl);
      } else if (!isLocalHost) {
        setOrigin(currentOrigin);
      }
    }
  }, []);

  const targetPath = `/restaurant/${restaurant.slug}`;
  const fullScanUrl = `${origin}${targetPath}`;

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(
      fullScanUrl,
      {
        width: 480,
        margin: 2,
        color: {
          dark: "#18181b",
          light: "#ffffff",
        },
      },
      (err, url) => {
        if (!err && url && isMounted) {
          setQrDataUrl(url);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [fullScanUrl]);

  return (
    <div className="my-10 flex flex-col items-center">
      {/* Printable / Scannable QR Card */}
      <div className="w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-zinc-900 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10 text-center">
        <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-bold">
          {restaurant.name}
        </span>
        <h2 className="text-xl font-black text-zinc-100 mt-1 flex items-center justify-center gap-2">
          <QrCode className="w-5 h-5 text-amber-400" />
          <span>Scan to Order &amp; Pay</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Point your smartphone camera to view menu &amp; choose your table
        </p>

        {/* QR Code Container */}
        <div className="my-5 p-4 rounded-2xl bg-white shadow-inner flex items-center justify-center relative aspect-square max-w-[240px] mx-auto">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`${restaurant.name} Menu QR Code`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <p suppressHydrationWarning className="text-[11px] text-zinc-500 truncate px-2 font-mono">
          {fullScanUrl}
        </p>

        {/* Direct Link button */}
        <Link
          href={targetPath}
          className="mt-5 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-md transition-all active:scale-95"
        >
          <span>Open Menu Directly</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
