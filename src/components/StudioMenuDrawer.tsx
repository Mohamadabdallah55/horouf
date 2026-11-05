import React from 'react';
import {
  History,
  RotateCcw,
  Shuffle,
  Sliders,
  Trash2,
  Undo2,
  X,
  Home,
} from 'lucide-react';
import { CellOwner, FontFamilyId, RoomGameState, VisualThemeId } from '../types/game';

interface StudioMenuDrawerProps {
  state: RoomGameState;
  onClose: () => void;
  onUndoMove: () => void;
  onShuffleBoard: () => void;
  onReplayRound: () => void;
  onNextRound: () => void;
  onReturnToTitle: () => void;
  onCorrectCellOwner: (cellId: number, owner: CellOwner) => void;
  onUpdateSettings: (partial: Partial<RoomGameState['settings']>) => void;
  onUpdateTeamNames: (team1Name: string, team2Name: string) => void;
}

export const StudioMenuDrawer: React.FC<StudioMenuDrawerProps> = ({
  state,
  onClose,
  onUndoMove,
  onShuffleBoard,
  onReplayRound,
  onNextRound,
  onReturnToTitle,
  onCorrectCellOwner,
  onUpdateSettings,
}) => {
  const currentRoundMoves = state.moveHistory
    .filter((m) => m.round === state.currentRound)
    .slice()
    .reverse();

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/65 flex justify-end select-none"
      role="dialog"
      aria-modal="true"
      aria-label="قائمة التحكم وسجل الحركات"
    >
      <div className="w-full max-w-md h-full bg-[#1C0B30] border-r-2 border-white/15 p-5 text-white flex flex-col justify-between overflow-y-auto shadow-2xl space-y-5">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black">إدارة المسابقة وسجل الحركات</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق القائمة"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Round & Board Actions */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-amber-300">
              تحكم سريع بالجولة واللوحة
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onShuffleBoard();
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Shuffle className="w-4 h-4 text-amber-300" />
                <span>إعادة خلط الحروف</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onReplayRound();
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-cyan-300" />
                <span>تصفير وإعادة الجولة</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNextRound();
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>انتقال للجولة التالية</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onReturnToTitle();
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>شاشة البداية</span>
              </button>
            </div>
          </div>

          {/* Customization Controls */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-3">
            <h3 className="text-xs font-extrabold text-cyan-300">
              تخصيص المظهر والمؤقت أثناء اللعب
            </h3>

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white/80">الهوية البصرية:</span>
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'classic', label: 'كلاسيكي' },
                    { id: 'elite_clash', label: 'ELITE CLASH' },
                    { id: 'royal_night', label: 'ليلي ملكي' },
                  ] as Array<{ id: VisualThemeId; label: string }>
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onUpdateSettings({ theme: t.id })}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      state.settings.theme === t.id
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-white/10 text-white/75'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white/80">خط اللوحة:</span>
              <div className="flex items-center gap-1">
                {(['Cairo', 'Alexandria', 'Changa', 'Tajawal'] as FontFamilyId[]).map(
                  (f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => onUpdateSettings({ fontFamily: f })}
                      className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                        state.settings.fontFamily === f
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-white/10 text-white/75'
                      }`}
                    >
                      {f}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white/80">مؤقت السؤال:</span>
              <div className="flex items-center gap-1 tabular-nums">
                {[0, 15, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onUpdateSettings({ timerSeconds: sec })}
                    className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                      state.settings.timerSeconds === sec
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-white/10 text-white/75'
                    }`}
                  >
                    {sec === 0 ? 'بدون' : `${sec}ث`}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between text-xs cursor-pointer pt-1">
              <span className="font-bold text-white/80">
                إظهار الحرف على الخلايا المملوكة:
              </span>
              <input
                type="checkbox"
                checked={state.settings.showLettersOnOwnedCells}
                onChange={(e) =>
                  onUpdateSettings({ showLettersOnOwnedCells: e.target.checked })
                }
                className="w-4 h-4 accent-amber-400 rounded"
              />
            </label>
          </div>

          {/* Direct 25-Cell Ownership Correction Grid */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-amber-300">
                تصحيح ملكية الخلايا مباشرة (اضغط للتبديل)
              </h3>
              <span className="text-[11px] text-white/60">
                أبيض ← أخضر ← برتقالي
              </span>
            </div>
            <div dir="ltr" className="grid grid-cols-5 gap-1.5 pr-2">
              {state.cells.map((cell) => {
                const isOddRow = cell.row % 2 === 1;
                const nextOwner: CellOwner =
                  cell.owner === 'none'
                    ? 'team1'
                    : cell.owner === 'team1'
                    ? 'team2'
                    : 'none';
                const bg =
                  cell.owner === 'team1'
                    ? state.team1.color
                    : cell.owner === 'team2'
                    ? state.team2.color
                    : '#FFFFFF';
                const textColor =
                  cell.owner === 'none' ? '#230E3B' : '#FFFFFF';
                return (
                  <button
                    key={cell.id}
                    type="button"
                    onClick={() => onCorrectCellOwner(cell.id, nextOwner)}
                    style={{ backgroundColor: bg, color: textColor }}
                    className={`py-1.5 rounded-lg font-black text-sm shadow transition cursor-pointer hover:scale-105 ${
                      isOddRow ? 'translate-x-1.5' : ''
                    }`}
                  >
                    {cell.letter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Move History Log */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-white">
                <History className="w-4 h-4 text-amber-300" />
                <span>سجل حركات الجولة الحالية ({currentRoundMoves.length})</span>
              </div>
              {currentRoundMoves.length > 0 && (
                <button
                  type="button"
                  onClick={onUndoMove}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>تراجع عن آخر حركة</span>
                </button>
              )}
            </div>

            {currentRoundMoves.length === 0 ? (
              <p className="text-xs text-white/50 py-2 text-center">
                لم يتم منح أي خلية في هذه الجولة بعد.
              </p>
            ) : (
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {currentRoundMoves.map((move) => (
                  <div
                    key={move.id}
                    className="flex items-center justify-between rounded-xl bg-[#140724] px-3 py-2 text-xs border border-white/5"
                  >
                    <span className="font-bold text-white/90">
                      {move.description}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCorrectCellOwner(move.cellId, 'none')}
                      title="إعادة الخلية للون الأبيض"
                      className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
