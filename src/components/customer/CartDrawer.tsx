"use client";

import { useState } from "react";
import { CartItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { X, Trash2, Plus, Minus, ShoppingBag, Send, ChefHat, Loader2 } from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  tableNumber: string;
  restaurantSlug: string;
  qrToken: string;
  onUpdateQuantity: (menuItemId: string, newQty: number) => void;
  onClearCart: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  tableNumber,
  restaurantSlug,
  qrToken,
  onUpdateQuantity,
  onClearCart,
}: CartDrawerProps) {
  const [customerNotes, setCustomerNotes] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalCents = cart.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  async function handleConfirmOrder() {
    setIsCheckingOut(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((c) => ({
            menuItemId: c.menuItem.id,
            quantity: c.quantity,
          })),
          restaurantSlug,
          qrToken,
          customerNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to confirm order with kitchen");
      }

      if (data.orderId) {
        // Clear customer cart and redirect to order status
        onClearCart();
        window.location.href = `/restaurant/${restaurantSlug}/order-status/${data.orderId}`;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Order submission error";
      setErrorMessage(msg);
      setIsCheckingOut(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-10 pointer-events-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">Your Order</h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
                Serving to: <strong className="text-zinc-800 dark:text-zinc-200">{tableNumber}</strong>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-zinc-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-zinc-500">Your cart is empty.</p>
              <p className="text-xs text-zinc-400 mt-1">Add some delicious dishes from the menu!</p>
            </div>
          ) : (
            <div className="space-y-3 divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {cart.map(({ menuItem, quantity }) => (
                <div key={menuItem.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {menuItem.name}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      {formatCurrency(menuItem.price)} each
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                      <button
                        onClick={() => onUpdateQuantity(menuItem.id, quantity - 1)}
                        className="w-6 h-6 rounded-md bg-white dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        {quantity === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3" />}
                      </button>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 min-w-4 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(menuItem.id, quantity + 1)}
                        className="w-6 h-6 rounded-md bg-white dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 min-w-16 text-right">
                      {formatCurrency(menuItem.price * quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <label htmlFor="notes" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Special Kitchen Instructions (optional)
              </label>
              <textarea
                id="notes"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="e.g. Dressing on the side, allergies, extra spicy..."
                rows={2}
                className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl text-xs">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] bg-zinc-50 dark:bg-zinc-900/90 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Items Subtotal</span>
                <span>{formatCurrency(totalCents)}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Taxes & Service</span>
                <span>Calculated at Checkout</span>
              </div>
              <div className="flex justify-between font-bold text-base text-zinc-900 dark:text-zinc-50 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                <span>Total</span>
                <span>{formatCurrency(totalCents)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={isCheckingOut}
              className="w-full py-4 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-75 touch-manipulation cursor-pointer"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending to Kitchen...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Confirm Order ({formatCurrency(totalCents)})</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-zinc-400 text-center font-medium leading-relaxed">
              Ticket sent directly to the kitchen. You will receive payment options once food is dispatched.
            </p>

            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                🔒 256-bit SSL Encrypted
              </span>
              <button
                onClick={onClearCart}
                className="text-zinc-400 hover:text-red-500 underline transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
