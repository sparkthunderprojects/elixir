-- Elixir Points: content management for the public website.
-- Every page of the site keeps its text and images here. Staff edit a DRAFT, preview it on the real
-- site, then an admin PUBLISHES it. Every publish is kept as a version that can be restored.
-- Images are stored in the 'elixir-media' storage bucket and listed in the media library.
-- Safe to run more than once.

create table if not exists elixir.cms_pages (
  slug               text primary key,
  title              text not null,
  draft              jsonb not null default '{}'::jsonb,
  published          jsonb,
  draft_updated_at   timestamptz not null default now(),
  draft_updated_by   text,
  published_at       timestamptz,
  published_by       text
);

create table if not exists elixir.cms_revisions (
  id          bigint generated always as identity primary key,
  slug        text not null references elixir.cms_pages(slug) on delete cascade,
  content     jsonb not null,
  kind        text not null check (kind in ('import', 'publish', 'restore')),
  note        text,
  created_at  timestamptz not null default now(),
  created_by  text
);
create index if not exists cms_revisions_slug_idx on elixir.cms_revisions (slug, id desc);

create table if not exists elixir.cms_media (
  id          uuid primary key default gen_random_uuid(),
  path        text not null unique,
  url         text not null,
  name        text not null,
  alt         text not null default '',
  width       integer,
  height      integer,
  bytes       bigint,
  mime        text,
  builtin     boolean not null default false,
  created_at  timestamptz not null default now(),
  created_by  text
);

alter table elixir.cms_pages     enable row level security;
alter table elixir.cms_revisions enable row level security;
alter table elixir.cms_media     enable row level security;

-- ---------------------------------------------------------------------------
-- Public: the published content of every page (read-only, marketing text only)
-- ---------------------------------------------------------------------------

create or replace function public.elixir_cms_published() returns jsonb
language sql stable security definer set search_path = elixir, pg_temp as $$
  select coalesce(jsonb_object_agg(slug, published), '{}'::jsonb)
  from elixir.cms_pages where published is not null;
$$;

-- Used by storage policies: is the caller Elixir staff?
create or replace function public.elixir_is_staff() returns boolean
language sql stable security definer set search_path = elixir, pg_temp as $$
  select exists (select 1 from elixir.staff where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Staff: pages
-- ---------------------------------------------------------------------------

create or replace function public.elixir_cms_pages() returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_staff('agent');
  return coalesce((select jsonb_agg(jsonb_build_object(
      'slug', p.slug, 'title', p.title,
      'has_changes', p.published is distinct from p.draft,
      'never_published', p.published is null,
      'draft_updated_at', p.draft_updated_at, 'draft_updated_by', p.draft_updated_by,
      'published_at', p.published_at, 'published_by', p.published_by) order by p.slug)
    from elixir.cms_pages p), '[]'::jsonb);
end $$;

create or replace function public.elixir_cms_get(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
declare v elixir.cms_pages;
begin
  perform elixir.require_staff('agent');
  select * into v from elixir.cms_pages where slug = p_slug;
  if not found then return 'null'::jsonb; end if;
  return jsonb_build_object('slug', v.slug, 'title', v.title, 'draft', v.draft, 'published', v.published,
    'has_changes', v.published is distinct from v.draft,
    'draft_updated_at', v.draft_updated_at, 'draft_updated_by', v.draft_updated_by,
    'published_at', v.published_at, 'published_by', v.published_by);
end $$;

-- Save the draft. Creates the page the first time.
create or replace function public.elixir_cms_save(p_slug text, p_title text, p_content jsonb) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff;
begin
  v_staff := elixir.require_staff('agent');
  if p_slug is null or p_slug !~ '^[a-z0-9-]{1,60}$' then raise exception 'Invalid page name'; end if;
  if jsonb_typeof(p_content) <> 'object' then raise exception 'Content must be an object'; end if;
  insert into elixir.cms_pages (slug, title, draft, draft_updated_at, draft_updated_by)
  values (p_slug, coalesce(nullif(trim(p_title), ''), p_slug), p_content, now(), v_staff.email)
  on conflict (slug) do update
    set draft = excluded.draft, title = coalesce(nullif(trim(p_title), ''), elixir.cms_pages.title),
        draft_updated_at = now(), draft_updated_by = v_staff.email;
  return jsonb_build_object('saved_at', now());
end $$;

-- Publish the draft (admins only) and keep a version.
create or replace function public.elixir_cms_publish(p_slug text, p_note text default null, p_kind text default 'publish') returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff; v elixir.cms_pages;
begin
  v_staff := elixir.require_staff('admin');
  if p_kind not in ('publish', 'import') then raise exception 'Invalid kind'; end if;
  select * into v from elixir.cms_pages where slug = p_slug for update;
  if not found then raise exception 'Page not found'; end if;
  update elixir.cms_pages set published = draft, published_at = now(), published_by = v_staff.email where slug = p_slug;
  insert into elixir.cms_revisions (slug, content, kind, note, created_by)
  values (p_slug, v.draft, p_kind, nullif(trim(p_note), ''), v_staff.email);
  perform elixir.log_admin(v_staff, 'cms.' || p_kind, jsonb_build_object('slug', p_slug));
  return jsonb_build_object('published_at', now());
end $$;

-- Throw away unpublished changes.
create or replace function public.elixir_cms_discard(p_slug text) returns void
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff;
begin
  v_staff := elixir.require_staff('admin');
  update elixir.cms_pages set draft = published, draft_updated_at = now(), draft_updated_by = v_staff.email
  where slug = p_slug and published is not null;
  perform elixir.log_admin(v_staff, 'cms.discard', jsonb_build_object('slug', p_slug));
end $$;

create or replace function public.elixir_cms_revisions(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_staff('agent');
  return coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'kind', r.kind, 'note', r.note,
      'created_at', r.created_at, 'created_by', r.created_by) order by r.id desc)
    from (select * from elixir.cms_revisions where slug = p_slug order by id desc limit 50) r), '[]'::jsonb);
