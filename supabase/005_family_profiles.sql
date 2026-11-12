-- VITAL v1.5 Family Profiles — deploy ONLY after 001, 003, 004.
-- NON-DESTRUCTIVE: no edits to medical_profiles, emergency_publications,
-- card_token, vital_get_emergency or existing Storage object contents.
-- IMPORTANT: export/backup the live database first; test with NON-SENSITIVE data.
-- Family members in this milestone are PRIVATE managed profiles only.
-- They do NOT automatically get public QR/NFC, emergency sharing, or an account login.

begin;

-- Validate supported medical fields, names, and types server-side.
-- Keep the same flat JSON-string field format as the existing VITAL profile.
create or replace function public.vital_family_fields_valid(p_fields jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(p_fields) <> 'object' then false else
    jsonb_typeof(p_fields->'fullName') = 'string'
    and length(btrim(p_fields->>'fullName')) between 1 and 200
    and not exists (
      select 1 from jsonb_each(p_fields) as f(key,value)
      where f.key <> all(array['fullName','birthDate','bloodGroup','allergies',
        'conditions','medications','surgeries','contactName','contactPhone','emergencySummary']::text[])
        or jsonb_typeof(f.value) <> 'string'
        or length(f.value #>> '{}') > case
          when f.key='emergencySummary' then 800
          when f.key='fullName' then 200
          when f.key='birthDate' then 30
          when f.key='bloodGroup' then 10
          when f.key='contactName' then 200
          when f.key='contactPhone' then 60
          else 2000 end
    )
  end;
$$;

revoke all on function public.vital_family_fields_valid(jsonb) from public, anon, authenticated;
-- Required for the CHECK constraint during authenticated INSERT/UPDATE.
grant execute on function public.vital_family_fields_valid(jsonb) to authenticated;

create table if not exists public.family_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_uid uuid not null references auth.users(id) on delete cascade,
  relationship text not null check (relationship in ('child','parent','spouse','sibling','other')),
  authority_basis text not null check (authority_basis in ('legal_guardian','express_consent')),
  consent_attested_at timestamptz not null default now(),
  fields jsonb not null check (public.vital_family_fields_valid(fields)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_profiles_owner_id_unique unique(owner_uid,id)
);

create index if not exists family_profiles_owner_created_idx
  on public.family_profiles(owner_uid, created_at desc);

alter table public.family_profiles enable row level security;
revoke all on table public.family_profiles from public, anon, authenticated;
grant select, insert, update, delete on table public.family_profiles to authenticated;

drop policy if exists "vital_family_select_own" on public.family_profiles;
create policy "vital_family_select_own" on public.family_profiles
  for select to authenticated using (owner_uid = (select auth.uid()));
drop policy if exists "vital_family_insert_own" on public.family_profiles;
create policy "vital_family_insert_own" on public.family_profiles
  for insert to authenticated with check (owner_uid = (select auth.uid()));
drop policy if exists "vital_family_update_own" on public.family_profiles;
create policy "vital_family_update_own" on public.family_profiles
  for update to authenticated using (owner_uid = (select auth.uid()))
  with check (owner_uid = (select auth.uid()));
drop policy if exists "vital_family_delete_own" on public.family_profiles;
create policy "vital_family_delete_own" on public.family_profiles
  for delete to authenticated using (owner_uid = (select auth.uid()));

-- Existing personal documents remain with NULL family_profile_id.
-- The composite foreign key guarantees that a document can only be assigned
-- to a family profile owned by THE SAME authenticated user.
alter table public.medical_documents
  add column if not exists family_profile_id uuid;

DO $$
begin
  if not exists (
    select 1 from pg_constraint where conrelid='public.medical_documents'::regclass
      and conname='medical_documents_family_owner_fk'
  ) then
    alter table public.medical_documents add constraint medical_documents_family_owner_fk
      foreign key (user_id, family_profile_id)
      references public.family_profiles(owner_uid,id)
      on delete restrict;
  end if;
end $$;

create index if not exists medical_documents_family_owner_idx
  on public.medical_documents(user_id, family_profile_id, created_at desc);

-- Inherited medical_documents RLS from 004: owner-only read/write.
-- Existing Storage bucket stays PRIVATE and files remain under owner_uid/UUID.ext.
-- This migration NEVER grants anon Storage access.

comment on table public.family_profiles is 'Private user-managed family members. Consent basis is self-attested, NOT verified; no public emergency access.';
comment on column public.medical_documents.family_profile_id is 'NULL for original user. Otherwise links to an owned family profile; private only.';

commit;
