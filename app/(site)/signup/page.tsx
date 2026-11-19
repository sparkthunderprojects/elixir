import Link from 'next/link';
import SignupForm from '@/components/signup-form';

export const metadata = { title: 'Join Elixir Points', robots: { index: false, follow: false } };

export default async function Page(props: { searchParams?: Promise<{ next?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-2xl font-bold text-deep">Join Elixir Points</h1>
      <p className="mt-2 text-sm text-body">Create a free account. It also works on every Sparkthunder site.</p>
      <div className="mt-6 card-depth rounded-3xl p-6 sm:p-8">
        <SignupForm next={searchParams?.next} />
      </div>
      <p className="mt-4 text-center text-sm text-body">Already have an account? <Link href="/login" className="font-medium text-elixir hover:underline">Sign in</Link></p>
    </div>
  );
}
