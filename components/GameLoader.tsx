'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { GameSlug } from '@/lib/games';

const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
]);

function useBlockScrollKeys() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
      }
      if (SCROLL_KEYS.has(e.key)) e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

const Loading = () => (
  <div className="flex h-40 items-center justify-center text-sm text-neutral-500">
    Loading...
  </div>
);

const COMPONENTS = {
  'tic-tac-toe': dynamic(() => import('@/games/tic-tac-toe/GameTicTacToe'), {
    ssr: false,
    loading: Loading,
  }),
  rps: dynamic(() => import('@/games/rps/GameRps'), {
    ssr: false,
    loading: Loading,
  }),
  'memory-match': dynamic(
    () => import('@/games/memory-match/GameMemoryMatch'),
    { ssr: false, loading: Loading }
  ),
  snake: dynamic(() => import('@/games/snake/GameSnake'), {
    ssr: false,
    loading: Loading,
  }),
  'whack-a-mole': dynamic(
    () => import('@/games/whack-a-mole/GameWhackAMole'),
    { ssr: false, loading: Loading }
  ),
  '2048': dynamic(() => import('@/games/2048/Game2048'), {
    ssr: false,
    loading: Loading,
  }),
  minesweeper: dynamic(
    () => import('@/games/minesweeper/GameMinesweeper'),
    { ssr: false, loading: Loading }
  ),
  breakout: dynamic(() => import('@/games/breakout/GameBreakout'), {
    ssr: false,
    loading: Loading,
  }),
  sudoku: dynamic(() => import('@/games/sudoku/GameSudoku'), {
    ssr: false,
    loading: Loading,
  }),
  pong: dynamic(() => import('@/games/pong/GamePong'), {
    ssr: false,
    loading: Loading,
  }),
  'block-stack': dynamic(
    () => import('@/games/block-stack/GameBlockStack'),
    { ssr: false, loading: Loading }
  ),
  flappy: dynamic(() => import('@/games/flappy/GameFlappy'), {
    ssr: false,
    loading: Loading,
  }),
  'fifteen-puzzle': dynamic(
    () => import('@/games/fifteen-puzzle/GameFifteenPuzzle'),
    { ssr: false, loading: Loading }
  ),
  'connect-four': dynamic(
    () => import('@/games/connect-four/GameConnectFour'),
    { ssr: false, loading: Loading }
  ),
  'simon-says': dynamic(() => import('@/games/simon-says/GameSimonSays'), {
    ssr: false,
    loading: Loading,
  }),
  'maze-muncher': dynamic(
    () => import('@/games/maze-muncher/GameMazeMuncher'),
    { ssr: false, loading: Loading }
  ),
  asteroids: dynamic(() => import('@/games/asteroids/GameAsteroids'), {
    ssr: false,
    loading: Loading,
  }),
  solitaire: dynamic(() => import('@/games/solitaire/GameSolitaire'), {
    ssr: false,
    loading: Loading,
  }),
  'bubble-shooter': dynamic(
    () => import('@/games/bubble-shooter/GameBubbleShooter'),
    { ssr: false, loading: Loading }
  ),
  'space-invaders': dynamic(
    () => import('@/games/space-invaders/GameSpaceInvaders'),
    { ssr: false, loading: Loading }
  ),
  frogger: dynamic(() => import('@/games/frogger/GameFrogger'), {
    ssr: false,
    loading: Loading,
  }),
  'dino-run': dynamic(() => import('@/games/dino-run/GameDinoRun'), {
    ssr: false,
    loading: Loading,
  }),
  'doodle-jump': dynamic(() => import('@/games/doodle-jump/GameDoodleJump'), {
    ssr: false,
    loading: Loading,
  }),
  helicopter: dynamic(() => import('@/games/helicopter/GameHelicopter'), {
    ssr: false,
    loading: Loading,
  }),
  'crossy-road': dynamic(() => import('@/games/crossy-road/GameCrossyRoad'), {
    ssr: false,
    loading: Loading,
  }),
  'galaxy-shooter': dynamic(
    () => import('@/games/galaxy-shooter/GameGalaxyShooter'),
    { ssr: false, loading: Loading }
  ),
  pinball: dynamic(() => import('@/games/pinball/GamePinball'), {
    ssr: false,
    loading: Loading,
  }),
  'bomberman-mini': dynamic(
    () => import('@/games/bomberman-mini/GameBombermanMini'),
    { ssr: false, loading: Loading }
  ),
  centipede: dynamic(() => import('@/games/centipede/GameCentipede'), {
    ssr: false,
    loading: Loading,
  }),
  'tank-battle': dynamic(() => import('@/games/tank-battle/GameTankBattle'), {
    ssr: false,
    loading: Loading,
  }),
  sokoban: dynamic(() => import('@/games/sokoban/GameSokoban'), {
    ssr: false,
    loading: Loading,
  }),
  'lights-out': dynamic(() => import('@/games/lights-out/GameLightsOut'), {
    ssr: false,
    loading: Loading,
  }),
  'tower-of-hanoi': dynamic(
    () => import('@/games/tower-of-hanoi/GameTowerOfHanoi'),
    { ssr: false, loading: Loading }
  ),
  klotski: dynamic(() => import('@/games/klotski/GameKlotski'), {
    ssr: false,
    loading: Loading,
  }),
  'match-three': dynamic(() => import('@/games/match-three/GameMatchThree'), {
    ssr: false,
    loading: Loading,
  }),
  'pipe-connect': dynamic(
    () => import('@/games/pipe-connect/GamePipeConnect'),
    { ssr: false, loading: Loading }
  ),
  'mahjong-solitaire': dynamic(
    () => import('@/games/mahjong-solitaire/GameMahjongSolitaire'),
    { ssr: false, loading: Loading }
  ),
  'word-search': dynamic(() => import('@/games/word-search/GameWordSearch'), {
    ssr: false,
    loading: Loading,
  }),
  reversi: dynamic(() => import('@/games/reversi/GameReversi'), {
    ssr: false,
    loading: Loading,
  }),
  'air-hockey': dynamic(() => import('@/games/air-hockey/GameAirHockey'), {
    ssr: false,
    loading: Loading,
  }),
} as const;

export default function GameLoader({ slug }: { slug: GameSlug }) {
  useBlockScrollKeys();
  const Component = COMPONENTS[slug as keyof typeof COMPONENTS];
  if (!Component) {
    return (
      <div className="text-sm text-neutral-500">Game not available.</div>
    );
  }
  return <Component />;
}
