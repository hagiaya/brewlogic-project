-- =================================================================
-- EXECUTE THIS SCRIPT TO FIX ALL "COLUMN NOT FOUND" ERRORS
-- AND UPDATE PRICING DATA
-- =================================================================

DO $$
BEGIN
    -- 1. Add sort_order
    BEGIN
        ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'sort_order exists';
    END;

    -- 2. Add is_best_seller
    BEGIN
        ALTER TABLE products ADD COLUMN is_best_seller BOOLEAN DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'is_best_seller exists';
    END;

    -- 3. Add monthly_price
    BEGIN
        ALTER TABLE products ADD COLUMN monthly_price BIGINT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'monthly_price exists';
    END;

    -- 4. Add savings_text
    BEGIN
        ALTER TABLE products ADD COLUMN savings_text TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'savings_text exists';
    END;

    -- 5. Add promo_text
    BEGIN
        ALTER TABLE products ADD COLUMN promo_text TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'promo_text exists';
    END;
END
$$;

-- =================================================================
-- UPDATE PRODUCT DATA (PRICING & TEXT)
-- =================================================================

-- 1. Starter Brew
UPDATE products SET
    duration = '1 Bulan',
    price = 49000,
    monthly_price = 49000,
    savings_text = NULL,
    promo_text = NULL,
    sort_order = 1
WHERE name ILIKE '%Starter%';

-- 2. Home Barista
UPDATE products SET
    duration = '3 Bulan',
    price = 99000,
    monthly_price = 33000,
    savings_text = 'Hemat 33%',
    promo_text = 'Beli 2 Bulan Gratis 1 Bulan',
    sort_order = 2
WHERE name ILIKE '%Home%';

-- 3. Pro Brewer
UPDATE products SET
    duration = '6 Bulan',
    price = 179000,
    monthly_price = 29800,
    savings_text = 'Hemat 40%',
    promo_text = NULL,
    sort_order = 3
WHERE name ILIKE '%Pro%';

-- 4. Coffee Master
UPDATE products SET
    duration = '1 Year',
    price = 249000,
    monthly_price = 20750,
    savings_text = 'Hemat 58%',
    promo_text = '+ BONUS EBOOK',
    sort_order = 4,
    is_best_seller = true
WHERE name ILIKE '%Master%';

-- Refresh sort orders if needed for new rows
UPDATE products SET sort_order = 99 WHERE sort_order IS NULL;
