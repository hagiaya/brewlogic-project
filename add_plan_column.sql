ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plan TEXT;
-- You might also want to index it if you query by it often, but for now just adding it is enough.
