import { Smartphone } from 'lucide-react';

/**
 * "Get the app" buttons. Set NEXT_PUBLIC_ELIXIR_IOS_URL and NEXT_PUBLIC_ELIXIR_ANDROID_URL once the app is
 * live in the stores; until then they read "Coming soon" and are not links.
 */
const IOS = process.env.NEXT_PUBLIC_ELIXIR_IOS_URL;
const ANDROID = process.env.NEXT_PUBLIC_ELIXIR_ANDROID_URL;

function Badge({ href, top, name }: { href?: string; top: string; name: string }) {
  const inner = (
    <>
      <Smartphone className="h-6 w-6" aria-hidden="true" />
      <span className="text-left leading-tight"><span className="block text-[10px] font-medium opacity-80">{href ? top : 'Coming soon'}</span><span className="block text-sm font-bold">{name}</span></span>
    </>
  );
  const cls = 'inline-flex items-center gap-2.5 rounded-xl border border-white/40 bg-black px-4 py-2 text-white';
  return href ? <a href={href} rel="noopener" className={`${cls} hover:bg-white/10`}>{inner}</a> : <span className={`${cls} opacity-80`}>{inner}</span>;
}

export default function StoreBadges({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <Badge href={IOS} top="Download on the" name="App Store" />
      <Badge href={ANDROID} top="Get it on" name="Google Play" />
    </div>
  );
}
