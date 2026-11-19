import type { Metadata } from 'next';
import BrandsView from '@/components/views/brands';
import { getContent } from '@/lib/cms/server';
import { pageMetadata } from '@/lib/seo';
import { getProgramme } from '@/lib/programme';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const p = await getProgramme();
  const c = await getContent('brands', p);
  return pageMetadata(c.t('seo.title'), c.t('seo.description'), '/brands');
}

export default async function Page() {
  const p = await getProgramme();
  const [c, site] = await Promise.all([getContent('brands', p), getContent('site', p)]);
  return <BrandsView p={p} c={c} site={site} />;
}
