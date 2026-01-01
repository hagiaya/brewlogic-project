-- Add is_best_seller column to products table
DO $$
BEGIN
    BEGIN
        ALTER TABLE products ADD COLUMN is_best_seller BOOLEAN DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column is_best_seller already exists in products.';
    END;
END
$$;

-- Update existing records if needed (optional)
-- UPDATE products SET is_best_seller = true WHERE id = 'pro-brewer';
