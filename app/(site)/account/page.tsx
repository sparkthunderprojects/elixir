import Wallet from '@/components/account/wallet';

export const metadata = { title: 'My Elixir', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Wallet />
    </div>
  );
}
