import type { Metadata } from 'next';
import HomeView from '@/components/views/home';
import { getContent } from '@/lib/cms/server';
import { pageMetadata } from '@/lib/seo';
import { getProgramme } from '@/lib/programme';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const p = await getProgramme();
  const c = await getContent('home', p);
  return { ...pageMetadata(c.t('seo.title'), c.t('seo.description'), '/'), title: { absolute: c.t('seo.title') } };
}

export default async function Page() {
  const p = await getProgramme();
  const [c, site] = await Promise.all([getContent('home', p), getContent('site', p)]);
  return <HomeView p={p} c={c} site={site} />;
}
