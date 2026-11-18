import type { Metadata } from 'next';
import RewardsView from '@/components/views/rewards';
import { getContent } from '@/lib/cms/server';
import { pageMetadata } from '@/lib/seo';
import { getProgramme } from '@/lib/programme';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const p = await getProgramme();
  const c = await getContent('rewards', p);
  return pageMetadata(c.t('seo.title'), c.t('seo.description'), '/rewards');
}

export default async function Page() {
  const p = await getProgramme();
  const [c, site] = await Promise.all([getContent('rewards', p), getContent('site', p)]);
  return <RewardsView p={p} c={c} site={site} />;
}
