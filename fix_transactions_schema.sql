-- 1. Transactions Table
alter table transactions add column if not exists payment_url text;
alter table transactions add column if not exists payment_method text;
alter table transactions add column if not exists unique_code integer;
alter table transactions add column if not exists transfer_amount bigint;
alter table transactions add column if not exists proof_image text;
alter table transactions add column if not exists token text;
alter table transactions add column if not exists updated_at timestamp with time zone;

-- 2. Users Table
alter table users add column if not exists plan text;
alter table users add column if not exists subscription_start timestamp with time zone;
alter table users add column if not exists subscription_end timestamp with time zone;
alter table users add column if not exists phone text;

-- 3. OTP Codes Table (Just in case you haven't run previous step)
create table if not exists otp_codes (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  otp_code text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- 4. Enable RLS and Policies for OTP
alter table otp_codes enable row level security;
do $$ 
begin
    if not exists (select 1 from pg_policies where policyname = 'Allow insert for anon' and tablename = 'otp_codes') then
        create policy "Allow insert for anon" on otp_codes for insert with check (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Allow select for anon' and tablename = 'otp_codes') then
        create policy "Allow select for anon" on otp_codes for select using (true);
    end if;
     if not exists (select 1 from pg_policies where policyname = 'Allow delete for anon' and tablename = 'otp_codes') then
        create policy "Allow delete for anon" on otp_codes for delete using (true);
    end if;
end $$;

