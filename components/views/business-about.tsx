import PageShell from '@/components/page-shell';
import BusinessNav from '@/components/business-nav';
import { ButtonLink, SectionTitle } from '@/components/ui';
import type { ViewProps } from '@/components/views/home';

export default function BusinessAboutView({ c }: ViewProps) {
  const what = c.list<{ title: string; text: string }>('what.items');
  const principles = c.list<{ title: string; text: string }>('principles.items');
  const Cards = ({ items }: { items: { title: string; text: string }[] }) => (
    <ul className="mt-8 grid gap-5 md:grid-cols-3">
      {items.map((i, n) => (
        <li key={`${n}-${i.title}`} className="card-depth rounded-3xl p-6 sm:p-8">
          <h3 className="text-lg font-extrabold text-deep">{i.title}</h3>
          <p className="mt-2 text-body">{i.text}</p>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <BusinessNav current="/business/about" />
      <PageShell title={c.t('intro.title')} intro={c.t('intro.text')} path="/business/about">
        <div className="card-depth mx-auto max-w-3xl rounded-3xl p-8 sm:p-12">
          <h2 className="text-2xl font-extrabold text-deep sm:text-3xl">{c.t('story.title')}</h2>
          <p className="mt-4 text-lg text-body">{c.t('story.text')}</p>
        </div>
        <div className="mt-16"><SectionTitle>{c.t('what.title')}</SectionTitle></div>
        <Cards items={what} />
        <div className="mt-16"><SectionTitle>{c.t('principles.title')}</SectionTitle></div>
        <Cards items={principles} />
        <div className="hero-deep mt-12 flex flex-col items-center gap-5 rounded-3xl px-6 py-12 text-center text-white">
          <h2 className="text-3xl font-extrabold !text-white">{c.t('cta.title')}</h2>
          <ButtonLink href="/business/contact">{c.t('cta.button')}</ButtonLink>
        </div>
      </PageShell>
    </>
  );
}
