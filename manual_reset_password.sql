-- EMERGENCY MANUAL PASSWORD RESET
-- Run this in Supabase SQL Editor to force update the password

UPDATE users
SET password = 'qqq123'
WHERE email = 'serveralpstudio@gmail.com' OR username = 'serveralpstudio@gmail.com';

-- Verify the update
SELECT username, email, password FROM users WHERE email = 'serveralpstudio@gmail.com';
