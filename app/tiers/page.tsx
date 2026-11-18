import type { Metadata } from 'next';
import TiersView from '@/components/views/tiers';
import { getContent } from '@/lib/cms/server';
import { pageMetadata } from '@/lib/seo';
import { getProgramme } from '@/lib/programme';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const p = await getProgramme();
  const c = await getContent('tiers', p);
  return pageMetadata(c.t('seo.title'), c.t('seo.description'), '/tiers');
}

export default async function Page() {
  const p = await getProgramme();
  const [c, site] = await Promise.all([getContent('tiers', p), getContent('site', p)]);
  return <TiersView p={p} c={c} site={site} />;
}
