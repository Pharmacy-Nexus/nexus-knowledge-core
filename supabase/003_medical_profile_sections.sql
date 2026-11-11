-- VITAL Medical Profile v1.3
-- Apply ONLY after 001_vital_schema.sql on the existing VITAL Supabase project.
-- Adds support for one new optional JSON field: 'surgeries'.
-- No tables are dropped, no patient records are modified, no QR tokens are regenerated.
-- Keeps missing fields from older app versions instead of wiping them.
-- Safeguard: run on a test clone/backup and verify behavior before real medical data.

begin;

create or replace function public.vital_save_profile(
  p_fields jsonb, p_sharing jsonb, p_publish boolean default false
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_fields jsonb := '{}'::jsonb;
  v_sharing jsonb := '{}'::jsonb;
  v_snapshot jsonb := '{}'::jsonb;
  v_previous_fields jsonb;
  v_previous_sharing jsonb;
  v_key text;
  v_value text;
  v_shared boolean;
  v_allowed text[] := array['fullName','birthDate','bloodGroup','allergies',
    'conditions','medications','surgeries','contactName','contactPhone','emergencySummary'];
  v_token text;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_fields is null or jsonb_typeof(p_fields) <> 'object'
     or p_sharing is null or jsonb_typeof(p_sharing) <> 'object' then
     raise exception 'Invalid profile format';
  end if;

  insert into public.medical_profiles(user_id) values(v_uid)
    on conflict(user_id) do nothing;
  select fields, sharing, card_token
    into v_previous_fields, v_previous_sharing, v_token
    from public.medical_profiles where user_id=v_uid for update;

  for v_key in select unnest(v_allowed) loop
    if p_fields ? v_key and jsonb_typeof(p_fields->v_key) <> 'string' then
      raise exception 'Invalid field type: %', v_key;
    end if;
    if p_sharing ? v_key and jsonb_typeof(p_sharing->v_key) <> 'boolean' then
      raise exception 'Invalid sharing option: %', v_key;
    end if;
    -- Backward-compatible: older clients do not know the surgeries key.
    v_value := btrim(coalesce(p_fields->>v_key, v_previous_fields->>v_key, ''));
    v_shared := coalesce((p_sharing->>v_key)::boolean,
                         (v_previous_sharing->>v_key)::boolean, false);
    if length(v_value) > (case when v_key='emergencySummary' then 800 else 2000 end) then
      raise exception 'Field too long: %', v_key;
    end if;
    v_fields := v_fields || jsonb_build_object(v_key, v_value);
    v_sharing := v_sharing || jsonb_build_object(v_key, v_shared);
    if v_shared and v_value <> '' then
      v_snapshot := v_snapshot || jsonb_build_object(v_key, v_value);
    end if;
  end loop;

  if p_publish and v_token is null then
    raise exception 'Create a card first';
  end if;
  if p_publish and v_snapshot = '{}'::jsonb then
    raise exception 'Choose at least one nonempty field to publish';
  end if;

  update public.medical_profiles
    set fields=v_fields, sharing=v_sharing, published=p_publish, updated_at=now()
    where user_id=v_uid;

  if p_publish then
    insert into public.emergency_publications(token_hash, owner_uid, snapshot, active)
    values(encode(sha256(convert_to(v_token,'UTF8')),'hex'), v_uid, v_snapshot, true)
    on conflict(owner_uid) do update set
      token_hash=excluded.token_hash, snapshot=excluded.snapshot,
      active=true, updated_at=now();
  else
    update public.emergency_publications
      set snapshot='{}'::jsonb, active=false, updated_at=now()
      where owner_uid=v_uid;
  end if;
  return jsonb_build_object('published', p_publish, 'shared_fields',
     (select count(*) from jsonb_object_keys(v_snapshot)));
end;
$$;

revoke all on function public.vital_save_profile(jsonb,jsonb,boolean) from public, anon, authenticated;
grant execute on function public.vital_save_profile(jsonb,jsonb,boolean) to authenticated;

commit;
