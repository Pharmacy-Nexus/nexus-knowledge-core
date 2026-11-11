-- VITAL v1.4 Medical Vault -- run AFTER 001_vital_schema.sql and 003_medical_profile_sections.sql
-- Creates a NEW private bucket and owner-scoped document metadata. Existing medical profiles,
-- QR links, emergency publications, and their functions remain unchanged.
-- No demo patients or seeded documents are inserted.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vital-medical-vault', 'vital-medical-vault', false, 10485760,
  array['application/pdf','image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.medical_documents (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 120),
  category text not null check (category in ('lab','imaging','prescription','report','other')),
  document_date date,
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png','image/webp')),
  file_size integer not null check (file_size between 1 and 10485760),
  storage_path text not null unique check (
    storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$'
  ),
  created_at timestamptz not null default now()
);

create index if not exists medical_documents_owner_time_idx
  on public.medical_documents(user_id, created_at desc);

alter table public.medical_documents enable row level security;
revoke all on table public.medical_documents from public, anon, authenticated;
grant select, insert, delete on table public.medical_documents to authenticated;

drop policy if exists "vital_vault_select_own" on public.medical_documents;
create policy "vital_vault_select_own" on public.medical_documents
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "vital_vault_insert_own" on public.medical_documents;
create policy "vital_vault_insert_own" on public.medical_documents
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and storage_path like ((select auth.uid())::text || '/%')
  );

drop policy if exists "vital_vault_delete_own" on public.medical_documents;
create policy "vital_vault_delete_own" on public.medical_documents
  for delete to authenticated using (user_id = (select auth.uid()));

-- Storage access is never public: even knowing a path does not grant access.
-- Each file is stored at <authenticated_user_id>/<random_uuid>.<extension>.
drop policy if exists "vital_vault_storage_read_own" on storage.objects;
create policy "vital_vault_storage_read_own" on storage.objects
  for select to authenticated using (
    bucket_id = 'vital-medical-vault'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and owner_id = (select auth.uid())::text
  );

drop policy if exists "vital_vault_storage_insert_own" on storage.objects;
create policy "vital_vault_storage_insert_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'vital-medical-vault'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and owner_id = (select auth.uid())::text
    and storage.extension(name) in ('pdf','jpg','png','webp')
  );

drop policy if exists "vital_vault_storage_delete_own" on storage.objects;
create policy "vital_vault_storage_delete_own" on storage.objects
  for delete to authenticated using (
    bucket_id = 'vital-medical-vault'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and owner_id = (select auth.uid())::text
  );

comment on table public.medical_documents is 'Private per-user document index. NEVER expose in emergency RPC.';
commit;
