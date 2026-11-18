-- Elixir Points: scale foundation.
-- Global currencies, fast balances, an event outbox, and a nightly integrity check.
-- Safe to run on a live database: existing calls from brand sites keep working unchanged.

-- ---------------------------------------------------------------------------
-- Currencies. Points are the one global unit; each currency has its own earn rate and
-- its own fixed redeem value (no live exchange rates on points). gbp_rate is a reference
-- rate (units of this currency per £1) used only to give every purchase a frozen £ value
-- for tiers and reporting. Seed values are starting points; tune them in the dashboard.
-- ---------------------------------------------------------------------------

create table elixir.currencies (
  code text primary key check (code ~ '^[A-Z]{3}$'),
  name text not null,
  symbol text not null,
  minor_units smallint not null default 2 check (minor_units between 0 and 3),
  earn_points_per_unit   numeric(12,5) not null check (earn_points_per_unit >= 0),
  redeem_points_per_unit numeric(12,4) not null check (redeem_points_per_unit > 0),
  gbp_rate numeric(14,6) not null check (gbp_rate > 0),
  active boolean not null default true,
  rate_updated_at timestamptz not null default now()
);
alter table elixir.currencies enable row level security;

insert into elixir.currencies (code, name, symbol, minor_units, earn_points_per_unit, redeem_points_per_unit, gbp_rate)
select 'GBP', 'British pound', '£', 2, c.earn_points_per_gbp, c.redeem_points_per_gbp, 1 from elixir.config c;
insert into elixir.currencies (code, name, symbol, minor_units, earn_points_per_unit, redeem_points_per_unit, gbp_rate) values
  ('USD', 'US dollar',         '$',  2, 1,    150, 1.30),
  ('EUR', 'Euro',              '€',  2, 1,    175, 1.15),
  ('CAD', 'Canadian dollar',   'C$', 2, 1,    110, 1.80),
  ('AUD', 'Australian dollar', 'A$', 2, 1,    100, 2.00),
  ('JPY', 'Japanese yen',      '¥',  0, 0.005, 1,  190);

-- The pound row follows the programme settings, so there is one place to change it.
create function elixir.sync_gbp_currency() returns trigger
language plpgsql security definer set search_path = elixir, pg_temp as $$
begin
  update elixir.currencies set earn_points_per_unit = new.earn_points_per_gbp,
         redeem_points_per_unit = new.redeem_points_per_gbp, rate_updated_at = now()
   where code = 'GBP';
  return new;
end $$;
create trigger config_sync_gbp after update on elixir.config for each row execute function elixir.sync_gbp_currency();

-- ---------------------------------------------------------------------------
-- Ledger: keep what the customer actually paid, and the £ value frozen at the time.
-- (spend_gbp stays as the frozen £ value, so tiers and reports are unchanged.)
-- Older rows have amount null and are read as amount = spend_gbp, currency GBP.
-- ---------------------------------------------------------------------------

alter table elixir.ledger add column currency text not null default 'GBP' references elixir.currencies(code);
alter table elixir.ledger add column amount numeric(14,2);
alter table elixir.members add column country text check (country is null or country ~ '^[A-Z]{2}$');

-- ---------------------------------------------------------------------------
-- Fast balances: one row per member, kept in step with the ledger by a trigger in the
-- same transaction. The ledger stays the source of truth; elixir_admin_verify_balances()
-- proves the two agree.
-- ---------------------------------------------------------------------------

create table elixir.member_balances (
  member_id uuid primary key references elixir.members(id),
  balance integer not null default 0,
  lifetime_issued bigint not null default 0,
  lifetime_redeemed bigint not null default 0,
  lifetime_spend_gbp numeric(16,2) not null default 0,
  updated_at timestamptz not null default now()
);
alter table elixir.member_balances enable row level security;

insert into elixir.member_balances (member_id, balance, lifetime_issued, lifetime_redeemed, lifetime_spend_gbp)
select member_id, sum(delta), sum(greatest(delta, 0)), coalesce(sum(-delta) filter (where kind = 'redeem'), 0), coalesce(sum(spend_gbp), 0)
from elixir.ledger group by member_id;

-- Event outbox: every ledger entry also writes an event, for insights, personalised offers,
-- partner dashboards and anything else that should not read the live tables. Consumers mark
-- events delivered; old delivered events can be deleted on a schedule.
create table elixir.events (
  id bigint generated always as identity primary key,
  kind text not null,
  member_id uuid,
  brand_id uuid,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);
create index events_pending on elixir.events (id) where delivered_at is null;
alter table elixir.events enable row level security;

