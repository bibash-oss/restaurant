"use client";

import { useState } from "react";
import { MenuItem, Restaurant, RestaurantTable, Category, CartItem } from "@/lib/types";
import { MenuItemCard } from "@/components/customer/MenuItemCard";
import { CartDrawer } from "@/components/customer/CartDrawer";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  UtensilsCrossed,
  Search,
  MapPin,
  ChevronDown,
  Check,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";

interface CustomerMenuViewProps {
  restaurant: Restaurant;
  table?: RestaurantTable | null;
  allTables?: RestaurantTable[];
  categories: Category[];
  menuItems: MenuItem[];
  isTableLocked?: boolean;
}

export function CustomerMenuView({
  restaurant,
  table: initialTable,
  allTables = [],
  categories,
  menuItems,
  isTableLocked = false,
}: CustomerMenuViewProps) {
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(
    initialTable || null
  );
  // Modal pops up if not locked to table and no initial table
  const [isTablePickerOpen, setIsTablePickerOpen] = useState(!initialTable && !isTableLocked);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cart actions
  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });

    setToastMessage(`✓ Added "${item.name}"`);
    setTimeout(() => setToastMessage(null), 1800);
  };

  const handleRemoveFromCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((c) => c.menuItem.id !== item.id);
      }
      return prev.map((c) =>
        c.menuItem.id === item.id ? { ...c, quantity: c.quantity - 1 } : c
      );
    });
  };

  const handleUpdateQuantity = (menuItemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((c) => c.menuItem.id !== menuItemId));
    } else {
      setCart((prev) =>
        prev.map((c) => (c.menuItem.id === menuItemId ? { ...c, quantity: newQty } : c))
      );
    }
  };

  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const totalCartAmount = cart.reduce((acc, it) => acc + it.menuItem.price * it.quantity, 0);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category_id === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const effectiveTableNumber = selectedTable
    ? selectedTable.table_number
    : "Choose Table";

  const effectiveQrToken =
    selectedTable?.qr_token || (allTables[0]?.qr_token ?? "table-1-golden");

  const handleSelectTable = (table: RestaurantTable) => {
    setSelectedTable(table);
    setIsTablePickerOpen(false);
    setToastMessage(`✓ Seated at ${table.table_number}`);
    setTimeout(() => setToastMessage(null), 1800);
  };

  const handleOpenCart = () => {
    if (!selectedTable && !isTableLocked && allTables.length > 0) {
      setIsTablePickerOpen(true);
      setToastMessage("Please select your table first!");
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-36 text-zinc-900 dark:text-zinc-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold transition-all duration-150">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Restaurant Header Banner */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-zinc-900 dark:text-zinc-50 leading-tight">
                {restaurant.name}
              </h1>

              {/* Table status badge or picker */}
              {isTableLocked ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {selectedTable?.table_number || "Table"}
                  </span>
                  {restaurant.address && (
                    <span className="text-[11px] text-zinc-400 hidden sm:flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" /> {restaurant.address}
                    </span>
                  )}
                </div>
              ) : (
                <div className="relative mt-1">
                  <button
                    type="button"
                    onClick={() => setIsTablePickerOpen(true)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full transition-colors active:scale-95 ${
                      selectedTable
                        ? "text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                        : "text-zinc-950 bg-amber-500 font-bold shadow-md shadow-amber-500/20 hover:bg-amber-400"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedTable ? "bg-emerald-500" : "bg-zinc-950 animate-ping"
                      }`}
                    />
                    <span>{effectiveTableNumber}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCart}
            className="relative p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-zinc-950 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Choose Table Modal (Pops up on both mobile and big screen) */}
      {!isTableLocked && isTablePickerOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTablePickerOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl relative z-10 text-zinc-900 dark:text-zinc-100">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    Which Table Are You At?
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Select your dining table to start ordering
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTablePickerOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 touch-manipulation cursor-pointer"
              >
                <X className="w-4 h-4 pointer-events-none" />
              </button>
            </div>

            {/* Tables Grid */}
            <div className="my-4 grid grid-cols-2 gap-3 overflow-y-auto p-1 flex-1">
              {allTables.map((t) => {
                const isSelected = selectedTable?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTable(t)}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all active:scale-95 touch-manipulation cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/15 border-amber-500/80 shadow-md text-zinc-900 dark:text-zinc-100"
                        : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/80 hover:border-amber-500/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSelected ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                        <span className="font-bold text-sm">{t.table_number}</span>
                      </div>
                      <span className="text-[11px] text-zinc-400 block mt-0.5">
                        Dine-In Seating
                      </span>
                    </div>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-amber-500" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-zinc-400 text-center">
              Your order tickets will be routed directly to this table.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-6 space-y-6">
        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
          />
        </div>

        {/* Categories Horizontal Scroller */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === "all"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            All Dishes
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items List */}
        {categories.map((category) => {
          if (selectedCategory !== "all" && selectedCategory !== category.id) {
            return null;
          }

          const itemsInCategory = filteredItems.filter(
            (i) => i.category_id === category.id
          );

          if (itemsInCategory.length === 0) return null;

          return (
            <section key={category.id} className="space-y-3 pt-2">
              <h2 className="font-bold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {category.name}
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {itemsInCategory.map((item) => {
                  const cartItem = cart.find((c) => c.menuItem.id === item.id);
                  return (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      quantityInCart={cartItem?.quantity || 0}
                      onAddToCart={() => handleAddToCart(item)}
                      onRemoveFromCart={() => handleRemoveFromCart(item)}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {/* Floating Bottom Cart Bar */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-6 inset-x-4 max-w-2xl mx-auto z-40 pb-[env(safe-area-inset-bottom)] transition-all duration-200">
          <button
            type="button"
            onClick={handleOpenCart}
            className="w-full py-4 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm shadow-2xl shadow-amber-500/40 flex items-center justify-between active:scale-95 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-zinc-950 text-white text-xs flex items-center justify-center font-bold">
                {totalCartCount}
              </span>
              <span>View Order ({effectiveTableNumber})</span>
            </div>
            <div className="flex items-center gap-1.5 text-base font-black">
              <span>{formatCurrency(totalCartAmount)}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        tableNumber={effectiveTableNumber}
        restaurantSlug={restaurant.slug}
        qrToken={effectiveQrToken}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={() => setCart([])}
      />
    </div>
  );
}
