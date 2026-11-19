import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';
import { createServerSupabase } from '@/lib/supabase/server';
import { buildVars, makeContent, type Content } from '@/lib/cms/resolve';
import type { Programme } from '@/lib/programme';

type Stored = Record<string, Record<string, unknown>>;

/** Published content of every page, in one cached request. Never throws: falls back to launch wording. */
async function getPublished(): Promise<Stored> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/elixir_cms_published`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
      body: '{}',
      next: { revalidate: 300, tags: ['cms'] },
    });
    if (!res.ok) return {};
    const data = (await res.json()) as Stored;
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

/** The live content of a page, ready to read with c.t('group.field'). */
export async function getContent(slug: string, p: Programme): Promise<Content> {
  const all = await getPublished();
  return makeContent(slug, all[slug], buildVars(p));
}

/** The unpublished draft of a page, for staff previews. Throws if the visitor is not staff. */
export async function getDraftContent(slug: string, p: Programme): Promise<Content> {
  const { data, error } = await (await createServerSupabase()).rpc('elixir_cms_get', { p_slug: slug });
  if (error) throw new Error(error.message);
  const draft = (data as { draft?: Record<string, unknown> } | null)?.draft;
  return makeContent(slug, draft, buildVars(p));
}
