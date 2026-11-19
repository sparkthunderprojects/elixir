-- Security audit hardening (19 Nov 2026).
-- 1. Enquiry website must be a plain http(s) address (blocks javascript: links reaching staff).
-- 2. Per-brand safety limits so a leaked brand key cannot mint unlimited points.
-- 3. Settlement statements can never overlap (no double billing).
-- 4. Internal helper functions are no longer executable by PUBLIC (defence in depth).

create or replace function public.elixir_submit_enquiry(p jsonb) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare
  v_company text := btrim(coalesce(p->>'company', '')); v_name text := btrim(coalesce(p->>'contact_name', ''));
  v_email text := lower(btrim(coalesce(p->>'email', ''))); v_site text := nullif(btrim(coalesce(p->>'website', '')), '');
  v_msg text := btrim(coalesce(p->>'message', '')); v_interests text[];
begin
  if length(v_company) = 0 or length(v_company) > 120 then raise exception 'Please enter your company name.' using errcode = '22023'; end if;
  if length(v_name) = 0 or length(v_name) > 120 then raise exception 'Please enter your name.' using errcode = '22023'; end if;
  if length(v_email) > 200 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Please enter a valid email address.' using errcode = '22023'; end if;
  if v_site is not null and v_site !~* '^[a-z][a-z0-9+.-]*:' then v_site := 'https://' || v_site; end if;
  if v_site is not null and (length(v_site) > 200 or v_site !~* '^https?://[^\s<>"]+$') then raise exception 'Please enter a valid website address.' using errcode = '22023'; end if;
  if length(v_msg) = 0 or length(v_msg) > 4000 then raise exception 'Please tell us a little about what you have in mind (up to 4,000 characters).' using errcode = '22023'; end if;
  select coalesce(array_agg(distinct lower(btrim(x))), '{}') into v_interests
    from jsonb_array_elements_text(coalesce(case when jsonb_typeof(p->'interests') = 'array' then p->'interests' end, '[]'::jsonb)) x;
  if not (v_interests <@ array['loyalty', 'insights', 'media', 'other']::text[]) then raise exception 'Unknown area of interest.' using errcode = '22023'; end if;

  if (select count(*) from elixir.partner_enquiries where lower(email) = v_email and created_at > now() - interval '24 hours') >= 3
     or (select count(*) from elixir.partner_enquiries where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'too_many_enquiries' using errcode = '54000';
  end if;

  insert into elixir.partner_enquiries (company, contact_name, email, website, interests, message)
  values (v_company, v_name, v_email, v_site, v_interests, v_msg);
  return jsonb_build_object('ok', true);
end $$;

alter table elixir.brands
  add column if not exists max_order_gbp numeric(12,2) default 10000 check (max_order_gbp is null or max_order_gbp > 0),
  add column if not exists daily_points_cap integer default 2000000 check (daily_points_cap is null or daily_points_cap > 0);

create or replace function public.elixir_record_earn_v2(
  p_api_key text, p_source_ref text, p_amount numeric, p_currency text default 'GBP',
  p_email text default null, p_user_id uuid default null, p_description text default null, p_country text default null
) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare
  v_brand elixir.brands; v_brand_id uuid; v_cfg elixir.config; v_cur elixir.currencies; v_member uuid; v_status text;
  v_tier elixir.tiers; v_ratio numeric; v_campaign numeric; v_points integer; v_id bigint; v_existing elixir.ledger;
  v_code text := upper(btrim(coalesce(p_currency, 'GBP'))); v_gbp numeric;
begin
  v_brand_id := elixir.brand_from_key(p_api_key);
  if v_brand_id is null then raise exception 'invalid_api_key' using errcode = '28000'; end if;
  select * into v_brand from elixir.brands where id = v_brand_id;
  if p_source_ref is null or length(btrim(p_source_ref)) = 0 then raise exception 'source_ref required' using errcode = '22023'; end if;
  if p_amount is null or p_amount <= 0 or p_amount > 100000000 then raise exception 'amount must be between 0 and 100,000,000' using errcode = '22023'; end if;
  select * into v_cur from elixir.currencies where code = v_code and active;
  if not found then raise exception 'unsupported_currency' using errcode = '22023'; end if;
  if p_country is not null and upper(btrim(p_country)) !~ '^[A-Z]{2}$' then raise exception 'country must be a 2-letter code' using errcode = '22023'; end if;

  v_member := elixir.upsert_member(p_user_id, p_email);
  select status into v_status from elixir.members where id = v_member;
  if v_status <> 'active' then raise exception 'member_suspended' using errcode = '42501'; end if;
  if p_country is not null then update elixir.members set country = upper(btrim(p_country)) where id = v_member and country is null; end if;

  select * into v_existing from elixir.ledger where brand_id = v_brand_id and kind = 'earn' and source_ref = p_source_ref;
  if found then
    return jsonb_build_object('duplicate', true, 'points', v_existing.delta, 'balance', elixir.balance_of(v_member), 'member_id', v_member);
  end if;

  select * into v_cfg from elixir.config;
  v_tier := elixir.tier_for_spend(elixir.window_spend_of(v_member));
  -- a brand's own earn rate scales the currency's rate in the same proportion it scales the global one
  v_ratio := case when v_brand.earn_points_per_gbp is not null and v_cfg.earn_points_per_gbp > 0
                  then v_brand.earn_points_per_gbp / v_cfg.earn_points_per_gbp else 1 end;
  select coalesce(max(multiplier), 1) into v_campaign from elixir.earn_campaigns
   where active and starts_at <= now() and (ends_at is null or ends_at > now())
     and (brand_id is null or brand_id = v_brand_id);
  v_points := floor(p_amount * v_cur.earn_points_per_unit * v_ratio * coalesce(v_tier.earn_multiplier, 1) * v_campaign)::integer;
  v_gbp := round(p_amount / v_cur.gbp_rate, 2);
  if v_brand.max_order_gbp is not null and v_gbp > v_brand.max_order_gbp then
    raise exception 'order_exceeds_brand_limit' using errcode = '22023';
  end if;
  if v_brand.daily_points_cap is not null and v_points + coalesce((select sum(delta) from elixir.ledger
       where brand_id = v_brand_id and kind = 'earn' and created_at >= date_trunc('day', now())), 0) > v_brand.daily_points_cap then
    raise exception 'daily_points_cap_reached' using errcode = '22023';
  end if;

  insert into elixir.ledger (member_id, kind, delta, spend_gbp, amount, currency, brand_id, liable_brand_id, source_ref, description)
  values (v_member, 'earn', v_points, v_gbp, round(p_amount, 2), v_cur.code, v_brand_id, v_brand_id, p_source_ref, p_description)
  on conflict (brand_id, kind, source_ref) where source_ref is not null and brand_id is not null do nothing
  returning id into v_id;

  if v_id is null then  -- lost a race with an identical retry
    select * into v_existing from elixir.ledger where brand_id = v_brand_id and kind = 'earn' and source_ref = p_source_ref;
    return jsonb_build_object('duplicate', true, 'points', v_existing.delta, 'balance', elixir.balance_of(v_member), 'member_id', v_member);
  end if;

  return jsonb_build_object('duplicate', false, 'points', v_points, 'currency', v_cur.code, 'balance', elixir.balance_of(v_member),
    'member_id', v_member, 'tier', elixir.tier_json(elixir.tier_for_spend(elixir.window_spend_of(v_member))));
end $$;

create or replace function public.elixir_admin_brands() returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_staff('admin');
  return coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'slug', b.slug, 'name', b.name, 'brand_type', b.brand_type,
      'earn_points_per_gbp', b.earn_points_per_gbp, 'active', b.active, 'max_order_gbp', b.max_order_gbp, 'daily_points_cap', b.daily_points_cap,
      'keys', coalesce((select jsonb_agg(jsonb_build_object('id', k.id, 'label', k.label, 'prefix', k.key_prefix,
                 'created_at', k.created_at, 'revoked_at', k.revoked_at) order by k.created_at) from elixir.brand_keys k where k.brand_id = b.id), '[]'::jsonb))
      order by b.created_at) from elixir.brands b), '[]'::jsonb);
