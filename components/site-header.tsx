import Link from 'next/link';
import Image from 'next/image';
import HeaderAuth from '@/components/header-auth';
import NavLinks from '@/components/nav-links';
import { NAV } from '@/lib/site';

/** Sticky, frosted header. Logo and navigation are plain server-rendered HTML. */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex h-full items-center gap-4">
          <Link href="/" aria-label="Elixir Points rewards programme, home" className="shrink-0">
            <span className="flex items-center gap-2.5">
              <Image src="/elixir-mark.png" alt="" width={147} height={200} priority className="h-10 w-auto" />
              <span className="leading-none">
                <span className="block text-lg font-extrabold uppercase tracking-tight text-navy">Elixir <span className="font-medium">Points</span></span>
                <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.25em] text-body">Rewards programme</span>
              </span>
            </span>
          </Link>
          <NavLinks />
        </div>
        <div className="flex items-center gap-2">
          <HeaderAuth />
          <details className="relative md:hidden">
            <summary aria-label="Menu" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-black/10 text-deep">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </summary>
            <nav aria-label="Mobile" className="absolute right-0 top-12 w-56 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5">
              {NAV.map((n) => <Link key={n.href} href={n.href} className="block rounded-xl px-4 py-3 text-sm font-semibold text-deep hover:bg-page">{n.label}</Link>)}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
