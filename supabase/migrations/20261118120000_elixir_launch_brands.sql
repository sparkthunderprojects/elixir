-- Elixir Points: the four launch brands. Safe to run more than once.
insert into elixir.brands (slug, name, brand_type, active) values
  ('sparkthunder-shop', 'Sparkthunder Shop', 'owned', true),
  ('knightverge',       'Knightverge',       'owned', true),
  ('roll-combat',       'Roll Combat',       'owned', true),
  ('miss-petty',        'Miss Petty',        'owned', true)
on conflict (slug) do update set name = excluded.name, active = true;
