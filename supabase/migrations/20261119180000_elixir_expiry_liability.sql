-- Elixir: points expiry (off until an admin turns it on) and the liability report.
-- Expiry rule: a member's whole balance expires after N months with no earning or spending.

alter table elixir.config add column expiry_inactive_months integer check (expiry_inactive_months is null or expiry_inactive_months between 3 and 120);

alter table elixir.member_balances add column last_activity_at timestamptz;
update elixir.member_balances b set last_activity_at = (
  select max(l.created_at) from elixir.ledger l
  where l.member_id = b.member_id and (l.kind in ('earn', 'redeem') or (l.kind = 'adjust' and l.delta > 0)));
create index member_balances_activity on elixir.member_balances (last_activity_at) where balance > 0;

-- Same trigger as before, now also keeping the "last activity" time (earning, spending, or staff-awarded points).
create or replace function elixir.ledger_after_insert() returns trigger
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_active boolean := new.kind in ('earn', 'redeem') or (new.kind = 'adjust' and new.delta > 0);
begin
  insert into elixir.member_balances as b (member_id, balance, lifetime_issued, lifetime_redeemed, lifetime_spend_gbp, last_activity_at)
  values (new.member_id, new.delta, greatest(new.delta, 0), case when new.kind = 'redeem' then -new.delta else 0 end, coalesce(new.spend_gbp, 0),
          case when v_active then new.created_at end)
  on conflict (member_id) do update set
    balance = b.balance + excluded.balance,
    lifetime_issued = b.lifetime_issued + excluded.lifetime_issued,
    lifetime_redeemed = b.lifetime_redeemed + excluded.lifetime_redeemed,
    lifetime_spend_gbp = b.lifetime_spend_gbp + excluded.lifetime_spend_gbp,
    last_activity_at = case when v_active then greatest(coalesce(b.last_activity_at, excluded.last_activity_at), excluded.last_activity_at) else b.last_activity_at end,
    updated_at = now();
  insert into elixir.events (kind, member_id, brand_id, payload)
  values ('ledger.' || new.kind, new.member_id, new.brand_id, jsonb_build_object(
    'ledger_id', new.id, 'delta', new.delta, 'currency', new.currency, 'amount', new.amount,
    'spend_gbp', new.spend_gbp, 'source_ref', new.source_ref));
  return null;
end $$;

-- Staff: see and change the expiry rule.
create function public.elixir_admin_expiry_policy() returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
declare v_months integer; v_members integer := 0; v_points bigint := 0;
begin
  perform elixir.require_staff('agent');
  select expiry_inactive_months into v_months from elixir.config;
  if v_months is not null then
    select count(*), coalesce(sum(balance), 0) into v_members, v_points from elixir.member_balances
     where balance > 0 and coalesce(last_activity_at, updated_at) < now() - make_interval(months => v_months);
  end if;
  return jsonb_build_object('months', v_months, 'due_members', v_members, 'due_points', v_points);
end $$;

create function public.elixir_admin_set_expiry_policy(p_months integer) returns void
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff;
begin
  v_staff := elixir.require_staff('admin');
  if p_months is not null and p_months not between 3 and 120 then raise exception 'Expiry must be between 3 and 120 months.' using errcode = '22023'; end if;
  update elixir.config set expiry_inactive_months = p_months, updated_at = now();
  perform elixir.log_admin(v_staff, 'expiry.policy', jsonb_build_object('months', p_months));
end $$;

-- Staff (admin): expire balances that have been inactive too long. Dry run by default.
create function public.elixir_admin_run_expiry(p_dry_run boolean default true) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare
  v_staff elixir.staff; v_months integer; r record; v_bal integer; v_members integer := 0; v_points bigint := 0; v_more boolean := false;
