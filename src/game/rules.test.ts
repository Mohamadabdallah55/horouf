import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_ARABIC_LETTERS,
  areHexesAdjacent,
  createBoardCells,
  fromCellId,
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

  // Verify row and col coordinates
  for (let r = 0; r < 5; r++) {
    const rowCells = cells.filter((c) => c.row === r);
    assert.equal(rowCells.length, 5);
  }

  // Check even row cell (r=2, c=1 -> cellId 11)
  // Neighbors in odd-r: (2,0)=10, (2,2)=12, (1,0)=5, (1,1)=6, (3,0)=15, (3,1)=16
  const neighborsEven = getHexNeighbors(toCellId(2, 1)).sort((a, b) => a - b);
  assert.deepEqual(neighborsEven, [5, 6, 10, 12, 15, 16]);

  // Check odd row cell (r=1, c=1 -> cellId 6)
  // Neighbors in odd-r: (1,0)=5, (1,2)=7, (0,1)=1, (0,2)=2, (2,1)=11, (2,2)=12
  const neighborsOdd = getHexNeighbors(toCellId(1, 1)).sort((a, b) => a - b);
  assert.deepEqual(neighborsOdd, [1, 2, 5, 7, 11, 12]);

  // Verify non-adjacent corner/diagonal in rectangular coordinates is NOT hex-adjacent
  // For example, (0, 2) and (1, 0) are not adjacent
  assert.equal(areHexesAdjacent(toCellId(0, 2), toCellId(1, 0)), false);
  // In even row r=0, (0, 1) is NOT adjacent to (1, 2) because r=0 is shifted left and r=1 is shifted right!
  assert.equal(areHexesAdjacent(toCellId(0, 1), toCellId(1, 2)), false);
});

test('Question bank has >= 300 verified Arabic questions across all 8 categories and 28 letters', () => {
  assert.ok(
    QUESTION_BANK.length >= 300,
    `Expected >= 300 questions, got ${QUESTION_BANK.length}`
  );

  // Check all 8 categories exist
  for (const category of ALL_CATEGORIES) {
    const count = QUESTION_BANK.filter((q) => q.category === category).length;
    assert.ok(count > 0, `Category ${category} should have questions`);
  }

  // Check all 28 Arabic letters have questions and every answer starts with that letter
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

  // Now all questions for 'ح' are used
  const afterAllUsed = pickQuestionForLetter(letter, usedIds);
  assert.equal(afterAllUsed.exhausted, true);
  assert.equal(afterAllUsed.question, null);
});

test('Game flow: selecting cell, revealing answer, changing question, claiming cell, and undo', () => {
  let state = createInitialRoomState('TEST1', '1234', true);
  assert.equal(state.phase, 'playing');

  // 1. Select cell 11 (row 2, col 1 -> letter 'ح')
  state = applyGameAction(state, { type: 'SELECT_CELL', payload: { cellId: 11 } });
  assert.equal(state.selectedCellId, 11);
  assert.ok(state.currentQuestion !== null);
  assert.equal(state.answerRevealed, false);
  // Ownership must NOT change just by selecting or showing question
  assert.equal(state.cells[11].owner, 'none');

  const firstQuestionId = state.currentQuestion.id;

  // 2. Reveal answer
  state = applyGameAction(state, { type: 'REVEAL_ANSWER' });
  assert.equal(state.answerRevealed, true);
  assert.equal(state.cells[11].owner, 'none');

  // 3. New question for same cell without changing letter
  state = applyGameAction(state, { type: 'NEW_QUESTION' });
  assert.equal(state.selectedCellId, 11);
  assert.equal(state.answerRevealed, false);
  assert.ok(state.currentQuestion !== null);
  assert.notEqual(state.currentQuestion.id, firstQuestionId);

  // 4. Claim cell for Team 1
  state = applyGameAction(state, { type: 'CLAIM_CELL', payload: { team: 'team1' } });
  assert.equal(state.cells[11].owner, 'team1');
  assert.equal(state.selectedCellId, null);
  assert.equal(state.moveHistory.length, 1);

  // 5. Undo move restores ownership
  state = applyGameAction(state, { type: 'UNDO_MOVE' });
  assert.equal(state.cells[11].owner, 'none');
  assert.equal(state.moveHistory.length, 0);
});

test('Win detection: Team 1 vertical path (top to bottom) and Team 2 horizontal path (left to right)', () => {
  // Test 1: Team 1 connected zigzag vertical path
  // (0,1)=1 -> (1,1)=6 -> (2,2)=12 -> (3,1)=16 -> (4,1)=21
  // Let's verify each step is hex-adjacent:
  // (0,1) [even] neighbors in row 1: (1,0) and (1,1) -> 6 is adjacent!
  // (1,1) [odd] neighbors in row 2: (2,1) and (2,2) -> 12 is adjacent!
  // (2,2) [even] neighbors in row 3: (3,1) and (3,2) -> 16 is adjacent!
  // (3,1) [odd] neighbors in row 4: (4,1) and (4,2) -> 21 is adjacent!
  const cells1 = createBoardCells(false);
  for (const id of [1, 6, 12, 16, 21]) {
    cells1[id].owner = 'team1';
  }
  const win1 = checkTeamWin(cells1, 'team1');
  assert.equal(win1.hasWon, true);
  assert.equal(win1.winner, 'team1');
  assert.deepEqual(win1.winningPath, [1, 6, 12, 16, 21]);

  // Test 2: Non-adjacent false path must NOT win!
  // Suppose Team 1 owns (0,0)=0, (1,1)=6, (2,2)=12, (3,3)=18, (4,4)=24
  // Notice (0,0) [even] only touches (1,0) in row 1, NOT (1,1)=6!
  const falseCells = createBoardCells(false);
  for (const id of [0, 6, 12, 18, 24]) {
    falseCells[id].owner = 'team1';
  }
  const falseWin = checkTeamWin(falseCells, 'team1');
  assert.equal(falseWin.hasWon, false);

  // Test 3: Team 2 horizontal winding path from col 0 to col 4
  // (2,0)=10 -> (1,1) is not adjacent to (2,0), (2,0) touches (1,0)=5 or (2,1)=11!
  // Let's trace: (2,0)=10 -> (2,1)=11 -> (1,1)=6 -> (2,2)=12 -> (2,3)=13 -> (1,3)=8 -> (1,4)=9
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
