import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/page-shell';
import { pageMetadata } from '@/lib/seo';
import { MYSPARKTHUNDER_URL } from '@/lib/config';

export const metadata: Metadata = pageMetadata('Support', 'Get help with your Elixir Points account, balance, rewards or card.', '/support');

const EMAIL = process.env.NEXT_PUBLIC_ELIXIR_SUPPORT_EMAIL || 'support@elixirpoints.com';

export default function Page() {
  return (
    <PageShell title="Support" intro="Help with your points, card, rewards or account." path="/support">
      <div className="mx-auto max-w-2xl space-y-6 text-body">
        <section className="card-depth rounded-3xl p-6">
          <h2 className="text-xl font-extrabold text-deep">Contact us</h2>
          <p className="mt-2">Email <a className="font-bold text-elixir underline underline-offset-4" href={`mailto:${EMAIL}`}>{EMAIL}</a> with your Elixir card number (shown on the My Elixir page) and we will get back to you.</p>
        </section>
        <section className="card-depth rounded-3xl p-6">
          <h2 className="text-xl font-extrabold text-deep">Quick answers</h2>
          <p className="mt-2">Most questions are answered in the <Link className="font-bold text-elixir underline underline-offset-4" href="/faq">FAQ</Link>.</p>
        </section>
        <section className="card-depth rounded-3xl p-6">
          <h2 className="text-xl font-extrabold text-deep">Delete your account</h2>
          <p className="mt-2">Sign in, open My Elixir, scroll to the bottom and choose Delete my Elixir account. Your name and email are removed from your Elixir membership and any remaining points are lost.</p>
        </section>
        <p className="text-sm">Terms and privacy: <a className="font-semibold text-elixir underline underline-offset-4" href={`${MYSPARKTHUNDER_URL}/terms`}>Terms</a> · <a className="font-semibold text-elixir underline underline-offset-4" href={`${MYSPARKTHUNDER_URL}/privacy`}>Privacy</a></p>
      </div>
    </PageShell>
  );
}
