-- VITAL v1.6 Family Emergency (digital QR only; NOT physical card issuance)
-- Prerequisites: applied 001, 003, 004, 005. Run on a backup/test project first.
-- ADDITIVE: No changes to personal medical_profiles, personal QR, or personal
-- public function vital_get_emergency. No existing family data is overwritten.
-- All family emergency links begin UNPUBLISHED with no shared fields.

begin;

create table if not exists public.family_emergency_links (
  family_id uuid primary key references public.family_profiles(id) on delete cascade,
  owner_uid uuid not null references auth.users(id) on delete cascade,
  token text not null unique check (token ~ '^[a-f0-9]{40}$'),
  sharing jsonb not null default '{}'::jsonb check (jsonb_typeof(sharing) = 'object'),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_emergency_link_owner_fk foreign key (owner_uid, family_id)
    references public.family_profiles(owner_uid, id) on delete cascade
);

create index if not exists family_emergency_links_owner_idx
  on public.family_emergency_links(owner_uid, created_at desc);

create table if not exists public.family_emergency_publications (
  family_id uuid primary key references public.family_profiles(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  snapshot jsonb not null default '{}'::jsonb,
  active boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.family_emergency_links enable row level security;
alter table public.family_emergency_publications enable row level security;
revoke all on table public.family_emergency_links from public, anon, authenticated;
revoke all on table public.family_emergency_publications from public, anon, authenticated;
grant select on table public.family_emergency_links to authenticated;

drop policy if exists vital_family_emergency_links_select_own on public.family_emergency_links;
create policy vital_family_emergency_links_select_own
  on public.family_emergency_links for select to authenticated
  using (owner_uid = (select auth.uid()));

-- Public and private sessions cannot SELECT directly from publication table.
-- These authenticated RPCs are the ONLY mutation paths.
create or replace function public.vital_family_create_link(p_family_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_token text;
  v_relation text;
  v_basis text;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select relationship, authority_basis into v_relation, v_basis
  from public.family_profiles where id = p_family_id and owner_uid = v_uid for update;
  if not found then raise exception 'Family profile not found'; end if;
  if not ((v_relation = 'child' and v_basis = 'legal_guardian') or
          (v_relation <> 'child' and v_basis = 'express_consent')) then
    raise exception 'Family relationship / authorization must be confirmed before public sharing';
  end if;
  select token into v_token from public.family_emergency_links
    where family_id = p_family_id;
  if v_token is null then
    -- Generated on the server, unguessable; this is NOT a physical product activation.
    v_token := substring(encode(sha256(convert_to(
       (pg_catalog.gen_random_uuid())::text || (pg_catalog.gen_random_uuid())::text,
       'UTF8')),'hex') from 1 for 40);
    insert into public.family_emergency_links(family_id, owner_uid, token)
      values (p_family_id, v_uid, v_token);
  end if;
  return v_token;
end;
$$;

create or replace function public.vital_family_set_publication(
   p_family_id uuid, p_sharing jsonb, p_publish boolean
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_fields jsonb;
  v_relation text;
  v_basis text;
  v_token text;
  v_snapshot jsonb := '{}'::jsonb;
  v_sharing jsonb := '{}'::jsonb;
  v_key text;
  v_allowed text[] := array['fullName','birthDate','bloodGroup','allergies',
       'conditions','medications','surgeries','contactName','contactPhone','emergencySummary'];
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_sharing is null or jsonb_typeof(p_sharing) <> 'object' or p_publish is null then
    raise exception 'Invalid sharing settings';
  end if;
  if exists (
    select 1 from jsonb_each(p_sharing) as a(key,value)
    where not (a.key = any(v_allowed)) or jsonb_typeof(a.value) <> 'boolean'
  ) then raise exception 'Invalid sharing field'; end if;
  select fields, relationship, authority_basis into v_fields, v_relation, v_basis
  from public.family_profiles where id=p_family_id and owner_uid=v_uid for update;
  if not found then raise exception 'Family profile not found'; end if;
  if not ((v_relation = 'child' and v_basis = 'legal_guardian') or
          (v_relation <> 'child' and v_basis = 'express_consent')) then
    raise exception 'Family relationship / authorization must be confirmed before publishing';
  end if;
  select token into v_token from public.family_emergency_links
    where family_id=p_family_id and owner_uid=v_uid for update;
  if not found then raise exception 'Create a family emergency link first'; end if;
  foreach v_key in array v_allowed loop
    v_sharing := v_sharing || jsonb_build_object(v_key,
      coalesce((p_sharing->>v_key)::boolean,false));
    if coalesce((p_sharing->>v_key)::boolean,false)
       and btrim(coalesce(v_fields->>v_key,'')) <> '' then
      v_snapshot := v_snapshot || jsonb_build_object(v_key,btrim(v_fields->>v_key));
    end if;
  end loop;
  if p_publish and v_snapshot = '{}'::jsonb then
    raise exception 'Choose at least one nonempty field to publish';
  end if;
  update public.family_emergency_links
    set sharing=v_sharing,published=p_publish,updated_at=now() where family_id=p_family_id;
  if p_publish then
    insert into public.family_emergency_publications(family_id,token_hash,snapshot,active)
      values(p_family_id,encode(sha256(convert_to(v_token,'UTF8')),'hex'),v_snapshot,true)
      on conflict(family_id) do update set snapshot=excluded.snapshot,
        active=true, token_hash=excluded.token_hash,updated_at=now();
  else
    -- Disable remotely and erase previous public snapshot immediately.
    update public.family_emergency_publications
      set snapshot='{}'::jsonb,active=false,updated_at=now() where family_id=p_family_id;
  end if;
  return jsonb_build_object('published',p_publish,'shared_fields',(select count(*) from jsonb_object_keys(v_snapshot)));
end;
$$;

-- Automatically synchronize existing public family snapshot when the guardian
-- edits the family profile. No document metadata is ever included in snapshot.
create or replace function public.vital_family_refresh_publication()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_link record;
  v_allowed text[] := array['fullName','birthDate','bloodGroup','allergies',
       'conditions','medications','surgeries','contactName','contactPhone','emergencySummary'];
  v_key text;
  v_snapshot jsonb := '{}'::jsonb;
begin
  select * into v_link from public.family_emergency_links
    where family_id=NEW.id for update;
  if not found then return NEW; end if;
  if not v_link.published then return NEW; end if;
  if not ((NEW.relationship = 'child' and NEW.authority_basis='legal_guardian') or
          (NEW.relationship <> 'child' and NEW.authority_basis='express_consent')) then
    update public.family_emergency_links
      set published=false,updated_at=now() where family_id=NEW.id;
    update public.family_emergency_publications
      set active=false,snapshot='{}'::jsonb,updated_at=now() where family_id=NEW.id;
    return NEW;
  end if;
  foreach v_key in array v_allowed loop
    if coalesce((v_link.sharing->>v_key)::boolean,false)
      and btrim(coalesce(NEW.fields->>v_key,'')) <> '' then
      v_snapshot:=v_snapshot || jsonb_build_object(v_key,btrim(NEW.fields->>v_key));
    end if;
  end loop;
  if v_snapshot = '{}'::jsonb then
    update public.family_emergency_links
      set published=false,updated_at=now() where family_id=NEW.id;
    update public.family_emergency_publications
      set active=false,snapshot='{}'::jsonb,updated_at=now() where family_id=NEW.id;
  else
    update public.family_emergency_publications
      set snapshot=v_snapshot,active=true,updated_at=now() where family_id=NEW.id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists vital_family_emergency_refresh on public.family_profiles;
create trigger vital_family_emergency_refresh
  after update of fields, relationship, authority_basis on public.family_profiles
  for each row when (
    OLD.fields is distinct from NEW.fields or
    OLD.relationship is distinct from NEW.relationship or
    OLD.authority_basis is distinct from NEW.authority_basis
  ) execute function public.vital_family_refresh_publication();

create or replace function public.vital_get_family_emergency(p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if p_token is null or p_token !~ '^[a-f0-9]{40}$' then return null; end if;
  select snapshot into v_result from public.family_emergency_publications
    where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') and active=true;
  return v_result;
end;
$$;

revoke all on function public.vital_family_create_link(uuid) from public,anon,authenticated;
revoke all on function public.vital_family_set_publication(uuid,jsonb,boolean) from public,anon,authenticated;
revoke all on function public.vital_get_family_emergency(text) from public,anon,authenticated;
revoke all on function public.vital_family_refresh_publication() from public,anon,authenticated;
grant execute on function public.vital_family_create_link(uuid) to authenticated;
grant execute on function public.vital_family_set_publication(uuid,jsonb,boolean) to authenticated;
grant execute on function public.vital_get_family_emergency(text) to anon,authenticated;

comment on table public.family_emergency_links is
  'Authenticated guardian/consenting account digital emergency links; not physical VITAL card stock.';
comment on table public.family_emergency_publications is
  'Only approved family emergency field snapshots; no documents or private full profiles.';

commit;