begin
  v_staff := elixir.require_staff('admin');
  select expiry_inactive_months into v_months from elixir.config;
  if v_months is null then raise exception 'Expiry is switched off. Choose a number of months first.' using errcode = '22023'; end if;
  for r in
    select member_id from elixir.member_balances
     where balance > 0 and coalesce(last_activity_at, updated_at) < now() - make_interval(months => v_months)
     order by member_id limit 5000
  loop
    perform 1 from elixir.members where id = r.member_id for update;       -- same lock redemptions take
    select balance into v_bal from elixir.member_balances
     where member_id = r.member_id and balance > 0 and coalesce(last_activity_at, updated_at) < now() - make_interval(months => v_months);
    if v_bal is null then continue; end if;                                 -- they earned or spent in the meantime
    v_members := v_members + 1; v_points := v_points + v_bal;
    if not p_dry_run then
      insert into elixir.ledger (member_id, kind, delta, description, reason, staff_id, staff_email)
      values (r.member_id, 'expire', -v_bal, 'Points expired after ' || v_months || ' months without activity', 'inactivity', v_staff.user_id, v_staff.email);
    end if;
  end loop;
  select exists (select 1 from elixir.member_balances where balance > 0 and coalesce(last_activity_at, updated_at) < now() - make_interval(months => v_months)) into v_more;
  if not p_dry_run and v_members > 0 then
    perform elixir.log_admin(v_staff, 'expiry.run', jsonb_build_object('members', v_members, 'points', v_points, 'months', v_months));
  end if;
  return jsonb_build_object('dry_run', p_dry_run, 'members', v_members, 'points', v_points, 'more_to_do', v_more and not p_dry_run);
end $$;

-- Staff: the liability report.
create function public.elixir_admin_liability() returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
declare
  v_cfg elixir.config; v_out jsonb; v_issued bigint; v_redeemed bigint; v_expired bigint;
begin
  perform elixir.require_staff('agent');
  select * into v_cfg from elixir.config;
  select coalesce(sum(lifetime_issued), 0), coalesce(sum(lifetime_redeemed), 0) into v_issued, v_redeemed from elixir.member_balances;
  select coalesce(-sum(delta), 0) into v_expired from elixir.ledger where kind = 'expire';
  v_out := jsonb_build_object(
    'redeem_points_per_gbp', v_cfg.redeem_points_per_gbp,
    'expiry_months', v_cfg.expiry_inactive_months,
    'members_with_balance', (select count(*) from elixir.member_balances where balance > 0),
    'outstanding_points', (select coalesce(sum(balance), 0) from elixir.member_balances where balance > 0),
    'outstanding_gbp', round((select coalesce(sum(balance), 0) from elixir.member_balances where balance > 0)::numeric / v_cfg.redeem_points_per_gbp, 2),
    'issued_points', v_issued, 'redeemed_points', v_redeemed, 'expired_points', v_expired,
    'breakage_pct', case when v_issued > 0 then round(v_expired::numeric * 100 / v_issued, 1) else 0 end,
    'codes_unused', (select count(*) from elixir.redemptions where status = 'issued' and expires_at > now()),
    'ageing', (select coalesce(jsonb_agg(jsonb_build_object('bucket', bucket, 'members', members, 'points', points) order by ord), '[]'::jsonb) from (
        select case when age < interval '3 months' then 'Under 3 months' when age < interval '6 months' then '3 to 6 months'
                    when age < interval '12 months' then '6 to 12 months' when age < interval '24 months' then '12 to 24 months' else 'Over 24 months' end as bucket,
               case when age < interval '3 months' then 1 when age < interval '6 months' then 2 when age < interval '12 months' then 3 when age < interval '24 months' then 4 else 5 end as ord,
               count(*) as members, sum(balance) as points
          from (select balance, now() - coalesce(last_activity_at, updated_at) as age from elixir.member_balances where balance > 0) x
         group by 1, 2) a),
    'monthly', (select coalesce(jsonb_agg(jsonb_build_object('month', to_char(m, 'YYYY-MM'),
          'issued', coalesce(i, 0), 'redeemed', coalesce(r, 0), 'expired', coalesce(e, 0)) order by m), '[]'::jsonb) from (
        select date_trunc('month', created_at) as m,
               sum(delta) filter (where delta > 0) as i, -sum(delta) filter (where kind = 'redeem') as r, -sum(delta) filter (where kind = 'expire') as e
          from elixir.ledger where created_at >= date_trunc('month', now()) - interval '11 months' group by 1) t),
    'expiring_soon', case when v_cfg.expiry_inactive_months is null then null else (
        select jsonb_build_object('members', count(*), 'points', coalesce(sum(balance), 0)) from elixir.member_balances
         where balance > 0
           and coalesce(last_activity_at, updated_at) + make_interval(months => v_cfg.expiry_inactive_months) > now()
           and coalesce(last_activity_at, updated_at) + make_interval(months => v_cfg.expiry_inactive_months) <= now() + interval '60 days') end);
  return v_out;
