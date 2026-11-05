import React from 'react';
import {
  Check,
  Maximize2,
  Menu,
  Play,
  Pause,
  RotateCcw,
  Smartphone,
  Undo2,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Eye,
} from 'lucide-react';
import { getArabicRoundTitle } from '../game/gameEngine';
import { getRoundedHexPath } from '../game/hexMath';
import { RoomGameState, TeamId } from '../types/game';

interface SideControlPanelProps {
  state: RoomGameState;
  isDisplayOnly: boolean;
  isMuted: boolean;
  correctionMode: boolean;
  connectedDevicesCount: number;
  onRevealOrHideAnswer: () => void;
  onNewQuestion: () => void;
  onDeselectCell: () => void;
  onClaimCell: (team: TeamId) => void;
  onUndoMove: () => void;
  onToggleCorrectionMode: () => void;
  onToggleMute: () => void;
  onOpenMenuDrawer: () => void;
  onOpenSyncModal: () => void;
  onToggleDisplayMode: () => void;
  onTimerToggle: () => void;
  onTimerReset: () => void;
}

export const SideControlPanel: React.FC<SideControlPanelProps> = ({
  state,
  isDisplayOnly,
  isMuted,
  correctionMode,
  connectedDevicesCount,
  onRevealOrHideAnswer,
  onNewQuestion,
  onDeselectCell,
  onClaimCell,
  onUndoMove,
  onToggleCorrectionMode,
  onToggleMute,
  onOpenMenuDrawer,
  onOpenSyncModal,
  onToggleDisplayMode,
  onTimerToggle,
  onTimerReset,
}) => {
  const selectedCell =
    state.selectedCellId !== null ? state.cells[state.selectedCellId] : null;

  const team1OwnedCount = state.cells.filter((c) => c.owner === 'team1').length;
  const team2OwnedCount = state.cells.filter((c) => c.owner === 'team2').length;

  const hasSelection = selectedCell !== null;
  const canUndo = state.moveHistory.some((m) => m.round === state.currentRound);

  const panelBg =
    state.settings.theme === 'elite_clash'
      ? 'bg-[#130d26] border-l-4 border-[#d4af37]/50'
      : state.settings.theme === 'royal_night'
      ? 'bg-[#0f172a] border-l-4 border-sky-500/40'
      : 'bg-[#6A359C] border-l-4 border-[#51237F]';

  const cardOuterBg =
    state.settings.theme === 'elite_clash'
      ? 'bg-[#090614] border border-[#d4af37]/30'
      : 'bg-[#230E3B]';

  const cardInnerBg =
    state.settings.theme === 'elite_clash'
      ? 'bg-[#18122B] border-[#d4af37]/40'
      : 'bg-[#3F2859] border-[#5D437B]';

  const roundWords = getArabicRoundTitle(state.currentRound).split(' ');
  const roundFirstWord = roundWords[0] || 'الجولة';
  const roundSecondWord = roundWords.slice(1).join(' ') || 'الأولى';

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <aside
      dir="rtl"
      className={`w-full h-full flex flex-col justify-between px-5 py-4 select-none ${panelBg} text-white relative overflow-y-auto`}
      aria-label="لوحة التحكم والأسئلة"
    >
      {/* Top Header: Round Title + Studio Menu Button */}
      <div className="flex flex-col gap-2.5 shrink-0">
        <div className="flex items-start justify-between gap-2">
          {/* Stylized 3D Broadcast Round Title */}
          <div className="flex flex-col leading-none pr-1">
            <div className="text-[11px] font-bold tracking-wider text-amber-300/90 mb-1">
              ELITE CLASH · الجولة {state.currentRound} من {state.settings.totalRounds}
            </div>
            <div
              className="transform -rotate-6 origin-right select-none"
              style={{
                fontFamily: `'${state.settings.fontFamily}', 'Alexandria', 'Cairo', sans-serif`,
              }}
            >
              <div
                className="text-3xl xl:text-4xl font-black text-[#FF5733] tracking-tight"
                style={{
                  textShadow: '0 4px 0 #230E3B, 0 6px 10px rgba(0,0,0,0.35)',
                }}
              >
                {roundFirstWord}
              </div>
              <div
                className="text-3xl xl:text-4xl font-black text-[#FFD700] -mt-1 mr-3 tracking-tight"
                style={{
                  textShadow: '0 4px 0 #230E3B, 0 6px 10px rgba(0,0,0,0.35)',
                }}
              >
                {roundSecondWord}
              </div>
            </div>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2">
            {isDisplayOnly ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleFullscreen}
                  title="ملء الشاشة"
                  aria-label="ملء الشاشة"
                  className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={onToggleDisplayMode}
                  title="العودة لوضع الاستوديو والمقدم"
                  aria-label="العودة لوضع المقدم"
                  className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition cursor-pointer shadow"
                >
                  وضع المقدم
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenMenuDrawer}
                aria-label="القائمة وإعدادات المباراة"
                className="w-12 h-12 rounded-2xl bg-white text-[#230E3B] shadow-[0_5px_0_#cbd5e1] active:translate-y-0.5 active:shadow-[0_2px_0_#cbd5e1] flex items-center justify-center transition cursor-pointer hover:bg-slate-50"
              >
                <Menu className="w-7 h-7 stroke-[2.75]" />
              </button>
            )}
          </div>
        </div>

        {/* Host Quick Utility Strip (Hidden in Audience Display Mode) */}
        {!isDisplayOnly && (
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              type="button"
              onClick={onUndoMove}
              disabled={!canUndo}
              aria-label="تراجع عن آخر حركة"
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition ${
                canUndo
                  ? 'bg-[#230E3B]/80 hover:bg-[#230E3B] text-white cursor-pointer border border-white/15'
                  : 'bg-[#230E3B]/35 text-white/40 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">تراجع</span>
            </button>

            <button
              type="button"
              onClick={onToggleCorrectionMode}
              aria-label="تصحيح ملكية الخلايا"
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                correctionMode
                  ? 'bg-amber-400 text-slate-950 border-amber-200 shadow'
                  : 'bg-[#230E3B]/80 hover:bg-[#230E3B] text-white border-white/15'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">تصحيح</span>
            </button>

            <button
              type="button"
              onClick={onOpenSyncModal}
              aria-label="ربط الجوال ورمز الغرفة"
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold bg-[#230E3B]/80 hover:bg-[#230E3B] text-amber-300 border border-amber-400/30 transition cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">الجوال ({connectedDevicesCount})</span>
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onToggleDisplayMode}
                title="تفعيل وضع شاشة العرض للجمهور (إخفاء أزرار المقدم)"
                aria-label="تفعيل وضع العرض"
                className="flex-1 flex items-center justify-center py-1.5 px-1.5 rounded-xl text-xs font-bold bg-[#230E3B]/80 hover:bg-[#230E3B] text-cyan-300 border border-cyan-400/25 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onToggleMute}
                title={isMuted ? 'تشغيل الأصوات' : 'كتم الأصوات'}
                aria-label={isMuted ? 'تشغيل الأصوات' : 'كتم الأصوات'}
                className="flex-1 flex items-center justify-center py-1.5 px-1.5 rounded-xl text-xs font-bold bg-[#230E3B]/80 hover:bg-[#230E3B] text-white border border-white/15 transition cursor-pointer"
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Center Dark Purple Question Container */}
      <div
        className={`my-2 flex-1 flex flex-col justify-between rounded-[28px] p-4 pt-7 relative shadow-2xl ${cardOuterBg}`}
      >
        {/* Top Floating Letter Hexagon Badge */}
        <div className="relative flex-1 flex flex-col">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center">
            <svg width="68" height="74" viewBox="0 0 80 88" aria-hidden="true">
              <path
                d={getRoundedHexPath(40, 44, 36, 6)}
                fill="#FFFFFF"
                stroke="#6A359C"
                strokeWidth="5"
              />
              <text
                x="40"
                y="45"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#632B96"
                style={{
                  fontFamily: `'${state.settings.fontFamily}', 'Alexandria', 'Cairo', sans-serif`,
                  fontSize: '34px',
                  fontWeight: 900,
                }}
              >
                {selectedCell ? selectedCell.letter : '!'}
              </text>
            </svg>
          </div>

          {/* Deselect (Cancel Cell Selection) button in top-left of question box */}
          {hasSelection && !isDisplayOnly && (
            <button
              type="button"
              onClick={onDeselectCell}
              title="إلغاء اختيار الخلية"
              aria-label="إلغاء اختيار الخلية"
              className="absolute top-2 left-2 z-20 w-7 h-7 rounded-lg bg-white/10 hover:bg-rose-500/80 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Inner Question Card */}
          <div
            className={`w-full flex-1 rounded-2xl border px-4 pt-9 pb-3 flex flex-col items-center justify-between text-center ${cardInnerBg}`}
          >
            {/* Category & Timer Header */}
            <div className="w-full flex items-center justify-between text-xs text-purple-200/80 px-1">
              <span>
                {state.currentQuestion
                  ? state.currentQuestion.category
                  : 'بنك الأسئلة · 336 سؤال'}
              </span>

              {state.settings.timerSeconds > 0 && hasSelection && (
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono font-extrabold text-sm tabular-nums ${
                      state.timerRemaining <= 5
                        ? 'text-rose-400 animate-pulse'
                        : 'text-amber-300'
                    }`}
                    data-testid="question-timer"
                  >
                    {state.timerRemaining}ث
                  </span>
                  {!isDisplayOnly && (
                    <>
                      <button
                        type="button"
                        onClick={onTimerToggle}
                        aria-label={state.timerRunning ? 'إيقاف المؤقت' : 'تشغيل المؤقت'}
                        className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      >
                        {state.timerRunning ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={onTimerReset}
                        aria-label="إعادة ضبط المؤقت"
                        className="p-1 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Question Body Text */}
            <div
              className="my-auto py-3 px-1 flex items-center justify-center"
              data-testid="question-box"
            >
              {!hasSelection ? (
                <p className="text-lg xl:text-xl font-extrabold text-white/90 leading-relaxed">
                  اختر خلية لإظهار السؤال...
                </p>
              ) : state.questionExhaustedForLetter ? (
                <div className="space-y-1">
                  <p className="text-base font-extrabold text-amber-300">
                    انتهت جميع الأسئلة المتاحة لحرف ({selectedCell.letter}) في هذه المباراة!
                  </p>
                  <p className="text-xs text-white/75">
                    يمكنك طرح سؤال خارجي مباشر أو منح الخلية للفريق الفائز.
                  </p>
                </div>
              ) : (
                <p className="text-lg xl:text-[21px] font-extrabold text-white leading-relaxed">
                  {state.currentQuestion?.question}
                </p>
              )}
            </div>

            {/* Timer visual progress bar when timer is enabled */}
            {state.settings.timerSeconds > 0 && hasSelection && (
              <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    state.timerRemaining <= 5 ? 'bg-rose-500' : 'bg-amber-400'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (state.timerRemaining / state.settings.timerSeconds) * 100
                      )
                    )}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Revealed Answer Banner (Visible when answerRevealed is true) */}
        {hasSelection && state.answerRevealed && state.currentQuestion && (
          <div
            data-testid="revealed-answer-banner"
            className="mt-3 w-full rounded-xl bg-[#273B40] border-2 border-[#28B81E] px-4 py-2 flex items-center justify-between shadow-md"
          >
            <Check className="w-5 h-5 text-[#28B81E] stroke-[3] shrink-0" />
            <span className="text-base xl:text-lg font-extrabold text-[#4ADE80] text-center flex-1">
              {state.currentQuestion.answer}
            </span>
            <span className="w-5" aria-hidden="true" />
          </div>
        )}

        {/* Question Control Buttons (Hidden in Audience Display Mode) */}
        {!isDisplayOnly && (
          <div className="mt-3 grid grid-cols-2 gap-3 shrink-0">
            {/* Show / Hide Answer Button (Cyan) */}
            <button
              type="button"
              disabled={!hasSelection || !state.currentQuestion}
              onClick={onRevealOrHideAnswer}
              data-testid="btn-toggle-answer"
              className={`py-2.5 px-3 rounded-2xl font-black text-sm xl:text-base transition whitespace-nowrap ${
                hasSelection && state.currentQuestion
                  ? 'bg-[#22C3D1] hover:bg-[#2fd1df] text-[#132A34] shadow-[0_5px_0_#138896] active:translate-y-0.5 active:shadow-[0_2px_0_#138896] cursor-pointer'
                  : 'bg-[#22C3D1]/40 text-[#132A34]/60 shadow-[0_4px_0_#0f5a63] cursor-not-allowed'
              }`}
            >
              {state.answerRevealed ? 'إخفاء الإجابة' : 'عرض الإجابة'}
            </button>

            {/* New Question Button (Yellow) */}
            <button
              type="button"
              disabled={!hasSelection}
              onClick={onNewQuestion}
              data-testid="btn-new-question"
              className={`py-2.5 px-3 rounded-2xl font-black text-sm xl:text-base transition whitespace-nowrap ${
                hasSelection
                  ? 'bg-[#EDC700] hover:bg-[#f7d316] text-[#2A1D00] shadow-[0_5px_0_#B28F00] active:translate-y-0.5 active:shadow-[0_2px_0_#B28F00] cursor-pointer'
                  : 'bg-[#EDC700]/40 text-[#2A1D00]/60 shadow-[0_4px_0_#755e00] cursor-not-allowed'
              }`}
            >
              سؤال جديد
            </button>
          </div>
        )}
      </div>

      {/* Bottom Team Score & Cell Claim Bars */}
      <div className="flex flex-col gap-2.5 shrink-0">
        {/* Team 1 Pill Bar (Green — Vertical Path) */}
        <button
          type="button"
          disabled={isDisplayOnly || !hasSelection}
          onClick={() => onClaimCell('team1')}
          data-testid="btn-claim-team1"
          aria-label={`منح الخلية لـ ${state.team1.name} - الرصيد الحالي ${team1OwnedCount}`}
          style={{
            backgroundColor: hasSelection && !isDisplayOnly ? state.team1.color : '#38344C',
            borderColor: state.team1.color,
          }}
          className={`w-full rounded-full border-[3px] px-3.5 py-2 flex items-center justify-between transition shadow-lg ${
            hasSelection && !isDisplayOnly
              ? 'cursor-pointer hover:brightness-105 active:scale-[0.99]'
              : 'cursor-default'
          }`}
        >
          {/* Right side in RTL: Hexagonal Cell Counter */}
          <div className="flex items-center gap-2">
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  d={getRoundedHexPath(24, 24, 20, 4)}
                  fill={state.team1.color}
                  stroke="#14532d"
                  strokeWidth="3.5"
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center font-black text-lg text-[#102A13] tabular-nums"
                data-testid="team1-cell-count"
              >
                {team1OwnedCount}
              </span>
            </div>
            <div className="text-right">
              <div
                className={`text-lg xl:text-xl font-black leading-tight ${
                  hasSelection && !isDisplayOnly ? 'text-[#0E2911]' : 'text-[#28B81E]'
                }`}
              >
                {state.team1.name}
              </div>
              <div
                className={`text-[11px] font-bold ${
                  hasSelection && !isDisplayOnly ? 'text-[#0E2911]/80' : 'text-white/65'
                }`}
              >
                مسار عمودي (أعلى ↕ أسفل) · الجولات: {state.team1.roundsWon}
              </div>
            </div>
          </div>

          {/* Left side in RTL: Checkmark icon when ready to claim */}
          <div className="pl-2">
            <Check
              className={`w-7 h-7 stroke-[3] transition-opacity ${
                hasSelection && !isDisplayOnly
                  ? 'opacity-100 text-[#0E2911]'
                  : 'opacity-25 text-white'
              }`}
            />
          </div>
        </button>

        {/* Team 2 Pill Bar (Orange — Horizontal Path) */}
        <button
          type="button"
          disabled={isDisplayOnly || !hasSelection}
          onClick={() => onClaimCell('team2')}
          data-testid="btn-claim-team2"
          aria-label={`منح الخلية لـ ${state.team2.name} - الرصيد الحالي ${team2OwnedCount}`}
          style={{
            backgroundColor: hasSelection && !isDisplayOnly ? state.team2.color : '#59324C',
            borderColor: state.team2.color,
          }}
          className={`w-full rounded-full border-[3px] px-3.5 py-2 flex items-center justify-between transition shadow-lg ${
            hasSelection && !isDisplayOnly
              ? 'cursor-pointer hover:brightness-105 active:scale-[0.99]'
              : 'cursor-default'
          }`}
        >
          {/* Right side in RTL: Hexagonal Cell Counter */}
          <div className="flex items-center gap-2">
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  d={getRoundedHexPath(24, 24, 20, 4)}
                  fill={state.team2.color}
                  stroke="#7c2d12"
                  strokeWidth="3.5"
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center font-black text-lg text-[#2E1305] tabular-nums"
                data-testid="team2-cell-count"
              >
                {team2OwnedCount}
              </span>
            </div>
            <div className="text-right">
              <div
                className={`text-lg xl:text-xl font-black leading-tight ${
                  hasSelection && !isDisplayOnly ? 'text-[#2E1305]' : 'text-[#FF7724]'
                }`}
              >
                {state.team2.name}
              </div>
              <div
                className={`text-[11px] font-bold ${
                  hasSelection && !isDisplayOnly ? 'text-[#2E1305]/80' : 'text-white/65'
                }`}
              >
                مسار أفقي (يمين ↔ يسار) · الجولات: {state.team2.roundsWon}
              </div>
            </div>
          </div>

          {/* Left side in RTL: Checkmark icon when ready to claim */}
          <div className="pl-2">
            <Check
              className={`w-7 h-7 stroke-[3] transition-opacity ${
                hasSelection && !isDisplayOnly
                  ? 'opacity-100 text-[#2E1305]'
                  : 'opacity-25 text-white'
              }`}
            />
          </div>
        </button>
      </div>
    </aside>
  );
};
