-- Allows unsubscribe with anon key even when table RLS only allows insert.
-- Run this in Supabase SQL editor.

create or replace function public.unsubscribe_newsletter_subscriber(input_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
begin
  normalized_email := lower(trim(input_email));

  if normalized_email is null or normalized_email = '' then
    return false;
  end if;

  delete from public.newsletter_subscribers
  where lower(email) = normalized_email;

  return true;
end;
$$;

revoke all on function public.unsubscribe_newsletter_subscriber(text) from public;
grant execute on function public.unsubscribe_newsletter_subscriber(text) to anon, authenticated;
