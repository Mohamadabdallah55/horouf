import { HexCell, TeamId } from '../types/game';
import { getHexNeighbors, GRID_COLS, GRID_ROWS } from './hexMath';

export interface WinCheckResult {
  hasWon: boolean;
  winner: TeamId | null;
  winningPath: number[];
}

/**
 * Checks if a specific team has formed a connected path between their two target edges
 * using Breadth-First Search (BFS) over true hexagonal neighbors.
 *
 * - Team 1 ('team1', Green): Top edge (row === 0) to Bottom edge (row === GRID_ROWS - 1)
 * - Team 2 ('team2', Orange): Left edge (col === 0) to Right edge (col === GRID_COLS - 1)
 */
export function checkTeamWin(cells: HexCell[], team: TeamId): WinCheckResult {
  const ownedSet = new Set<number>(
    cells.filter((cell) => cell.owner === team).map((cell) => cell.id)
  );

  // Starting edge cells owned by this team
  const startCellIds = cells
    .filter((cell) => {
      if (cell.owner !== team) return false;
      return team === 'team1' ? cell.row === 0 : cell.col === 0;
    })
    .map((cell) => cell.id);

  if (startCellIds.length === 0) {
    return { hasWon: false, winner: null, winningPath: [] };
  }

  // Target edge check
  const isTargetCell = (cellId: number): boolean => {
    const cell = cells[cellId];
    if (!cell) return false;
    return team === 'team1' ? cell.row === GRID_ROWS - 1 : cell.col === GRID_COLS - 1;
  };

  // Multi-source BFS to find the shortest connected path from start edge to target edge
  const queue: number[] = [];
  const parentMap = new Map<number, number | null>();

  for (const startId of startCellIds) {
    queue.push(startId);
    parentMap.set(startId, null);
  }

  let reachedTargetId: number | null = null;

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (isTargetCell(currentId)) {
      reachedTargetId = currentId;
      break;
    }

    const neighbors = getHexNeighbors(currentId);
    for (const neighborId of neighbors) {
      if (ownedSet.has(neighborId) && !parentMap.has(neighborId)) {
        parentMap.set(neighborId, currentId);
        queue.push(neighborId);
      }
    }
  }

  if (reachedTargetId === null) {
    return { hasWon: false, winner: null, winningPath: [] };
  }

  // Reconstruct the shortest winning path
  const shortestPath: number[] = [];
  let cursor: number | null = reachedTargetId;
  while (cursor !== null) {
    shortestPath.unshift(cursor);
    cursor = parentMap.get(cursor) ?? null;
  }

  // Also include any other cells in the same connected component that bridge start-to-end
  // or return the clean shortest path so the winning chain illuminates clearly
  return {
    hasWon: true,
    winner: team,
    winningPath: shortestPath,
  };
}

/**
 * Evaluates the board for either Team 1 or Team 2 victory.
 */
export function evaluateBoardWinner(cells: HexCell[]): WinCheckResult {
  const team1Result = checkTeamWin(cells, 'team1');
  if (team1Result.hasWon) {
    return team1Result;
  }

  const team2Result = checkTeamWin(cells, 'team2');
  if (team2Result.hasWon) {
    return team2Result;
  }

  return { hasWon: false, winner: null, winningPath: [] };
}
