-- Create Vouchers Table
CREATE TABLE IF NOT EXISTS vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Access Policies
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Vouchers' AND tablename = 'vouchers' ) THEN
        CREATE POLICY "Public Read Vouchers" ON vouchers FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Public Insert Vouchers' AND tablename = 'vouchers' ) THEN
        CREATE POLICY "Public Insert Vouchers" ON vouchers FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Public Delete Vouchers' AND tablename = 'vouchers' ) THEN
        CREATE POLICY "Public Delete Vouchers" ON vouchers FOR DELETE USING (true);
    END IF;
END $$;

-- Seed some example vouchers
INSERT INTO vouchers (code, discount_type, discount_value)
VALUES 
('BREW10', 'percentage', 10),
('HEMAT50', 'fixed', 50000)
ON CONFLICT (code) DO NOTHING;
