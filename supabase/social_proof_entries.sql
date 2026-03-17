-- Consolidated social-proof storage for testimonials and success stories.
-- Run this before app code that expects `public.social_proof_entries`.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.social_proof_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  name text,
  first_name text,
  last_name text,
  email text,
  location text,
  rating integer,
  content text not null default '',
  image_url text,
  media_url text,
  media_type text,
  story_date date,
  is_published boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.social_proof_entries
  add column if not exists kind text;

alter table public.social_proof_entries
  add column if not exists name text;

alter table public.social_proof_entries
  add column if not exists first_name text;

alter table public.social_proof_entries
  add column if not exists last_name text;

alter table public.social_proof_entries
  add column if not exists email text;

alter table public.social_proof_entries
  add column if not exists location text;

alter table public.social_proof_entries
  add column if not exists rating integer;

alter table public.social_proof_entries
  add column if not exists content text not null default '';

alter table public.social_proof_entries
  add column if not exists image_url text;

alter table public.social_proof_entries
  add column if not exists media_url text;

alter table public.social_proof_entries
  add column if not exists media_type text;

alter table public.social_proof_entries
  add column if not exists story_date date;

alter table public.social_proof_entries
  add column if not exists is_published boolean not null default true;

alter table public.social_proof_entries
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.social_proof_entries
  add column if not exists created_at timestamptz not null default now();

alter table public.social_proof_entries
  add column if not exists updated_at timestamptz not null default now();

update public.social_proof_entries
set email = lower(trim(email))
where email is not null
  and email <> lower(trim(email));

update public.social_proof_entries
set content = ''
where content is null;

update public.social_proof_entries
set metadata = '{}'::jsonb
where metadata is null
   or jsonb_typeof(metadata) <> 'object';

update public.social_proof_entries
set is_published = true
where is_published is null;

update public.social_proof_entries
set created_at = now()
where created_at is null;

update public.social_proof_entries
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

alter table public.social_proof_entries
  alter column kind set not null;

alter table public.social_proof_entries
  alter column content set default '';

alter table public.social_proof_entries
  alter column content set not null;

alter table public.social_proof_entries
  alter column is_published set default true;

alter table public.social_proof_entries
  alter column is_published set not null;

alter table public.social_proof_entries
  alter column metadata set default '{}'::jsonb;

alter table public.social_proof_entries
  alter column metadata set not null;

alter table public.social_proof_entries
  alter column created_at set default now();

alter table public.social_proof_entries
  alter column created_at set not null;

alter table public.social_proof_entries
  alter column updated_at set default now();

alter table public.social_proof_entries
  alter column updated_at set not null;

alter table public.social_proof_entries
  drop constraint if exists social_proof_entries_kind_check;

alter table public.social_proof_entries
  add constraint social_proof_entries_kind_check
  check (kind in ('testimonial', 'success_story'));

alter table public.social_proof_entries
  drop constraint if exists social_proof_entries_rating_range_check;

alter table public.social_proof_entries
  add constraint social_proof_entries_rating_range_check
  check (rating is null or rating between 0 and 5);

alter table public.social_proof_entries
  drop constraint if exists social_proof_entries_media_type_check;

alter table public.social_proof_entries
  add constraint social_proof_entries_media_type_check
  check (media_type is null or media_type in ('image', 'video'));

create index if not exists social_proof_entries_kind_published_created_at_idx
  on public.social_proof_entries (kind, is_published, created_at desc);

create index if not exists social_proof_entries_kind_story_date_idx
  on public.social_proof_entries (kind, story_date desc, created_at desc);

create index if not exists social_proof_entries_kind_email_created_at_idx
  on public.social_proof_entries (kind, email, created_at desc);

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'testimonials'
  ) then
    insert into public.social_proof_entries (
      id,
      kind,
      name,
      first_name,
      last_name,
      email,
      location,
      rating,
      content,
      image_url,
      is_published,
      metadata,
      created_at,
      updated_at
    )
    select
      t.id,
      'testimonial',
      nullif(
        concat_ws(
          ' ',
          nullif(btrim(t.first_name), ''),
          nullif(btrim(t.last_name), '')
        ),
        ''
      ),
      t.first_name,
      t.last_name,
      case
        when t.email is null or btrim(t.email) = '' then null
        else lower(trim(t.email))
      end,
      t.location,
      t.rating,
      coalesce(t.review, ''),
      t.profile_image_url,
      coalesce(t.is_published, true),
      coalesce(
        to_jsonb(t) - array[
          'id',
          'first_name',
          'last_name',
          'email',
          'location',
          'rating',
          'review',
          'profile_image_url',
          'is_published',
          'created_at',
          'updated_at'
        ]::text[],
        '{}'::jsonb
      ),
      coalesce(t.created_at, now()),
      coalesce(t.created_at, now())
    from public.testimonials t
    on conflict (id) do update
    set
      kind = excluded.kind,
      name = excluded.name,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      email = excluded.email,
      location = excluded.location,
      rating = excluded.rating,
      content = excluded.content,
      image_url = excluded.image_url,
      is_published = excluded.is_published,
      metadata = excluded.metadata,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'success_stories'
  ) then
    insert into public.social_proof_entries (
      id,
      kind,
      name,
      location,
      content,
      image_url,
      media_url,
      media_type,
      story_date,
      is_published,
      metadata,
      created_at,
      updated_at
    )
    select
      ss.id,
      'success_story',
      ss.name,
      ss.location,
      coalesce(ss.testimonial, ''),
      ss.image_url,
      ss.media_url,
      case
        when ss.media_type in ('image', 'video') then ss.media_type
        else null
      end,
      case
        when ss.story_date is null then null
        else ss.story_date::date
      end,
      true,
      coalesce(
        to_jsonb(ss) - array[
          'id',
          'name',
          'location',
          'testimonial',
          'image_url',
          'media_url',
          'media_type',
          'story_date',
          'created_at',
          'updated_at'
        ]::text[],
        '{}'::jsonb
      ),
      coalesce(ss.created_at, now()),
      coalesce(ss.created_at, now())
    from public.success_stories ss
    on conflict (id) do update
    set
      kind = excluded.kind,
      name = excluded.name,
      location = excluded.location,
      content = excluded.content,
      image_url = excluded.image_url,
      media_url = excluded.media_url,
      media_type = excluded.media_type,
      story_date = excluded.story_date,
      is_published = excluded.is_published,
      metadata = excluded.metadata,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at;
  end if;
end
$$;

drop trigger if exists set_social_proof_entries_updated_at on public.social_proof_entries;
create trigger set_social_proof_entries_updated_at
before update on public.social_proof_entries
for each row execute function public.set_updated_at_timestamp();

alter table public.social_proof_entries enable row level security;

drop policy if exists "Service role manages social proof entries"
  on public.social_proof_entries;
create policy "Service role manages social proof entries"
on public.social_proof_entries
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
