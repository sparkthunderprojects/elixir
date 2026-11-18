import Image from 'next/image';
import type { BrandLook } from '@/lib/brands';

/** A brand shown as a tile: its logo on a background that suits it, or its name as text. */
export default function BrandTile({ look, name, className = 'h-32' }: { look?: BrandLook; name: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-2xl p-5 ${className}`} style={{ background: look?.tile ?? '#ffffff' }}>
      {look?.logo ? (
        <Image src={look.logo.src} alt={look.logo.alt || `${name} logo`} width={look.logo.width || 400} height={look.logo.height || 120} className="max-h-full w-auto max-w-full object-contain" />
      ) : (
        <span className="text-center text-sm font-extrabold uppercase tracking-wide text-deep">{name}</span>
      )}
    </div>
  );
}
