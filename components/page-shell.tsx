import Link from 'next/link';
import type { ReactNode } from 'react';
import JsonLd from '@/components/json-ld';
import { Droplet } from '@/components/art';
import { SITE_URL } from '@/lib/site';

/** Inner-page heading panel with breadcrumbs (visible and as structured data). */
export default function PageShell({ title, intro, path, children }: { title: string; intro: string; path: string; children: ReactNode }) {
  const crumbs = [{ name: 'Home', url: SITE_URL + '/' }, { name: title, url: SITE_URL + path }];
  return (
    <div className="mx-auto max-w-none px-4 pt-6 sm:px-6">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
      }} />
      <div className="relative overflow-hidden hero-deep rounded-3xl px-6 py-12 text-white sm:px-12 sm:py-16">
        <Droplet className="float-slow drop-glow pointer-events-none absolute -right-4 top-6 h-36 w-28 text-elixir" />
        <Droplet className="float-slower drop-glow pointer-events-none absolute right-28 bottom-4 h-16 w-12 text-elixir-light" />
        <nav aria-label="Breadcrumb" className="text-sm text-white/60">
          <ol className="flex gap-2">
            <li><Link href="/" className="hover:text-white">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-white">{title}</li>
          </ol>
        </nav>
        <h1 className="mt-4 max-w-2xl text-4xl font-extrabold !text-white sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-xl text-lg text-white/80">{intro}</p>
      </div>
      <div className="py-12">{children}</div>
    </div>
  );
}
