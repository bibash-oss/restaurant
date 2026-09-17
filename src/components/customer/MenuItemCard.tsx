"use client";

import { MenuItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Plus, Minus, Check } from "lucide-react";
import Image from "next/image";

interface MenuItemCardProps {
  item: MenuItem;
  quantityInCart: number;
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (item: MenuItem) => void;
}

export function MenuItemCard({
  item,
  quantityInCart,
  onAddToCart,
  onRemoveFromCart,
}: MenuItemCardProps) {
  const isSelected = quantityInCart > 0;

  return (
    <div
      className={`rounded-2xl border p-4 flex gap-4 shadow-sm transition-all duration-150 relative ${
        isSelected
          ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/20"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {/* In-Cart Count Badge */}
      {isSelected && (
        <div className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
          <Check className="w-3 h-3 stroke-[3]" />
          <span>{quantityInCart} in Order</span>
        </div>
      )}

      {/* Item details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {item.dietary_tags?.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60"
              >
                {tag}
              </span>
            ))}
          </div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base leading-snug">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
          <span className="font-extrabold text-zinc-900 dark:text-zinc-50 text-base">
            {formatCurrency(item.price)}
          </span>

          {isSelected ? (
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border-2 border-emerald-500 rounded-full p-1 shadow-sm">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFromCart(item);
                }}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200 active:scale-90 transition-transform touch-manipulation cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4 pointer-events-none" />
              </button>
              <span className="font-black text-sm text-emerald-700 dark:text-emerald-400 min-w-5 text-center select-none">
                {quantityInCart}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(item);
                }}
                className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs active:scale-90 transition-transform touch-manipulation cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4 pointer-events-none" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(item);
              }}
              disabled={item.is_available === false}
              className="flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] min-w-[72px] rounded-full text-xs font-black shadow-xs bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 active:scale-95 transition-transform touch-manipulation cursor-pointer"
            >
              <Plus className="w-4 h-4 pointer-events-none" />
              <span className="pointer-events-none">{item.is_available !== false ? "Add" : "Sold Out"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Item Image */}
      {item.image_url && (
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 96px, 112px"
            className="object-cover"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}
