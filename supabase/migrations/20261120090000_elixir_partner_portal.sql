-- Elixir partner portal: brand users, partner overview, self-serve API keys.
-- Partners see only their own brand; members are never identifiable (masked ids).

create table if not exists elixir.brand_users (
  brand_id uuid not null references elixir.brands(id) on delete cascade,
  user_id uuid not null,
  email text not null,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  primary key (brand_id, user_id)
);
create index if not exists brand_users_user on elixir.brand_users (user_id);
alter table elixir.brand_users enable row level security;

create or replace function elixir.require_brand_user(p_brand uuid, p_owner_only boolean default false) returns elixir.brand_users
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
declare v elixir.brand_users;
begin
  select * into v from elixir.brand_users where brand_id = p_brand and user_id = auth.uid();
  if not found or (p_owner_only and v.role <> 'owner') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return v;
end $$;

-- ---------- staff: link users to brands ----------
create or replace function public.elixir_admin_brand_users(p_brand uuid) returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_staff('admin');
  return coalesce((select jsonb_agg(jsonb_build_object('user_id', user_id, 'email', email, 'role', role, 'created_at', created_at) order by created_at)
                   from elixir.brand_users where brand_id = p_brand), '[]'::jsonb);
end $$;

create or replace function public.elixir_admin_add_brand_user(p_brand uuid, p_email text, p_role text default 'staff') returns void
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff; v_uid uuid; v_email text := lower(btrim(coalesce(p_email, '')));
begin
  v_staff := elixir.require_staff('admin');
  if p_role not in ('owner', 'staff') then raise exception 'invalid role' using errcode = '22023'; end if;
  perform 1 from elixir.brands where id = p_brand;
  if not found then raise exception 'brand not found' using errcode = '22023'; end if;
  select id into v_uid from auth.users where lower(email) = v_email limit 1;
  if v_uid is null then raise exception 'no account with that email - ask them to sign up first' using errcode = '22023'; end if;
  insert into elixir.brand_users (brand_id, user_id, email, role) values (p_brand, v_uid, v_email, p_role)
  on conflict (brand_id, user_id) do update set role = excluded.role;
  perform elixir.log_admin(v_staff, 'brand_user.add', jsonb_build_object('brand_id', p_brand, 'email', v_email, 'role', p_role));
end $$;

create or replace function public.elixir_admin_remove_brand_user(p_brand uuid, p_user uuid) returns void
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff;
begin
  v_staff := elixir.require_staff('admin');
  delete from elixir.brand_users where brand_id = p_brand and user_id = p_user;
  perform elixir.log_admin(v_staff, 'brand_user.remove', jsonb_build_object('brand_id', p_brand, 'user_id', p_user));
end $$;

-- ---------- partner: own brands ----------
create or replace function public.elixir_partner_brands() returns jsonb
language sql stable security definer set search_path = elixir, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object('brand_id', b.id, 'name', b.name, 'slug', b.slug, 'role', u.role, 'active', b.active) order by b.name), '[]'::jsonb)
  from elixir.brand_users u join elixir.brands b on b.id = u.brand_id
  where u.user_id = auth.uid();
$$;

create or replace function public.elixir_partner_overview(p_brand uuid, p_days int default 30) returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
declare
  v_days int := least(greatest(coalesce(p_days, 30), 1), 365);
  v_from timestamptz := date_trunc('day', now()) - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 365) - 1);
  v_cfg elixir.config; v_brand elixir.brands;
  v_issued bigint; v_funded bigint; v_redeemed bigint; v_spend numeric; v_orders bigint; v_members bigint;
