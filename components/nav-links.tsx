'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '@/lib/site';

/** Desktop navigation with an underline on the current page. */
export default function NavLinks() {
  const path = usePathname() ?? '/';
  return (
    <nav aria-label="Main" className="hidden h-full items-stretch gap-1 md:flex">
      {NAV.map((n) => {
        const active = path === n.href;
        return (
          <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined}
            className={`relative flex items-center px-4 text-sm font-semibold transition-colors ${active ? 'text-elixir' : 'text-deep hover:text-elixir'}`}>
            {n.label}
            {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-elixir" />}
          </Link>
        );
      })}
    </nav>
  );
}
