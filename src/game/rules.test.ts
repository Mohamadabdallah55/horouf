import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_ARABIC_LETTERS,
  areHexesAdjacent,
  createBoardCells,
  getHexNeighbors,
  toCellId,
  TOTAL_CELLS,
} from './hexMath';
import { checkTeamWin, evaluateBoardWinner } from './winDetector';
import {
  ALL_CATEGORIES,
  getQuestionsByLetter,
  normalizeArabicLetter,
  QUESTION_BANK,
} from '../data/questions';
import {
  applyGameAction,
  createInitialRoomState,
  pickQuestionForLetter,
} from './gameEngine';

test('Hexagonal board has 25 cells across 5 staggered rows and accurate odd-r neighbors', () => {
  const cells = createBoardCells(false);
  assert.equal(cells.length, 25);
  assert.equal(TOTAL_CELLS, 25);

  for (let r = 0; r < 5; r++) {
    const rowCells = cells.filter((c) => c.row === r);
    assert.equal(rowCells.length, 5);
  }

  const neighborsEven = getHexNeighbors(toCellId(2, 1)).sort((a, b) => a - b);
  assert.deepEqual(neighborsEven, [5, 6, 10, 12, 15, 16]);

  const neighborsOdd = getHexNeighbors(toCellId(1, 1)).sort((a, b) => a - b);
  assert.deepEqual(neighborsOdd, [1, 2, 5, 7, 11, 12]);

  assert.equal(areHexesAdjacent(toCellId(0, 2), toCellId(1, 0)), false);
  assert.equal(areHexesAdjacent(toCellId(0, 1), toCellId(1, 2)), false);
});

test('Question bank has >= 300 verified Arabic questions across all 8 categories and 28 letters', () => {
  assert.ok(
    QUESTION_BANK.length >= 300,
    `Expected >= 300 questions, got ${QUESTION_BANK.length}`
  );

  for (const category of ALL_CATEGORIES) {
    const count = QUESTION_BANK.filter((q) => q.category === category).length;
    assert.ok(count > 0, `Category ${category} should have questions`);
  }

  for (const letter of ALL_ARABIC_LETTERS) {
    const questions = getQuestionsByLetter(letter);
    assert.ok(
      questions.length >= 10,
      `Letter ${letter} should have at least 10 questions, got ${questions.length}`
    );

    const expectedNorm = normalizeArabicLetter(letter);
    for (const q of questions) {
      const firstChar = normalizeArabicLetter(q.answer.trim()[0]);
      assert.equal(
        firstChar,
        expectedNorm,
        `Answer "${q.answer}" for question "${q.question}" must start with "${expectedNorm}"`
      );
    }
  }
});

test('Question selection does not repeat questions in a match and handles exhaustion cleanly', () => {
  const letter = 'ح';
  const allForH = getQuestionsByLetter(letter);
  const usedIds: string[] = [];

  for (let i = 0; i < allForH.length; i++) {
    const { question, exhausted } = pickQuestionForLetter(letter, usedIds);
    assert.equal(exhausted, false);
    assert.ok(question !== null);
    assert.equal(usedIds.includes(question.id), false);
    usedIds.push(question.id);
  }

  const afterAllUsed = pickQuestionForLetter(letter, usedIds);
  assert.equal(afterAllUsed.exhausted, true);
  assert.equal(afterAllUsed.question, null);
});

test('Game flow: selecting cell, revealing answer, changing question, claiming cell, and undo', () => {
  let state = createInitialRoomState('TEST1', '1234', true);
  assert.equal(state.phase, 'playing');

  state = applyGameAction(state, { type: 'SELECT_CELL', payload: { cellId: 11 } });
  assert.equal(state.selectedCellId, 11);
  assert.ok(state.currentQuestion !== null);
  assert.equal(state.answerRevealed, false);
  assert.equal(state.cells[11].owner, 'none');

  const firstQuestionId = state.currentQuestion.id;

  state = applyGameAction(state, { type: 'REVEAL_ANSWER' });
  assert.equal(state.answerRevealed, true);
  assert.equal(state.cells[11].owner, 'none');

  state = applyGameAction(state, { type: 'NEW_QUESTION' });
  assert.equal(state.selectedCellId, 11);
  assert.equal(state.answerRevealed, false);
  assert.ok(state.currentQuestion !== null);
  assert.notEqual(state.currentQuestion.id, firstQuestionId);

  state = applyGameAction(state, { type: 'CLAIM_CELL', payload: { team: 'team1' } });
  assert.equal(state.cells[11].owner, 'team1');
  assert.equal(state.selectedCellId, null);
  assert.equal(state.moveHistory.length, 1);

  state = applyGameAction(state, { type: 'UNDO_MOVE' });
  assert.equal(state.cells[11].owner, 'none');
  assert.equal(state.moveHistory.length, 0);
});

