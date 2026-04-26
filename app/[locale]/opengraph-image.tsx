import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Owlmode — free retro mini-games';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OWL_SVG = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" width="380" height="380"><rect x="6" y="2" width="3" height="3" fill="#7c2d12"/><rect x="23" y="2" width="3" height="3" fill="#7c2d12"/><rect x="5" y="5" width="22" height="3" fill="#7c2d12"/><rect x="4" y="6" width="24" height="22" fill="#92400e"/><rect x="5" y="28" width="22" height="2" fill="#7c2d12"/><rect x="7" y="9" width="18" height="9" fill="#fbbf24"/><rect x="9" y="10" width="6" height="6" fill="#fff"/><rect x="17" y="10" width="6" height="6" fill="#fff"/><rect x="11" y="11" width="3" height="3" fill="#0a0a0a"/><rect x="19" y="11" width="3" height="3" fill="#0a0a0a"/><rect x="12" y="11" width="1" height="1" fill="#fff"/><rect x="20" y="11" width="1" height="1" fill="#fff"/><rect x="14" y="16" width="4" height="2" fill="#f97316"/><rect x="15" y="18" width="2" height="1" fill="#ea580c"/><rect x="9" y="20" width="14" height="6" fill="#fbbf24"/><rect x="11" y="22" width="2" height="1" fill="#92400e"/><rect x="15" y="22" width="2" height="1" fill="#92400e"/><rect x="19" y="22" width="2" height="1" fill="#92400e"/><rect x="13" y="24" width="2" height="1" fill="#92400e"/><rect x="17" y="24" width="2" height="1" fill="#92400e"/><rect x="11" y="29" width="3" height="2" fill="#f97316"/><rect x="18" y="29" width="3" height="2" fill="#f97316"/></svg>`;

const OWL_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(OWL_SVG).toString('base64')}`;

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #0a0a0a 0%, #1c1917 60%, #422006 100%)',
          fontFamily: 'sans-serif',
          padding: 60,
          gap: 60,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={OWL_DATA_URL} width={380} height={380} alt="" />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 150,
              fontWeight: 900,
              letterSpacing: -4,
              color: '#fbbf24',
              lineHeight: 1,
            }}
          >
            Owlmode
          </div>
          <div
            style={{
              fontSize: 36,
              color: '#a3a3a3',
              letterSpacing: 1,
            }}
          >
            40 free retro mini-games
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
