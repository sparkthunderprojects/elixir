# Elixir Points

The rewards programme site for the Sparkthunder family of brands (elixirpoints.com).

- `/` public home page, `/login` and `/signup` for members
- `/admin` staff dashboard (members, adjustments, rewards, brands and keys, settings)
- Data lives in the `elixir` schema of the My Sparkthunder Supabase project and is reached only through `public.elixir_*` database functions
- `supabase/migrations` holds the database setup; `docs/elixir-move-to-own-supabase.md` explains moving Elixir to its own project

Settings are optional environment variables (see `.env.example`). With none set it uses the My Sparkthunder project.
