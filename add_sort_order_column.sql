-- Add sort_order column to products table
DO $$
BEGIN
    BEGIN
        ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column sort_order already exists in products.';
    END;
END
$$;

-- Initialize sort_order for existing products based on current price order (or any default)
WITH sorted AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY price ASC) as rn
    FROM products
)
UPDATE products
SET sort_order = sorted.rn
FROM sorted
WHERE products.id = sorted.id;
