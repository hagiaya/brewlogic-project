-- Add subscription tracking columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- Create index for faster querying of expiring users
CREATE INDEX IF NOT EXISTS idx_users_subscription_end ON public.users(subscription_end);
