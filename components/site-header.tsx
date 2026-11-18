import Link from 'next/link';
import Image from 'next/image';
import HeaderAuth from '@/components/header-auth';
import NavLinks from '@/components/nav-links';
import type { Content } from '@/lib/cms/resolve';

/** Sticky, frosted header. Logo and navigation are plain server-rendered HTML. */
export default function SiteHeader({ c }: { c: Content }) {
  const nav = c.list<{ href: string; label: string }>('nav.items');
  const mark = c.img('header.mark');
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/75 shadow-[0_10px_30px_-18px_rgba(15,26,48,0.45)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-none items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">
        <div className="flex h-full items-center gap-4">
          <Link href="/" aria-label={`${c.t('header.name_main')} ${c.t('header.name_light')} ${c.t('header.strapline')}, home`} className="shrink-0">
            <span className="flex items-center gap-2.5">
              <Image src={mark.src} alt={mark.alt} width={mark.width || 147} height={mark.height || 200} priority className="h-11 w-auto drop-shadow-[0_4px_6px_rgba(189,49,65,0.35)]" />
              <span className="leading-none">
                <span className="block text-lg font-extrabold uppercase tracking-tight text-navy">{c.t('header.name_main')} <span className="font-medium">{c.t('header.name_light')}</span></span>
                <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.25em] text-body">{c.t('header.strapline')}</span>
              </span>
            </span>
          </Link>
          <NavLinks items={nav} />
        </div>
        <div className="flex items-center gap-2">
          <HeaderAuth labels={{ signin: c.t('header.signin'), join: c.t('header.join'), signout: c.t('header.signout') }} />
          <details className="relative md:hidden">
            <summary aria-label="Menu" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-black/10 text-deep">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </summary>
            <nav aria-label="Mobile" className="absolute right-0 top-12 w-56 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5">
              {nav.map((n) => <Link key={n.href} href={n.href} className="block rounded-xl px-4 py-3 text-sm font-semibold text-deep hover:bg-page">{n.label}</Link>)}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
