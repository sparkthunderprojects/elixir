import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { VIEWS } from '@/components/views';
import { getDraftContent, getContent } from '@/lib/cms/server';
import { PAGE_BY_SLUG } from '@/lib/cms/schema';
import { getProgramme } from '@/lib/programme';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Preview', robots: { index: false, follow: false } };

/** What a page will look like once the draft is published. Staff only; the database refuses anyone else. */
export default async function Preview(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const View = VIEWS[params.slug];
  if (!View || !PAGE_BY_SLUG[params.slug]) notFound();
  const p = await getProgramme();
  let c, site;
  try {
    if (params.slug === 'site') {
      // The site-wide settings have no page of their own, so they are shown on the home page.
      [c, site] = await Promise.all([getContent('home', p), getDraftContent('site', p)]);
    } else {
      [c, site] = await Promise.all([getDraftContent(params.slug, p), getContent('site', p)]);
    }
  } catch {
    return <p className="p-10 text-center text-body">Preview is only available to Elixir staff. Sign in and try again.</p>;
  }
  return (
    <>
      {/* The editor shows the page inside a frame, so the site header and footer would repeat. */}
      {params.slug !== 'site' && <style>{'header.sticky{display:none!important}footer{display:none!important}'}</style>}
      <View p={p} c={c} site={site} />
    </>
  );
}
