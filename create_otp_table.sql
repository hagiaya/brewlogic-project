-- Table for storing OTP codes
create table if not exists otp_codes (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  otp_code text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS (Optional, but good practice)
alter table otp_codes enable row level security;

-- Policy: Server (Service Role) typically bypasses RLS, but if anon needs access:
create policy "Allow insert for anon" on otp_codes for insert with check (true);
create policy "Allow select for anon" on otp_codes for select using (true);
