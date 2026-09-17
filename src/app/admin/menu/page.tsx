"use client";

import { useEffect, useState } from "react";
import { MenuItem, Category } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { DEMO_MENU_ITEMS, DEMO_CATEGORIES, DEMO_RESTAURANT } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Plus, Utensils, Check, X } from "lucide-react";
import Image from "next/image";

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [loading, setLoading] = useState(true);

  // New item form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceInput, setPriceInput] = useState(""); // in dollars, e.g. "14.99"
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const fetchMenu = async () => {
    try {
      const supabase = createClient();
      const isLiveSupabase =
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

      if (isLiveSupabase) {
        const { data: catData } = await supabase
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true });

        const { data: itemData } = await supabase
          .from("menu_items")
          .select("*")
          .order("created_at", { ascending: false });

        if (catData) setCategories(catData);
        if (itemData) {
          setItems(itemData);
          return;
        }
      }

      setCategories(DEMO_CATEGORIES);
      setItems(DEMO_MENU_ITEMS);
    } catch (err) {
      console.error("Failed to load menu:", err);
      setCategories(DEMO_CATEGORIES);
      setItems(DEMO_MENU_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleToggleAvailability = async (itemId: string, current: boolean) => {
    const nextStatus = !current;
    const isLiveSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

    if (isLiveSupabase) {
      const supabase = createClient();
      await supabase
        .from("menu_items")
        .update({ is_available: nextStatus })
        .eq("id", itemId);
    }

    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, is_available: nextStatus } : it))
    );
  };

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(priceInput);
    if (!name.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      alert("Please provide a valid dish name and price.");
      return;
    }

    const priceInCents = Math.round(parsedPrice * 100);

    const isLiveSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

    if (isLiveSupabase) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          restaurant_id: DEMO_RESTAURANT.id,
          category_id: categoryId || categories[0]?.id || null,
          name: name.trim(),
          description: description.trim() || null,
          price: priceInCents,
          image_url: imageUrl.trim() || null,
          is_available: true,
        })
        .select()
        .single();

      if (!error && data) {
        setItems((prev) => [data, ...prev]);
        resetForm();
        return;
      }
    }

    // Local fallback
    const newItem: MenuItem = {
      id: `item-local-${Date.now()}`,
      restaurant_id: DEMO_RESTAURANT.id,
      category_id: categoryId || categories[0]?.id || null,
      name: name.trim(),
      description: description.trim() || null,
      price: priceInCents,
      image_url: imageUrl.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
      is_available: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setItems((prev) => [newItem, ...prev]);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPriceInput("");
    setImageUrl("");
    setIsAddingItem(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-amber-500" />
            <span>Menu & Price Management</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Update dish prices, toggle availability, and configure menu categories
          </p>
        </div>

        <button
          onClick={() => setIsAddingItem(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Add Item Modal */}
      {isAddingItem && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Create New Menu Item
            </h3>
            <button onClick={resetForm} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateMenuItem} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Handmade Lobster Ravioli"
                  className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Price (USD $) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="e.g. 24.50 (saved as 2450 cents)"
                  className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Photo URL (Unsplash or Supabase Storage)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Description & Ingredients
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Details, allergens, culinary preparation..."
                className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
              >
                Save Menu Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-zinc-400">Loading dishes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm flex items-start gap-4"
            >
              {item.image_url ? (
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-400">
                  <Utensils className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </h3>
                    <span className="font-black text-xs text-zinc-900 dark:text-zinc-50 ml-2">
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {item.price}¢ (cents)
                  </span>

                  <button
                    onClick={() => handleToggleAvailability(item.id, item.is_available)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      item.is_available
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {item.is_available ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Available</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        <span>Sold Out</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
