# Elixir Points

The rewards programme site for the Sparkthunder family of brands (elixirpoints.com).

- Public, server-rendered, SEO-optimised pages: `/`, `/how-it-works`, `/tiers`, `/rewards`, `/brands`, `/faq` (live data via `public.elixir_programme()`, refreshed every 5 minutes; sitemap, robots, structured data and social image included)
- `/login` and `/signup` for members
- `/admin` staff dashboard (members, adjustments, rewards, brands and keys, settings)
- Data lives in the `elixir` schema of the My Sparkthunder Supabase project and is reached only through `public.elixir_*` database functions
- `supabase/migrations` holds the database setup; `docs/elixir-move-to-own-supabase.md` explains moving Elixir to its own project

Settings are optional environment variables (see `.env.example`). With none set it uses the My Sparkthunder project.

## Website content (CMS)

All the text and images on the public site are edited at `/admin/content` (staff sign-in, same as the dashboard).

- Every page and section lists its editable fields in `lib/cms/schema.ts`, with the launch wording as defaults.
- Staff edit a **draft** (autosaved), see it in a live preview (desktop, tablet, phone), and an **admin publishes** it. Every publish is kept in History and can be restored.
- Text can include live values such as `{earn}` and `{redeem}`; the site fills in the current numbers.
- Pictures are uploaded to the `elixir-media` storage bucket and picked from the Image library.
- The first time an admin opens the page, the current site content is moved into the database automatically.
- Set up once by running `supabase/migrations/20261118150000_elixir_cms.sql`.
- To add a new editable field or page, add it to `lib/cms/schema.ts` and read it with `c.t('group.field')`. Nothing else is needed.
