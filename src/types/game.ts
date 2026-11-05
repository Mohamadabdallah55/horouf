export type TeamId = 'team1' | 'team2';
export type CellOwner = 'none' | TeamId;
export type ClientRole = 'studio' | 'display' | 'team1' | 'team2';

export type QuestionCategory =
  | 'معلومات عامة'
  | 'علوم'
  | 'تاريخ'
  | 'جغرافيا'
  | 'رياضة'
  | 'ثقافة عربية'
  | 'معلومات إسلامية'
  | 'ألغاز';

export interface QuestionItem {
  id: string;
  letter: string;
  question: string;
  answer: string;
  category: QuestionCategory;
}

export interface HexCell {
  id: number; // 0 to 24
  row: number; // 0 to 4
  col: number; // 0 to 4
  letter: string;
  owner: CellOwner;
}

export interface MoveRecord {
  id: string;
  timestamp: number;
  round: number;
  cellId: number;
  letter: string;
  previousOwner: CellOwner;
  newOwner: CellOwner;
  description: string;
}

export type VisualThemeId = 'classic' | 'elite_clash' | 'royal_night';
export type FontFamilyId = 'Cairo' | 'Alexandria' | 'Tajawal' | 'Changa';

export interface TeamConfig {
  id: TeamId;
  name: string;
  color: string;
  darkColor: string;
  lightColor: string;
  roundsWon: number;
}

export interface GameSettings {
  totalRounds: number; // 1, 3, 5, 7
  timerSeconds: number; // 0 = disabled, or 15, 30, 45, 60
  answerTimerSeconds: number; // Countdown after buzzing in, default 10s
  autoOpenBuzzerOnQuestion: boolean; // Automatically open buzzer when question appears
  theme: VisualThemeId;
  fontFamily: FontFamilyId;
  selectedCategories: QuestionCategory[];
  showLettersOnOwnedCells: boolean;
}

export type GamePhase =
  | 'title'
  | 'round_intro'
  | 'playing'
  | 'paused'
  | 'round_victory'
  | 'match_victory';

export type BuzzerStatus =
  | 'idle' // No question selected yet
  | 'locked' // Question selected, waiting for host to open buzzer (or locked manually)
  | 'open' // Active race! Eligible teams can press
  | 'locked_by_winner' // A team buzzed in first and is answering
  | 'exhausted'; // Both teams answered wrong on this question

export interface BuzzerState {
  status: BuzzerStatus;
  questionNonce: number; // Unique monotonically increasing ID per question to reject stale buzzes
  winner: TeamId | null;
  winnerTimestamp: number | null;
  lockedOutTeams: TeamId[]; // Teams that already answered wrong on the current question
  answerTimerRemaining: number;
  answerTimerRunning: boolean;
}

export interface RoomPresence {
  displays: number;
  studios: number;
  team1Connected: boolean;
  team2Connected: boolean;
  team1DeviceId: string | null;
  team2DeviceId: string | null;
  total: number;
}

export interface RoundWinnerRecord {
  roundNumber: number;
  winner: TeamId;
  winnerName: string;
  winningPath: number[];
  team1Cells: number;
  team2Cells: number;
  durationSeconds: number;
}

export interface RoomGameState {
  roomCode: string;
  hostPin: string;
  version: number;
  phase: GamePhase;
  currentRound: number;
  cells: HexCell[];
  selectedCellId: number | null;
  currentQuestion: QuestionItem | null;
  questionExhaustedForLetter: boolean;
  answerRevealed: boolean;
  usedQuestionIds: string[];
  moveHistory: MoveRecord[];
  winningTeam: TeamId | null;
  winningPath: number[];
  roundHistory: RoundWinnerRecord[];
  team1: TeamConfig;
  team2: TeamConfig;
  settings: GameSettings;
  buzzer: BuzzerState;
  timerRemaining: number;
  timerRunning: boolean;
  lastUpdatedAt: number;
  roundStartedAt: number;
}

export type GameAction =
  | {
      type: 'START_MATCH';
      payload?: Partial<{
        team1Name: string;
        team2Name: string;
        team1Color: string;
        team2Color: string;
        totalRounds: number;
        timerSeconds: number;
        answerTimerSeconds: number;
        autoOpenBuzzerOnQuestion: boolean;
        theme: VisualThemeId;
        fontFamily: FontFamilyId;
      }>;
    }
  | { type: 'FINISH_ROUND_INTRO' }
  | { type: 'SELECT_CELL'; payload: { cellId: number } }
  | { type: 'DESELECT_CELL' }
  | { type: 'REVEAL_ANSWER' }
  | { type: 'HIDE_ANSWER' }
  | { type: 'NEW_QUESTION' }
  | { type: 'CLAIM_CELL'; payload: { team: TeamId; cellId?: number } }
  | { type: 'CORRECT_CELL_OWNER'; payload: { cellId: number; owner: CellOwner } }
  | { type: 'UNDO_MOVE' }
  | { type: 'SHUFFLE_BOARD' }
  | { type: 'NEXT_ROUND' }
  | { type: 'REPLAY_ROUND' }
  | { type: 'RESET_MATCH' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'SET_PHASE'; payload: { phase: GamePhase } }
  | { type: 'TIMER_START' }
  | { type: 'TIMER_PAUSE' }
  | { type: 'TIMER_RESET' }
  | { type: 'TIMER_TICK' }
  | { type: 'BUZZ_OPEN' }
  | { type: 'BUZZ_LOCK' }
  | { type: 'BUZZ_PRESS'; payload: { team: TeamId; questionNonce?: number } }
  | { type: 'BUZZ_CORRECT_ANSWER' }
  | { type: 'BUZZ_WRONG_ANSWER' }
  | { type: 'BUZZ_RESET_RACE' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GameSettings> }
  | {
      type: 'UPDATE_TEAMS';
      payload: { team1?: Partial<TeamConfig>; team2?: Partial<TeamConfig> };
    };
