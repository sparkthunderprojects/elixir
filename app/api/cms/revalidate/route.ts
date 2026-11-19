import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Called by the editor after publishing. Only Elixir staff may trigger it. */
export async function POST() {
  const { data, error } = await (await createServerSupabase()).rpc('elixir_is_staff');
  if (error || data !== true) return NextResponse.json({ ok: false }, { status: 403 });
  revalidateTag('cms', 'max');
  revalidateTag('programme', 'max');
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
