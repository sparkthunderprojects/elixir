'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

/** QR code and barcode for a card number, drawn in the browser. */
export function CardCodes({ value }: { value: string }) {
  const [qr, setQr] = useState('');
  const bar = useRef<SVGSVGElement>(null);
  useEffect(() => {
    QRCode.toString(value, { type: 'svg', margin: 1, width: 160, errorCorrectionLevel: 'M' }).then(setQr, () => setQr(''));
    if (bar.current) {
      try { JsBarcode(bar.current, value, { format: 'CODE128', displayValue: false, height: 46, margin: 0, width: 1.6 }); } catch { /* leave blank */ }
    }
  }, [value]);
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-white p-4 text-deep">
      <div className="h-32 w-32 shrink-0 overflow-hidden [&>svg]:h-full [&>svg]:w-full" role="img" aria-label="Your Elixir card QR code" dangerouslySetInnerHTML={{ __html: qr }} />
      <div className="min-w-0 flex-1">
        <svg ref={bar} className="h-12 w-full max-w-[16rem]" role="img" aria-label="Your Elixir card barcode" />
        <p className="mt-2 font-mono text-sm font-bold tracking-wider">{value}</p>
      </div>
    </div>
  );
}
