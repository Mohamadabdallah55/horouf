import { HexCell } from '../types/game';

export const GRID_ROWS = 5;
export const GRID_COLS = 5;
export const TOTAL_CELLS = GRID_ROWS * GRID_COLS; // 25

/**
 * Arabic letters pool (all 28 letters).
 * The default 25 board letters prioritize the classic 25 letters shown in the TV game,
 * while shuffling can draw from all 28 Arabic letters.
 */
export const ALL_ARABIC_LETTERS: string[] = [
  'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ',
  'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص',
  'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق',
  'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'
];

/**
 * Default 25 balanced letters matching the reference screenshot board
 */
export const DEFAULT_25_LETTERS: string[] = [
  'هـ', 'ث', 'ل', 'ع', 'ت',
  'ب', 'ص', 'ق', 'ذ', 'ج',
  'ر', 'ح', 'ز', 'غ', 'ف',
  'ك', 'ط', 'ن', 'ش', 'و',
  'ض', 'خ', 'أ', 'ي', 'م'
];

/**
 * Converts (row, col) to cell ID (0..24)
 */
export function toCellId(row: number, col: number): number {
  return row * GRID_COLS + col;
}

/**
 * Converts cell ID (0..24) to { row, col }
 */
export function fromCellId(cellId: number): { row: number; col: number } {
  return {
    row: Math.floor(cellId / GRID_COLS),
    col: cellId % GRID_COLS,
  };
}

/**
 * Computes the actual hexagonal neighbors for a cell in a 5x5 pointy-top "odd-r" staggered grid.
 *
 * In the reference board:
 * - Row 0, 2, 4 (even rows) are shifted left (offset = 0)
 * - Row 1, 3 (odd rows) are shifted right by +0.5 hex width
 *
 * Therefore:
 * - For EVEN row (r % 2 === 0):
 *   - Same row: (r, c - 1), (r, c + 1)
 *   - Row above (r - 1): (r - 1, c - 1) [top-left], (r - 1, c) [top-right]
 *   - Row below (r + 1): (r + 1, c - 1) [bottom-left], (r + 1, c) [bottom-right]
 *
 * - For ODD row (r % 2 === 1):
 *   - Same row: (r, c - 1), (r, c + 1)
 *   - Row above (r - 1): (r - 1, c) [top-left], (r - 1, c + 1) [top-right]
 *   - Row below (r + 1): (r + 1, c) [bottom-left], (r + 1, c + 1) [bottom-right]
 */
export function getHexNeighbors(cellId: number): number[] {
  if (cellId < 0 || cellId >= TOTAL_CELLS) return [];
  const { row, col } = fromCellId(cellId);
  const isOddRow = row % 2 === 1;

  const candidateCoords: Array<[number, number]> = isOddRow
    ? [
        [row, col - 1],     // Left
        [row, col + 1],     // Right
        [row - 1, col],     // Top-Left
        [row - 1, col + 1], // Top-Right
        [row + 1, col],     // Bottom-Left
        [row + 1, col + 1], // Bottom-Right
      ]
    : [
        [row, col - 1],     // Left
        [row, col + 1],     // Right
        [row - 1, col - 1], // Top-Left
        [row - 1, col],     // Top-Right
        [row + 1, col - 1], // Bottom-Left
        [row + 1, col],     // Bottom-Right
      ];

  const neighbors: number[] = [];
  for (const [r, c] of candidateCoords) {
    if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
      neighbors.push(toCellId(r, c));
    }
  }
  return neighbors;
}

/**
 * Checks whether two cells share a hexagonal edge.
 */
export function areHexesAdjacent(cellA: number, cellB: number): boolean {
  return getHexNeighbors(cellA).includes(cellB);
}

/**
 * Calculates the (cx, cy) SVG center point for a pointy-top hexagon at (row, col).
 * For a regular pointy-top hexagon of circumradius R:
 * - width W = sqrt(3) * R
 * - height H = 2 * R
 * - horizontal center-to-center spacing = W
 * - vertical center-to-center spacing = 1.5 * R
 */
export function getHexCenter(
  row: number,
  col: number,
  radius: number,
  originX: number,
  originY: number,
  gap: number = 0
): { cx: number; cy: number } {
  const hexWidth = Math.sqrt(3) * radius + gap;
  const vertSpacing = 1.5 * radius + gap * 0.866;
  const xOffset = row % 2 === 1 ? hexWidth * 0.5 : 0;

  return {
    cx: originX + col * hexWidth + xOffset,
    cy: originY + row * vertSpacing,
  };
}

/**
 * Returns the SVG polygon points string for a pointy-top hexagon centered at (cx, cy).
 * Angles for pointy-top hex: -90°, -30°, 30°, 90°, 150°, 210°
 */
export function getHexPolygonPoints(cx: number, cy: number, radius: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i - 90;
    const angleRad = (Math.PI / 180) * angleDeg;
    const x = cx + radius * Math.cos(angleRad);
    const y = cy + radius * Math.sin(angleRad);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(' ');
}

/**
 * Creates a rounded pointy-top hexagon SVG path for an ultra-clean TV studio look.
 */
export function getRoundedHexPath(cx: number, cy: number, radius: number, cornerRadius: number = 6): string {
  const vertices: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 6; i++) {
    const angleRad = (Math.PI / 180) * (60 * i - 90);
    vertices.push({
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad),
    });
  }

  const parts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const prev = vertices[(i + 5) % 6];
    const curr = vertices[i];
    const next = vertices[(i + 1) % 6];

    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const len1 = Math.hypot(dx1, dy1);

    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const len2 = Math.hypot(dx2, dy2);

    const r = Math.min(cornerRadius, len1 / 3, len2 / 3);

    const p1x = curr.x - (dx1 / len1) * r;
    const p1y = curr.y - (dy1 / len1) * r;
    const p2x = curr.x + (dx2 / len2) * r;
    const p2y = curr.y + (dy2 / len2) * r;

    if (i === 0) {
      parts.push(`M ${p1x.toFixed(2)} ${p1y.toFixed(2)}`);
    } else {
      parts.push(`L ${p1x.toFixed(2)} ${p1y.toFixed(2)}`);
    }
    parts.push(`Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${p2x.toFixed(2)} ${p2y.toFixed(2)}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

/**
 * Generates 25 HexCell objects using either the balanced default order or a newly shuffled 25-letter selection.
 */
export function createBoardCells(shuffle: boolean = false, customSeedLetters?: string[]): HexCell[] {
  let chosenLetters: string[];
  if (customSeedLetters && customSeedLetters.length === TOTAL_CELLS) {
    chosenLetters = [...customSeedLetters];
  } else if (!shuffle) {
    chosenLetters = [...DEFAULT_25_LETTERS];
  } else {
    // Shuffle all 28 Arabic letters using Fisher-Yates and pick 25 balanced letters
    const pool = [...ALL_ARABIC_LETTERS];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    chosenLetters = pool.slice(0, TOTAL_CELLS);
  }

  const cells: HexCell[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const id = toCellId(r, c);
      cells.push({
        id,
        row: r,
        col: c,
        letter: chosenLetters[id],
        owner: 'none',
      });
    }
  }
  return cells;
}
