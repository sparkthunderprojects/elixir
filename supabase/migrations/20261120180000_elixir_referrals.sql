-- Elixir referrals: invite a friend, both get a bonus after the friend's first qualifying purchase.
-- Off by default. Bonus points are funded by Elixir (no partner is billed).

alter table elixir.config
  add column if not exists referral_enabled boolean not null default false,
  add column if not exists referral_bonus_referrer integer not null default 500 check (referral_bonus_referrer >= 0),
  add column if not exists referral_bonus_referee integer not null default 500 check (referral_bonus_referee >= 0),
  add column if not exists referral_min_spend_gbp numeric(10,2) not null default 10 check (referral_min_spend_gbp >= 0),
  add column if not exists referral_max_per_member integer not null default 20 check (referral_max_per_member >= 0);

alter table elixir.members add column if not exists referral_code text;
update elixir.members set referral_code = upper(substr(md5(random()::text || id::text), 1, 8)) where referral_code is null;
alter table elixir.members alter column referral_code set default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
alter table elixir.members alter column referral_code set not null;
create unique index if not exists members_referral_code_key on elixir.members (referral_code);

create table if not exists elixir.referrals (
  referee_id uuid primary key references elixir.members(id) on delete cascade,
  referrer_id uuid not null references elixir.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  rewarded_at timestamptz,
  check (referee_id <> referrer_id)
);
create index if not exists referrals_referrer on elixir.referrals (referrer_id);
alter table elixir.referrals enable row level security;

create or replace function public.elixir_claim_referral(p_code text) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_cfg elixir.config; v_me elixir.members; v_ref elixir.members;
begin
  select * into v_cfg from elixir.config;
  if not v_cfg.referral_enabled then return jsonb_build_object('ok', false, 'reason', 'disabled'); end if;
  select * into v_me from elixir.members where user_id = auth.uid();
  if not found then raise exception 'join first' using errcode = '42501'; end if;
  select * into v_ref from elixir.members where referral_code = upper(btrim(coalesce(p_code, ''))) and status = 'active';
  if not found then return jsonb_build_object('ok', false, 'reason', 'unknown_code'); end if;
  if v_ref.id = v_me.id then return jsonb_build_object('ok', false, 'reason', 'own_code'); end if;
  if exists (select 1 from elixir.referrals where referee_id = v_me.id) then return jsonb_build_object('ok', false, 'reason', 'already_referred'); end if;
  if exists (select 1 from elixir.ledger where member_id = v_me.id and kind = 'earn' and brand_id is not null) then
    return jsonb_build_object('ok', false, 'reason', 'already_earned');
  end if;
  if (select count(*) from elixir.referrals where referrer_id = v_ref.id) >= v_cfg.referral_max_per_member then
    return jsonb_build_object('ok', false, 'reason', 'limit_reached');
  end if;
  insert into elixir.referrals (referee_id, referrer_id) values (v_me.id, v_ref.id);
  return jsonb_build_object('ok', true);
end $$;

create or replace function elixir.reward_referral() returns trigger
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_cfg elixir.config; v_r elixir.referrals;
begin
  if new.kind <> 'earn' or new.brand_id is null or coalesce(new.spend_gbp, 0) <= 0 then return null; end if;
  select * into v_cfg from elixir.config;
  if not v_cfg.referral_enabled or new.spend_gbp < v_cfg.referral_min_spend_gbp then return null; end if;
  select * into v_r from elixir.referrals where referee_id = new.member_id and rewarded_at is null for update;
  if not found then return null; end if;
  update elixir.referrals set rewarded_at = now() where referee_id = v_r.referee_id;
  if v_cfg.referral_bonus_referee > 0 then
    insert into elixir.ledger (member_id, kind, delta, description) values (v_r.referee_id, 'earn', v_cfg.referral_bonus_referee, 'Referral welcome bonus');
  end if;
  if v_cfg.referral_bonus_referrer > 0 then
    insert into elixir.ledger (member_id, kind, delta, description) values (v_r.referrer_id, 'earn', v_cfg.referral_bonus_referrer, 'Referral bonus: a friend made their first purchase');
  end if;
  return null;
end $$;
drop trigger if exists ledger_referral_reward on elixir.ledger;
create trigger ledger_referral_reward after insert on elixir.ledger for each row execute function elixir.reward_referral();

create or replace function public.elixir_my_referrals() returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
declare v_cfg elixir.config; v_me elixir.members;
begin
  select * into v_cfg from elixir.config;
  select * into v_me from elixir.members where user_id = auth.uid();
  if not found then return jsonb_build_object('enabled', v_cfg.referral_enabled, 'code', null); end if;
  return jsonb_build_object(
    'enabled', v_cfg.referral_enabled,
    'code', v_me.referral_code,
    'bonus_referrer', v_cfg.referral_bonus_referrer,
    'bonus_referee', v_cfg.referral_bonus_referee,
    'min_spend_gbp', v_cfg.referral_min_spend_gbp,
    'invited', (select count(*) from elixir.referrals where referrer_id = v_me.id),
    'rewarded', (select count(*) from elixir.referrals where referrer_id = v_me.id and rewarded_at is not null),
    'points_earned', (select count(*) from elixir.referrals where referrer_id = v_me.id and rewarded_at is not null) * v_cfg.referral_bonus_referrer);
end $$;

create or replace function public.elixir_admin_referral_settings() returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
declare v_cfg elixir.config;
begin
  perform elixir.require_staff('agent');
  select * into v_cfg from elixir.config;
  return jsonb_build_object('enabled', v_cfg.referral_enabled, 'bonus_referrer', v_cfg.referral_bonus_referrer, 'bonus_referee', v_cfg.referral_bonus_referee,
    'min_spend_gbp', v_cfg.referral_min_spend_gbp, 'max_per_member', v_cfg.referral_max_per_member,
    'total', (select count(*) from elixir.referrals), 'rewarded', (select count(*) from elixir.referrals where rewarded_at is not null));
end $$;

create or replace function public.elixir_admin_set_referral_settings(p jsonb) returns void
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff;
begin
  v_staff := elixir.require_staff('admin');
  update elixir.config set
    referral_enabled = coalesce((p->>'enabled')::boolean, referral_enabled),
    referral_bonus_referrer = coalesce((p->>'bonus_referrer')::int, referral_bonus_referrer),
    referral_bonus_referee = coalesce((p->>'bonus_referee')::int, referral_bonus_referee),
    referral_min_spend_gbp = coalesce((p->>'min_spend_gbp')::numeric, referral_min_spend_gbp),
    referral_max_per_member = coalesce((p->>'max_per_member')::int, referral_max_per_member),
    updated_at = now();
  perform elixir.log_admin(v_staff, 'referral.settings', p);
end $$;

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('elixir_claim_referral', 'elixir_my_referrals', 'elixir_admin_referral_settings', 'elixir_admin_set_referral_settings')
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
