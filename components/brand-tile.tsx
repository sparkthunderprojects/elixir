import Image from 'next/image';
import { BRAND_LOOKS } from '@/lib/brands';

/** A brand shown as a tile: its logo on a background that suits it, or its name as text. */
export default function BrandTile({ slug, name, className = 'h-32' }: { slug: string; name: string; className?: string }) {
  const look = BRAND_LOOKS[slug];
  return (
    <div className={`flex items-center justify-center rounded-2xl p-5 ${className}`} style={{ background: look?.tile ?? '#ffffff' }}>
      {look?.logo ? (
        <Image src={look.logo.src} alt={`${name} logo`} width={look.logo.width} height={look.logo.height} className="max-h-full w-auto max-w-full object-contain" />
      ) : (
        <span className="text-center text-sm font-extrabold uppercase tracking-wide text-deep">{name}</span>
      )}
    </div>
  );
}
