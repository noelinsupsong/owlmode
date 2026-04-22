export type GameSlug =
  | 'tic-tac-toe'
  | 'rps'
  | 'memory-match'
  | 'snake'
  | 'whack-a-mole'
  | '2048'
  | 'minesweeper'
  | 'breakout'
  | 'sudoku'
  | 'pong'
  | 'block-stack'
  | 'flappy'
  | 'fifteen-puzzle'
  | 'connect-four'
  | 'simon-says'
  | 'maze-muncher'
  | 'asteroids'
  | 'solitaire'
  | 'bubble-shooter'
  | 'space-invaders'
  | 'frogger'
  | 'dino-run'
  | 'doodle-jump'
  | 'helicopter'
  | 'crossy-road'
  | 'galaxy-shooter'
  | 'pinball'
  | 'bomberman-mini'
  | 'centipede'
  | 'tank-battle'
  | 'sokoban'
  | 'lights-out'
  | 'tower-of-hanoi'
  | 'klotski'
  | 'match-three'
  | 'pipe-connect'
  | 'mahjong-solitaire'
  | 'word-search'
  | 'reversi'
  | 'air-hockey';

export type GameGenre =
  | 'puzzle'
  | 'arcade'
  | 'board'
  | 'memory'
  | 'casual'
  | 'action'
  | 'card'
  | 'shooter'
  | 'block';

export interface GameMeta {
  slug: GameSlug;
  genre: GameGenre;
  enabled: boolean;
  popularity: number;
  /** Big visual icon shown on the game card thumbnail */
  icon: string;
}

export const GAMES: readonly GameMeta[] = [
  { slug: 'tic-tac-toe', genre: 'board', enabled: true, popularity: 100, icon: '⭕' },
  { slug: 'rps', genre: 'casual', enabled: true, popularity: 95, icon: '✌️' },
  { slug: 'memory-match', genre: 'memory', enabled: true, popularity: 90, icon: '🃏' },
  { slug: 'snake', genre: 'arcade', enabled: true, popularity: 88, icon: '🐍' },
  { slug: 'whack-a-mole', genre: 'action', enabled: true, popularity: 85, icon: '🐹' },
  { slug: '2048', genre: 'puzzle', enabled: true, popularity: 80, icon: '🔢' },
  { slug: 'minesweeper', genre: 'puzzle', enabled: true, popularity: 78, icon: '💣' },
  { slug: 'breakout', genre: 'arcade', enabled: true, popularity: 75, icon: '🧱' },
  { slug: 'sudoku', genre: 'puzzle', enabled: true, popularity: 72, icon: '🧩' },
  { slug: 'pong', genre: 'arcade', enabled: true, popularity: 70, icon: '🏓' },
  { slug: 'block-stack', genre: 'block', enabled: true, popularity: 68, icon: '🟦' },
  { slug: 'flappy', genre: 'arcade', enabled: true, popularity: 65, icon: '🐦' },
  { slug: 'fifteen-puzzle', genre: 'puzzle', enabled: true, popularity: 60, icon: '🔀' },
  { slug: 'connect-four', genre: 'board', enabled: true, popularity: 58, icon: '🔴' },
  { slug: 'simon-says', genre: 'memory', enabled: true, popularity: 55, icon: '🎵' },
  { slug: 'maze-muncher', genre: 'arcade', enabled: true, popularity: 52, icon: '👻' },
  { slug: 'asteroids', genre: 'arcade', enabled: true, popularity: 50, icon: '☄️' },
  { slug: 'solitaire', genre: 'card', enabled: true, popularity: 48, icon: '🂡' },
  { slug: 'bubble-shooter', genre: 'puzzle', enabled: true, popularity: 45, icon: '🫧' },
  { slug: 'space-invaders', genre: 'shooter', enabled: true, popularity: 42, icon: '👾' },
  { slug: 'frogger', genre: 'arcade', enabled: true, popularity: 40, icon: '🐸' },
  { slug: 'dino-run', genre: 'arcade', enabled: true, popularity: 38, icon: '🦖' },
  { slug: 'doodle-jump', genre: 'arcade', enabled: true, popularity: 36, icon: '🦘' },
  { slug: 'helicopter', genre: 'arcade', enabled: true, popularity: 34, icon: '🚁' },
  { slug: 'crossy-road', genre: 'arcade', enabled: true, popularity: 32, icon: '🐔' },
  { slug: 'galaxy-shooter', genre: 'shooter', enabled: true, popularity: 30, icon: '🚀' },
  { slug: 'pinball', genre: 'arcade', enabled: true, popularity: 28, icon: '🔮' },
  { slug: 'bomberman-mini', genre: 'action', enabled: true, popularity: 26, icon: '💥' },
  { slug: 'centipede', genre: 'shooter', enabled: true, popularity: 24, icon: '🐛' },
  { slug: 'tank-battle', genre: 'shooter', enabled: true, popularity: 22, icon: '🛡️' },
  { slug: 'sokoban', genre: 'puzzle', enabled: true, popularity: 20, icon: '📦' },
  { slug: 'lights-out', genre: 'puzzle', enabled: true, popularity: 18, icon: '💡' },
  { slug: 'tower-of-hanoi', genre: 'puzzle', enabled: true, popularity: 16, icon: '🗼' },
  { slug: 'klotski', genre: 'puzzle', enabled: true, popularity: 14, icon: '🧱' },
  { slug: 'match-three', genre: 'puzzle', enabled: true, popularity: 12, icon: '💎' },
  { slug: 'pipe-connect', genre: 'puzzle', enabled: true, popularity: 10, icon: '🔗' },
  { slug: 'mahjong-solitaire', genre: 'memory', enabled: true, popularity: 8, icon: '🀄' },
  { slug: 'word-search', genre: 'puzzle', enabled: true, popularity: 6, icon: '🔤' },
  { slug: 'reversi', genre: 'board', enabled: true, popularity: 4, icon: '⚫' },
  { slug: 'air-hockey', genre: 'arcade', enabled: true, popularity: 2, icon: '🏒' },
] as const;

export function getGame(slug: string): GameMeta | undefined {
  return GAMES.find((g) => g.slug === slug);
}

export const ENABLED_SLUGS = GAMES.filter((g) => g.enabled).map((g) => g.slug);
