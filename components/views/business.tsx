import Link from 'next/link';
import { safeHref } from '@/lib/safe-href';
import BrandTile from '@/components/brand-tile';
import { ButtonLink } from '@/components/ui';
import { AppPhone, CardScreen, RewardsScreen } from '@/components/app-screens';
import { BizPage, Disc, Ring } from '@/components/biz/parts';
import { brandLooks, sortBrands } from '@/lib/brands';
import type { ViewProps } from '@/components/views/home';

export default function BusinessView({ p, c, site }: ViewProps) {
  const cards = c.list<{ href: string; status: string; title: string; text: string }>('offer.items');
  const looks = brandLooks(site);
  const brands = sortBrands(p.brands);
  return (
    <BizPage>
      {/* Hero */}
      <section className="relative mx-auto max-w-[1200px] overflow-hidden px-6 pb-24 pt-8 sm:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative z-10">
            <h1 className="text-5xl font-black leading-[1.02] text-elixir-light sm:text-7xl">{c.t('hero.title')}</h1>
            <p className="mt-8 max-w-xl text-2xl font-light leading-snug text-white/70">{c.t('hero.text')}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/business/contact">{c.t('hero.primary')}</ButtonLink>
              <ButtonLink href="/partner" variant="outline">{c.t('hero.secondary')}</ButtonLink>
            </div>
          </div>
          <div className="relative mx-auto h-[26rem] w-[26rem] max-w-full">
            <Ring size={70} color="#1f5fa8" thick={14} className="-left-2 top-6" />
            <Ring size={34} color="#3aa88f" thick={8} className="left-14 bottom-2" />
            <Ring size={110} color="#8a1d3c" thick={30} className="-right-4 bottom-0" />
            <span aria-hidden="true" className="absolute right-6 top-0 h-6 w-6 rounded-full bg-white/60" />
            <Disc className="absolute inset-4"><div className="absolute left-1/2 top-14 -translate-x-1/2"><AppPhone><RewardsScreen p={p} /></AppPhone></div></Disc>
          </div>
        </div>
      </section>

      {/* Services */}
      <section aria-labelledby="services" className="bg-[#75002a]">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 py-24 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold text-white/60">{c.t('offer.label')}</p>
            <h2 id="services" className="mt-3 text-5xl font-black leading-tight text-white/90 sm:text-6xl">{c.t('offer.title')}</h2>
            <p className="mt-6 max-w-md text-xl font-light text-white/75">{c.t('offer.text')}</p>
          </div>
          <ul className="space-y-4">
            {cards.map((card, i) => (
              <li key={`${i}-${card.title}`}>
                <Link href={safeHref(card.href)} className="flex items-center justify-between rounded-md bg-black px-7 py-6 text-2xl font-extrabold text-white/90 transition hover:bg-[#14141a]">
                  <span>{card.title}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-white/50">{card.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How we work */}
      <section aria-labelledby="work" className="relative mx-auto max-w-[1200px] overflow-hidden px-6 py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p id="work" className="text-3xl font-black text-elixir-light">{c.t('work.title')}</p>
            <h2 className="mt-4 text-5xl font-black leading-[1.05] text-white/60 sm:text-6xl">{c.t('work.heading')}</h2>
            <p className="mt-8 max-w-md text-xl font-light text-white/70">{c.t('work.text')}</p>
          </div>
          <div className="relative mx-auto h-[24rem] w-[24rem] max-w-full">
            <Ring size={90} color="#4a7c23" thick={26} className="-right-6 -top-4" />
            <Disc className="absolute inset-0"><div className="absolute left-1/2 top-12 -translate-x-1/2"><AppPhone><CardScreen /></AppPhone></div></Disc>
          </div>
        </div>
      </section>

      {/* Family */}
      {brands.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-6 pb-28">
          <h2 className="text-3xl font-black text-elixir-light">{c.t('family.title')}</h2>
          <p className="mt-3 text-lg font-light text-white/60">{c.t('family.text')}</p>
          <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {brands.slice(0, 4).map((b) => <li key={b.slug}><BrandTile look={looks[b.slug]} name={b.name} className="h-28" /></li>)}
          </ul>
        </section>
      )}

      {/* Contact */}
      <section className="bg-[#75002a]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-8 px-6 py-20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-4xl font-black text-white sm:text-5xl">{c.t('cta.title')}</h2>
            <p className="mt-3 text-xl font-light text-white/75">{c.t('cta.text')}</p>
          </div>
          <ButtonLink href="/business/contact" variant="light">{c.t('cta.button')}</ButtonLink>
        </div>
      </section>
    </BizPage>
  );
}
