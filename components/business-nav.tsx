import Link from 'next/link';

const LINKS = [
  { href: '/business', label: 'Overview' }, { href: '/business/loyalty', label: 'Loyalty' }, { href: '/business/insights', label: 'Insights' },
  { href: '/business/media', label: 'Media' }, { href: '/business/about', label: 'About' }, { href: '/business/contact', label: 'Contact' },
];

/** Section navigation shared by every Elixir 360 page. */
export default function BusinessNav({ current }: { current: string }) {
  return (
    <nav aria-label="Elixir 360" className="mx-auto max-w-none px-4 pt-4 sm:px-6">
      <ul className="flex flex-wrap items-center gap-1 rounded-2xl bg-white/70 p-1.5 text-sm font-bold shadow-sm ring-1 ring-black/5 backdrop-blur">
        <li className="px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-elixir">Elixir 360</li>
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} aria-current={l.href === current ? 'page' : undefined}
              className={`block rounded-xl px-3 py-1.5 ${l.href === current ? 'bg-elixir text-white' : 'text-deep hover:bg-elixir/10'}`}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
