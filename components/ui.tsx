import Link from 'next/link';
import type { ReactNode } from 'react';

export function ButtonLink({ href, children, variant = 'primary', className = '' }: { href: string; children: ReactNode; variant?: 'primary' | 'outline' | 'light'; className?: string }) {
  const styles = {
    primary: 'bg-elixir text-white hover:bg-elixir-dark',
    outline: 'border-2 border-white/80 text-white hover:bg-white/10',
    light: 'bg-white text-deep hover:bg-page',
  }[variant];
  return (
    <Link href={href} className={`inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-bold transition-colors ${styles} ${className}`}>
      {children}
    </Link>
  );
}

/** Centered section title, like a chapter heading between panels. */
export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return <h2 id={id} className="mx-auto max-w-2xl text-center text-3xl font-extrabold text-deep sm:text-4xl">{children}</h2>;
}

/** A rounded split card: words on one side, a bright colour block with art on the other. */
export function SplitCard({ title, text, color, flip, children }: { title: string; text: string; color: string; flip?: boolean; children: ReactNode }) {
  return (
    <article className="grid overflow-hidden rounded-3xl bg-white md:grid-cols-2">
      <div className={`flex flex-col justify-center p-8 sm:p-12 ${flip ? 'md:order-2' : ''}`}>
        <h3 className="text-2xl font-extrabold leading-tight text-deep sm:text-3xl">{title}</h3>
        <p className="mt-4 max-w-md text-body">{text}</p>
      </div>
      <div className={`relative flex items-center justify-center overflow-hidden ${flip ? 'md:order-1' : ''}`} style={{ background: color }}>
        {children}
      </div>
    </article>
  );
}
