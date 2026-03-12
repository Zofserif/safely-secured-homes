-- Retired by supabase/email_core.sql.
-- Keep this file only for reference while older environments are being cut over.

-- Retires the public raw-email unsubscribe RPC.
-- Run this in Supabase SQL editor.

drop function if exists public.unsubscribe_newsletter_subscriber(text);
