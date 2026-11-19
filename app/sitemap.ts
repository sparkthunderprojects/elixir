import type { MetadataRoute } from 'next';
import { PUBLIC_PATHS, SITE_URL, brandPath } from '@/lib/site';
import { getProgramme } from '@/lib/programme';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const p = await getProgramme();
  const paths = [...PUBLIC_PATHS, ...p.brands.map((b) => brandPath(b.slug))];
  return paths.map((path) => ({
    url: SITE_URL + (path === '/' ? '/' : path),
    changeFrequency: path === '/' || path === '/rewards' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.8,
  }));
}
