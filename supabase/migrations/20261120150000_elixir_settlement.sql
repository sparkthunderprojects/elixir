-- Elixir settlement: double-entry journal + partner funding statements.
-- Partners fund the points their customers earn; we bill that at the redeem value per period.

create table if not exists elixir.accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  kind text not null check (kind in ('asset', 'liability', 'income', 'expense')),
  brand_id uuid references elixir.brands(id)
);
alter table elixir.accounts enable row level security;

create table if not exists elixir.journal (
  id bigint generated always as identity primary key,
  kind text not null,
  ref text,
  memo text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create table if not exists elixir.journal_lines (
  id bigint generated always as identity primary key,
  journal_id bigint not null references elixir.journal(id),
  account_id uuid not null references elixir.accounts(id),
  debit numeric(14,2) not null default 0 check (debit >= 0),
  credit numeric(14,2) not null default 0 check (credit >= 0),
  check ((debit = 0) <> (credit = 0))
);
create index if not exists journal_lines_account on elixir.journal_lines (account_id);
alter table elixir.journal enable row level security;
alter table elixir.journal_lines enable row level security;

create or replace function elixir.block_journal_changes() returns trigger language plpgsql as $$
begin raise exception 'journal is append-only' using errcode = '42501'; end $$;
drop trigger if exists journal_immutable on elixir.journal;
create trigger journal_immutable before update or delete on elixir.journal for each row execute function elixir.block_journal_changes();
drop trigger if exists journal_lines_immutable on elixir.journal_lines;
create trigger journal_lines_immutable before update or delete on elixir.journal_lines for each row execute function elixir.block_journal_changes();

-- every journal must balance when the transaction commits
create or replace function elixir.check_journal_balanced() returns trigger language plpgsql as $$
declare v_d numeric; v_c numeric;
begin
  select coalesce(sum(debit), 0), coalesce(sum(credit), 0) into v_d, v_c from elixir.journal_lines where journal_id = new.journal_id;
  if v_d <> v_c then raise exception 'journal % does not balance (% vs %)', new.journal_id, v_d, v_c using errcode = '23514'; end if;
  return null;
end $$;
drop trigger if exists journal_balanced on elixir.journal_lines;
create constraint trigger journal_balanced after insert on elixir.journal_lines deferrable initially deferred
  for each row execute function elixir.check_journal_balanced();

insert into elixir.accounts (code, name, kind) values
  ('1000', 'Cash', 'asset'),
  ('2100', 'Points funded by partners', 'liability'),
  ('4000', 'Programme income', 'income')
on conflict (code) do nothing;

create or replace function elixir.partner_account(p_brand uuid) returns uuid
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_id uuid; v_name text;
begin
  select id into v_id from elixir.accounts where brand_id = p_brand and kind = 'asset';
  if v_id is null then
    select name into v_name from elixir.brands where id = p_brand;
    insert into elixir.accounts (code, name, kind, brand_id) values ('1200-' || left(p_brand::text, 8), 'Receivable: ' || v_name, 'asset', p_brand) returning id into v_id;
  end if;
  return v_id;
end $$;

create table if not exists elixir.settlements (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references elixir.brands(id),
  period_start date not null,
  period_end date not null,
  points_funded bigint not null,
  redeem_points_per_gbp numeric not null,
  amount_gbp numeric(14,2) not null,
  status text not null default 'draft' check (status in ('draft', 'issued', 'paid')),
  issue_journal bigint references elixir.journal(id),
  paid_journal bigint references elixir.journal(id),
  created_at timestamptz not null default now(),
  issued_at timestamptz,
  paid_at timestamptz,
  check (period_end >= period_start),
  unique (brand_id, period_start, period_end)
);
alter table elixir.settlements enable row level security;

create or replace function elixir.post_journal(p_kind text, p_ref text, p_memo text, p_by uuid, p_debit uuid, p_credit uuid, p_amount numeric) returns bigint
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_id bigint;
begin
  insert into elixir.journal (kind, ref, memo, created_by) values (p_kind, p_ref, p_memo, p_by) returning id into v_id;
  insert into elixir.journal_lines (journal_id, account_id, debit) values (v_id, p_debit, p_amount);
  insert into elixir.journal_lines (journal_id, account_id, credit) values (v_id, p_credit, p_amount);
  return v_id;
end $$;

create or replace function public.elixir_admin_generate_settlements(p_from date, p_to date) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff; v_cfg elixir.config; r record; v_n int := 0;
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
    insert into elixir.settlements (brand_id, period_start, period_end, points_funded, redeem_points_per_gbp, amount_gbp)
    values (r.brand_id, p_from, p_to, r.pts, v_cfg.redeem_points_per_gbp, round(r.pts::numeric / v_cfg.redeem_points_per_gbp, 2))
    on conflict (brand_id, period_start, period_end) do nothing;
    if found then v_n := v_n + 1; end if;
  end loop;
  perform elixir.log_admin(v_staff, 'settlement.generate', jsonb_build_object('from', p_from, 'to', p_to, 'created', v_n));
  return jsonb_build_object('created', v_n);
end $$;

create or replace function public.elixir_admin_settlements(p_status text default null) returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_staff('admin');
  return coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'brand', b.name, 'period_start', s.period_start, 'period_end', s.period_end,
      'points_funded', s.points_funded, 'amount_gbp', s.amount_gbp, 'status', s.status, 'issued_at', s.issued_at, 'paid_at', s.paid_at) order by s.created_at desc)
    from elixir.settlements s join elixir.brands b on b.id = s.brand_id where p_status is null or s.status = p_status), '[]'::jsonb);
