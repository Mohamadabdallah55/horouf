import { ALL_CATEGORIES, getQuestionsByLetter } from '../data/questions';
import {
  CellOwner,
  GameAction,
  QuestionItem,
  RoomGameState,
  TeamId,
} from '../types/game';
import { createBoardCells, TOTAL_CELLS } from './hexMath';
import { evaluateBoardWinner } from './winDetector';

export const ROUND_NAMES_AR: Record<number, string> = {
  1: 'الجولة الأولى',
  2: 'الجولة الثانية',
  3: 'الجولة الثالثة',
  4: 'الجولة الرابعة',
  5: 'الجولة الخامسة',
  6: 'الجولة السادسة',
  7: 'الجولة السابعة',
};

export function getArabicRoundTitle(roundNumber: number): string {
  return ROUND_NAMES_AR[roundNumber] || `الجولة ${roundNumber}`;
}

/**
 * Picks an unused question for the specified Arabic letter.
 * Never repeats a question within the same match (`usedQuestionIds`).
 * If all questions for that letter are exhausted, returns `null` so the UI displays a clear notice.
 */
export function pickQuestionForLetter(
  letter: string,
  usedQuestionIds: string[],
  selectedCategories = ALL_CATEGORIES
): { question: QuestionItem | null; exhausted: boolean } {
  const usedSet = new Set(usedQuestionIds);
  let candidates = getQuestionsByLetter(letter, selectedCategories).filter(
    (q) => !usedSet.has(q.id)
  );

  // If filtering by selected categories left no questions, fall back to any unused question for that letter
  if (candidates.length === 0 && selectedCategories.length < ALL_CATEGORIES.length) {
    candidates = getQuestionsByLetter(letter).filter((q) => !usedSet.has(q.id));
  }

  if (candidates.length === 0) {
    return { question: null, exhausted: true };
  }

  // Deterministic-friendly first unused or random among unused?
  // Picking the first unused item in a shuffled or ordered bank is deterministic for tests while varied across letters.
  const chosen = candidates[0];
  return { question: chosen, exhausted: false };
}

/**
 * Creates a fresh initial RoomGameState.
 */
export function createInitialRoomState(
  roomCode: string = 'ELITE1',
  hostPin: string = '2026',
  autostart: boolean = false
): RoomGameState {
  const now = Date.now();
  return {
    roomCode,
    hostPin,
    version: 1,
    phase: autostart ? 'playing' : 'title',
    currentRound: 1,
    cells: createBoardCells(false),
    selectedCellId: null,
    currentQuestion: null,
    questionExhaustedForLetter: false,
    answerRevealed: false,
    usedQuestionIds: [],
    moveHistory: [],
    winningTeam: null,
    winningPath: [],
    roundHistory: [],
    team1: {
      id: 'team1',
      name: 'الفريق الأول',
      color: '#25B81B',
      darkColor: '#15803d',
      lightColor: '#4ade80',
      roundsWon: 0,
    },
    team2: {
      id: 'team2',
      name: 'الفريق الثاني',
      color: '#FF7724',
      darkColor: '#c2410c',
      lightColor: '#fb923c',
      roundsWon: 0,
    },
    settings: {
      totalRounds: 3,
      timerSeconds: 30,
      theme: 'classic',
      fontFamily: 'Cairo',
      selectedCategories: [...ALL_CATEGORIES],
      showLettersOnOwnedCells: false,
    },
    timerRemaining: 30,
    timerRunning: false,
    lastUpdatedAt: now,
    roundStartedAt: now,
  };
}

/**
 * Pure reducer that applies a GameAction to a RoomGameState and returns a new RoomGameState.
 */