create function elixir.ledger_after_insert() returns trigger
language plpgsql security definer set search_path = elixir, pg_temp as $$
begin
  insert into elixir.member_balances as b (member_id, balance, lifetime_issued, lifetime_redeemed, lifetime_spend_gbp)
  values (new.member_id, new.delta, greatest(new.delta, 0), case when new.kind = 'redeem' then -new.delta else 0 end, coalesce(new.spend_gbp, 0))
  on conflict (member_id) do update set
    balance = b.balance + excluded.balance,
    lifetime_issued = b.lifetime_issued + excluded.lifetime_issued,
    lifetime_redeemed = b.lifetime_redeemed + excluded.lifetime_redeemed,
    lifetime_spend_gbp = b.lifetime_spend_gbp + excluded.lifetime_spend_gbp,
    updated_at = now();
  insert into elixir.events (kind, member_id, brand_id, payload)
  values ('ledger.' || new.kind, new.member_id, new.brand_id, jsonb_build_object(
    'ledger_id', new.id, 'delta', new.delta, 'currency', new.currency, 'amount', new.amount,
    'spend_gbp', new.spend_gbp, 'source_ref', new.source_ref));
  return null;
end $$;
create trigger ledger_after_insert after insert on elixir.ledger for each row execute function elixir.ledger_after_insert();

create or replace function elixir.balance_of(p_member uuid) returns integer
language sql stable security definer set search_path = elixir, pg_temp as $$
  select coalesce((select balance from elixir.member_balances where member_id = p_member), 0)::integer;
$$;

-- ---------------------------------------------------------------------------
-- Earning and reversing in any supported currency (service_role, via the Edge Function).
-- The older spend_gbp / refund_gbp functions remain and now call these.
-- ---------------------------------------------------------------------------

