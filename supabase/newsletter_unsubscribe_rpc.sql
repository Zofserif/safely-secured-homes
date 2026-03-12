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
  unsubscribed_at_value timestamptz := now();
begin
  normalized_email := lower(trim(input_email));

  if normalized_email is null or normalized_email = '' then
    return false;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'newsletter_subscribers'
      and column_name = 'status'
  ) then
    update public.newsletter_subscribers
    set
      status = 'unsubscribed',
      unsubscribed_at = unsubscribed_at_value
    where lower(email) = normalized_email;

    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = 'campaign_enrollments'
    ) then
      update public.campaign_enrollments
      set
        status = 'cancelled',
        exited_at = coalesce(exited_at, unsubscribed_at_value),
        exit_reason = case
          when coalesce(btrim(exit_reason), '') = '' then 'unsubscribe'
          else exit_reason
        end
      where subscriber_id in (
        select id
        from public.newsletter_subscribers
        where lower(email) = normalized_email
      )
        and status in ('active', 'paused');
    end if;
  else
    delete from public.newsletter_subscribers
    where lower(email) = normalized_email;
  end if;

  return true;
end;
$$;

revoke all on function public.unsubscribe_newsletter_subscriber(text) from public;
grant execute on function public.unsubscribe_newsletter_subscriber(text) to anon, authenticated;
