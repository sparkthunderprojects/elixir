-- Elixir 360: enquiries from businesses and partners, sent from the website.
-- Anyone can send one (with spam limits). Only staff can read or manage them.

create table elixir.partner_enquiries (
  id uuid primary key default gen_random_uuid(),
  company text not null check (length(btrim(company)) between 1 and 120),
  contact_name text not null check (length(btrim(contact_name)) between 1 and 120),
  email text not null check (length(email) <= 200 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  website text check (website is null or length(website) <= 200),
  interests text[] not null default '{}' check (interests <@ array['loyalty', 'insights', 'media', 'other']::text[]),
  message text not null check (length(btrim(message)) between 1 and 4000),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed')),
  notes text check (notes is null or length(notes) <= 4000),
  handled_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index partner_enquiries_recent on elixir.partner_enquiries (created_at desc);
create index partner_enquiries_status on elixir.partner_enquiries (status, created_at desc);
alter table elixir.partner_enquiries enable row level security;

-- Public: send an enquiry. At most 3 per email per day and 300 per hour overall.
create function public.elixir_submit_enquiry(p jsonb) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare
  v_company text := btrim(coalesce(p->>'company', '')); v_name text := btrim(coalesce(p->>'contact_name', ''));
  v_email text := lower(btrim(coalesce(p->>'email', ''))); v_site text := nullif(btrim(coalesce(p->>'website', '')), '');
  v_msg text := btrim(coalesce(p->>'message', '')); v_interests text[];
begin
  if length(v_company) = 0 or length(v_company) > 120 then raise exception 'Please enter your company name.' using errcode = '22023'; end if;
  if length(v_name) = 0 or length(v_name) > 120 then raise exception 'Please enter your name.' using errcode = '22023'; end if;
  if length(v_email) > 200 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Please enter a valid email address.' using errcode = '22023'; end if;
  if v_site is not null and length(v_site) > 200 then raise exception 'That website address is too long.' using errcode = '22023'; end if;
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

-- Staff: list and manage enquiries.
create function public.elixir_admin_enquiries(p_status text default null, p_limit integer default 100, p_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_staff('agent');
  return jsonb_build_object(
    'new_count', (select count(*) from elixir.partner_enquiries where status = 'new'),
    'total', (select count(*) from elixir.partner_enquiries where p_status is null or status = p_status),
    'rows', coalesce((select jsonb_agg(to_jsonb(e) order by e.created_at desc) from (
        select id, company, contact_name, email, website, interests, message, status, notes, handled_by, created_at, updated_at
          from elixir.partner_enquiries where p_status is null or status = p_status
          order by created_at desc limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)) e), '[]'::jsonb));
end $$;

create function public.elixir_admin_update_enquiry(p_id uuid, p_status text, p_notes text default null) returns void
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff;
begin
  v_staff := elixir.require_staff('agent');
  if p_status not in ('new', 'contacted', 'qualified', 'closed') then raise exception 'invalid status' using errcode = '22023'; end if;
  update elixir.partner_enquiries set status = p_status, notes = nullif(btrim(coalesce(p_notes, '')), ''),
         handled_by = v_staff.email, updated_at = now() where id = p_id;
  if not found then raise exception 'enquiry not found' using errcode = '22023'; end if;
  perform elixir.log_admin(v_staff, 'enquiry.update', jsonb_build_object('id', p_id, 'status', p_status));
end $$;

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig, p.proname
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('elixir_submit_enquiry', 'elixir_admin_enquiries', 'elixir_admin_update_enquiry')
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f.sig);
    if f.proname = 'elixir_submit_enquiry' then
      execute format('grant execute on function %s to anon, authenticated, service_role', f.sig);
    else
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
end $$;