begin
  perform elixir.require_brand_user(p_brand);
  select * into v_brand from elixir.brands where id = p_brand;
  select * into v_cfg from elixir.config;

  select coalesce(sum(delta) filter (where kind in ('earn', 'reversal')), 0),
         coalesce(-sum(delta) filter (where kind = 'redeem'), 0),
         coalesce(sum(spend_gbp) filter (where kind in ('earn', 'reversal')), 0),
         count(*) filter (where kind = 'earn'),
         count(distinct member_id) filter (where kind = 'earn')
    into v_issued, v_redeemed, v_spend, v_orders, v_members
  from elixir.ledger where brand_id = p_brand and created_at >= v_from;

  select coalesce(sum(delta) filter (where kind in ('earn', 'reversal')), 0) into v_funded
  from elixir.ledger where liable_brand_id = p_brand and created_at >= v_from;

  return jsonb_build_object(
    'brand', jsonb_build_object('id', v_brand.id, 'name', v_brand.name, 'slug', v_brand.slug, 'active', v_brand.active),
    'days', v_days,
    'points_issued', v_issued,
    'points_funded', v_funded,
    'points_redeemed', v_redeemed,
    'funding_cost_gbp', round(v_funded::numeric / v_cfg.redeem_points_per_gbp, 2),
    'spend_gbp', v_spend,
    'orders', v_orders,
    'members', v_members,
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', d::date, 'points', coalesce(s.points, 0), 'spend_gbp', coalesce(s.spend, 0), 'orders', coalesce(s.orders, 0)) order by d)
      from generate_series(v_from, date_trunc('day', now()), interval '1 day') d
      left join (select date_trunc('day', created_at) as dy, sum(delta) filter (where kind in ('earn', 'reversal')) points,
                        sum(spend_gbp) filter (where kind in ('earn', 'reversal')) spend, count(*) filter (where kind = 'earn') orders
                 from elixir.ledger where brand_id = p_brand and created_at >= v_from group by 1) s on s.dy = d), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(r order by r.created_at desc) from (
        select created_at, kind, delta, spend_gbp, source_ref, description, 'M-' || upper(left(md5(member_id::text), 6)) as member
        from elixir.ledger where brand_id = p_brand order by created_at desc, id desc limit 25) r), '[]'::jsonb));
end $$;

-- ---------- partner: API keys (owners only) ----------
create or replace function public.elixir_partner_keys(p_brand uuid) returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_brand_user(p_brand, true);
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'label', label, 'prefix', key_prefix, 'created_at', created_at, 'revoked_at', revoked_at) order by created_at)
                   from elixir.brand_keys where brand_id = p_brand), '[]'::jsonb);
end $$;

create or replace function public.elixir_partner_create_key(p_brand uuid, p_label text default 'default') returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_u elixir.brand_users; v_key text; v_id uuid;
begin
  v_u := elixir.require_brand_user(p_brand, true);
  perform 1 from elixir.brands where id = p_brand and active;
  if not found then raise exception 'brand is not active' using errcode = '22023'; end if;
  v_key := 'elx_' || replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into elixir.brand_keys (brand_id, label, key_prefix, key_hash, created_by)
  values (p_brand, coalesce(nullif(btrim(p_label), ''), 'default'), substr(v_key, 1, 8),
          encode(sha256(convert_to(v_key, 'utf8')), 'hex'), v_u.user_id) returning id into v_id;
  insert into elixir.admin_log (staff_id, staff_email, action, detail)
  values (v_u.user_id, v_u.email, 'partner.key.create', jsonb_build_object('brand_id', p_brand, 'key_id', v_id));
  return jsonb_build_object('id', v_id, 'key', v_key);
end $$;

create or replace function public.elixir_partner_revoke_key(p_brand uuid, p_key uuid) returns void
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_u elixir.brand_users;
begin
  v_u := elixir.require_brand_user(p_brand, true);
  update elixir.brand_keys set revoked_at = now() where id = p_key and brand_id = p_brand and revoked_at is null;
  insert into elixir.admin_log (staff_id, staff_email, action, detail)
  values (v_u.user_id, v_u.email, 'partner.key.revoke', jsonb_build_object('brand_id', p_brand, 'key_id', p_key));
end $$;

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('elixir_admin_brand_users', 'elixir_admin_add_brand_user', 'elixir_admin_remove_brand_user',
             'elixir_partner_brands', 'elixir_partner_overview', 'elixir_partner_keys', 'elixir_partner_create_key', 'elixir_partner_revoke_key')
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
