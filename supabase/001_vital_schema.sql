-- VITAL v0.2 — deploy to a NEW Supabase project using SQL Editor.
-- No demo patients or seed records are inserted.
-- Public HTTP access is only through vital_get_emergency (no table SELECT).

create table if not exists public.medical_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  fields jsonb not null default '{}'::jsonb,
  sharing jsonb not null default '{}'::jsonb,
  card_token text unique,
  published boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint valid_card_token check (card_token is null or card_token ~ '^[a-f0-9]{40}$')
);

create table if not exists public.emergency_publications (
  owner_uid uuid not null unique references auth.users(id) on delete cascade,
  token_hash text primary key,
  snapshot jsonb not null default '{}'::jsonb,
  active boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.medical_profiles enable row level security;
alter table public.emergency_publications enable row level security;
revoke all on table public.medical_profiles from anon, authenticated;
revoke all on table public.emergency_publications from anon, authenticated;
grant select on table public.medical_profiles to authenticated;

-- Only the account owner may read their private profile. No direct insert/update.
drop policy if exists "profile_read_own" on public.medical_profiles;
create policy "profile_read_own" on public.medical_profiles
  for select to authenticated using ((select auth.uid()) = user_id);

-- SECURITY DEFINER functions are the only write/read-public paths.
create or replace function public.vital_create_card(p_token text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_token text;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_token is null or p_token !~ '^[a-f0-9]{40}$' then
    raise exception 'Invalid card token';
  end if;
  insert into public.medical_profiles(user_id) values(v_uid)
    on conflict(user_id) do nothing;
  select card_token into v_token from public.medical_profiles
    where user_id = v_uid for update;
  if v_token is null then
    update public.medical_profiles set card_token=p_token, updated_at=now()
      where user_id = v_uid;
    v_token := p_token;
  end if;
  return v_token;
end;
$$;

create or replace function public.vital_save_profile(
  p_fields jsonb, p_sharing jsonb, p_publish boolean default false
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_fields jsonb := '{}'::jsonb;
  v_sharing jsonb := '{}'::jsonb;
  v_snapshot jsonb := '{}'::jsonb;
  v_key text;
  v_value text;
  v_allowed text[] := array['fullName','birthDate','bloodGroup','allergies',
    'conditions','medications','contactName','contactPhone','emergencySummary'];
  v_token text;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_fields is null or jsonb_typeof(p_fields) <> 'object'
     or p_sharing is null or jsonb_typeof(p_sharing) <> 'object' then
     raise exception 'Invalid profile format';
  end if;
  for v_key in select unnest(v_allowed) loop
    if p_fields ? v_key and jsonb_typeof(p_fields->v_key) <> 'string' then
      raise exception 'Invalid field type: %', v_key;
    end if;
    if p_sharing ? v_key and jsonb_typeof(p_sharing->v_key) <> 'boolean' then
      raise exception 'Invalid sharing option: %', v_key;
    end if;
    v_value := btrim(coalesce(p_fields->>v_key, ''));
    if length(v_value) > (case when v_key='emergencySummary' then 800 else 2000 end) then
      raise exception 'Field too long: %', v_key;
    end if;
    v_fields := v_fields || jsonb_build_object(v_key, v_value);
    v_sharing := v_sharing || jsonb_build_object(v_key,
      coalesce((p_sharing->>v_key)::boolean, false));
    if coalesce((p_sharing->>v_key)::boolean, false) and v_value <> '' then
      v_snapshot := v_snapshot || jsonb_build_object(v_key, v_value);
    end if;
  end loop;
  insert into public.medical_profiles(user_id) values(v_uid)
    on conflict(user_id) do nothing;
  select card_token into v_token from public.medical_profiles
    where user_id = v_uid for update;
  if p_publish and v_token is null then
    raise exception 'Create a card first';
  end if;
  if p_publish and v_snapshot = '{}'::jsonb then
    raise exception 'Choose at least one nonempty field to publish';
  end if;
  update public.medical_profiles
    set fields=v_fields, sharing=v_sharing, published=p_publish, updated_at=now()
    where user_id = v_uid;

  if p_publish then
    insert into public.emergency_publications(token_hash, owner_uid, snapshot, active)
    values(encode(sha256(convert_to(v_token,'UTF8')),'hex'), v_uid, v_snapshot, true)
    on conflict(owner_uid) do update set
      token_hash=excluded.token_hash,
      snapshot=excluded.snapshot, active=true, updated_at=now();
  else
    -- Immediately erase previously published medical fields.
    update public.emergency_publications
      set snapshot='{}'::jsonb, active=false, updated_at=now()
      where owner_uid=v_uid;
  end if;
  return jsonb_build_object('published', p_publish, 'shared_fields',
     (select count(*) from jsonb_object_keys(v_snapshot)));
end;
$$;

create or replace function public.vital_get_emergency(p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_snapshot jsonb;
begin
  if p_token is null or p_token !~ '^[a-f0-9]{40}$' then return null; end if;
  select snapshot into v_snapshot from public.emergency_publications
    where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex')
      and active=true;
  return v_snapshot;
end;
$$;

revoke all on function public.vital_create_card(text) from public, anon, authenticated;
revoke all on function public.vital_save_profile(jsonb,jsonb,boolean) from public, anon, authenticated;
revoke all on function public.vital_get_emergency(text) from public, anon, authenticated;
grant execute on function public.vital_create_card(text) to authenticated;
grant execute on function public.vital_save_profile(jsonb,jsonb,boolean) to authenticated;
grant execute on function public.vital_get_emergency(text) to anon, authenticated;

comment on function public.vital_get_emergency(text) is 'Returns only user-approved published emergency fields; null for unknown/suspended tokens.';
