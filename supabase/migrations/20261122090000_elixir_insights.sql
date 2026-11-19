-- Elixir insights: aggregate-only reports. No member is ever identifiable; small audiences are suppressed.

create or replace function public.elixir_partner_insights(p_brand uuid, p_days int default 90) returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
declare
  v_from timestamptz := now() - make_interval(days => least(greatest(coalesce(p_days, 90), 7), 365));
  v_members int; v_new int; v_repeat int; v_orders int; v_aov numeric; v_cross int; v_small boolean;
begin
  perform elixir.require_brand_user(p_brand);

  select count(distinct member_id), count(*), round(avg(spend_gbp), 2) into v_members, v_orders, v_aov
  from elixir.ledger where brand_id = p_brand and kind = 'earn' and created_at >= v_from;

  select count(*) into v_new from (
    select member_id from elixir.ledger where brand_id = p_brand and kind = 'earn' group by member_id having min(created_at) >= v_from) n;

  select count(*) into v_repeat from (
    select member_id from elixir.ledger where brand_id = p_brand and kind = 'earn' and created_at >= v_from group by member_id having count(*) >= 2) r;

  select count(distinct l.member_id) into v_cross from elixir.ledger l
  where l.kind = 'earn' and l.brand_id is not null and l.brand_id <> p_brand and l.created_at >= v_from
    and l.member_id in (select member_id from elixir.ledger where brand_id = p_brand and kind = 'earn' and created_at >= v_from);

  v_small := v_members < 10;
  return jsonb_build_object(
    'days', least(greatest(coalesce(p_days, 90), 7), 365),
    'members', v_members,
    'orders', v_orders,
    'avg_order_gbp', v_aov,
    'new_members', v_new,
    'returning_members', greatest(v_members - v_new, 0),
    'repeat_members', v_repeat,
    'repeat_rate', case when v_members > 0 then round(v_repeat::numeric / v_members, 3) end,
    'orders_per_member', case when v_members > 0 then round(v_orders::numeric / v_members, 2) end,
    'small_audience', v_small,
    'cross_shop_rate', case when v_small or v_members = 0 then null else round(v_cross::numeric / v_members, 3) end,
    'by_weekday', (select coalesce(jsonb_agg(jsonb_build_object('dow', d, 'orders', coalesce(c.n, 0)) order by d), '[]'::jsonb)
                   from generate_series(1, 7) d left join (select extract(isodow from created_at)::int dow, count(*) n from elixir.ledger
                        where brand_id = p_brand and kind = 'earn' and created_at >= v_from group by 1) c on c.dow = d));
end $$;

create or replace function public.elixir_admin_insights(p_months int default 6) returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
declare
  v_m int := least(greatest(coalesce(p_months, 6), 1), 24);
  v_from timestamptz := date_trunc('month', now()) - make_interval(months => least(greatest(coalesce(p_months, 6), 1), 24) - 1);
  v_issued bigint; v_redeemed bigint; v_active int; v_multi int; v_shoppers int;
begin
  perform elixir.require_staff('agent');
  select coalesce(sum(delta) filter (where delta > 0), 0), coalesce(-sum(delta) filter (where kind = 'redeem'), 0)
    into v_issued, v_redeemed from elixir.ledger where created_at >= v_from;
  select count(distinct member_id) into v_active from elixir.ledger where kind in ('earn', 'redeem') and created_at >= now() - interval '30 days';
  select count(*), count(*) filter (where b >= 2) into v_shoppers, v_multi from (
    select member_id, count(distinct brand_id) b from elixir.ledger where kind = 'earn' and brand_id is not null and created_at >= v_from group by member_id) s;
  return jsonb_build_object(
    'months', v_m,
    'members_total', (select count(*) from elixir.members),
    'new_members', (select count(*) from elixir.members where joined_at >= v_from),
    'active_30d', v_active,
    'points_issued', v_issued,
    'points_redeemed', v_redeemed,
    'redemption_rate', case when v_issued > 0 then round(v_redeemed::numeric / v_issued, 3) end,
    'multi_brand_rate', case when v_shoppers > 0 then round(v_multi::numeric / v_shoppers, 3) end,
    'monthly', (select coalesce(jsonb_agg(jsonb_build_object('month', to_char(m, 'YYYY-MM'),
        'issued', coalesce(l.issued, 0), 'redeemed', coalesce(l.redeemed, 0), 'active', coalesce(l.active, 0), 'new_members', coalesce(j.n, 0)) order by m), '[]'::jsonb)
      from generate_series(v_from, date_trunc('month', now()), interval '1 month') m
      left join (select date_trunc('month', created_at) mm, sum(delta) filter (where delta > 0) issued, -sum(delta) filter (where kind = 'redeem') redeemed,
                        count(distinct member_id) filter (where kind in ('earn', 'redeem')) active from elixir.ledger where created_at >= v_from group by 1) l on l.mm = m
      left join (select date_trunc('month', joined_at) mm, count(*) n from elixir.members where joined_at >= v_from group by 1) j on j.mm = m),
    'brands', (select coalesce(jsonb_agg(x order by x.spend_gbp desc), '[]'::jsonb) from (
        select b.name, coalesce(sum(l.spend_gbp), 0) spend_gbp, count(*) filter (where l.kind = 'earn') orders, count(distinct l.member_id) filter (where l.kind = 'earn') members
        from elixir.brands b left join elixir.ledger l on l.brand_id = b.id and l.created_at >= v_from group by b.id, b.name) x));
end $$;

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('elixir_partner_insights', 'elixir_admin_insights')
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
