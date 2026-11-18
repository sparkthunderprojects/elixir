import Link from 'next/link';
import { MYSPARKTHUNDER_URL } from '@/lib/config';

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Elixir Points is the rewards programme of the Sparkthunder family of brands.</p>
        <p className="flex gap-4">
          <a href={`${MYSPARKTHUNDER_URL}/terms`} className="hover:text-slate-800">Terms</a>
          <a href={`${MYSPARKTHUNDER_URL}/forgot-password`} className="hover:text-slate-800">Forgot password</a>
          <Link href="/admin" className="hover:text-slate-800">Staff</Link>
        </p>
      </div>
    </footer>
  );
}
