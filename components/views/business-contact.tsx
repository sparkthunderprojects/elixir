import BusinessNav from '@/components/business-nav';
import PageShell from '@/components/page-shell';
import EnquiryForm from '@/components/enquiry-form';
import type { ViewProps } from '@/components/views/home';

export default function BusinessContactView({ c }: ViewProps) {
  const keys = ['company', 'name', 'email', 'website', 'interests', 'interest_loyalty', 'interest_insights', 'interest_media', 'interest_other', 'message', 'submit', 'consent'];
  const labels: Record<string, string> = {};
  for (const k of keys) labels[k] = c.t(`form.${k}`);
  for (const k of ['title', 'text', 'limit', 'error']) labels[`done_${k}`] = c.t(`done.${k}`);
  return (
    <>
    <BusinessNav current="/business/contact" />
    <PageShell title={c.t('intro.title')} intro={c.t('intro.text')} path="/business/contact">
      <div className="card-depth mx-auto max-w-2xl rounded-3xl p-6 sm:p-10">
        <EnquiryForm labels={labels} />
      </div>
    </PageShell>
    </>
  );
}
