-- Elixir advertiser campaigns: partners submit offers, staff review and price them,
-- approved offers show to members. Fees post to the double-entry journal.

create table if not exists elixir.campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references elixir.brands(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 80),
  body text check (length(body) <= 280),
  link_url text not null check (link_url ~* '^https://'),
  starts_on date not null,
  ends_on date not null,
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected')),
  reject_reason text,
  fee_gbp numeric(12,2) not null default 0 check (fee_gbp >= 0),
  fee_status text not null default 'none' check (fee_status in ('none', 'billed', 'paid')),
  impressions integer not null default 0,
  clicks integer not null default 0,
  created_by uuid,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index if not exists campaigns_brand on elixir.campaigns (brand_id, created_at desc);
alter table elixir.campaigns enable row level security;

-- ---------- partner ----------
create or replace function public.elixir_partner_campaigns(p_brand uuid) returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_brand_user(p_brand);
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'body', body, 'link_url', link_url, 'starts_on', starts_on, 'ends_on', ends_on,
      'status', status, 'reject_reason', reject_reason, 'fee_gbp', fee_gbp, 'fee_status', fee_status, 'impressions', impressions, 'clicks', clicks) order by created_at desc)
    from elixir.campaigns where brand_id = p_brand), '[]'::jsonb);
end $$;

create or replace function public.elixir_partner_save_campaign(p_brand uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_u elixir.brand_users; v_id uuid := nullif(p->>'id', '')::uuid; c elixir.campaigns;
begin
  v_u := elixir.require_brand_user(p_brand, true);
  if v_id is null then
    insert into elixir.campaigns (brand_id, title, body, link_url, starts_on, ends_on, created_by)
    values (p_brand, p->>'title', p->>'body', p->>'link_url', (p->>'starts_on')::date, (p->>'ends_on')::date, v_u.user_id) returning id into v_id;
  else
    select * into c from elixir.campaigns where id = v_id and brand_id = p_brand for update;
    if not found then raise exception 'campaign not found' using errcode = '22023'; end if;
    if c.status not in ('draft', 'rejected') then raise exception 'only drafts can be edited' using errcode = '22023'; end if;
    update elixir.campaigns set title = coalesce(p->>'title', title), body = coalesce(p->>'body', body), link_url = coalesce(p->>'link_url', link_url),
      starts_on = coalesce((p->>'starts_on')::date, starts_on), ends_on = coalesce((p->>'ends_on')::date, ends_on), status = 'draft', reject_reason = null where id = v_id;
  end if;
  return v_id;
end $$;

create or replace function public.elixir_partner_submit_campaign(p_brand uuid, p_id uuid) returns void
language plpgsql security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_brand_user(p_brand, true);
  update elixir.campaigns set status = 'pending' where id = p_id and brand_id = p_brand and status = 'draft';
  if not found then raise exception 'only drafts can be submitted' using errcode = '22023'; end if;
end $$;

-- ---------- staff ----------
create or replace function public.elixir_admin_campaigns(p_status text default null) returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_staff('agent');
  return coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'brand', b.name, 'title', c.title, 'body', c.body, 'link_url', c.link_url,
      'starts_on', c.starts_on, 'ends_on', c.ends_on, 'status', c.status, 'fee_gbp', c.fee_gbp, 'fee_status', c.fee_status,
      'impressions', c.impressions, 'clicks', c.clicks) order by (c.status = 'pending') desc, c.created_at desc)
    from elixir.campaigns c join elixir.brands b on b.id = c.brand_id where c.status <> 'draft' and (p_status is null or c.status = p_status)), '[]'::jsonb);
end $$;

