-- VITAL v1.7 — Device Management foundation / DIGITAL DEMO devices only.
-- Requires 001, 003, 004, 005, 006. Run on a backup/test database first.
-- ADDITIVE: does not replace existing /e and /f QR links, medical records, or Storage.
-- IMPORTANT: owner-generated rows are DEMO QR links, not issued/activated physical goods.
-- Only a future admin process may issue inventory-backed NFC/QR products.

begin;

create table if not exists public.vital_demo_devices (
  id uuid primary key default gen_random_uuid(),
  owner_uid uuid not null references auth.users(id) on delete cascade,
  target_kind text not null check (target_kind in ('self','family')),
  family_id uuid,
  device_kind text not null check (device_kind in ('card','wristband','watch','seatbelt')),
  label text not null check (length(btrim(label)) between 1 and 60),
  token text not null unique check (token ~ '^[a-f0-9]{40}$'),
  status text not null default 'active' check (status in ('active','paused','lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demo_target_valid check ((target_kind='self' and family_id is null) or (target_kind='family' and family_id is not null)),
  constraint demo_device_family_owner_fk foreign key(owner_uid,family_id)
    references public.family_profiles(owner_uid,id) on delete cascade
);

create index if not exists vital_demo_devices_owner_date_idx
  on public.vital_demo_devices(owner_uid,created_at desc);
create unique index if not exists vital_demo_devices_token_idx
  on public.vital_demo_devices(token);

alter table public.vital_demo_devices enable row level security;
revoke all on table public.vital_demo_devices from public, anon, authenticated;
grant select on table public.vital_demo_devices to authenticated;

drop policy if exists vital_demo_devices_read_own on public.vital_demo_devices;
create policy vital_demo_devices_read_own on public.vital_demo_devices
  for select to authenticated using (owner_uid=(select auth.uid()));

-- Creation must run on server; no direct INSERT/UPDATE/DELETE exposed via REST.
create or replace function public.vital_demo_device_create(
  p_kind text, p_label text, p_target_kind text, p_family_id uuid default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_token text;
  v_id uuid;
  v_relation text;
  v_basis text;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_kind is null or p_kind not in ('card','wristband','watch','seatbelt')
     or p_target_kind is null or p_target_kind not in ('self','family')
     or p_label is null or length(btrim(p_label)) not between 1 and 60 then
    raise exception 'Invalid device information';
  end if;
  -- Avoid creation storms and confusing UI; administrative inventory is separate.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 714));
  if (select count(*) from public.vital_demo_devices where owner_uid=v_uid)>=12 then
    raise exception 'Demo limit reached (12 devices per account)';
  end if;
  if p_target_kind = 'self' then
    if p_family_id is not null then raise exception 'Invalid personal target'; end if;
  else
    if p_family_id is null then raise exception 'Select a family member'; end if;
    select relationship,authority_basis into v_relation,v_basis
      from public.family_profiles where id=p_family_id and owner_uid=v_uid;
    if not found then raise exception 'Family profile not found'; end if;
    if not ((v_relation='child' and v_basis='legal_guardian') or
            (v_relation<>'child' and v_basis='express_consent')) then
      raise exception 'Family sharing authorization required';
    end if;
  end if;
  -- Long random bearer token; no medical data in QR itself.
  v_token := substring(encode(pg_catalog.sha256(pg_catalog.convert_to(
     pg_catalog.gen_random_uuid()::text || pg_catalog.gen_random_uuid()::text,
     'UTF8')),'hex') from 1 for 40);
  insert into public.vital_demo_devices(owner_uid,target_kind,family_id,device_kind,label,token)
    values(v_uid,p_target_kind,p_family_id,p_kind,btrim(p_label),v_token)
    returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.vital_demo_device_set_status(
  p_device_id uuid, p_status text
) returns text language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_prev text;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_status is null or p_status not in ('active','paused','lost') then
    raise exception 'Invalid device status'; end if;
  select status into v_prev from public.vital_demo_devices
    where id=p_device_id and owner_uid=v_uid for update;
  if not found then raise exception 'Device not found'; end if;
  if v_prev='lost' and p_status <> 'lost' then
    raise exception 'Lost device cannot be reactivated. Create a new demo device.';
  end if;
  update public.vital_demo_devices set status=p_status,updated_at=now()
    where id=p_device_id and owner_uid=v_uid;
  return p_status;
end;
$$;

-- Public reader sees ONLY fields already published under /e or /f.
-- A paused/lost demo device cannot be used to fetch those fields through /d.
-- Documents, entire family records, and owner identity are never returned.
create or replace function public.vital_demo_device_emergency(p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_device record; v_result jsonb;
begin
  if p_token is null or p_token !~ '^[a-f0-9]{40}$' then return null; end if;
  select owner_uid,target_kind,family_id into v_device
    from public.vital_demo_devices
    where token=p_token and status='active';
  if not found then return null; end if;
  if v_device.target_kind='self' then
    select ep.snapshot into v_result from public.emergency_publications ep
      where ep.owner_uid=v_device.owner_uid and ep.active=true;
  else
    select fp.snapshot into v_result
      from public.family_emergency_publications fp
      join public.family_profiles f on f.id=fp.family_id
      join public.family_emergency_links l on l.family_id=f.id
      where fp.family_id=v_device.family_id
        and f.owner_uid=v_device.owner_uid
        and fp.active=true and l.published=true;
  end if;
  return v_result;
end;
$$;

revoke all on function public.vital_demo_device_create(text,text,text,uuid) from public,anon,authenticated;
revoke all on function public.vital_demo_device_set_status(uuid,text) from public,anon,authenticated;
revoke all on function public.vital_demo_device_emergency(text) from public,anon,authenticated;
grant execute on function public.vital_demo_device_create(text,text,text,uuid) to authenticated;
grant execute on function public.vital_demo_device_set_status(uuid,text) to authenticated;
grant execute on function public.vital_demo_device_emergency(text) to anon,authenticated;

comment on table public.vital_demo_devices is
 'Digital testing links only. Not issued/activated VITAL physical products. No private medical data stored.';
commit;
