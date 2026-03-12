-- Retired by supabase/email_core.sql.
-- Keep this file only for reference while older environments are being cut over.

-- Converts newsletter_subscribers to name-only capture.
-- Run this in Supabase SQL editor.

alter table if exists public.newsletter_subscribers
  add column if not exists name text;

update public.newsletter_subscribers as ns
set name = coalesce(
  (
    select
      upper(left(token_lower, 1)) || substr(token_lower, 2)
    from (
      select
        lower(trim(token)) as token_lower,
        ordinality
      from regexp_split_to_table(
        split_part(
          split_part(lower(trim(coalesce(ns.email, ''))), '@', 1),
          '+',
          1
        ),
        '[._[:space:]-]+'
      ) with ordinality as token(token, ordinality)
    ) as tokens
    where token_lower <> ''
      and token_lower ~ '[a-z]'
    order by ordinality
    limit 1
  ),
  'there'
)
where name is null or btrim(name) = '';

update public.newsletter_subscribers
set name = 'there'
where name is null or btrim(name) = '';

alter table if exists public.newsletter_subscribers
  alter column name set not null;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'newsletter_subscribers'
      and con.contype = 'c'
      and (
        pg_get_constraintdef(con.oid) ilike '%first_name%'
        or pg_get_constraintdef(con.oid) ilike '%last_name%'
        or pg_get_constraintdef(con.oid) ilike '%contact_number%'
      )
  loop
    execute format(
      'alter table public.newsletter_subscribers drop constraint if exists %I',
      constraint_record.conname
    );
  end loop;
end;
$$;

alter table if exists public.newsletter_subscribers
  drop column if exists first_name;

alter table if exists public.newsletter_subscribers
  drop column if exists last_name;

alter table if exists public.newsletter_subscribers
  drop column if exists contact_number;
