import React, { useState } from 'react';
import { Award, Eye, Play, RotateCcw, Trophy, Undo2, Sparkles } from 'lucide-react';
import { getArabicRoundTitle } from '../game/gameEngine';
import { RoomGameState } from '../types/game';

interface VictoryModalProps {
  state: RoomGameState;
  isDisplayOnly: boolean;
  onNextRound: () => void;
  onReplayRound: () => void;
  onResetMatch: () => void;
  onUndoWinningMove: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  state,
  isDisplayOnly,
  onNextRound,
  onReplayRound,
  onResetMatch,
  onUndoWinningMove,
}) => {
  const [inspectBoard, setInspectBoard] = useState(false);

  const winningTeam =
    state.winningTeam === 'team1'
      ? state.team1
      : state.winningTeam === 'team2'
      ? state.team2
      : null;

  if (!winningTeam) return null;

  const isMatchOver = state.phase === 'match_victory';
  const team1Cells = state.cells.filter((c) => c.owner === 'team1').length;
  const team2Cells = state.cells.filter((c) => c.owner === 'team2').length;

  const nextRoundWords = getArabicRoundTitle(state.currentRound + 1).split(' ');

  // Compact bottom bar mode when inspecting the glowing winning path on the board
  if (inspectBoard) {
    return (
      <div
        dir="rtl"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl rounded-2xl bg-[#230E3B]/95 border-2 border-amber-400 px-5 py-3 text-white shadow-2xl flex items-center justify-between gap-4 select-none"
        data-testid="victory-compact-bar"
      >
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-amber-400 shrink-0" />
          <div>
            <div className="text-sm font-black" style={{ color: winningTeam.color }}>
              فوز {winningTeam.name} ({getArabicRoundTitle(state.currentRound)})
            </div>
            <div className="text-xs text-white/75">
              المسار الفائز مضاء بالكامل على اللوحة ({state.winningPath.length} خلايا متصلة)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInspectBoard(false)}
            className="px-3.5 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
          >
            عرض بطاقة النتيجة
          </button>
          {!isDisplayOnly && !isMatchOver && (
            <button
              type="button"
              onClick={onNextRound}
              className="px-3.5 py-2 rounded-xl bg-[#28B81E] text-white font-black text-xs cursor-pointer"
            >
              بدء {getArabicRoundTitle(state.currentRound + 1)}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-40 bg-[#2A1046]/80 flex items-center justify-center p-4 select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`فوز ${winningTeam.name}`}
      data-testid="victory-modal"
    >
      {/* Broadcast Radial Sunburst Background (Matching Reference Round Transition Screen) */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full opacity-25 animate-sunrays"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {Array.from({ length: 18 }).map((_, i) => {
          const angle1 = (i * 20 * Math.PI) / 180;
          const angle2 = ((i * 20 + 10) * Math.PI) / 180;
          const x1 = 500 + 1000 * Math.cos(angle1);
          const y1 = 500 + 1000 * Math.sin(angle1);
          const x2 = 500 + 1000 * Math.cos(angle2);
          const y2 = 500 + 1000 * Math.sin(angle2);
          return (
            <polygon
              key={i}
              points={`500,500 ${x1},${y1} ${x2},${y2}`}
              fill="#9333EA"
            />
          );
        })}
      </svg>

      <div className="relative z-10 w-full max-w-xl rounded-3xl bg-[#230E3B] border-4 border-amber-400 p-6 sm:p-7 text-white shadow-2xl text-center space-y-5">
        {/* Top Row: Inspect Board Button + Trophy Badge */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setInspectBoard(true)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-extrabold text-amber-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>معاينة المسار على اللوحة</span>
          </button>

          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
            <Sparkles className="w-4 h-4" />
            <span>
              {isMatchOver
                ? 'بطل دوري ELITE CLASH'
                : `نتيجة ${getArabicRoundTitle(state.currentRound)}`}
            </span>
          </div>
        </div>

        {/* Center 3D Extruded Round / Winner Headline */}
        <div className="space-y-2 py-1">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-lg mb-2">
            {isMatchOver ? (
              <Trophy className="w-8 h-8" />
            ) : (
              <Award className="w-8 h-8" />
            )}
          </div>

          <h2
            className="text-3xl sm:text-4xl font-black tracking-tight"
            style={{
              color: winningTeam.color,
              textShadow: '0 4px 0 #120621',
            }}
          >
            فوز {winningTeam.name}!
          </h2>
          <p className="text-sm text-white/85 font-semibold">
            {state.winningTeam === 'team1'
              ? 'أكمل مسارًا سداسيًا متصلاً من أعلى اللوحة إلى أسفلها!'
              : 'أكمل مسارًا سداسيًا متصلاً من يمين اللوحة إلى يسارها!'}
          </p>
        </div>

        {/* Series Score & Cell Counts (Tabular Nums) */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#160826] border border-white/10 p-3">
            <div className="text-xs text-white/70 font-bold mb-1">
              مجموع الجولات
            </div>
            <div className="text-2xl font-black tabular-nums text-amber-300">
              {state.team1.roundsWon} - {state.team2.roundsWon}
            </div>
            <div className="text-[10px] text-white/55 mt-0.5">
              من أصل {state.settings.totalRounds} جولات
            </div>
          </div>

          <div className="rounded-2xl bg-[#160826] border border-white/10 p-3">
            <div className="text-xs text-white/70 font-bold mb-1">
              خلايا {state.team1.name}
            </div>
            <div
              className="text-2xl font-black tabular-nums"
              style={{ color: state.team1.color }}
            >
              {team1Cells}
            </div>
            <div className="text-[10px] text-white/55 mt-0.5">
              جولات فائزة: {state.team1.roundsWon}
            </div>
          </div>

          <div className="rounded-2xl bg-[#160826] border border-white/10 p-3">
            <div className="text-xs text-white/70 font-bold mb-1">
              خلايا {state.team2.name}
            </div>
            <div
              className="text-2xl font-black tabular-nums"
              style={{ color: state.team2.color }}
            >
              {team2Cells}
            </div>
            <div className="text-[10px] text-white/55 mt-0.5">
              جولات فائزة: {state.team2.roundsWon}
            </div>
          </div>
        </div>

        {/* Winning Path Letters Strip */}
        <div className="rounded-2xl bg-[#160826] border border-white/10 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs text-white/70 font-bold">
            حروف المسار الفائز ({state.winningPath.length} خلايا):
          </span>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {state.winningPath.map((cellId) => {
              const cell = state.cells[cellId];
              if (!cell) return null;
              return (
                <span
                  key={cellId}
                  style={{ backgroundColor: winningTeam.color }}
                  className="w-8 h-8 rounded-lg text-slate-950 font-black text-base flex items-center justify-center shadow"
                >
                  {cell.letter}
                </span>
              );
            })}
          </div>
        </div>

        {/* Next Round Preview Banner (Matching Reference Image 7 Style) */}
        {!isMatchOver && (
          <div className="rounded-2xl bg-gradient-to-l from-[#5B2C86] to-[#3B185F] border border-purple-300/25 px-4 py-2.5 flex items-center justify-between">
            <div className="text-right">
              <div className="text-xs text-amber-300 font-extrabold">
                الانتقال إلى الجولة القادمة بحروف جديدة مبعثرة
              </div>
              <div className="text-xs text-white/80">
                الأسئلة السابقة لن تتكرر خلال المباراة
              </div>
            </div>
            <div className="transform -rotate-6 text-left leading-none pl-2">
              <div
                className="text-lg font-black text-[#FF5733]"
                style={{ textShadow: '0 2px 0 #230E3B' }}
              >
                {nextRoundWords[0]}
              </div>
              <div
                className="text-lg font-black text-[#FFD700]"
                style={{ textShadow: '0 2px 0 #230E3B' }}
              >
                {nextRoundWords.slice(1).join(' ')}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons (Hidden in Audience Display Mode) */}
        {!isDisplayOnly ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            {!isMatchOver ? (
              <button
                type="button"
                data-start="true"
                data-testid="btn-next-round"
                onClick={onNextRound}
                className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-[#28B81E] hover:bg-[#32d127] text-white font-black text-base shadow-[0_5px_0_#156910] active:translate-y-0.5 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>بدء {getArabicRoundTitle(state.currentRound + 1)}</span>
              </button>
            ) : (
              <button
                type="button"
                data-start="true"
                data-testid="btn-new-match"
                onClick={onResetMatch}
                className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base shadow-[0_5px_0_#b45309] active:translate-y-0.5 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Trophy className="w-5 h-5" />
                <span>مباراة جديدة</span>
              </button>
            )}

            <button
              type="button"
              onClick={onReplayRound}
              data-testid="btn-replay-round"
              className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة الجولة</span>
            </button>

            <button
              type="button"
              onClick={onUndoWinningMove}
              title="التراجع عن الحركة الأخيرة واستئناف الجولة"
              className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 font-extrabold text-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Undo2 className="w-4 h-4" />
              <span>تراجع</span>
            </button>
          </div>
        ) : (
          <div className="text-xs text-amber-300/90 font-bold pt-1">
            بانتظار انتقال المقدم إلى الجولة التالية...
          </div>
        )}
      </div>
    </div>
  );
};