create function public.elixir_record_earn_v2(
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

create or replace function public.elixir_record_earn(
  p_api_key text, p_source_ref text, p_spend_gbp numeric,
  p_email text default null, p_user_id uuid default null, p_description text default null
) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
begin
  if p_spend_gbp is null or p_spend_gbp <= 0 or p_spend_gbp > 1000000 then raise exception 'spend_gbp must be between 0 and 1,000,000' using errcode = '22023'; end if;
  return public.elixir_record_earn_v2(p_api_key, p_source_ref, p_spend_gbp, 'GBP', p_email, p_user_id, p_description, null);
end $$;

create function public.elixir_record_reversal_v2(
  p_api_key text, p_order_ref text, p_refund_ref text, p_refund_amount numeric, p_currency text default null
) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare
  v_brand_id uuid; v_orig elixir.ledger; v_orig_amt numeric; v_done_amt numeric; v_done_points integer;
  v_refund numeric; v_points integer; v_id bigint; v_existing elixir.ledger; v_gbp numeric;
begin
  v_brand_id := elixir.brand_from_key(p_api_key);
  if v_brand_id is null then raise exception 'invalid_api_key' using errcode = '28000'; end if;
  if p_refund_ref is null or length(btrim(p_refund_ref)) = 0 then raise exception 'refund_ref required' using errcode = '22023'; end if;
  if p_refund_amount is null or p_refund_amount <= 0 then raise exception 'refund amount must be positive' using errcode = '22023'; end if;

  select * into v_existing from elixir.ledger where brand_id = v_brand_id and kind = 'reversal' and source_ref = p_refund_ref;
  if found then return jsonb_build_object('status', 'duplicate', 'points', v_existing.delta); end if;

  select * into v_orig from elixir.ledger where brand_id = v_brand_id and kind = 'earn' and source_ref = p_order_ref;
  if not found then return jsonb_build_object('status', 'no_original_earn', 'points', 0); end if;
  if p_currency is not null and upper(btrim(p_currency)) <> v_orig.currency then
    raise exception 'currency_mismatch: the order was in %', v_orig.currency using errcode = '22023';
  end if;

  v_orig_amt := coalesce(v_orig.amount, v_orig.spend_gbp);
  select coalesce(sum(-coalesce(amount, spend_gbp)), 0), coalesce(sum(-delta), 0) into v_done_amt, v_done_points
    from elixir.ledger where reverses_id = v_orig.id;
  v_refund := least(p_refund_amount, v_orig_amt - v_done_amt);
  if v_refund <= 0 then return jsonb_build_object('status', 'already_fully_reversed', 'points', 0); end if;
  v_points := least(round(v_orig.delta * v_refund / v_orig_amt)::integer, v_orig.delta - v_done_points);
  v_gbp := round(v_orig.spend_gbp * v_refund / v_orig_amt, 2);

  insert into elixir.ledger (member_id, kind, delta, spend_gbp, amount, currency, brand_id, liable_brand_id, source_ref, reverses_id, description)
  values (v_orig.member_id, 'reversal', -v_points, -v_gbp, -round(v_refund, 2), v_orig.currency, v_brand_id, v_orig.liable_brand_id, p_refund_ref, v_orig.id,
          'Refund on order ' || p_order_ref)
  on conflict (brand_id, kind, source_ref) where source_ref is not null and brand_id is not null do nothing
  returning id into v_id;
  if v_id is null then return jsonb_build_object('status', 'duplicate', 'points', 0); end if;

  return jsonb_build_object('status', 'reversed', 'points', -v_points, 'balance', elixir.balance_of(v_orig.member_id));
end $$;

create or replace function public.elixir_record_reversal(
  p_api_key text, p_order_ref text, p_refund_ref text, p_refund_gbp numeric
) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
begin
  if p_refund_gbp is null or p_refund_gbp <= 0 then raise exception 'refund_gbp must be positive' using errcode = '22023'; end if;
  return public.elixir_record_reversal_v2(p_api_key, p_order_ref, p_refund_ref, p_refund_gbp, 'GBP');
end $$;

-- ---------------------------------------------------------------------------
-- Dashboard: currencies, balance check, and an overview that no longer scans every ledger row.
-- ---------------------------------------------------------------------------

create function public.elixir_admin_currencies() returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_staff('agent');
  return coalesce((select jsonb_agg(to_jsonb(c) order by (c.code = 'GBP') desc, c.code) from elixir.currencies c), '[]'::jsonb);
end $$;

create function public.elixir_admin_save_currency(p jsonb) returns void
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff; v_code text := upper(btrim(coalesce(p->>'code', '')));
begin
  v_staff := elixir.require_staff('admin');
  if v_code !~ '^[A-Z]{3}$' then raise exception 'currency code must be 3 letters' using errcode = '22023'; end if;
  if v_code = 'GBP' then  -- the pound follows programme settings
    update elixir.config set
      earn_points_per_gbp = coalesce((p->>'earn_points_per_unit')::numeric, earn_points_per_gbp),
      redeem_points_per_gbp = coalesce((p->>'redeem_points_per_unit')::numeric::integer, redeem_points_per_gbp), updated_at = now();
  elsif exists (select 1 from elixir.currencies where code = v_code) then
    update elixir.currencies set
      name = coalesce(nullif(btrim(p->>'name'), ''), name),
      symbol = coalesce(nullif(btrim(p->>'symbol'), ''), symbol),
      minor_units = coalesce((p->>'minor_units')::smallint, minor_units),
      earn_points_per_unit = coalesce((p->>'earn_points_per_unit')::numeric, earn_points_per_unit),
      redeem_points_per_unit = coalesce((p->>'redeem_points_per_unit')::numeric, redeem_points_per_unit),
      gbp_rate = coalesce((p->>'gbp_rate')::numeric, gbp_rate),
      active = coalesce((p->>'active')::boolean, active),
      rate_updated_at = now()
     where code = v_code;
  else
    if p->>'earn_points_per_unit' is null or p->>'redeem_points_per_unit' is null or p->>'gbp_rate' is null then
      raise exception 'a new currency needs earn_points_per_unit, redeem_points_per_unit and gbp_rate' using errcode = '22023';
    end if;
    insert into elixir.currencies (code, name, symbol, minor_units, earn_points_per_unit, redeem_points_per_unit, gbp_rate, active)
    values (v_code, coalesce(nullif(btrim(p->>'name'), ''), v_code), coalesce(nullif(btrim(p->>'symbol'), ''), v_code),
            coalesce((p->>'minor_units')::smallint, 2), (p->>'earn_points_per_unit')::numeric, (p->>'redeem_points_per_unit')::numeric,
            (p->>'gbp_rate')::numeric, coalesce((p->>'active')::boolean, true));
  end if;
  perform elixir.log_admin(v_staff, 'currency.save', p);
end $$;

-- Compares every stored balance with the ledger. Returns [] when they agree.
create function public.elixir_admin_verify_balances() returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_staff('admin');
  return coalesce((
    select jsonb_agg(jsonb_build_object('member_id', x.member_id, 'stored', x.stored, 'ledger', x.actual))
    from (select member_id, coalesce(b.balance, 0) as stored, coalesce(l.s, 0) as actual
          from elixir.member_balances b full join (select member_id, sum(delta)::integer s from elixir.ledger group by member_id) l using (member_id)
          where coalesce(b.balance, 0) <> coalesce(l.s, 0)) x), '[]'::jsonb);
end $$;

create or replace function public.elixir_admin_overview() returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
declare v_cfg elixir.config; v_totals record; v_members integer; v_tiers jsonb; v_brands jsonb;
begin
  perform elixir.require_staff('agent');
  select * into v_cfg from elixir.config;
  select coalesce(sum(balance), 0) as outstanding, coalesce(sum(lifetime_issued), 0) as issued,
         coalesce(sum(lifetime_redeemed), 0) as redeemed, coalesce(sum(lifetime_spend_gbp), 0) as spend
    into v_totals from elixir.member_balances;
  select count(*) into v_members from elixir.members;

  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color, 'members', coalesce(c.n, 0)) order by t.sort_order), '[]'::jsonb)
    into v_tiers
    from elixir.tiers t
    left join (
      select x.tier_id, count(*) n from (
        select (select t2.id from elixir.tiers t2 where t2.min_spend_gbp <= greatest(coalesce(w.s, 0), 0)
                 order by t2.min_spend_gbp desc limit 1) as tier_id
        from elixir.members m
        left join (select member_id, sum(spend_gbp) s from elixir.ledger
                    where created_at >= now() - make_interval(months => v_cfg.tier_window_months) group by member_id) w on w.member_id = m.id) x
      group by x.tier_id) c on c.tier_id = t.id;

  select coalesce(jsonb_agg(jsonb_build_object('slug', b.slug, 'name', b.name, 'points', coalesce(s.points, 0), 'spend_gbp', coalesce(s.spend, 0))), '[]'::jsonb)
    into v_brands
    from elixir.brands b
    left join (select brand_id, sum(delta) filter (where kind in ('earn', 'reversal')) points, sum(spend_gbp) spend
               from elixir.ledger where created_at >= now() - interval '30 days' group by brand_id) s on s.brand_id = b.id
    where b.active;

  return jsonb_build_object(
    'members', v_members,
    'points_outstanding', v_totals.outstanding,
    'points_issued', v_totals.issued,
    'points_redeemed', v_totals.redeemed,
    'redeemed_value_gbp', round(v_totals.redeemed::numeric / v_cfg.redeem_points_per_gbp, 2),
    'liability_gbp', round(v_totals.outstanding::numeric / v_cfg.redeem_points_per_gbp, 2),
    'avg_lifetime_spend_gbp', case when v_members = 0 then 0 else round(v_totals.spend / v_members, 2) end,
    'redeem_points_per_gbp', v_cfg.redeem_points_per_gbp,
    'tiers', v_tiers,
    'brands_30d', v_brands);
