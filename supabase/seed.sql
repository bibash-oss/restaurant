-- ==============================================================================
-- RESTAURANT QR ORDERING MVP - SEED DATA
-- ==============================================================================

DO $$
DECLARE
    v_restaurant_id UUID;
    v_cat_starters UUID;
    v_cat_mains UUID;
    v_cat_drinks UUID;
    v_cat_desserts UUID;
    v_table_1 UUID;
    v_table_2 UUID;
    v_table_3 UUID;
    v_table_4 UUID;
    v_table_5 UUID;
BEGIN
    -- 1. Create or retrieve demo restaurant "The Golden Olive Bistro"
    INSERT INTO public.restaurants (name, slug, currency, address, phone)
    VALUES (
        'The Golden Olive Bistro',
        'golden-olive',
        'usd',
        '742 Evergreen Terrace, Downtown',
        '+1 (555) 019-2834'
    )
    ON CONFLICT (slug) DO UPDATE 
    SET name = EXCLUDED.name
    RETURNING id INTO v_restaurant_id;

    -- 2. Create sample tables with pre-defined QR tokens
    -- Table 1
    INSERT INTO public.tables (restaurant_id, table_number, qr_token, is_active)
    VALUES (v_restaurant_id, 'Table 1', 'table-1-golden', true)
    ON CONFLICT (restaurant_id, table_number) DO UPDATE SET qr_token = EXCLUDED.qr_token
    RETURNING id INTO v_table_1;

    -- Table 2
    INSERT INTO public.tables (restaurant_id, table_number, qr_token, is_active)
    VALUES (v_restaurant_id, 'Table 2', 'table-2-golden', true)
    ON CONFLICT (restaurant_id, table_number) DO UPDATE SET qr_token = EXCLUDED.qr_token
    RETURNING id INTO v_table_2;

    -- Table 3
    INSERT INTO public.tables (restaurant_id, table_number, qr_token, is_active)
    VALUES (v_restaurant_id, 'Table 3', 'table-3-golden', true)
    ON CONFLICT (restaurant_id, table_number) DO UPDATE SET qr_token = EXCLUDED.qr_token
    RETURNING id INTO v_table_3;

    -- Table 4
    INSERT INTO public.tables (restaurant_id, table_number, qr_token, is_active)
    VALUES (v_restaurant_id, 'Table 4', 'table-4-golden', true)
    ON CONFLICT (restaurant_id, table_number) DO UPDATE SET qr_token = EXCLUDED.qr_token
    RETURNING id INTO v_table_4;

    -- Table 5 (The primary demo table for scans!)
    INSERT INTO public.tables (restaurant_id, table_number, qr_token, is_active)
    VALUES (v_restaurant_id, 'Table 5', 'table-5-golden', true)
    ON CONFLICT (restaurant_id, table_number) DO UPDATE SET qr_token = EXCLUDED.qr_token
    RETURNING id INTO v_table_5;

    -- 3. Create Categories
    INSERT INTO public.categories (restaurant_id, name, sort_order)
    VALUES (v_restaurant_id, 'Appetizers & Tapas', 1)
    RETURNING id INTO v_cat_starters;

    INSERT INTO public.categories (restaurant_id, name, sort_order)
    VALUES (v_restaurant_id, 'Artisanal Mains', 2)
    RETURNING id INTO v_cat_mains;

    INSERT INTO public.categories (restaurant_id, name, sort_order)
    VALUES (v_restaurant_id, 'Craft Beverages', 3)
    RETURNING id INTO v_cat_drinks;

    INSERT INTO public.categories (restaurant_id, name, sort_order)
    VALUES (v_restaurant_id, 'Decadent Desserts', 4)
    RETURNING id INTO v_cat_desserts;

    -- 4. Create Menu Items (Prices in cents: e.g. 1499 = $14.99)
    -- Starters
    INSERT INTO public.menu_items (restaurant_id, category_id, name, description, price, image_url, is_available, dietary_tags)
    VALUES
    (
        v_restaurant_id, v_cat_starters,
        'Crispy Truffle Calamari',
        'Wild tender squid lightly dusted with semolina, tossed with black truffle salt, fresh herbs, and served with house lemon-caper aioli.',
        1499,
        'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
        true,
        ARRAY['Seafood', 'Chef Choice']
    ),
    (
        v_restaurant_id, v_cat_starters,
        'Whipped Ricotta & Wild Honey Crostini',
        'Artisanal sourdough topped with organic lemon-whipped ricotta, roasted pistachios, and lavender wild honey.',
        1250,
        'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&auto=format&fit=crop&q=80',
        true,
        ARRAY['Vegetarian']
    ),
    (
        v_restaurant_id, v_cat_starters,
        'Heirloom Burrata Caprese',
        'Creamy burrata accompanied by sweet heirloom tomatoes, aged Modena balsamic glaze, and torn genovese basil.',
        1500,
        'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
        true,
        ARRAY['Vegetarian', 'Gluten-Free']
    );

    -- Mains
    INSERT INTO public.menu_items (restaurant_id, category_id, name, description, price, image_url, is_available, dietary_tags)
    VALUES
    (
        v_restaurant_id, v_cat_mains,
        'Wood-Fired Truffle Funghi Pizza',
        'Slow-fermented Neapolitan dough topped with fior di latte, roasted cremini & shiitake mushrooms, truffle emulsion, and baby arugula.',
        2100,
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
        true,
        ARRAY['Vegetarian', 'Signature']
    ),
    (
        v_restaurant_id, v_cat_mains,
        'Slow-Braised Short Rib Tagliatelle',
        'Handmade egg tagliatelle tossed in an 8-hour Chianti braised beef short rib ragù, finished with 24-month Parmigiano-Reggiano.',
        2650,
        'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=800&auto=format&fit=crop&q=80',
        true,
        ARRAY['Chef Choice']
    ),
    (
        v_restaurant_id, v_cat_mains,
        'Pan-Seared King Salmon',
        'Sustainable Pacific salmon fillet served over saffron sweet pea risotto, grilled asparagus, and citrus beurre blanc.',
        2800,
        'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop&q=80',
        true,
        ARRAY['Gluten-Free', 'Seafood']
    ),
    (
        v_restaurant_id, v_cat_mains,
        'The Wagyu Bistro Burger',
        'Half-pound American Wagyu patty, aged white cheddar, caramelized shallots, arugula, and black garlic aioli on a brioche bun with rosemary fries.',
        1950,
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
        true,
        ARRAY['Popular']
    );

    -- Beverages
    INSERT INTO public.menu_items (restaurant_id, category_id, name, description, price, image_url, is_available, dietary_tags)
    VALUES
    (
        v_restaurant_id, v_cat_drinks,
        'Blood Orange Sparkling Spritz',
        'Freshly squeezed Sicilian blood oranges, botanical herbs, sparkling mineral water, and rosemary sprig.',
        750,
        'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
        true,
        ARRAY['Beverage', 'Mocktail']
    ),
    (
        v_restaurant_id, v_cat_drinks,
        'Smoked Rosemary Espresso Tonic',
        'Double shot of single-origin Ethiopian espresso poured over chilled artisanal tonic and charred rosemary.',
        650,
        'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80',
        true,
        ARRAY['Beverage']
    );

    -- Desserts
    INSERT INTO public.menu_items (restaurant_id, category_id, name, description, price, image_url, is_available, dietary_tags)
    VALUES
    (
        v_restaurant_id, v_cat_desserts,
        'Classic Espresso Tiramisu',
        'Layered ladyfingers soaked in espresso and Marsala, whipped mascarpone zabaione, and Valrhona cocoa dust.',
        950,
        'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&auto=format&fit=crop&q=80',
        true,
        ARRAY['Dessert', 'Vegetarian']
    ),
    (
        v_restaurant_id, v_cat_desserts,
        'Warm Valrhona Molten Lava Cake',
        'Rich 70% dark chocolate cake with a molten center, served with Madagascar vanilla bean gelato.',
        1100,
        'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80',
        true,
        ARRAY['Dessert', 'Signature']
    );

END $$;