end $$;

create or replace function public.elixir_admin_save_brand(p jsonb) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff; v_id uuid := nullif(p->>'id', '')::uuid;
begin
  v_staff := elixir.require_staff('admin');
  if v_id is null then
    insert into elixir.brands (slug, name, brand_type, earn_points_per_gbp, active)
    values (lower(btrim(p->>'slug')), btrim(p->>'name'), coalesce(p->>'brand_type', 'owned'),
            nullif(p->>'earn_points_per_gbp', '')::numeric, coalesce((p->>'active')::boolean, true)) returning id into v_id;
  else
    update elixir.brands set name = btrim(p->>'name'), brand_type = coalesce(p->>'brand_type', brand_type),
      earn_points_per_gbp = nullif(p->>'earn_points_per_gbp', '')::numeric, active = coalesce((p->>'active')::boolean, active),
      max_order_gbp = case when p ? 'max_order_gbp' then nullif(p->>'max_order_gbp', '')::numeric else max_order_gbp end,
      daily_points_cap = case when p ? 'daily_points_cap' then nullif(p->>'daily_points_cap', '')::integer else daily_points_cap end
    where id = v_id;
    if not found then raise exception 'brand not found' using errcode = '22023'; end if;
  end if;
  perform elixir.log_admin(v_staff, 'brand.save', jsonb_build_object('brand_id', v_id, 'name', p->>'name', 'active', p->>'active'));
  return jsonb_build_object('id', v_id);
