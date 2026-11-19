-- Elixir affiliate shopping: members click through to outside retailers, networks pay a commission,
-- staff record the sale and confirmed sales credit points. Funded by the commission, not a partner.

create table if not exists elixir.affiliate_merchants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (length(btrim(name)) > 0),
  description text,
  url_template text not null check (url_template ~* '^https://'),   -- {click} is replaced with the tracking id
  points_per_gbp numeric(8,3) not null default 1 check (points_per_gbp >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists elixir.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references elixir.members(id) on delete cascade,
  merchant_id uuid not null references elixir.affiliate_merchants(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists affiliate_clicks_member on elixir.affiliate_clicks (member_id, created_at desc);
create table if not exists elixir.affiliate_conversions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references elixir.affiliate_merchants(id),
  member_id uuid not null references elixir.members(id),
  click_id uuid references elixir.affiliate_clicks(id),
  order_ref text not null,
  sale_gbp numeric(12,2) not null check (sale_gbp > 0),
  points integer not null check (points >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (merchant_id, order_ref)
);
alter table elixir.affiliate_merchants enable row level security;
alter table elixir.affiliate_clicks enable row level security;
alter table elixir.affiliate_conversions enable row level security;

create or replace function public.elixir_affiliate_merchants() returns jsonb
language sql stable security definer set search_path = elixir, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'description', description, 'points_per_gbp', points_per_gbp) order by name), '[]'::jsonb)
  from elixir.affiliate_merchants where active;
$$;

create or replace function public.elixir_affiliate_click(p_merchant uuid) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_m elixir.affiliate_merchants; v_me elixir.members; v_id uuid;
begin
  select * into v_me from elixir.members where user_id = auth.uid() and status = 'active';
  if not found then raise exception 'join first' using errcode = '42501'; end if;
  select * into v_m from elixir.affiliate_merchants where id = p_merchant and active;
  if not found then raise exception 'merchant not available' using errcode = '22023'; end if;
  insert into elixir.affiliate_clicks (member_id, merchant_id) values (v_me.id, v_m.id) returning id into v_id;
  return jsonb_build_object('url', replace(v_m.url_template, '{click}', v_id::text));
end $$;

create or replace function public.elixir_admin_affiliate_merchants() returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_staff('agent');
  return coalesce((select jsonb_agg(to_jsonb(m) order by m.name) from elixir.affiliate_merchants m), '[]'::jsonb);
end $$;

create or replace function public.elixir_admin_save_affiliate_merchant(p jsonb) returns uuid
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff; v_id uuid := nullif(p->>'id', '')::uuid;
begin
  v_staff := elixir.require_staff('admin');
  if v_id is null then
    insert into elixir.affiliate_merchants (slug, name, description, url_template, points_per_gbp, active)
    values (p->>'slug', p->>'name', p->>'description', p->>'url_template', coalesce((p->>'points_per_gbp')::numeric, 1), coalesce((p->>'active')::boolean, true))
    returning id into v_id;
  else
    update elixir.affiliate_merchants set name = coalesce(p->>'name', name), description = coalesce(p->>'description', description),
      url_template = coalesce(p->>'url_template', url_template), points_per_gbp = coalesce((p->>'points_per_gbp')::numeric, points_per_gbp),
      active = coalesce((p->>'active')::boolean, active) where id = v_id;
  end if;
  perform elixir.log_admin(v_staff, 'affiliate.merchant.save', jsonb_build_object('id', v_id));
  return v_id;
end $$;

create or replace function public.elixir_admin_record_conversion(p_merchant uuid, p_order_ref text, p_sale_gbp numeric, p_click uuid default null, p_email text default null) returns uuid
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff; v_m elixir.affiliate_merchants; v_member uuid; v_click uuid; v_id uuid;
begin
  v_staff := elixir.require_staff('admin');
  select * into v_m from elixir.affiliate_merchants where id = p_merchant;
  if not found then raise exception 'merchant not found' using errcode = '22023'; end if;
  if p_click is not null then
    select member_id, id into v_member, v_click from elixir.affiliate_clicks where id = p_click and merchant_id = p_merchant;
  elsif p_email is not null then
    select id into v_member from elixir.members where lower(email) = lower(btrim(p_email));
  end if;
  if v_member is null then raise exception 'could not find the member: give a valid click id or member email' using errcode = '22023'; end if;
  if coalesce(btrim(p_order_ref), '') = '' or coalesce(p_sale_gbp, 0) <= 0 then raise exception 'order reference and a positive sale amount are required' using errcode = '22023'; end if;
  insert into elixir.affiliate_conversions (merchant_id, member_id, click_id, order_ref, sale_gbp, points)
  values (p_merchant, v_member, v_click, btrim(p_order_ref), p_sale_gbp, floor(p_sale_gbp * v_m.points_per_gbp)::int)
  returning id into v_id;
  perform elixir.log_admin(v_staff, 'affiliate.conversion.record', jsonb_build_object('id', v_id, 'order_ref', p_order_ref));
  return v_id;
exception when unique_violation then
  raise exception 'that order has already been recorded' using errcode = '22023';
end $$;

create or replace function public.elixir_admin_set_conversion(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff; c elixir.affiliate_conversions; v_name text;
begin
  v_staff := elixir.require_staff('admin');
  if p_status not in ('confirmed', 'declined') then raise exception 'invalid status' using errcode = '22023'; end if;
  select * into c from elixir.affiliate_conversions where id = p_id for update;
  if not found then raise exception 'conversion not found' using errcode = '22023'; end if;
  if c.status <> 'pending' then raise exception 'already decided' using errcode = '22023'; end if;
  update elixir.affiliate_conversions set status = p_status, decided_at = now() where id = p_id;
  if p_status = 'confirmed' and c.points > 0 then
    select name into v_name from elixir.affiliate_merchants where id = c.merchant_id;
    insert into elixir.ledger (member_id, kind, delta, description, source_ref)
    values (c.member_id, 'earn', c.points, 'Online shopping: ' || v_name, 'affiliate:' || c.id::text);
  end if;
  perform elixir.log_admin(v_staff, 'affiliate.conversion.' || p_status, jsonb_build_object('id', p_id, 'points', c.points));
end $$;

create or replace function public.elixir_admin_conversions(p_status text default null) returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_staff('agent');
  return coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'merchant', m.name, 'member', mem.email, 'order_ref', c.order_ref,
      'sale_gbp', c.sale_gbp, 'points', c.points, 'status', c.status, 'created_at', c.created_at) order by c.created_at desc)
    from (select * from elixir.affiliate_conversions where p_status is null or status = p_status order by created_at desc limit 200) c
    join elixir.affiliate_merchants m on m.id = c.merchant_id join elixir.members mem on mem.id = c.member_id), '[]'::jsonb);
end $$;

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('elixir_affiliate_merchants', 'elixir_affiliate_click', 'elixir_admin_affiliate_merchants',
             'elixir_admin_save_affiliate_merchant', 'elixir_admin_record_conversion', 'elixir_admin_set_conversion', 'elixir_admin_conversions')
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
