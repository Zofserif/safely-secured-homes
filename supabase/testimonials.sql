-- Testimonials table for public review display and /rate submissions.
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  email text,
  location text,
  rating integer,
  review text,
  profile_image_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.testimonials
  add column if not exists first_name text;

alter table public.testimonials
  add column if not exists last_name text;

alter table public.testimonials
  add column if not exists email text;

alter table public.testimonials
  add column if not exists location text;

alter table public.testimonials
  add column if not exists rating integer;

alter table public.testimonials
  add column if not exists review text;

alter table public.testimonials
  add column if not exists profile_image_url text;

alter table public.testimonials
  add column if not exists is_published boolean not null default true;

alter table public.testimonials
  add column if not exists created_at timestamptz not null default now();

alter table public.testimonials
  add column if not exists updated_at timestamptz not null default now();

alter table public.testimonials
  alter column rating set default 5;

alter table public.testimonials
  alter column is_published set default true;

update public.testimonials
set is_published = true
where is_published is null;

alter table public.testimonials
  alter column is_published set not null;

alter table public.testimonials
  drop constraint if exists testimonials_rating_range_check;

alter table public.testimonials
  add constraint testimonials_rating_range_check
  check (rating is null or rating between 0 and 5);

create index if not exists testimonials_published_created_at_idx
  on public.testimonials (is_published, created_at desc);

create index if not exists testimonials_email_created_at_idx
  on public.testimonials (email, created_at desc);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_testimonials_updated_at on public.testimonials;
create trigger set_testimonials_updated_at
before update on public.testimonials
for each row execute function public.set_updated_at_timestamp();

alter table public.testimonials enable row level security;

drop policy if exists "Service role manages testimonials" on public.testimonials;
create policy "Service role manages testimonials"
on public.testimonials
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
