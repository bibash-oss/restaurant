"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, Download, Printer, Copy, Check, ExternalLink } from "lucide-react";
import { RestaurantTable } from "@/lib/types";

interface QRCodeModalProps {
  table: RestaurantTable;
  restaurantSlug: string;
  restaurantName: string;
  onClose: () => void;
}

export function QRCodeModal({
  table,
  restaurantSlug,
  restaurantName,
  onClose,
}: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const scanUrl = `${origin}/restaurant/${restaurantSlug}/table/${table.qr_token}`;

  useEffect(() => {
    QRCode.toDataURL(
      scanUrl,
      {
        width: 400,
        margin: 2,
        color: {
          dark: "#18181b",
          light: "#ffffff",
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [scanUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(scanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${restaurantSlug}-${table.table_number.toLowerCase().replace(/\s+/g, "-")}-qr.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
              Table QR Code
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {table.table_number} • {restaurantName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Table Tent Card Area */}
        <div id="printable-qr-card" className="my-6 p-6 bg-amber-50/50 dark:bg-zinc-800/60 rounded-2xl border-2 border-dashed border-amber-200 dark:border-zinc-700 text-center">
          <span className="text-xs font-bold tracking-widest text-amber-700 dark:text-amber-400 uppercase">
            {restaurantName}
          </span>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
            {table.table_number}
          </h2>

          <div className="my-4 mx-auto w-56 h-56 bg-white p-3 rounded-2xl shadow-sm border border-zinc-200/80 flex items-center justify-center">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`${table.table_number} QR Code`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Scan with your smartphone camera to view menu & order
          </p>
          <p className="text-[11px] text-zinc-400 mt-1 truncate px-2 font-mono">
            {scanUrl}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
          <button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Card
          </button>

          <button
            onClick={handleCopy}
            className="col-span-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy URL</span>
              </>
            )}
          </button>

          <a
            href={`/restaurant/${restaurantSlug}/table/${table.qr_token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Menu</span>
          </a>
        </div>
      </div>
    </div>
  );
}
