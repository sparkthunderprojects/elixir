import type { Metadata } from 'next';
import './globals.css';
import './elixir.css';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://elixirpoints.com'),
  title: { default: 'Elixir Points: one rewards balance across every Sparkthunder brand', template: '%s | Elixir Points' },
  description: 'Earn Elixir Points every time you shop or play across Sparkthunder brands, and spend them anywhere in the family.',
  applicationName: 'Elixir Points',
  icons: { icon: '/elixir-logo.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
