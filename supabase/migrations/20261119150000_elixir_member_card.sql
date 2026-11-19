-- Elixir member card: every member gets a card number for the wallet page and QR/barcode.
-- The number only identifies a card. It is not a password and cannot be used to spend points.

create sequence elixir.card_seq start 10000001;

alter table elixir.members add column card_no text;
update elixir.members set card_no = 'ELX-' || nextval('elixir.card_seq')::text || '-' || upper(substr(md5(random()::text || id::text), 1, 4)) where card_no is null;
alter table elixir.members alter column card_no set default ('ELX-' || nextval('elixir.card_seq')::text || '-' || upper(substr(md5(random()::text), 1, 4)));
alter table elixir.members alter column card_no set not null;
alter table elixir.members add constraint members_card_no_key unique (card_no);

-- elixir_me now also returns the card, name and join date for the wallet page.
create or replace function public.elixir_me() returns jsonb
language plpgsql stable security definer set search_path = elixir, pg_temp as $$
declare
  v_uid uuid := auth.uid(); v_member elixir.members; v_spend numeric; v_tier elixir.tiers; v_next elixir.tiers; v_cfg elixir.config;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select * into v_member from elixir.members where user_id = v_uid;
  if not found then return jsonb_build_object('enrolled', false); end if;
  select * into v_cfg from elixir.config;
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
