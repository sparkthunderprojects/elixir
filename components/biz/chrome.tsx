import Link from 'next/link';
import { MYSPARKTHUNDER_URL } from '@/lib/config';

const LINKS = [
  { href: '/business/loyalty', label: 'Loyalty' }, { href: '/business/insights', label: 'Insights' }, { href: '/business/media', label: 'Media' },
  { href: '/business/about', label: 'About' }, { href: '/business/contact', label: 'Contact' },
];

/** The Elixir 360 mark: letters in a grid, ending in a droplet-red dot. */
export function BizLogo({ className = '' }: { className?: string }) {
  const rows = [['E', 'L', 'I'], ['X', 'I', 'R'], ['3', '6']];
  return (
    <span className={`inline-grid select-none grid-cols-3 gap-x-2 gap-y-0.5 text-[15px] font-light leading-none text-elixir-light ${className}`} aria-hidden="true">
      {rows.flat().map((ch, i) => <span key={i} className="text-center">{ch}</span>)}
      <span className="mx-auto mt-px h-3.5 w-3.5 rounded-full border-[3px] border-elixir-light" />
    </span>
  );
}

export function BizHeader() {
  return (
    <header className="relative z-40 bg-black">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-6">
        <Link href="/business" aria-label="Elixir 360, home"><BizLogo /></Link>
        <nav aria-label="Elixir 360" className="hidden items-center gap-7 text-sm font-semibold text-white/80 md:flex">
          {LINKS.map((l) => <Link key={l.href} href={l.href} className="hover:text-white">{l.label}</Link>)}
          <Link href="/partner" className="rounded-lg border border-white/30 px-4 py-2 text-white hover:bg-white/10">Partner login</Link>
        </nav>
        <details className="relative md:hidden">
          <summary aria-label="Menu" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/30 text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </summary>
          <nav aria-label="Elixir 360 mobile" className="absolute right-0 top-12 w-56 rounded-2xl bg-[#14141a] p-2 shadow-xl ring-1 ring-white/10">
            {LINKS.map((l) => <Link key={l.href} href={l.href} className="block rounded-xl px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">{l.label}</Link>)}
            <Link href="/partner" className="block rounded-xl px-4 py-3 text-sm font-bold text-elixir-light hover:bg-white/10">Partner login</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function BizFooter() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div><BizLogo /><p className="mt-4 max-w-xs text-sm text-white/60">Loyalty, insights and media for brands. Part of the Sparkthunder family.</p></div>
        <ul className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm text-white/70">
          <li><Link href="/business/contact" className="hover:text-white">Contact</Link></li>
          <li><Link href="/" className="hover:text-white">Elixir Points</Link></li>
          <li><a href={`${MYSPARKTHUNDER_URL}/terms`} className="hover:text-white">Terms</a></li>
          <li><a href={`${MYSPARKTHUNDER_URL}/privacy`} className="hover:text-white">Privacy</a></li>
        </ul>
      </div>
      <p className="mx-auto max-w-[1200px] px-6 pb-8 text-xs text-white/40">© {new Date().getFullYear()} Elixir 360. All rights reserved.</p>
    </footer>
  );
}
