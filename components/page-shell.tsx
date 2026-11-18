import Link from 'next/link';
import type { ReactNode } from 'react';
import JsonLd from '@/components/json-ld';
import { SITE_URL } from '@/lib/site';

/** Page heading with breadcrumbs (visible and as structured data). */
export default function PageShell({ title, intro, path, children }: { title: string; intro: string; path: string; children: ReactNode }) {
  const crumbs = [
    { name: 'Home', url: SITE_URL + '/' },
    { name: title, url: SITE_URL + path },
  ];
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
      }} />
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
            <ol className="flex gap-2">
              <li><Link href="/" className="hover:text-navy">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-slate-700">{title}</li>
            </ol>
          </nav>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">{intro}</p>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</div>
    </>
  );
}