end $$;

-- Member: the wallet now also says when points would expire.
create or replace function public.elixir_me() returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
declare
  v_uid uuid := auth.uid(); v_member elixir.members; v_spend numeric; v_tier elixir.tiers; v_next elixir.tiers; v_cfg elixir.config; v_bal elixir.member_balances;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select * into v_member from elixir.members where user_id = v_uid;
  if not found then return jsonb_build_object('enrolled', false); end if;
  select * into v_cfg from elixir.config;
  select * into v_bal from elixir.member_balances where member_id = v_member.id;
  v_spend := elixir.window_spend_of(v_member.id);
  v_tier := elixir.tier_for_spend(v_spend);
  select * into v_next from elixir.tiers where min_spend_gbp > coalesce(v_tier.min_spend_gbp, 0) order by min_spend_gbp limit 1;
  return jsonb_build_object(
    'enrolled', true,
    'card_no', v_member.card_no,
    'display_name', v_member.display_name,
    'joined_at', v_member.joined_at,
    'balance', elixir.balance_of(v_member.id),
    'balance_gbp', round(elixir.balance_of(v_member.id)::numeric / v_cfg.redeem_points_per_gbp, 2),
    'lifetime_earned', coalesce((select sum(delta) from elixir.ledger where member_id = v_member.id and delta > 0), 0),
    'lifetime_redeemed', coalesce((select -sum(delta) from elixir.ledger where member_id = v_member.id and kind = 'redeem'), 0),
    'expiry_months', v_cfg.expiry_inactive_months,
    'expires_on', case when v_cfg.expiry_inactive_months is null or coalesce(v_bal.balance, 0) <= 0 then null
                  else coalesce(v_bal.last_activity_at, v_bal.updated_at) + make_interval(months => v_cfg.expiry_inactive_months) end,
    'tier', elixir.tier_json(v_tier),
    'window_spend_gbp', v_spend,
    'next_tier', case when v_next.id is null then null
                 else jsonb_build_object('name', v_next.name, 'spend_needed_gbp', v_next.min_spend_gbp - v_spend) end,
    'history', coalesce((select jsonb_agg(h order by h.created_at desc) from (
        select l.created_at, l.kind, l.delta, l.description, b.name as brand
        from elixir.ledger l left join elixir.brands b on b.id = l.brand_id
        where l.member_id = v_member.id order by l.created_at desc, l.id desc limit 50) h), '[]'::jsonb),
    'codes', coalesce((select jsonb_agg(c order by c.issued_at desc) from (
        select code, status, expires_at, issued_at, reward_snapshot->>'title' as title
        from elixir.redemptions where member_id = v_member.id and status = 'issued' and expires_at > now()) c), '[]'::jsonb));
end $$;

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('elixir_admin_expiry_policy', 'elixir_admin_set_expiry_policy', 'elixir_admin_run_expiry', 'elixir_admin_liability')
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
