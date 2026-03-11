-- Leads table cleanup for canonical payload-first storage.
-- Run this in Supabase SQL editor.

alter table if exists public.leads
  add column if not exists email text;

alter table if exists public.leads
  add column if not exists name text;

alter table if exists public.leads
  add column if not exists payload jsonb;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'leads'
  ) then
    update public.leads
    set name = coalesce(
      nullif(btrim(name), ''),
      nullif(btrim(payload->'contact'->>'name'), ''),
      nullif(btrim(payload->'contact'->>'first_name'), ''),
      'there'
    )
    where name is null
       or btrim(name) = '';

    update public.leads
    set payload = jsonb_set(
      payload,
      '{contact}',
      (
        coalesce(payload->'contact', '{}'::jsonb) - 'first_name'
      ) || jsonb_build_object(
        'name',
        coalesce(
          nullif(btrim(payload->'contact'->>'name'), ''),
          nullif(btrim(payload->'contact'->>'first_name'), ''),
          nullif(btrim(name), ''),
          'there'
        )
      ),
      true
    )
    where jsonb_typeof(payload->'contact') = 'object'
      and (
        (payload->'contact') ? 'first_name'
        or not ((payload->'contact') ? 'name')
        or nullif(btrim(payload->'contact'->>'name'), '') is null
      );
  end if;
end
$$;

alter table if exists public.leads
  drop column if exists tier;

alter table if exists public.leads
  drop column if exists score;

alter table if exists public.leads
  drop column if exists camera_count;

alter table if exists public.leads
  drop column if exists safety_score_total;
