import Link from 'next/link';
import SignupForm from '@/components/signup-form';

export const metadata = { title: 'Join Elixir Points' };

export default function Page({ searchParams }: { searchParams?: { next?: string } }) {
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-2xl font-bold text-navy">Join Elixir Points</h1>
      <p className="mt-2 text-sm text-slate-600">Create a free account. It also works on every Sparkthunder site.</p>
      <div className="mt-6 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <SignupForm next={searchParams?.next} />
      </div>
      <p className="mt-4 text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="font-medium text-elixir hover:underline">Sign in</Link></p>
    </div>
  );
}
