import Link from 'next/link';
import Image from 'next/image';
import HeaderAuth from '@/components/header-auth';
import { NAV } from '@/lib/site';

/** Server-rendered header: logo and navigation are plain HTML. Only sign-in state is client-side. */
export default function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 sm:px-6">
        <Link href="/" aria-label="Elixir Points home">
          <Image src="/elixir-logo.png" alt="Elixir Points rewards programme" width={520} height={393} priority className="h-16 w-auto sm:h-20" />
        </Link>
        <nav aria-label="Main" className="order-3 flex w-full gap-1 overflow-x-auto text-sm font-medium text-slate-600 sm:order-none sm:w-auto">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 hover:bg-slate-100 hover:text-navy">{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2"><HeaderAuth /></div>
      </div>
    </header>
  );
}
