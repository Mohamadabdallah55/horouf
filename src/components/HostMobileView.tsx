import React, { useState } from 'react';
import {
  Bell,
  Check,
  Eye,
  EyeOff,
  Lock,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  Undo2,
  Monitor,
  Trophy,
  X,
  XCircle,
} from 'lucide-react';
import { getArabicRoundTitle } from '../game/gameEngine';
import { CellOwner, GameAction, RoomGameState, RoomPresence, TeamId } from '../types/game';

interface HostMobileViewProps {
  state: RoomGameState;
  presence: RoomPresence;
  onDispatch: (action: GameAction) => void;
  onSwitchToStudio: () => void;
}

export const HostMobileView: React.FC<HostMobileViewProps> = ({
  state,
  presence,
  onDispatch,
  onSwitchToStudio,
}) => {
  const [correctionMode, setCorrectionMode] = useState(false);

  const selectedCell =
    state.selectedCellId !== null ? state.cells[state.selectedCellId] : null;
  const hasSelection = selectedCell !== null;

  const team1Count = state.cells.filter((c) => c.owner === 'team1').length;
  const team2Count = state.cells.filter((c) => c.owner === 'team2').length;

  const buzzer = state.buzzer;
  const buzzerWinnerTeam =
    buzzer.winner === 'team1'
      ? state.team1
      : buzzer.winner === 'team2'
      ? state.team2
      : null;

  const handleCellTap = (cellId: number, currentOwner: CellOwner) => {
    if (correctionMode) {
      const nextOwner: CellOwner =
        currentOwner === 'none'
          ? 'team1'
          : currentOwner === 'team1'
          ? 'team2'
          : 'none';
      onDispatch({
        type: 'CORRECT_CELL_OWNER',
        payload: { cellId, owner: nextOwner },
      });
      return;
    }

    if (currentOwner === 'none') {
      onDispatch({ type: 'SELECT_CELL', payload: { cellId } });
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-[#140824] text-white flex flex-col justify-between p-4 space-y-3.5 select-none overflow-y-auto"
      data-testid="host-mobile-view"
    >
      {/* Top Status Header */}
      <header className="flex flex-col gap-2 bg-[#230E3B] border border-white/15 rounded-2xl px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-300">
              جهاز تحكم المقدم · غرفة {state.roomCode}
            </div>
            <h1 className="text-lg font-black">
              {getArabicRoundTitle(state.currentRound)} ({presence.total} متصل)
            </h1>
          </div>

          <button
            type="button"
            onClick={onSwitchToStudio}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <Monitor className="w-4 h-4 text-cyan-300" />
            <span>شاشة الاستوديو</span>
          </button>
        </div>

        {/* Live Team Buzzer Connection Status */}
        <div className="rounded-xl bg-[#160826] border border-white/10 px-3 py-1.5 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="text-white/70">جرس {state.team1.name}:</span>
            <span
              className={
                presence.team1Connected ? 'text-emerald-400 font-black' : 'text-white/45'
              }
            >
              {presence.team1Connected ? 'متصل' : 'غير متصل'}
            </span>
          </div>
          <span className="text-white/25">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-white/70">جرس {state.team2.name}:</span>
            <span
              className={
                presence.team2Connected ? 'text-orange-400 font-black' : 'text-white/45'
              }
            >
              {presence.team2Connected ? 'متصل' : 'غير متصل'}
            </span>
          </div>
        </div>
      </header>

      {/* If Game is on Title Screen, let Host start it from phone */}
      {state.phase === 'title' && (
        <div className="rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 p-4 text-center space-y-3">
          <p className="text-sm font-extrabold">
            اللعبة حاليًا في شاشة البداية على التلفزيون.
          </p>
          <button
            type="button"
            onClick={() => onDispatch({ type: 'START_MATCH' })}
            className="w-full py-3 rounded-xl bg-[#28B81E] text-white font-black text-base shadow-lg cursor-pointer"
          >
            بدء المباراة الآن على الشاشة
          </button>
        </div>
      )}

      {/* If Round or Match Victory is active */}
      {(state.phase === 'round_victory' || state.phase === 'match_victory') && (
        <div className="rounded-2xl bg-amber-400/20 border-2 border-amber-400 p-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-lg">
            <Trophy className="w-6 h-6" />
            <span>
              فوز{' '}
              {state.winningTeam === 'team1'
                ? state.team1.name
                : state.team2.name}
              !
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onDispatch({ type: 'NEXT_ROUND' })}
              className="py-2.5 px-3 rounded-xl bg-[#28B81E] text-white font-black text-sm cursor-pointer"
            >
              بدء الجولة التالية
            </button>
            <button
              type="button"
              onClick={() => onDispatch({ type: 'REPLAY_ROUND' })}
              className="py-2.5 px-3 rounded-xl bg-white/15 text-white font-bold text-sm cursor-pointer"
            >
              إعادة الجولة
            </button>
          </div>
        </div>
      )}

      {/* Secret Host Question, Buzzer Controls & Answer Card */}
      <section className="rounded-3xl bg-[#230E3B] border-2 border-purple-400/30 p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow">
              {selectedCell ? selectedCell.letter : '!'}
            </span>
            <div>
              <div className="text-xs font-bold text-purple-200/75">
                {state.currentQuestion
                  ? state.currentQuestion.category
                  : 'اختر حرفًا من الشبكة بالأسفل'}
              </div>
              <div className="text-xs font-extrabold text-amber-300">
                {state.answerRevealed
                  ? 'الإجابة ظاهرة للجمهور الآن'
                  : 'الإجابة مخفية عن الجمهور (تظهر لك فقط)'}
              </div>
            </div>
          </div>

          {hasSelection && (
            <button
              type="button"
              onClick={() => onDispatch({ type: 'DESELECT_CELL' })}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white cursor-pointer"
              aria-label="إلغاء اختيار الحرف"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Question text */}
        <div className="rounded-2xl bg-[#160826] border border-white/10 p-3.5 text-center">
          <p className="text-base font-extrabold leading-relaxed text-white">
            {hasSelection
              ? state.currentQuestion?.question ||
                'انتهت أسئلة هذا الحرف في المباراة الحالية.'
              : 'اضغط على أي خلية بيضاء في الشبكة لعرض سؤالها...'}
          </p>
        </div>

        {/* Host-Only Always-Visible Secret Answer Box */}
        {hasSelection && state.currentQuestion && (
          <div className="rounded-2xl bg-emerald-950/80 border-2 border-emerald-400/70 px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-300">
                الجواب الصحيح (خاص بالمقدم):
              </div>
              <div
                className="text-lg font-black text-white"
                data-testid="host-secret-answer"
              >
                {state.currentQuestion.answer}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onDispatch({
                  type: state.answerRevealed ? 'HIDE_ANSWER' : 'REVEAL_ANSWER',
                })
              }
              className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition ${
                state.answerRevealed
                  ? 'bg-rose-500 text-white'
                  : 'bg-[#22C3D1] text-slate-950'
              }`}
            >
              {state.answerRevealed ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>إخفاء عن التلفزيون</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>إظهار على التلفزيون</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Host Buzzer Race Control Panel */}
        {hasSelection && (
          <div className="rounded-2xl bg-[#160826] border border-white/15 p-3 space-y-2">
            {buzzer.status === 'locked_by_winner' && buzzerWinnerTeam ? (
              <div
                data-testid="host-buzzer-winner-banner"
                style={{ backgroundColor: buzzerWinnerTeam.color }}
                className="rounded-xl p-3 text-slate-950 space-y-2 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black">
                    🔔 {buzzerWinnerTeam.name} ضغط أولًا!
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-amber-300 font-mono font-black text-xs tabular-nums">
                    عداد الإجابة: {buzzer.answerTimerRemaining}ث
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onDispatch({ type: 'BUZZ_CORRECT_ANSWER' })}
                    data-testid="host-btn-buzz-correct"
                    className="py-2 px-2 rounded-xl bg-slate-950 text-emerald-400 font-black text-xs flex items-center justify-center gap-1 cursor-pointer shadow"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>إجابة صحيحة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDispatch({ type: 'BUZZ_WRONG_ANSWER' })}
                    data-testid="host-btn-buzz-wrong"
                    className="py-2 px-2 rounded-xl bg-slate-950 text-rose-400 font-black text-xs flex items-center justify-center gap-1 cursor-pointer shadow"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>إجابة خاطئة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDispatch({ type: 'BUZZ_RESET_RACE' })}
                    data-testid="host-btn-buzz-reset"
                    className="py-2 px-2 rounded-xl bg-slate-950/85 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إعادة السباق</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold px-1">
                  <span className="text-white/75">حالة الجرس الإلكتروني:</span>
                  <span
                    className={
                      buzzer.status === 'open'
                        ? 'text-emerald-400 font-black'
                        : buzzer.status === 'exhausted'
                        ? 'text-rose-400 font-black'
                        : 'text-amber-300'
                    }
                  >
                    {buzzer.status === 'open'
                      ? buzzer.lockedOutTeams.length === 1
                        ? `مفتوح لـ ${
                            buzzer.lockedOutTeams[0] === 'team1'
                              ? state.team2.name
                              : state.team1.name
                          } فقط`
                        : 'مفتوح الآن للتسابق!'
                      : buzzer.status === 'exhausted'
                      ? 'أخطأ الفريقان'
                      : 'مقفول (استعداد)'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={buzzer.status === 'open'}
                    onClick={() => onDispatch({ type: 'BUZZ_OPEN' })}
                    data-testid="host-btn-open-buzzer"
                    className={`py-2 px-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 ${
                      buzzer.status !== 'open'
                        ? 'bg-emerald-500 text-slate-950 cursor-pointer shadow'
                        : 'bg-emerald-500/20 text-emerald-200/40 cursor-not-allowed'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>فتح الجرس</span>
                  </button>

                  <button
                    type="button"
                    disabled={buzzer.status !== 'open'}
                    onClick={() => onDispatch({ type: 'BUZZ_LOCK' })}
                    data-testid="host-btn-lock-buzzer"
                    className={`py-2 px-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 ${
                      buzzer.status === 'open'
                        ? 'bg-rose-500 text-white cursor-pointer shadow'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>قفل الجرس</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDispatch({ type: 'BUZZ_RESET_RACE' })}
                    data-testid="host-btn-buzz-reset"
                    className="py-2 px-2.5 rounded-xl bg-white/10 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إعادة السباق</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Question & Timer Controls */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={!hasSelection}
            onClick={() => onDispatch({ type: 'NEW_QUESTION' })}
            className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 ${
              hasSelection
                ? 'bg-[#EDC700] text-slate-950 cursor-pointer'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>سؤال جديد</span>
          </button>

          <button
            type="button"
            disabled={!hasSelection}
            onClick={() =>
              onDispatch({
                type: state.timerRunning ? 'TIMER_PAUSE' : 'TIMER_START',
              })
            }
            className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 tabular-nums ${
              hasSelection
                ? 'bg-purple-600 text-white cursor-pointer'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {state.timerRunning ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>مؤقت ({state.timerRemaining}ث)</span>
          </button>

          <button
            type="button"
            disabled={!hasSelection}
            onClick={() => onDispatch({ type: 'TIMER_RESET' })}
            className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 ${
              hasSelection
                ? 'bg-white/15 text-white cursor-pointer'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>تصفير المؤقت</span>
          </button>
        </div>

        {/* Award Cell to Team 1 or Team 2 */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            disabled={!hasSelection}
            onClick={() =>
              onDispatch({ type: 'CLAIM_CELL', payload: { team: 'team1' as TeamId } })
            }
            style={{
              backgroundColor: hasSelection ? state.team1.color : '#283c2b',
            }}
            className={`py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-between shadow-lg ${
              hasSelection
                ? 'text-slate-950 cursor-pointer active:scale-95'
                : 'text-white/40 cursor-not-allowed'
            }`}
          >
            <span>منح لـ {state.team1.name}</span>
            <Check className="w-5 h-5 stroke-[3]" />
          </button>

          <button
            type="button"
            disabled={!hasSelection}
            onClick={() =>
              onDispatch({ type: 'CLAIM_CELL', payload: { team: 'team2' as TeamId } })
            }
            style={{
              backgroundColor: hasSelection ? state.team2.color : '#422c24',
            }}
            className={`py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-between shadow-lg ${
              hasSelection
                ? 'text-slate-950 cursor-pointer active:scale-95'
                : 'text-white/40 cursor-not-allowed'
            }`}
          >
            <span>منح لـ {state.team2.name}</span>
            <Check className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </section>

      {/* Interactive 25-Letter Grid for Mobile Host */}
      <section className="rounded-3xl bg-[#230E3B] border border-white/15 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black">
            شبكة الحروف (25 خلية) · {state.team1.name}: {team1Count} |{' '}
            {state.team2.name}: {team2Count}
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCorrectionMode(!correctionMode)}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer ${
                correctionMode
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-white/10 text-white'
              }`}
            >
              {correctionMode ? 'إيقاف التصحيح' : 'تصحيح الملكية'}
            </button>
            <button
              type="button"
              onClick={() => onDispatch({ type: 'UNDO_MOVE' })}
              className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>تراجع</span>
            </button>
          </div>
        </div>

        <div dir="ltr" className="grid grid-cols-5 gap-2 pr-2">
          {state.cells.map((cell) => {
            const isSelected = state.selectedCellId === cell.id;
            const isOddRow = cell.row % 2 === 1;
            let bg = '#FFFFFF';
            let textCol = '#230E3B';
            if (cell.owner === 'team1') {
              bg = state.team1.color;
              textCol = '#FFFFFF';
            } else if (cell.owner === 'team2') {
              bg = state.team2.color;
              textCol = '#FFFFFF';
            } else if (isSelected) {
              bg = '#FFE100';
              textCol = '#230E3B';
            }

            return (
              <button
                key={cell.id}
                type="button"
                onClick={() => handleCellTap(cell.id, cell.owner)}
                style={{ backgroundColor: bg, color: textCol }}
                className={`h-11 rounded-xl font-black text-lg shadow flex items-center justify-center transition cursor-pointer ${
                  isOddRow ? 'translate-x-2' : ''
                } ${isSelected ? 'ring-4 ring-amber-300 scale-105' : ''}`}
              >
                {cell.letter}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
