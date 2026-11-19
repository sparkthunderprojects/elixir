import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import AppShell from '@/components/app-shell';
import { getContent } from '@/lib/cms/server';
import { getProgramme } from '@/lib/programme';

/** The Elixir Points website: header, page, footer. (Elixir 360 has its own layout.) */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const site = await getContent('site', await getProgramme());
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-navy focus:shadow">Skip to content</a>
      <SiteHeader c={site} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter c={site} />
      <AppShell />
    </>
  );
}