end $$;

-- Public programme info now also lists the currencies, so sites can show local rates.
create or replace function public.elixir_programme() returns jsonb
language sql stable security definer set search_path = elixir, pg_temp as $$
  select jsonb_build_object(
    'earn_points_per_gbp',   c.earn_points_per_gbp,
    'redeem_points_per_gbp', c.redeem_points_per_gbp,
    'tier_window_months',    c.tier_window_months,
    'tiers', coalesce((select jsonb_agg(jsonb_build_object(
        'id', t.id, 'name', t.name, 'min_spend_gbp', t.min_spend_gbp,
        'earn_multiplier', t.earn_multiplier, 'color', t.color, 'perks', t.perks)
        order by t.min_spend_gbp) from elixir.tiers t), '[]'::jsonb),
    'rewards', coalesce((select jsonb_agg(jsonb_build_object(
        'title', r.title, 'description', r.description, 'reward_type', r.reward_type,
        'value', r.value, 'point_cost', r.point_cost, 'brand', b.name)
        order by r.point_cost)
      from elixir.rewards r left join elixir.brands b on b.id = r.brand_id
      where r.active and r.archived_at is null and (r.stock is null or r.stock > 0)), '[]'::jsonb),
    'brands', coalesce((select jsonb_agg(jsonb_build_object(
        'slug', b.slug, 'name', b.name, 'brand_type', b.brand_type) order by b.name)
      from elixir.brands b where b.active), '[]'::jsonb),
    'currencies', coalesce((select jsonb_agg(jsonb_build_object(
        'code', cu.code, 'name', cu.name, 'symbol', cu.symbol,
        'earn_points_per_unit', cu.earn_points_per_unit, 'redeem_points_per_unit', cu.redeem_points_per_unit)
        order by (cu.code = 'GBP') desc, cu.code) from elixir.currencies cu where cu.active), '[]'::jsonb)
  )
  from elixir.config c;
$$;

-- ---------------------------------------------------------------------------
-- Grants (same rule as before): brand-server functions go to service_role only.
-- ---------------------------------------------------------------------------

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig, p.proname
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'elixir\_%'
             and p.proname in ('elixir_record_earn', 'elixir_record_earn_v2', 'elixir_record_reversal', 'elixir_record_reversal_v2',
                               'elixir_admin_currencies', 'elixir_admin_save_currency', 'elixir_admin_verify_balances', 'elixir_admin_overview', 'elixir_programme')
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f.sig);
    if f.proname like 'elixir\_record\_%' then
      execute format('grant execute on function %s to service_role', f.sig);
    elsif f.proname = 'elixir_programme' then  -- public marketing info, as before
      execute format('grant execute on function %s to anon, authenticated, service_role', f.sig);
    else
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
end $$;
