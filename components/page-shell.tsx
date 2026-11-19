import Link from 'next/link';
import type { ReactNode } from 'react';
import JsonLd from '@/components/json-ld';
import { SITE_URL } from '@/lib/site';

/** Inner-page heading panel with breadcrumbs (visible and as structured data). */
export default function PageShell({ title, intro, path, children }: { title: string; intro: string; path: string; children: ReactNode }) {
  const crumbs = [{ name: 'Home', url: SITE_URL + '/' }, { name: title, url: SITE_URL + path }];
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
      }} />
      <div className="hero-deep rounded-3xl px-8 py-14 text-white sm:px-14 sm:py-16">
        <nav aria-label="Breadcrumb" className="sr-only">
          <ol><li><Link href="/">Home</Link></li><li aria-current="page">{title}</li></ol>
        </nav>
        <h1 className="max-w-2xl text-4xl font-extrabold !text-white sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-xl text-lg text-white/75">{intro}</p>
      </div>
      <div className="py-14">{children}</div>
    </div>
  );
}
