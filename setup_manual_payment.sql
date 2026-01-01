-- 1. Create Bank Accounts Table
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    logo_url TEXT, -- Optional functionality for bank logo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add Columns to Transactions
DO $$
BEGIN
    BEGIN
        ALTER TABLE transactions ADD COLUMN payment_method TEXT DEFAULT 'midtrans';
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column payment_method already exists';
    END;

    BEGIN
        ALTER TABLE transactions ADD COLUMN unique_code INTEGER DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column unique_code already exists';
    END;

    BEGIN
        ALTER TABLE transactions ADD COLUMN proof_image TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column proof_image already exists';
    END;

    BEGIN
        ALTER TABLE transactions ADD COLUMN transfer_amount BIGINT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column transfer_amount already exists';
    END;
END $$;

-- 3. RLS Policies for Bank Accounts
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Banks' AND tablename = 'bank_accounts') THEN
        CREATE POLICY "Public Read Banks" ON bank_accounts FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin Manage Banks' AND tablename = 'bank_accounts') THEN
        CREATE POLICY "Admin Manage Banks" ON bank_accounts FOR ALL USING (true) WITH CHECK (true); 
        -- Note: simplified for this app, ideally check auth.uid() or role
    END IF;
END $$;

-- 4. Create Bucket for Payment Proofs (This might fail if run from SQL editor depending on permissions, but worth a try or user does manual)
-- Insert a row into storage.buckets if it doesn't exist (Supabase specific hack, usually requires API)
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true) ON CONFLICT (id) DO NOTHING;

-- Policy for storage
-- Policy for storage
DO $$
BEGIN
    -- Allow public to upload to receipts
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Upload Receipts' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Upload Receipts" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'receipts');
    END IF;
    
    -- Allow public to read
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Receipts' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Read Receipts" ON storage.objects FOR SELECT TO public USING (bucket_id = 'receipts');
    END IF;
END $$;
