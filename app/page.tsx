import Link from 'next/link';
import { Gift, ShoppingBag, Sparkles } from 'lucide-react';

const steps = [
  { icon: ShoppingBag, title: 'Shop or play', text: 'Earn Elixir Points on every purchase across Sparkthunder brands, as a guest or signed in.' },
  { icon: Sparkles, title: 'Level up', text: 'The more you spend, the higher your tier, and the faster your points grow.' },
  { icon: Gift, title: 'Spend anywhere', text: 'Turn your points into rewards at checkout, in any brand that takes part.' },
];

export default function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">One rewards balance. Every Sparkthunder brand.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Collect Elixir Points wherever you shop with us, from comics to makeup and beyond, and spend them anywhere in the family.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="rounded-lg bg-elixir px-6 py-3 font-semibold text-white hover:bg-elixir-dark">Join free</Link>
            <Link href="/login" className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-navy hover:bg-slate-50">Sign in</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-navy">How it works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-elixir/10 text-elixir"><Icon className="h-6 w-6" /></span>
              <h3 className="mt-4 text-lg font-semibold text-navy">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-slate-500">Your balance and rewards will appear here once you sign in. Member pages are coming soon.</p>
      </section>
    </>
  );
}