end $$;

create or replace function public.elixir_admin_generate_settlements(p_from date, p_to date) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff; v_cfg elixir.config; r record; v_n int := 0; v_skip int := 0;
begin
  v_staff := elixir.require_staff('admin');
  if p_from is null or p_to is null or p_to < p_from then raise exception 'invalid period' using errcode = '22023'; end if;
  select * into v_cfg from elixir.config;
  for r in
    select l.liable_brand_id as brand_id, sum(l.delta) filter (where l.kind in ('earn', 'reversal')) as pts
    from elixir.ledger l join elixir.brands b on b.id = l.liable_brand_id and b.brand_type = 'partner'
    where l.created_at >= p_from::timestamptz and l.created_at < (p_to + 1)::timestamptz
    group by 1
    having coalesce(sum(l.delta) filter (where l.kind in ('earn', 'reversal')), 0) > 0
  loop
    -- never bill the same days twice: skip a partner who already has a statement overlapping this period
    if exists (select 1 from elixir.settlements s where s.brand_id = r.brand_id and s.period_start <= p_to and s.period_end >= p_from) then
      v_skip := v_skip + 1; continue;
    end if;
    insert into elixir.settlements (brand_id, period_start, period_end, points_funded, redeem_points_per_gbp, amount_gbp)
    values (r.brand_id, p_from, p_to, r.pts, v_cfg.redeem_points_per_gbp, round(r.pts::numeric / v_cfg.redeem_points_per_gbp, 2))
    on conflict (brand_id, period_start, period_end) do nothing;
    if found then v_n := v_n + 1; end if;
  end loop;
  perform elixir.log_admin(v_staff, 'settlement.generate', jsonb_build_object('from', p_from, 'to', p_to, 'created', v_n, 'skipped', v_skip));
  return jsonb_build_object('created', v_n, 'skipped', v_skip);
end $$;

revoke execute on all functions in schema elixir from public, anon, authenticated;
alter default privileges in schema elixir revoke execute on functions from public;

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('elixir_submit_enquiry', 'elixir_record_earn_v2', 'elixir_admin_brands', 'elixir_admin_save_brand', 'elixir_admin_generate_settlements')
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f.sig);
    if f.proname = 'elixir_submit_enquiry' then
      execute format('grant execute on function %s to anon, authenticated, service_role', f.sig);
    elsif f.proname = 'elixir_record_earn_v2' then
      execute format('grant execute on function %s to service_role', f.sig);
    else
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
end $$;