end $$;

-- Load an older version into the draft (it is not live until published).
create or replace function public.elixir_cms_restore(p_revision bigint) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff; v elixir.cms_revisions;
begin
  v_staff := elixir.require_staff('admin');
  select * into v from elixir.cms_revisions where id = p_revision;
  if not found then raise exception 'Version not found'; end if;
  update elixir.cms_pages set draft = v.content, draft_updated_at = now(), draft_updated_by = v_staff.email where slug = v.slug;
  perform elixir.log_admin(v_staff, 'cms.restore', jsonb_build_object('slug', v.slug, 'revision', p_revision));
  return jsonb_build_object('slug', v.slug);
end $$;

-- ---------------------------------------------------------------------------
-- Staff: media library
-- ---------------------------------------------------------------------------

create or replace function public.elixir_cms_media_list() returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_staff('agent');
  return coalesce((select jsonb_agg(to_jsonb(m) order by m.builtin, m.created_at desc) from elixir.cms_media m), '[]'::jsonb);
end $$;

create or replace function public.elixir_cms_media_add(p jsonb) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff; v_id uuid;
begin
  v_staff := elixir.require_staff('agent');
  insert into elixir.cms_media (path, url, name, alt, width, height, bytes, mime, builtin, created_by)
  values (p->>'path', p->>'url', coalesce(nullif(p->>'name', ''), p->>'path'), coalesce(p->>'alt', ''),
          nullif(p->>'width', '')::int, nullif(p->>'height', '')::int, nullif(p->>'bytes', '')::bigint, p->>'mime',
          coalesce((p->>'builtin')::boolean, false) and v_staff.role = 'admin', v_staff.email)
  on conflict (path) do update set url = excluded.url, name = excluded.name
  returning id into v_id;
  return jsonb_build_object('id', v_id);
end $$;

create or replace function public.elixir_cms_media_update(p_id uuid, p_name text, p_alt text) returns void
language plpgsql security definer set search_path = elixir, pg_temp as $$
begin
  perform elixir.require_staff('agent');
  update elixir.cms_media set name = coalesce(nullif(trim(p_name), ''), name), alt = coalesce(p_alt, alt) where id = p_id;
end $$;

-- Removes the library entry and returns its storage path so the app can delete the file.
create or replace function public.elixir_cms_media_delete(p_id uuid) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_staff elixir.staff; v elixir.cms_media;
begin
  v_staff := elixir.require_staff('admin');
  select * into v from elixir.cms_media where id = p_id;
  if not found then return jsonb_build_object('path', null); end if;
  if v.builtin then raise exception 'Built-in images cannot be deleted'; end if;
  delete from elixir.cms_media where id = p_id;
  perform elixir.log_admin(v_staff, 'cms.media_delete', jsonb_build_object('path', v.path));
  return jsonb_build_object('path', v.path);
end $$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and (p.proname like 'elixir\_cms\_%' or p.proname = 'elixir_is_staff')
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f.sig);
    if f.proname = 'elixir_cms_published' then
      execute format('grant execute on function %s to anon, authenticated, service_role', f.sig);
    else
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Image storage (public bucket; only staff can add, change or remove files)
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('elixir-media', 'elixir-media', true, 10485760,
            array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'])
    on conflict (id) do update set public = true;

    drop policy if exists elixir_media_staff_insert on storage.objects;
    drop policy if exists elixir_media_staff_update on storage.objects;
    drop policy if exists elixir_media_staff_delete on storage.objects;
    create policy elixir_media_staff_insert on storage.objects for insert to authenticated
      with check (bucket_id = 'elixir-media' and public.elixir_is_staff());
    create policy elixir_media_staff_update on storage.objects for update to authenticated
      using (bucket_id = 'elixir-media' and public.elixir_is_staff());
    create policy elixir_media_staff_delete on storage.objects for delete to authenticated
      using (bucket_id = 'elixir-media' and public.elixir_is_staff());
  end if;
end $$;
