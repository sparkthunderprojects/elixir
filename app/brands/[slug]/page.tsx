import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BrandDetailView from '@/components/views/brand-detail';
import { getContent } from '@/lib/cms/server';
import { pageMetadata } from '@/lib/seo';
import { getProgramme } from '@/lib/programme';
import { brandPath } from '@/lib/site';

export const revalidate = 300;

export async function generateStaticParams() {
  const p = await getProgramme();
  return p.brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getProgramme();
  const brand = p.brands.find((b) => b.slug === slug);
  if (!brand) return { title: 'Brand not found', robots: { index: false } };
  const c = await getContent('brands', p);
  const v = { brand: brand.name };
  return pageMetadata(c.t('detail.seo_title', v), c.t('detail.seo_description', v), brandPath(slug));
}

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const p = await getProgramme();
  if (!p.brands.some((b) => b.slug === slug)) notFound();
  const [c, site] = await Promise.all([getContent('brands', p), getContent('site', p)]);
  return <BrandDetailView slug={slug} p={p} c={c} site={site} />;
}
