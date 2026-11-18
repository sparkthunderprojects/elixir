import PageShell from '@/components/page-shell';
import JsonLd from '@/components/json-ld';
import type { ViewProps } from '@/components/views/home';

export default function FaqView({ c }: ViewProps) {
  const items = c.list<{ q: string; a: string }>('items.items');
  return (
    <PageShell title={c.t('intro.title')} intro={c.t('intro.text')} path="/faq">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })) }} />
      <dl className="grid gap-4">
        {items.map((i, n) => (
          <div key={`${n}-${i.q}`} className="card-depth rounded-3xl p-6 sm:p-8">
            <dt className="text-lg font-bold text-deep"><h2>{i.q}</h2></dt>
            <dd className="mt-1 max-w-3xl text-body">{i.a}</dd>
          </div>
        ))}
      </dl>
    </PageShell>
  );
}
