import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Staff dashboard', robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="elixir-admin min-h-[70vh]">{children}</div>;
}