test('Win detection: Team 1 vertical path (top to bottom) and Team 2 horizontal path (left to right)', () => {
  const cells1 = createBoardCells(false);
  for (const id of [1, 6, 12, 16, 21]) {
    cells1[id].owner = 'team1';
  }
  const win1 = checkTeamWin(cells1, 'team1');
  assert.equal(win1.hasWon, true);
  assert.equal(win1.winner, 'team1');
  assert.deepEqual(win1.winningPath, [1, 6, 12, 16, 21]);

  const falseCells = createBoardCells(false);
  for (const id of [0, 6, 12, 18, 24]) {
    falseCells[id].owner = 'team1';
  }
  const falseWin = checkTeamWin(falseCells, 'team1');
  assert.equal(falseWin.hasWon, false);

  const cells2 = createBoardCells(false);
  for (const id of [10, 11, 6, 12, 13, 8, 9]) {
    cells2[id].owner = 'team2';
  }
  const win2 = evaluateBoardWinner(cells2);
  assert.equal(win2.hasWon, true);
  assert.equal(win2.winner, 'team2');
  assert.equal(win2.winningPath[0], 10);
  assert.equal(win2.winningPath[win2.winningPath.length - 1], 9);
});

test('Atomic Buzzer System: premature press, opening, first press wins, simultaneous lock, wrong answer handover, and correct answer cell award', () => {
  let state = createInitialRoomState('BUZZ1', '2026', true);

  // 1. Select cell 12 (row 2, col 2) -> buzzer starts in 'locked' state (preparation phase)
  state = applyGameAction(state, { type: 'SELECT_CELL', payload: { cellId: 12 } });
  assert.equal(state.buzzer.status, 'locked');
  const activeNonce = state.buzzer.questionNonce;

  // 2. Pressing before buzzer is opened MUST be rejected
  const beforeOpen = applyGameAction(state, {
    type: 'BUZZ_PRESS',
    payload: { team: 'team1', questionNonce: activeNonce },
  });
  assert.equal(beforeOpen.buzzer.winner, null);
  assert.equal(beforeOpen.buzzer.status, 'locked');

  // 3. Open the buzzer
  state = applyGameAction(state, { type: 'BUZZ_OPEN' });
  assert.equal(state.buzzer.status, 'open');

  // 4. Stale questionNonce press MUST be rejected
  const stalePress = applyGameAction(state, {
    type: 'BUZZ_PRESS',
    payload: { team: 'team2', questionNonce: activeNonce - 1 },
  });
  assert.equal(stalePress.buzzer.winner, null);

  // 5. Team 1 presses first -> atomically locks buzzer and starts answer timer
  state = applyGameAction(state, {
    type: 'BUZZ_PRESS',
    payload: { team: 'team1', questionNonce: activeNonce },
  });
  assert.equal(state.buzzer.status, 'locked_by_winner');
  assert.equal(state.buzzer.winner, 'team1');
  assert.equal(state.buzzer.answerTimerRunning, true);

  // 6. Near-simultaneous press by Team 2 or repeated press by Team 1 MUST be rejected
  const secondPress = applyGameAction(state, {
    type: 'BUZZ_PRESS',
    payload: { team: 'team2', questionNonce: activeNonce },
  });
  assert.equal(secondPress.buzzer.winner, 'team1');

  // 7. Team 1 answers WRONG -> Team 1 is locked out, buzzer opens automatically for Team 2 only!
  state = applyGameAction(state, { type: 'BUZZ_WRONG_ANSWER' });
  assert.equal(state.buzzer.status, 'open');
  assert.equal(state.buzzer.winner, null);
  assert.deepEqual(state.buzzer.lockedOutTeams, ['team1']);

  // 8. Team 1 tries to press again on the same question -> MUST be rejected!
  const retryByLockedTeam = applyGameAction(state, {
    type: 'BUZZ_PRESS',
    payload: { team: 'team1', questionNonce: activeNonce },
  });
  assert.equal(retryByLockedTeam.buzzer.winner, null);

  // 9. Team 2 presses and wins the buzzer opportunity
  state = applyGameAction(state, {
    type: 'BUZZ_PRESS',
    payload: { team: 'team2', questionNonce: activeNonce },
  });
  assert.equal(state.buzzer.status, 'locked_by_winner');
  assert.equal(state.buzzer.winner, 'team2');

  // 10. Team 2 gives CORRECT answer -> Cell 12 is awarded to Team 2, buzzer resets for next question
  state = applyGameAction(state, { type: 'BUZZ_CORRECT_ANSWER' });
  assert.equal(state.cells[12].owner, 'team2');
  assert.equal(state.selectedCellId, null);
  assert.equal(state.buzzer.status, 'idle');
  assert.equal(state.buzzer.winner, null);
  assert.equal(state.buzzer.lockedOutTeams.length, 0);
});
