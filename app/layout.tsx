import type { Metadata, Viewport } from 'next';
import './globals.css';
import './elixir.css';
import JsonLd from '@/components/json-ld';
import { getContent } from '@/lib/cms/server';
import { getProgramme } from '@/lib/programme';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getContent('site', await getProgramme());
  const tagline = site.t('seo.tagline');
  const description = site.t('seo.description');
  const title = `${SITE_NAME}: ${tagline}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    applicationName: SITE_NAME,
    alternates: { canonical: '/' },
    openGraph: { type: 'website', siteName: SITE_NAME, title, description, url: '/', locale: 'en_GB' },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
    icons: { icon: '/elixir-logo.png', apple: '/elixir-logo.png' },
  };
}

export const viewport: Viewport = { themeColor: '#1d3557', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getContent('site', await getProgramme());
  const description = site.t('seo.description');
  return (
    <html lang="en-GB">
      <body className="flex min-h-screen flex-col">
        <JsonLd data={[
          { '@context': 'https://schema.org', '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/elixir-logo.png`, description },
          { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, description, inLanguage: 'en-GB', publisher: { '@id': `${SITE_URL}/#organization` } },
        ]} />
        {children}
      </body>
    </html>
  );
}
