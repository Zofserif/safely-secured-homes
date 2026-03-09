-- Leads table cleanup for canonical payload-first storage.
-- Run this in Supabase SQL editor.

alter table if exists public.leads
  add column if not exists email text;

alter table if exists public.leads
  add column if not exists name text;

alter table if exists public.leads
  add column if not exists payload jsonb;

alter table if exists public.leads
  drop column if exists tier;

alter table if exists public.leads
  drop column if exists score;

alter table if exists public.leads
  drop column if exists camera_count;

alter table if exists public.leads
  drop column if exists safety_score_total;
