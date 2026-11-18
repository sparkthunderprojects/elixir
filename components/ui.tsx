import Link from 'next/link';
import type { ReactNode } from 'react';

export function ButtonLink({ href, children, variant = 'primary', className = '' }: { href: string; children: ReactNode; variant?: 'primary' | 'outline' | 'light'; className?: string }) {
  const styles = {
    primary: 'bg-gradient-to-b from-[#e85a68] to-[#b02a3c] text-white shadow-[0_10px_22px_-8px_rgba(189,49,65,0.8),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-8px_rgba(189,49,65,0.9),inset_0_1px_0_rgba(255,255,255,0.4)]',
    outline: 'glass text-white hover:-translate-y-0.5 hover:bg-white/10',
    light: 'bg-gradient-to-b from-white to-[#efe9e3] text-deep shadow-[0_10px_22px_-10px_rgba(0,0,0,0.5),inset_0_1px_0_#fff] hover:-translate-y-0.5',
  }[variant];
  return (
    <Link href={href} className={`inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-bold transition-all duration-200 ${styles} ${className}`}>
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
  const bg = `radial-gradient(70% 90% at 20% 0%, rgba(255,255,255,0.45), transparent 60%), linear-gradient(135deg, color-mix(in srgb, ${color} 82%, white), ${color} 50%, color-mix(in srgb, ${color} 78%, #6d1424))`;
  return (
    <article className="card-depth grid overflow-hidden rounded-3xl md:grid-cols-2">
      <div className={`flex flex-col justify-center p-8 sm:p-12 ${flip ? 'md:order-2' : ''}`}>
        <h3 className="text-2xl font-extrabold leading-tight text-deep sm:text-3xl">{title}</h3>
        <p className="mt-4 max-w-md text-body">{text}</p>
      </div>
      <div className={`relative flex items-center justify-center overflow-hidden shadow-[inset_0_0_60px_rgba(0,0,0,0.12)] ${flip ? 'md:order-1' : ''}`} style={{ background: bg }}>
        <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/25 blur-2xl" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-black/10 blur-2xl" />
        <div className="relative w-full">{children}</div>
      </div>
    </article>
  );
}
