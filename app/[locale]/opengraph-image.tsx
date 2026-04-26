import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Owlmode — free retro mini-games';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #0a0a0a 0%, #1c1917 60%, #422006 100%)',
          fontFamily: 'system-ui, sans-serif',
          color: '#fbbf24',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 32,
          }}
        >
          {/* Pixel owl rendered as inline divs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(32, 8px)',
              gridTemplateRows: 'repeat(32, 8px)',
              gap: 0,
            }}
          >
            {(() => {
              const KEY = {
                '.': 'transparent',
                D: '#7c2d12',
                B: '#92400e',
                Y: '#fbbf24',
                W: '#ffffff',
                K: '#0a0a0a',
                O: '#f97316',
                R: '#ea580c',
              } as const;
              type Code = keyof typeof KEY;
              const ART: string[] = [
                '................................',
                '................................',
                '......DDD.................DDD...',
                '......DDD.................DDD...',
                '......DDD.................DDD...',
                '....DDDDDDDDDDDDDDDDDDDDDDDD....',
                '...DBBBBBBBBBBBBBBBBBBBBBBBB....',
                '...DBBBBBBBBBBBBBBBBBBBBBBBB....',
                '...DBBBBBBBBBBBBBBBBBBBBBBBB....',
                '...DBBBYYYYYYYYYYYYYYYYYYBBB....',
                '...DBBBYWWWWWWYYYYWWWWWWYBBB....',
                '...DBBBYWKKKWWYYYYWWKKKWYBBB....',
                '...DBBBYWKKKWWYYYYWWKKKWYBBB....',
                '...DBBBYWKKKWWYYYYWWKKKWYBBB....',
                '...DBBBYWWWWWWYYYYWWWWWWYBBB....',
                '...DBBBYYYYYYYYYYYYYYYYYYBBB....',
                '...DBBBBBBBBBBOOOOBBBBBBBBBB....',
                '...DBBBBBBBBBBOOOOBBBBBBBBBB....',
                '...DBBBBBBBBBBBRRBBBBBBBBBBB....',
                '...DBBBBBBBBBBBBBBBBBBBBBBBB....',
                '...DBBBYYYYYYYYYYYYYYYYYYBBB....',
                '...DBBBYYYYYYYYYYYYYYYYYYBBB....',
                '...DBBBYBBYYYYBBYYYYBBYYYYBB....',
                '...DBBBYYYYYYYYYYYYYYYYYYBBB....',
                '...DBBBYYBBYYYYBBYYYYBBYYYBB....',
                '...DBBBYYYYYYYYYYYYYYYYYYBBB....',
                '...DBBBBBBBBBBBBBBBBBBBBBBBB....',
                '....DDDDDDDDDDDDDDDDDDDDDDDD....',
                '......OOO.............OOO.......',
                '......OOO.............OOO.......',
                '................................',
                '................................',
              ];
              const cells: React.ReactElement[] = [];
              for (let r = 0; r < 32; r++) {
                for (let c = 0; c < 32; c++) {
                  const code = (ART[r]?.[c] ?? '.') as Code;
                  cells.push(
                    <div
                      key={`${r}-${c}`}
                      style={{ background: KEY[code] }}
                    />
                  );
                }
              }
              return cells;
            })()}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 140,
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
                fontSize: 32,
                color: '#a3a3a3',
                letterSpacing: 1,
              }}
            >
              40 free retro mini-games
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
