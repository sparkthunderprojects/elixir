-- Elixir Points: public programme info for the elixirpoints.com website.
-- One read-only function that anyone (signed in or not) may call. It returns only what
-- is already public marketing information: earn and spend rates, tiers, active rewards and
-- active brands. No member data, no stock levels, no keys, no staff.

create or replace function public.elixir_programme() returns jsonb
language sql stable security definer set search_path = elixir, pg_temp as $$
  select jsonb_build_object(
    'earn_points_per_gbp',   c.earn_points_per_gbp,
    'redeem_points_per_gbp', c.redeem_points_per_gbp,
    'tier_window_months',    c.tier_window_months,
    'tiers', coalesce((select jsonb_agg(jsonb_build_object(
        'id', t.id, 'name', t.name, 'min_spend_gbp', t.min_spend_gbp,
        'earn_multiplier', t.earn_multiplier, 'color', t.color, 'perks', t.perks)
        order by t.min_spend_gbp) from elixir.tiers t), '[]'::jsonb),
    'rewards', coalesce((select jsonb_agg(jsonb_build_object(
        'title', r.title, 'description', r.description, 'reward_type', r.reward_type,
        'value', r.value, 'point_cost', r.point_cost, 'brand', b.name)
        order by r.point_cost)
      from elixir.rewards r left join elixir.brands b on b.id = r.brand_id
      where r.active and r.archived_at is null and (r.stock is null or r.stock > 0)), '[]'::jsonb),
    'brands', coalesce((select jsonb_agg(jsonb_build_object(
        'slug', b.slug, 'name', b.name, 'brand_type', b.brand_type) order by b.name)
      from elixir.brands b where b.active), '[]'::jsonb)
  )
  from elixir.config c;
$$;

revoke all on function public.elixir_programme() from public, anon, authenticated, service_role;
grant execute on function public.elixir_programme() to anon, authenticated, service_role;
