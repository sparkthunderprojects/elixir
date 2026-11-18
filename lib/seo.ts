import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/site';

/** Consistent title, description, canonical, Open Graph and Twitter tags for a page. */
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', siteName: SITE_NAME, title: `${title} | ${SITE_NAME}`, description, url: path, locale: 'en_GB' },
    twitter: { card: 'summary_large_image', title: `${title} | ${SITE_NAME}`, description },
  };
}
