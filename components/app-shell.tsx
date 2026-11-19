'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, Store, Gift, Info } from 'lucide-react';

/**
 * Inside the iPhone and Android app (which adds "ElixirApp" to the browser name) the website header and
 * footer are hidden and a bottom tab bar is shown instead. On the normal website this renders nothing.
 */
const TABS = [
  { href: '/account', label: 'Wallet', Icon: Wallet },
  { href: '/brands', label: 'Brands', Icon: Store },
  { href: '/rewards', label: 'Rewards', Icon: Gift },
  { href: '/how-it-works', label: 'About', Icon: Info },
];

export default function AppShell() {
  const [inApp, setInApp] = useState(false);
  const path = usePathname();
  useEffect(() => {
    const yes = /ElixirApp/i.test(navigator.userAgent);
    setInApp(yes);
    document.documentElement.classList.toggle('in-app', yes);
  }, []);
  if (!inApp) return null;
  return (
    <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <ul className="mx-auto flex max-w-xl">
        {TABS.map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(href + '/');
          return (
            <li key={href} className="flex-1">
              <Link href={href} aria-current={active ? 'page' : undefined} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold ${active ? 'text-elixir' : 'text-body'}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />{label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
