-- Lets a member delete their Elixir account from inside the app (an App Store and Google Play requirement).
-- The sign-in itself belongs to Sparkthunder ID and is shared with other sites, so it is NOT deleted here.
-- What is removed: the name and email on the Elixir membership, and the browsing history of shop clicks.
-- What is kept, anonymised: the points ledger, which the programme needs for its accounts. Any unspent points are forfeited.
alter table elixir.members add column if not exists deleted_at timestamptz;

create or replace function public.elixir_delete_my_account(p_confirm text) returns jsonb
language plpgsql security definer set search_path = elixir, pg_temp as $$
declare v_uid uuid := auth.uid(); v_member elixir.members; v_staff boolean;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if coalesce(btrim(p_confirm), '') <> 'DELETE' then raise exception 'Type DELETE to confirm.' using errcode = '22023'; end if;
  select * into v_member from elixir.members where user_id = v_uid and deleted_at is null for update;
  if not found then return jsonb_build_object('ok', true, 'already', true); end if;
  select exists (select 1 from elixir.staff where user_id = v_uid) or exists (select 1 from elixir.brand_users where user_id = v_uid) into v_staff;
  if v_staff then raise exception 'Staff and partner accounts cannot be deleted here. Please contact us.' using errcode = '42501'; end if;

  delete from elixir.affiliate_clicks where member_id = v_member.id;
  update elixir.members
     set user_id = null, email = 'deleted-' || id::text || '@deleted.invalid', display_name = null,
         status = 'suspended', deleted_at = now()
   where id = v_member.id;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.elixir_delete_my_account(text) from public, anon, authenticated, service_role;
grant execute on function public.elixir_delete_my_account(text) to authenticated;
