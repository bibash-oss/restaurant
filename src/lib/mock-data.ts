import { Restaurant, RestaurantTable, Category, MenuItem, Order } from "./types";

export const DEMO_RESTAURANT: Restaurant = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "The Golden Olive Bistro",
  slug: "golden-olive",
  currency: "aud",
  address: "742 Evergreen Terrace, Downtown",
  phone: "+1 (555) 019-2834",
  logo_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEMO_TABLES: RestaurantTable[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    restaurant_id: DEMO_RESTAURANT.id,
    table_number: "Table 1",
    qr_token: "table-1-golden",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    restaurant_id: DEMO_RESTAURANT.id,
    table_number: "Table 2",
    qr_token: "table-2-golden",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    restaurant_id: DEMO_RESTAURANT.id,
    table_number: "Table 3",
    qr_token: "table-3-golden",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    restaurant_id: DEMO_RESTAURANT.id,
    table_number: "Table 4",
    qr_token: "table-4-golden",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    restaurant_id: DEMO_RESTAURANT.id,
    table_number: "Table 5",
    qr_token: "table-5-golden",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEMO_CATEGORIES: Category[] = [
  { id: "20000000-0000-0000-0000-000000000001", restaurant_id: DEMO_RESTAURANT.id, name: "Appetizers & Tapas", sort_order: 1, created_at: new Date().toISOString() },
  { id: "20000000-0000-0000-0000-000000000002", restaurant_id: DEMO_RESTAURANT.id, name: "Artisanal Mains", sort_order: 2, created_at: new Date().toISOString() },
  { id: "20000000-0000-0000-0000-000000000003", restaurant_id: DEMO_RESTAURANT.id, name: "Craft Beverages", sort_order: 3, created_at: new Date().toISOString() },
  { id: "20000000-0000-0000-0000-000000000004", restaurant_id: DEMO_RESTAURANT.id, name: "Decadent Desserts", sort_order: 4, created_at: new Date().toISOString() },
];

export const DEMO_MENU_ITEMS: MenuItem[] = [
  {
    id: "30000000-0000-0000-0000-000000000001",
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: "20000000-0000-0000-0000-000000000001",
    name: "Crispy Truffle Calamari",
    description: "Wild tender squid lightly dusted with semolina, tossed with black truffle salt, fresh herbs, and served with house lemon-caper aioli.",
    price: 1499,
    image_url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80",
    is_available: true,
    dietary_tags: ["Seafood", "Chef Choice"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "30000000-0000-0000-0000-000000000002",
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: "20000000-0000-0000-0000-000000000001",
    name: "Whipped Ricotta & Wild Honey Crostini",
    description: "Artisanal sourdough topped with organic lemon-whipped ricotta, roasted pistachios, and lavender wild honey.",
    price: 1250,
    image_url: "https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&auto=format&fit=crop&q=80",
    is_available: true,
    dietary_tags: ["Vegetarian"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "30000000-0000-0000-0000-000000000003",
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: "20000000-0000-0000-0000-000000000001",
    name: "Heirloom Burrata Caprese",
    description: "Creamy burrata accompanied by sweet heirloom tomatoes, aged Modena balsamic glaze, and torn genovese basil.",
    price: 1500,
    image_url: "https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80",
    is_available: true,
    dietary_tags: ["Vegetarian", "Gluten-Free"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "30000000-0000-0000-0000-000000000004",
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: "20000000-0000-0000-0000-000000000002",
    name: "Wood-Fired Truffle Funghi Pizza",
    description: "Slow-fermented Neapolitan dough topped with fior di latte, roasted cremini & shiitake mushrooms, truffle emulsion, and baby arugula.",
    price: 2100,
    image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
    is_available: true,
    dietary_tags: ["Vegetarian", "Signature"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "30000000-0000-0000-0000-000000000005",
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: "20000000-0000-0000-0000-000000000002",
    name: "Slow-Braised Short Rib Tagliatelle",
    description: "Handmade egg tagliatelle tossed in an 8-hour Chianti braised beef short rib ragù, finished with 24-month Parmigiano-Reggiano.",
    price: 2650,
    image_url: "https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=800&auto=format&fit=crop&q=80",
    is_available: true,
    dietary_tags: ["Chef Choice"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "30000000-0000-0000-0000-000000000006",
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: "20000000-0000-0000-0000-000000000002",
    name: "The Wagyu Bistro Burger",
    description: "Half-pound American Wagyu patty, aged white cheddar, caramelized shallots, arugula, and black garlic aioli on brioche with rosemary fries.",
    price: 1950,
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
    is_available: true,
    dietary_tags: ["Popular"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "30000000-0000-0000-0000-000000000007",
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: "20000000-0000-0000-0000-000000000003",
    name: "Blood Orange Sparkling Spritz",
    description: "Freshly squeezed Sicilian blood oranges, botanical herbs, sparkling mineral water, and rosemary sprig.",
    price: 750,
    image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80",
    is_available: true,
    dietary_tags: ["Beverage", "Mocktail"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "30000000-0000-0000-0000-000000000008",
    restaurant_id: DEMO_RESTAURANT.id,
    category_id: "20000000-0000-0000-0000-000000000004",
    name: "Warm Valrhona Molten Lava Cake",
    description: "Rich 70% dark chocolate cake with a molten center, served with Madagascar vanilla bean gelato.",
    price: 1100,
    image_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80",
    is_available: true,
    dietary_tags: ["Dessert", "Signature"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_ORDERS: Order[] = [];

declare global {
  // eslint-disable-next-line no-var
  var __GLOBAL_DEMO_ORDERS__: Order[] | undefined;
}

if (!globalThis.__GLOBAL_DEMO_ORDERS__) {
  globalThis.__GLOBAL_DEMO_ORDERS__ = INITIAL_ORDERS;
}

export const DEMO_ORDERS: Order[] = globalThis.__GLOBAL_DEMO_ORDERS__;