create or replace function public.elixir_admin_review_campaign(p_id uuid, p_decision text, p_fee numeric default 0, p_reason text default null) returns void
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff;
begin
  v_staff := elixir.require_staff('admin');
  if p_decision not in ('approved', 'rejected') then raise exception 'invalid decision' using errcode = '22023'; end if;
  if p_decision = 'rejected' and coalesce(btrim(p_reason), '') = '' then raise exception 'give a reason so the partner can fix it' using errcode = '22023'; end if;
  update elixir.campaigns set status = p_decision, fee_gbp = case when p_decision = 'approved' then greatest(coalesce(p_fee, 0), 0) else 0 end,
    reject_reason = case when p_decision = 'rejected' then btrim(p_reason) else null end where id = p_id and status = 'pending';
  if not found then raise exception 'only pending campaigns can be reviewed' using errcode = '22023'; end if;
  perform elixir.log_admin(v_staff, 'campaign.' || p_decision, jsonb_build_object('id', p_id, 'fee_gbp', p_fee));
end $$;

create or replace function public.elixir_admin_bill_campaign(p_id uuid) returns void
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff; c elixir.campaigns;
begin
  v_staff := elixir.require_staff('admin');
  select * into c from elixir.campaigns where id = p_id for update;
  if not found or c.status <> 'approved' or c.fee_status <> 'none' or c.fee_gbp <= 0 then raise exception 'nothing to bill' using errcode = '22023'; end if;
  perform elixir.post_journal('campaign.bill', c.id::text, 'Campaign: ' || c.title, v_staff.user_id,
    elixir.partner_account(c.brand_id), (select id from elixir.accounts where code = '4000'), c.fee_gbp);
  update elixir.campaigns set fee_status = 'billed' where id = p_id;
  perform elixir.log_admin(v_staff, 'campaign.bill', jsonb_build_object('id', p_id, 'fee_gbp', c.fee_gbp));
end $$;

create or replace function public.elixir_admin_campaign_paid(p_id uuid) returns void
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff; c elixir.campaigns;
begin
  v_staff := elixir.require_staff('admin');
  select * into c from elixir.campaigns where id = p_id for update;
  if not found or c.fee_status <> 'billed' then raise exception 'only billed campaigns can be marked paid' using errcode = '22023'; end if;
  perform elixir.post_journal('campaign.paid', c.id::text, 'Payment received', v_staff.user_id,
    (select id from elixir.accounts where code = '1000'), elixir.partner_account(c.brand_id), c.fee_gbp);
  update elixir.campaigns set fee_status = 'paid' where id = p_id;
  perform elixir.log_admin(v_staff, 'campaign.paid', jsonb_build_object('id', p_id));
end $$;

-- ---------- members ----------
create or replace function public.elixir_offers() returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_ids uuid[]; v_out jsonb;
begin
  select coalesce(array_agg(c.id), '{}') into v_ids from elixir.campaigns c join elixir.brands b on b.id = c.brand_id
   where c.status = 'approved' and b.active and current_date between c.starts_on and c.ends_on;
  update elixir.campaigns set impressions = impressions + 1 where id = any(v_ids);
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'brand', b.name, 'title', c.title, 'body', c.body) order by c.starts_on desc), '[]'::jsonb) into v_out
    from elixir.campaigns c join elixir.brands b on b.id = c.brand_id where c.id = any(v_ids);
  return v_out;
end $$;

create or replace function public.elixir_offer_click(p_id uuid) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare c elixir.campaigns;
begin
  select c0.* into c from elixir.campaigns c0 join elixir.brands b on b.id = c0.brand_id
   where c0.id = p_id and c0.status = 'approved' and b.active and current_date between c0.starts_on and c0.ends_on;
  if not found then raise exception 'offer not available' using errcode = '22023'; end if;
  update elixir.campaigns set clicks = clicks + 1 where id = p_id;
  return jsonb_build_object('url', c.link_url);
end $$;

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('elixir_partner_campaigns', 'elixir_partner_save_campaign', 'elixir_partner_submit_campaign',
             'elixir_admin_campaigns', 'elixir_admin_review_campaign', 'elixir_admin_bill_campaign', 'elixir_admin_campaign_paid', 'elixir_offers', 'elixir_offer_click')
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
