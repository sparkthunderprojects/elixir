import type { Metadata } from 'next';
import FaqView from '@/components/views/faq';
import { getContent } from '@/lib/cms/server';
import { pageMetadata } from '@/lib/seo';
import { getProgramme } from '@/lib/programme';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const p = await getProgramme();
  const c = await getContent('faq', p);
  return pageMetadata(c.t('seo.title'), c.t('seo.description'), '/faq');
}

export default async function Page() {
  const p = await getProgramme();
  const [c, site] = await Promise.all([getContent('faq', p), getContent('site', p)]);
  return <FaqView p={p} c={c} site={site} />;
}