export function applyGameAction(state: RoomGameState, action: GameAction): RoomGameState {
  const now = Date.now();
  const next: RoomGameState = {
    ...state,
    cells: state.cells.map((c) => ({ ...c })),
    usedQuestionIds: [...state.usedQuestionIds],
    moveHistory: [...state.moveHistory],
    winningPath: [...state.winningPath],
    roundHistory: [...state.roundHistory],
    team1: { ...state.team1 },
    team2: { ...state.team2 },
    settings: {
      ...state.settings,
      selectedCategories: [...state.settings.selectedCategories],
    },
    version: state.version + 1,
    lastUpdatedAt: now,
  };

  switch (action.type) {
    case 'START_MATCH': {
      const p = action.payload || {};
      if (p.team1Name?.trim()) next.team1.name = p.team1Name.trim();
      if (p.team2Name?.trim()) next.team2.name = p.team2Name.trim();
      if (p.team1Color) next.team1.color = p.team1Color;
      if (p.team2Color) next.team2.color = p.team2Color;
      if (typeof p.totalRounds === 'number' && p.totalRounds >= 1) {
        next.settings.totalRounds = p.totalRounds;
      }
      if (typeof p.timerSeconds === 'number' && p.timerSeconds >= 0) {
        next.settings.timerSeconds = p.timerSeconds;
      }
      if (p.theme) next.settings.theme = p.theme;
      if (p.fontFamily) next.settings.fontFamily = p.fontFamily;

      next.currentRound = 1;
      next.team1.roundsWon = 0;
      next.team2.roundsWon = 0;
      next.roundHistory = [];
      next.moveHistory = [];
      next.usedQuestionIds = [];
      next.cells = createBoardCells(false);
      next.selectedCellId = null;
      next.currentQuestion = null;
      next.questionExhaustedForLetter = false;
      next.answerRevealed = false;
      next.winningTeam = null;
      next.winningPath = [];
      next.timerRemaining = next.settings.timerSeconds;
      next.timerRunning = false;
      next.phase = 'playing';
      next.roundStartedAt = now;
      return next;
    }

    case 'FINISH_ROUND_INTRO': {
      next.phase = 'playing';
      next.roundStartedAt = now;
      return next;
    }

    case 'SELECT_CELL': {
      if (next.phase !== 'playing') return state;
      const { cellId } = action.payload;
      if (cellId < 0 || cellId >= TOTAL_CELLS) return state;
      const targetCell = next.cells[cellId];
      // Only unowned cells can be selected for a question
      if (!targetCell || targetCell.owner !== 'none') return state;

      // If clicking the already-selected cell, keep it selected
      if (next.selectedCellId === cellId && next.currentQuestion) {
        return state;
      }

      next.selectedCellId = cellId;
      next.answerRevealed = false;

      const { question, exhausted } = pickQuestionForLetter(
        targetCell.letter,
        next.usedQuestionIds,
        next.settings.selectedCategories
      );

      next.currentQuestion = question;
      next.questionExhaustedForLetter = exhausted;
      if (question) {
        next.usedQuestionIds.push(question.id);
      }

      next.timerRemaining = next.settings.timerSeconds;
      next.timerRunning = next.settings.timerSeconds > 0;
      return next;
    }

    case 'DESELECT_CELL': {
      next.selectedCellId = null;
      next.currentQuestion = null;
      next.questionExhaustedForLetter = false;
      next.answerRevealed = false;
      next.timerRunning = false;
      next.timerRemaining = next.settings.timerSeconds;
      return next;
    }

    case 'REVEAL_ANSWER': {
      if (!next.currentQuestion && next.selectedCellId === null) return state;
      next.answerRevealed = true;
      next.timerRunning = false;
      return next;
    }

    case 'HIDE_ANSWER': {
      next.answerRevealed = false;
      return next;
    }

    case 'NEW_QUESTION': {
      if (next.selectedCellId === null) return state;
      const cell = next.cells[next.selectedCellId];
      if (!cell) return state;

      next.answerRevealed = false;
      const { question, exhausted } = pickQuestionForLetter(
        cell.letter,
        next.usedQuestionIds,
        next.settings.selectedCategories
      );

      next.currentQuestion = question;
      next.questionExhaustedForLetter = exhausted;
      if (question) {
        next.usedQuestionIds.push(question.id);
      }

      next.timerRemaining = next.settings.timerSeconds;
      next.timerRunning = next.settings.timerSeconds > 0;
      return next;
    }

    case 'CLAIM_CELL': {
      if (next.phase !== 'playing') return state;
      const targetCellId =
        typeof action.payload.cellId === 'number'
          ? action.payload.cellId
          : next.selectedCellId;

      if (targetCellId === null || targetCellId < 0 || targetCellId >= TOTAL_CELLS) {
        return state;
      }

      const cell = next.cells[targetCellId];
      if (!cell) return state;

      const previousOwner = cell.owner;
      const newOwner: TeamId = action.payload.team;
      cell.owner = newOwner;

      const teamName = newOwner === 'team1' ? next.team1.name : next.team2.name;
      next.moveHistory.push({
        id: `move_${now}_${next.moveHistory.length + 1}`,
        timestamp: now,
        round: next.currentRound,
        cellId: targetCellId,
        letter: cell.letter,
        previousOwner,
        newOwner,
        description: `منح حرف (${cell.letter}) لـ ${teamName}`,
      });

      // Clear active selection and question
      next.selectedCellId = null;
      next.currentQuestion = null;
      next.questionExhaustedForLetter = false;
      next.answerRevealed = false;
      next.timerRunning = false;
      next.timerRemaining = next.settings.timerSeconds;

      // Check if this move created a winning connected path
      return evaluateAndApplyVictory(next, now);
    }

    case 'CORRECT_CELL_OWNER': {
      const { cellId, owner } = action.payload;
      if (cellId < 0 || cellId >= TOTAL_CELLS) return state;
      const cell = next.cells[cellId];
      if (!cell || cell.owner === owner) return state;

      const previousOwner = cell.owner;
      cell.owner = owner;

      const ownerLabel =
        owner === 'team1'
          ? next.team1.name
          : owner === 'team2'
          ? next.team2.name
          : 'غير مملوكة (بيضاء)';

      next.moveHistory.push({
        id: `corr_${now}_${next.moveHistory.length + 1}`,
        timestamp: now,
        round: next.currentRound,
        cellId,
        letter: cell.letter,
        previousOwner,
        newOwner: owner,
        description: `تصحيح ملكية خلية (${cell.letter}) إلى ${ownerLabel}`,
      });

      if (next.selectedCellId === cellId && owner !== 'none') {
        next.selectedCellId = null;
        next.currentQuestion = null;
        next.answerRevealed = false;
      }

      return evaluateAndApplyVictory(next, now);
    }

    case 'UNDO_MOVE': {
      // Find the last move in the current round
      const currentRoundMoves = next.moveHistory.filter(
        (m) => m.round === next.currentRound
      );
      if (currentRoundMoves.length === 0) return state;

      const lastMove = currentRoundMoves[currentRoundMoves.length - 1];
      const moveIdx = next.moveHistory.findIndex((m) => m.id === lastMove.id);
      if (moveIdx !== -1) {
        next.moveHistory.splice(moveIdx, 1);
      }

      const cell = next.cells[lastMove.cellId];
      if (cell) {
        cell.owner = lastMove.previousOwner;
      }

      // If we were in round_victory or match_victory from that move, revert the round win!
      if (next.phase === 'round_victory' || next.phase === 'match_victory') {
        const lastRoundRecord = next.roundHistory[next.roundHistory.length - 1];
        if (lastRoundRecord && lastRoundRecord.roundNumber === next.currentRound) {
          next.roundHistory.pop();
          if (lastRoundRecord.winner === 'team1') {
            next.team1.roundsWon = Math.max(0, next.team1.roundsWon - 1);
          } else {
            next.team2.roundsWon = Math.max(0, next.team2.roundsWon - 1);
          }
        }
        next.phase = 'playing';
        next.winningTeam = null;
        next.winningPath = [];
      }

      return evaluateAndApplyVictory(next, now);
    }

    case 'SHUFFLE_BOARD': {
      next.cells = createBoardCells(true);
      next.selectedCellId = null;
      next.currentQuestion = null;
      next.questionExhaustedForLetter = false;
      next.answerRevealed = false;
      next.winningTeam = null;
      next.winningPath = [];
      next.moveHistory = next.moveHistory.filter((m) => m.round !== next.currentRound);
      next.timerRunning = false;
      next.timerRemaining = next.settings.timerSeconds;
      next.phase = 'playing';
      return next;
    }

    case 'REPLAY_ROUND': {
      // If current round already recorded a win, revert that win count before replaying
      const existingWinIdx = next.roundHistory.findIndex(
        (r) => r.roundNumber === next.currentRound
      );
      if (existingWinIdx !== -1) {
        const removed = next.roundHistory[existingWinIdx];
        next.roundHistory.splice(existingWinIdx, 1);
        if (removed.winner === 'team1') {
          next.team1.roundsWon = Math.max(0, next.team1.roundsWon - 1);
        } else {
          next.team2.roundsWon = Math.max(0, next.team2.roundsWon - 1);
        }
      }

      next.cells = createBoardCells(true);
      next.selectedCellId = null;
      next.currentQuestion = null;
      next.questionExhaustedForLetter = false;
      next.answerRevealed = false;
      next.winningTeam = null;
      next.winningPath = [];
      next.moveHistory = next.moveHistory.filter((m) => m.round !== next.currentRound);
      next.timerRunning = false;
      next.timerRemaining = next.settings.timerSeconds;
      next.phase = 'playing';
      next.roundStartedAt = now;
      return next;
    }

    case 'NEXT_ROUND': {
      next.currentRound = state.currentRound + 1;
      next.cells = createBoardCells(true);
      next.selectedCellId = null;
      next.currentQuestion = null;
      next.questionExhaustedForLetter = false;
      next.answerRevealed = false;
      next.winningTeam = null;
      next.winningPath = [];
      next.timerRunning = false;
      next.timerRemaining = next.settings.timerSeconds;
      next.phase = 'playing';
      next.roundStartedAt = now;
      return next;
    }

    case 'RESET_MATCH': {
      return createInitialRoomState(state.roomCode, state.hostPin, false);
    }

    case 'TOGGLE_PAUSE': {
      if (next.phase === 'playing') {
        next.phase = 'paused';
        next.timerRunning = false;
      } else if (next.phase === 'paused') {
        next.phase = 'playing';
      }
      return next;
    }

    case 'SET_PHASE': {
      next.phase = action.payload.phase;
      return next;
    }

    case 'TIMER_START': {
      if (next.settings.timerSeconds > 0 && next.timerRemaining > 0) {
        next.timerRunning = true;
      }
      return next;
    }

    case 'TIMER_PAUSE': {
      next.timerRunning = false;
      return next;
    }

    case 'TIMER_RESET': {
      next.timerRemaining = next.settings.timerSeconds || 30;
      next.timerRunning = false;
      return next;
    }

    case 'TIMER_TICK': {
      if (!next.timerRunning) return state;
      if (next.timerRemaining > 0) {
        next.timerRemaining -= 1;
      }
      if (next.timerRemaining <= 0) {
        next.timerRemaining = 0;
        next.timerRunning = false;
      }
      return next;
    }

    case 'UPDATE_SETTINGS': {
      next.settings = {
        ...next.settings,
        ...action.payload,
      };
      if (typeof action.payload.timerSeconds === 'number') {
        next.timerRemaining = action.payload.timerSeconds;
        next.timerRunning = false;
      }
      return next;
    }

    case 'UPDATE_TEAMS': {
      if (action.payload.team1) {
        next.team1 = { ...next.team1, ...action.payload.team1 };
      }
      if (action.payload.team2) {
        next.team2 = { ...next.team2, ...action.payload.team2 };
      }
      return next;
    }

    default:
      return state;
  }
}

