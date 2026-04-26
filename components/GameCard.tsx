import fs from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { GameGenre, GameMeta } from '@/lib/games';

const GENRE_BAR: Record<GameGenre, string> = {
  puzzle: 'bg-blue-500',
  arcade: 'bg-amber-500',
  board: 'bg-emerald-500',
  memory: 'bg-fuchsia-500',
  casual: 'bg-pink-500',
  action: 'bg-orange-500',
  card: 'bg-teal-500',
  shooter: 'bg-cyan-500',
  block: 'bg-violet-500',
};

async function findThumbnail(slug: string): Promise<string | null> {
  const exts = ['png', 'webp', 'jpg', 'jpeg'];
  for (const ext of exts) {
    const p = path.join(
      process.cwd(),
      'public',
      'thumbnails',
      `${slug}.${ext}`
    );
    try {
      await fs.access(p);
      return `/thumbnails/${slug}.${ext}`;
    } catch {
      // not found, try next
    }
  }
  return null;
}

export default async function GameCard({
  game,
  locale,
}: {
  game: GameMeta;
  locale: string;
}) {
  const t = await getTranslations();
  const name = t(`games.${game.slug}.name`);
  const desc = t(`games.${game.slug}.desc`);
  const thumb = await findThumbnail(game.slug);

  const inner = (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 transition duration-200 ${
        game.enabled
          ? 'hover:-translate-y-0.5 hover:border-amber-400/60 hover:bg-neutral-800/80'
          : 'opacity-40'
      }`}
    >
      <div className={`absolute inset-x-0 top-0 z-10 h-0.5 ${GENRE_BAR[game.genre]}`} />

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-950">
        {thumb ? (
          <Image
            src={thumb}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-90 transition duration-200 group-hover:scale-105 sm:text-6xl">
              {game.icon}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 p-3">
        <h3 className="truncate font-mono text-sm font-semibold text-neutral-100">
          {name}
        </h3>
        <p className="line-clamp-2 text-xs leading-snug text-neutral-400">
          {desc}
        </p>
      </div>

      {!game.enabled && (
        <div className="absolute right-2 top-2 z-20 rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neutral-300">
          {t('common.comingSoon')}
        </div>
      )}
    </div>
  );

  if (!game.enabled) {
    return <div aria-disabled>{inner}</div>;
  }

  return (
    <Link
      href={`/${locale}/games/${game.slug}`}
      className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-neutral-950"
    >
      {inner}
    </Link>
  );
}