end $$;

create or replace function public.elixir_admin_issue_settlement(p_id uuid) returns void
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff; s elixir.settlements; v_j bigint;
begin
  v_staff := elixir.require_staff('admin');
  select * into s from elixir.settlements where id = p_id for update;
  if not found then raise exception 'settlement not found' using errcode = '22023'; end if;
  if s.status <> 'draft' then raise exception 'only draft statements can be issued' using errcode = '22023'; end if;
  -- Dr partner receivable, Cr points funded by partners
  v_j := elixir.post_journal('settlement.issue', s.id::text, 'Points funding ' || s.period_start || ' to ' || s.period_end, v_staff.user_id,
           elixir.partner_account(s.brand_id), (select id from elixir.accounts where code = '2100'), s.amount_gbp);
  update elixir.settlements set status = 'issued', issued_at = now(), issue_journal = v_j where id = p_id;
  perform elixir.log_admin(v_staff, 'settlement.issue', jsonb_build_object('id', p_id, 'amount_gbp', s.amount_gbp));
end $$;

create or replace function public.elixir_admin_mark_settlement_paid(p_id uuid) returns void
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff; s elixir.settlements; v_j bigint;
begin
  v_staff := elixir.require_staff('admin');
  select * into s from elixir.settlements where id = p_id for update;
  if not found then raise exception 'settlement not found' using errcode = '22023'; end if;
  if s.status <> 'issued' then raise exception 'only issued statements can be marked paid' using errcode = '22023'; end if;
  -- Dr cash, Cr partner receivable
  v_j := elixir.post_journal('settlement.paid', s.id::text, 'Payment received', v_staff.user_id,
           (select id from elixir.accounts where code = '1000'), elixir.partner_account(s.brand_id), s.amount_gbp);
  update elixir.settlements set status = 'paid', paid_at = now(), paid_journal = v_j where id = p_id;
  perform elixir.log_admin(v_staff, 'settlement.paid', jsonb_build_object('id', p_id, 'amount_gbp', s.amount_gbp));
end $$;

create or replace function public.elixir_admin_trial_balance() returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_staff('admin');
  return coalesce((select jsonb_agg(jsonb_build_object('code', a.code, 'name', a.name, 'kind', a.kind,
      'debit', coalesce(t.d, 0), 'credit', coalesce(t.c, 0)) order by a.code)
    from elixir.accounts a left join (select account_id, sum(debit) d, sum(credit) c from elixir.journal_lines group by 1) t on t.account_id = a.id), '[]'::jsonb);
end $$;

create or replace function public.elixir_partner_settlements(p_brand uuid) returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_brand_user(p_brand);
  return coalesce((select jsonb_agg(jsonb_build_object('period_start', period_start, 'period_end', period_end, 'points_funded', points_funded,
      'amount_gbp', amount_gbp, 'status', status, 'issued_at', issued_at, 'paid_at', paid_at) order by period_start desc)
    from elixir.settlements where brand_id = p_brand and status <> 'draft'), '[]'::jsonb);
end $$;

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('elixir_admin_generate_settlements', 'elixir_admin_settlements', 'elixir_admin_issue_settlement',
             'elixir_admin_mark_settlement_paid', 'elixir_admin_trial_balance', 'elixir_partner_settlements')
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
