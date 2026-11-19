import type { Metadata } from 'next';
import HowItWorksView from '@/components/views/how-it-works';
import { getContent } from '@/lib/cms/server';
import { pageMetadata } from '@/lib/seo';
import { getProgramme } from '@/lib/programme';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const p = await getProgramme();
  const c = await getContent('how-it-works', p);
  return pageMetadata(c.t('seo.title'), c.t('seo.description'), '/how-it-works');
}

export default async function Page() {
  const p = await getProgramme();
  const [c, site] = await Promise.all([getContent('how-it-works', p), getContent('site', p)]);
  return <HowItWorksView p={p} c={c} site={site} />;
}
