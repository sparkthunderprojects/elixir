import { ButtonLink } from '@/components/ui';
import { BizPage, BizPageHead } from '@/components/biz/parts';
import type { ViewProps } from '@/components/views/home';

export default function BusinessAboutView({ c }: ViewProps) {
  const principles = c.list<{ title: string; text: string }>('principles.items');
  return (
    <BizPage>
      <BizPageHead title={c.t('intro.title')} intro={c.t('intro.text')} />
      <section className="mx-auto max-w-[1200px] px-6 pb-24">
        <h2 className="text-3xl font-black text-elixir-light">{c.t('story.title')}</h2>
        <p className="mt-6 max-w-3xl text-2xl font-light leading-snug text-white/70">{c.t('story.text')}</p>
      </section>
      <section className="bg-[#75002a]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="text-3xl font-black text-white/90">{c.t('principles.title')}</h2>
          <ul className="mt-10 grid gap-10 md:grid-cols-3">
            {principles.map((i, n) => (
              <li key={`${n}-${i.title}`}><h3 className="text-xl font-extrabold text-white">{i.title}</h3><p className="mt-2 text-lg font-light text-white/75">{i.text}</p></li>
            ))}
          </ul>
        </div>
      </section>
      <section className="mx-auto flex max-w-[1200px] flex-col items-start gap-6 px-6 py-20">
        <h2 className="text-4xl font-black text-white">{c.t('cta.title')}</h2>
        <ButtonLink href="/business/contact">{c.t('cta.button')}</ButtonLink>
      </section>
    </BizPage>
  );
}
