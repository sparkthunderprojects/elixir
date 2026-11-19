import Link from 'next/link';
import { safeHref } from '@/lib/safe-href';
import { MYSPARKTHUNDER_URL } from '@/lib/config';
import type { Content } from '@/lib/cms/resolve';

export default function SiteFooter({ c }: { c: Content }) {
  const nav = c.list<{ href: string; label: string }>('nav.items');
  const col = 'text-sm text-body hover:text-elixir';
  const head = 'text-sm font-bold text-deep';
  return (
    <footer className="mt-20 border-t border-black/5 bg-white">
      <div className="mx-auto grid max-w-none gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className={head}>{c.t('footer.explore_heading')}</p>
          <ul className="mt-4 space-y-3">{nav.map((n) => <li key={n.href}><Link href={safeHref(n.href)} className={col}>{n.label}</Link></li>)}<li><Link href={c.t('header.business_href') || '/business'} className={col}>{c.t('header.business')}</Link></li></ul>
        </div>
        <div>
          <p className={head}>{c.t('footer.account_heading')}</p>
          <ul className="mt-4 space-y-3">
            <li><Link href="/signup" className={col}>{c.t('header.join')}</Link></li>
            <li><Link href="/login" className={col}>{c.t('header.signin')}</Link></li>
            <li><a href={`${MYSPARKTHUNDER_URL}/forgot-password`} className={col}>{c.t('footer.forgot')}</a></li>
          </ul>
        </div>
        <div>
          <p className={head}>{c.t('footer.legal_heading')}</p>
          <ul className="mt-4 space-y-3">
            <li><a href={`${MYSPARKTHUNDER_URL}/terms`} className={col}>{c.t('footer.terms')}</a></li>
            <li><a href={`${MYSPARKTHUNDER_URL}/privacy`} className={col}>{c.t('footer.privacy')}</a></li>
            <li><Link href="/support" className={col}>Support</Link></li>
          </ul>
        </div>
        <div>
          <p className={head}>{c.t('footer.family_heading')}</p>
          <p className="mt-4 text-sm text-body">{c.t('footer.family_text')}</p>
          <a href={MYSPARKTHUNDER_URL} className={`${col} mt-3 inline-block font-semibold`}>{c.t('footer.family_link')}</a>
        </div>
      </div>
      <div className="border-t border-black/5">
        <div className="mx-auto flex max-w-none items-center justify-between px-4 py-5 text-xs text-body sm:px-6">
          <p>© {new Date().getFullYear()} {c.t('footer.copyright')}. All rights reserved.</p>
          <Link href="/admin" rel="nofollow" className="hover:text-elixir">{c.t('footer.staff')}</Link>
        </div>
      </div>
    </footer>
  );
}
