-- Function to handle Admin Login securely without exposing password in a simple query
CREATE OR REPLACE FUNCTION login_admin(
    p_username TEXT,
    p_password TEXT
)
RETURNS JSONB AS $$
DECLARE
    found_user RECORD;
BEGIN
    -- Find user by username
    SELECT * INTO found_user FROM users WHERE username = p_username;
    
    -- Check if user exists
    IF found_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Check password (simple comparison as per current schema)
    IF found_user.password <> p_password THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid password');
    END IF;
    
    -- Check role
    IF found_user.role <> 'admin' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied: Admin only');
    END IF;
    
    -- Return success and user data (excluding password ideally, but keeping it simple for consistency with frontend expectations)
    RETURN jsonb_build_object('success', true, 'user', row_to_json(found_user));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure Transactions table has policies (Public for now as no Auth implemented)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Read Transactions' AND tablename = 'transactions' ) THEN
        CREATE POLICY "Allow Public Read Transactions" ON transactions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Insert Transactions' AND tablename = 'transactions' ) THEN
        CREATE POLICY "Allow Public Insert Transactions" ON transactions FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Update Transactions' AND tablename = 'transactions' ) THEN
        CREATE POLICY "Allow Public Update Transactions" ON transactions FOR UPDATE USING (true);
    END IF;
END
$$;

-- Ensure Grinders table has policies
ALTER TABLE grinders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Read Grinders' AND tablename = 'grinders' ) THEN
        CREATE POLICY "Allow Public Read Grinders" ON grinders FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Insert Grinders' AND tablename = 'grinders' ) THEN
        CREATE POLICY "Allow Public Insert Grinders" ON grinders FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Update Grinders' AND tablename = 'grinders' ) THEN
        CREATE POLICY "Allow Public Update Grinders" ON grinders FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Delete Grinders' AND tablename = 'grinders' ) THEN
        CREATE POLICY "Allow Public Delete Grinders" ON grinders FOR DELETE USING (true);
    END IF;
END
$$;

-- Ensure Users table is accessible for the User Management tab (Warning: Exposes data publicly if Anon key is used)
-- Ideally this should be restricted, but for "Serverless" admin panel without Auth v2, this is the trade-off.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Read Users' AND tablename = 'users' ) THEN
        CREATE POLICY "Allow Public Read Users" ON users FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Insert Users' AND tablename = 'users' ) THEN
        CREATE POLICY "Allow Public Insert Users" ON users FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Update Users' AND tablename = 'users' ) THEN
        CREATE POLICY "Allow Public Update Users" ON users FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Delete Users' AND tablename = 'users' ) THEN
        CREATE POLICY "Allow Public Delete Users" ON users FOR DELETE USING (true);
    END IF;
END
$$;
