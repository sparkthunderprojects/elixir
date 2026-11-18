import { ImageResponse } from 'next/og';

export const alt = 'Elixir Points: one rewards balance across every Sparkthunder brand';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', height: '100%', padding: 80, background: 'linear-gradient(135deg,#1d3557,#12213a)', color: 'white' }}>
        <div style={{ display: 'flex', width: 96, height: 96, borderRadius: 48, background: '#bd3141', alignItems: 'center', justifyContent: 'center', fontSize: 64, fontWeight: 800 }}>e</div>
        <div style={{ display: 'flex', fontSize: 84, fontWeight: 800, marginTop: 36 }}>Elixir Points</div>
        <div style={{ display: 'flex', fontSize: 38, marginTop: 16, color: '#cbd5e1' }}>One rewards balance across every Sparkthunder brand</div>
      </div>
    ),
    size,
  );
}
