import { getElixirClient } from '@/lib/elixir-client';
import { SUPABASE_URL } from '@/lib/config';

export interface CmsPageRow { slug: string; title: string; has_changes: boolean; never_published: boolean; draft_updated_at: string; draft_updated_by: string | null; published_at: string | null; published_by: string | null }
export interface CmsPage extends CmsPageRow { draft: Record<string, unknown>; published: Record<string, unknown> | null }
export interface CmsRevision { id: number; kind: 'import' | 'publish' | 'restore'; note: string | null; created_at: string; created_by: string | null }
export interface MediaRow { id: string; path: string; url: string; name: string; alt: string; width: number | null; height: number | null; bytes: number | null; mime: string | null; builtin: boolean; created_at: string }

export const MEDIA_BUCKET = 'elixir-media';

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await getElixirClient().rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const cms = {
  pages: () => rpc<CmsPageRow[]>('elixir_cms_pages'),
  get: (slug: string) => rpc<CmsPage | null>('elixir_cms_get', { p_slug: slug }),
  save: (slug: string, title: string, content: Record<string, unknown>) => rpc<{ saved_at: string }>('elixir_cms_save', { p_slug: slug, p_title: title, p_content: content }),
  publish: (slug: string, note?: string, kind: 'publish' | 'import' = 'publish') => rpc<{ published_at: string }>('elixir_cms_publish', { p_slug: slug, p_note: note ?? null, p_kind: kind }),
  discard: (slug: string) => rpc<void>('elixir_cms_discard', { p_slug: slug }),
  revisions: (slug: string) => rpc<CmsRevision[]>('elixir_cms_revisions', { p_slug: slug }),
  restore: (id: number) => rpc<{ slug: string }>('elixir_cms_restore', { p_revision: id }),
  media: () => rpc<MediaRow[]>('elixir_cms_media_list'),
  mediaUpdate: (id: string, name: string, alt: string) => rpc<void>('elixir_cms_media_update', { p_id: id, p_name: name, p_alt: alt }),
  async mediaDelete(id: string) {
    const r = await rpc<{ path: string | null }>('elixir_cms_media_delete', { p_id: id });
    if (r.path && !r.path.startsWith('/')) await getElixirClient().storage.from(MEDIA_BUCKET).remove([r.path]);
  },
  addBuiltinImage: (img: { path: string; url: string; name: string; alt: string; width: number; height: number }) => rpc<{ id: string }>('elixir_cms_media_add', { p: { ...img, builtin: true, mime: 'image/png' } }),
  /** Tells the live site to show the newly published content straight away. */
  async refreshSite() {
    try { await fetch('/api/cms/revalidate', { method: 'POST' }); } catch { /* the site refreshes itself within five minutes anyway */ }
  },
};

function imageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { resolve({ width: 0, height: 0 }); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

const safeName = (n: string) => n.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'image';

/** Uploads an image to storage and adds it to the media library. */
export async function uploadImage(file: File): Promise<MediaRow> {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image`);
  if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} is over 10 MB`);
  const { width, height } = file.type === 'image/svg+xml' ? { width: 0, height: 0 } : await imageSize(file);
  const ext = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] ?? file.type.split('/')[1] ?? 'png').toLowerCase().replace('jpeg', 'jpg').replace('svg+xml', 'svg');
  const path = `uploads/${new Date().getFullYear()}/${crypto.randomUUID().slice(0, 8)}-${safeName(file.name)}.${ext}`;
  const supabase = getElixirClient();
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) throw new Error(error.message.includes('Bucket not found') ? 'Image storage is not set up yet. Run the CMS SQL once in Supabase.' : error.message);
  const url = `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
  const { id } = await rpc<{ id: string }>('elixir_cms_media_add', { p: { path, url, name: file.name, width, height, bytes: file.size, mime: file.type } });
  return { id, path, url, name: file.name, alt: '', width, height, bytes: file.size, mime: file.type, builtin: false, created_at: new Date().toISOString() };
}
