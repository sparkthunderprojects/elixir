# Elixir Points

The rewards programme site for the Sparkthunder family of brands (elixirpoints.com).

- Public, server-rendered, SEO-optimised pages: `/`, `/how-it-works`, `/tiers`, `/rewards`, `/brands`, `/faq` (live data via `public.elixir_programme()`, refreshed every 5 minutes; sitemap, robots, structured data and social image included)
- `/login` and `/signup` for members
- `/admin` staff dashboard (members, adjustments, rewards, brands and keys, settings)
- Data lives in the `elixir` schema of the My Sparkthunder Supabase project and is reached only through `public.elixir_*` database functions
- `supabase/migrations` holds the database setup; `docs/elixir-move-to-own-supabase.md` explains moving Elixir to its own project

Settings are optional environment variables (see `.env.example`). With none set it uses the My Sparkthunder project.
