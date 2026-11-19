import { BizHeader, BizFooter } from '@/components/biz/chrome';

/** Elixir 360, the business site: its own look, header and footer, separate from the Elixir Points site. */
export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-black text-white">
      <style>{'body{background:#000}'}</style>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-black">Skip to content</a>
      <BizHeader />
      <main id="main" className="flex-1">{children}</main>
      <BizFooter />
    </div>
  );
}
