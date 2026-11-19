import type { Metadata } from 'next';
import { VIEWS } from '@/components/views';
import { getContent } from '@/lib/cms/server';
import { pageMetadata } from '@/lib/seo';
import { getProgramme } from '@/lib/programme';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const p = await getProgramme();
  const c = await getContent('business-loyalty', p);
  return pageMetadata(c.t('seo.title'), c.t('seo.description'), '/business/loyalty');
}

export default async function Page() {
  const p = await getProgramme();
  const [c, site] = await Promise.all([getContent('business-loyalty', p), getContent('site', p)]);
  const View = VIEWS['business-loyalty'];
  return <View p={p} c={c} site={site} />;
}
