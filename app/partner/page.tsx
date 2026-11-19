import Portal from '@/components/partner/portal';

export const metadata = { title: 'Partner portal', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Portal />
    </div>
  );
}
