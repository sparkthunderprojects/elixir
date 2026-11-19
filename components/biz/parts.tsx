import type { ReactNode } from 'react';

/** A plain ring, the building block of the Elixir 360 look. */
export function Ring({ size, color, thick = 28, className = '' }: { size: number; color: string; thick?: number; className?: string }) {
  return <span aria-hidden="true" className={`absolute rounded-full ${className}`} style={{ width: size, height: size, border: `${thick}px solid ${color}` }} />;
}

/** A circle holding a picture or phone, like the circles on the Elixir 360 pages. */
export function Disc({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`overflow-hidden rounded-full bg-gradient-to-br from-[#26354f] to-[#0e1422] ${className}`}>{children}</div>;
}

/** The black page body for every Elixir 360 view (also used when the editor previews a page). */
export function BizPage({ children }: { children: ReactNode }) {
  return <div className="bg-black text-white">{children}</div>;
}

/** Heading block used at the top of the inner Elixir 360 pages. */
export function BizPageHead({ title, intro, tag }: { title: string; intro?: string; tag?: string }) {
  return (
    <section className="mx-auto max-w-[1200px] px-6 pb-16 pt-10 sm:pt-16">
      {tag && <p className="text-sm font-bold text-elixir-light">{tag}</p>}
      <h1 className="mt-3 max-w-3xl text-5xl font-black leading-[1.05] text-white sm:text-6xl">{title}</h1>
      {intro && <p className="mt-6 max-w-2xl text-xl text-white/70">{intro}</p>}
    </section>
  );
}
