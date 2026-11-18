import Link from 'next/link';
import { MYSPARKTHUNDER_URL } from '@/lib/config';
import { NAV } from '@/lib/site';

export default function SiteFooter() {
  const col = 'text-sm text-body hover:text-elixir';
  const head = 'text-sm font-bold text-deep';
  return (
    <footer className="mt-20 border-t border-black/5 bg-white">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className={head}>Explore</p>
          <ul className="mt-4 space-y-3">{NAV.map((n) => <li key={n.href}><Link href={n.href} className={col}>{n.label}</Link></li>)}</ul>
        </div>
        <div>
          <p className={head}>Your account</p>
          <ul className="mt-4 space-y-3">
            <li><Link href="/signup" className={col}>Join free</Link></li>
            <li><Link href="/login" className={col}>Sign in</Link></li>
            <li><a href={`${MYSPARKTHUNDER_URL}/forgot-password`} className={col}>Forgot password</a></li>
          </ul>
        </div>
        <div>
          <p className={head}>Legal</p>
          <ul className="mt-4 space-y-3">
            <li><a href={`${MYSPARKTHUNDER_URL}/terms`} className={col}>Terms</a></li>
            <li><a href={`${MYSPARKTHUNDER_URL}/privacy`} className={col}>Privacy</a></li>
          </ul>
        </div>
        <div>
          <p className={head}>Part of the family</p>
          <p className="mt-4 text-sm text-body">Elixir Points is the rewards programme of the Sparkthunder family of brands.</p>
          <a href={MYSPARKTHUNDER_URL} className={`${col} mt-3 inline-block font-semibold`}>My Sparkthunder</a>
        </div>
      </div>
      <div className="border-t border-black/5">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-5 text-xs text-body sm:px-6">
          <p>© {new Date().getFullYear()} Elixir Points. All rights reserved.</p>
          <Link href="/admin" rel="nofollow" className="hover:text-elixir">Staff</Link>
        </div>
      </div>
    </footer>
  );
}
