import EnquiryForm from '@/components/enquiry-form';
import { BizPage, BizPageHead } from '@/components/biz/parts';
import type { ViewProps } from '@/components/views/home';

export default function BusinessContactView({ c }: ViewProps) {
  const keys = ['company', 'name', 'email', 'website', 'interests', 'interest_loyalty', 'interest_insights', 'interest_media', 'interest_other', 'message', 'submit', 'consent'];
  const labels: Record<string, string> = {};
  for (const k of keys) labels[k] = c.t(`form.${k}`);
  for (const k of ['title', 'text', 'limit', 'error']) labels[`done_${k}`] = c.t(`done.${k}`);
  return (
    <BizPage>
      <BizPageHead title={c.t('intro.title')} intro={c.t('intro.text')} />
      <section className="mx-auto max-w-[1200px] px-6 pb-28">
        <div className="max-w-2xl rounded-2xl bg-white p-6 text-deep sm:p-10"><EnquiryForm labels={labels} /></div>
      </section>
    </BizPage>
  );
}
