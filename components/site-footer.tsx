import Link from 'next/link';
import { MYSPARKTHUNDER_URL } from '@/lib/config';
import { NAV } from '@/lib/site';

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500 sm:px-6">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="hover:text-slate-800">{n.label}</Link>)}
          <Link href="/signup" className="hover:text-slate-800">Join free</Link>
          <a href={`${MYSPARKTHUNDER_URL}/terms`} className="hover:text-slate-800">Terms</a>
          <a href={`${MYSPARKTHUNDER_URL}/privacy`} className="hover:text-slate-800">Privacy</a>
          <Link href="/admin" rel="nofollow" className="hover:text-slate-800">Staff</Link>
        </nav>
        <p className="mt-4">Elixir Points is the rewards programme of the Sparkthunder family of brands.</p>
      </div>
    </footer>
  );
}