/**
 * Helper to evaluate win condition after any cell ownership change.
 */
function evaluateAndApplyVictory(state: RoomGameState, now: number): RoomGameState {
  const winResult = evaluateBoardWinner(state.cells);
  if (!winResult.hasWon || !winResult.winner) {
    state.winningTeam = null;
    state.winningPath = [];
    if (state.phase === 'round_victory' || state.phase === 'match_victory') {
      state.phase = 'playing';
    }
    return state;
  }

  state.winningTeam = winResult.winner;
  state.winningPath = winResult.winningPath;
  state.timerRunning = false;

  // Record round win if not already recorded for this round
  const alreadyRecorded = state.roundHistory.some(
    (r) => r.roundNumber === state.currentRound
  );

  if (!alreadyRecorded) {
    if (winResult.winner === 'team1') {
      state.team1.roundsWon += 1;
    } else {
      state.team2.roundsWon += 1;
    }

    const team1Cells = state.cells.filter((c) => c.owner === 'team1').length;
    const team2Cells = state.cells.filter((c) => c.owner === 'team2').length;

    state.roundHistory.push({
      roundNumber: state.currentRound,
      winner: winResult.winner,
      winnerName:
        winResult.winner === 'team1' ? state.team1.name : state.team2.name,
      winningPath: [...winResult.winningPath],
      team1Cells,
      team2Cells,
      durationSeconds: Math.max(
        1,
        Math.round((now - state.roundStartedAt) / 1000)
      ),
    });
  }

  const majorityRounds = Math.ceil(state.settings.totalRounds / 2);
  const isMatchWon =
    state.team1.roundsWon >= majorityRounds ||
    state.team2.roundsWon >= majorityRounds ||
    state.currentRound >= state.settings.totalRounds;

  state.phase = isMatchWon ? 'match_victory' : 'round_victory';
  return state;
}
