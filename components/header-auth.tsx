'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { getElixirClient } from '@/lib/elixir-client';

/** The only client-side part of the header: sign-in state. */
export default function HeaderAuth({ labels }: { labels: { signin: string; join: string; signout: string } }) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = getElixirClient();
    // Signing in to Elixir Points makes you a member and picks up any points earned as a guest
    // with your verified email. Safe to repeat; done once per browser session.
    const join = () => {
      try {
        if (sessionStorage.getItem('elixir-joined')) return;
        sessionStorage.setItem('elixir-joined', '1');
      } catch {
        // storage unavailable: just try each time
      }
      supabase.rpc('elixir_join').then(() => undefined, () => undefined);
    };
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      if (data.user) join();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
      if (session?.user) join();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await getElixirClient().auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (email === undefined) return <span className="h-10 w-28" aria-hidden="true" />;
  if (email) {
    return (
      <>
      <Link href="/account" className="rounded-xl bg-elixir px-4 py-2 text-sm font-bold text-white hover:bg-elixir-dark">My Elixir</Link>
      <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border-2 border-elixir px-4 py-2 text-sm font-bold text-elixir hover:bg-elixir/5">
        <LogOut className="h-4 w-4" /> {labels.signout}
      </button>
      </>
    );
  }
  return (
    <>
      <Link href="/login" className="hidden rounded-xl border-2 border-elixir px-4 py-2 text-sm font-bold text-elixir hover:bg-elixir/5 sm:inline-block">{labels.signin}</Link>
      <Link href="/signup" className="rounded-xl bg-elixir px-4 py-2.5 text-sm font-bold text-white hover:bg-elixir-dark">{labels.join}</Link>
    </>
  );
}
