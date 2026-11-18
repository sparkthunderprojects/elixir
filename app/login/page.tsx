import Link from 'next/link';
import LoginForm from '@/components/login-form';

export const metadata = { title: 'Sign in', robots: { index: false, follow: false } };

export default function Page({ searchParams }: { searchParams?: { next?: string } }) {
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-2xl font-bold text-deep">Sign in</h1>
      <p className="mt-2 text-sm text-body">Use your My Sparkthunder email and password. It is the same account.</p>
      <div className="mt-6 rounded-3xl bg-white p-6 sm:p-8">
        <LoginForm next={searchParams?.next} />
      </div>
      <p className="mt-4 text-center text-sm text-body">New here? <Link href="/signup" className="font-medium text-elixir hover:underline">Join free</Link></p>
    </div>
  );
}
