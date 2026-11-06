import React from 'react';
import {
  Bell,
  Check,
  Lock,
  Maximize2,
  Menu,
  Play,
  Pause,
  RotateCcw,
  Undo2,
  Volume2,
  VolumeX,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import { getArabicRoundTitle } from '../game/gameEngine';
import { getRoundedHexPath } from '../game/hexMath';
import { RoomGameState, RoomPresence, TeamId } from '../types/game';

interface SideControlPanelProps {
  state: RoomGameState;
  presence: RoomPresence;
  isDisplayOnly: boolean;
  isMuted: boolean;
  correctionMode: boolean;
  onRevealOrHideAnswer: () => void;
  onNewQuestion: () => void;
  onDeselectCell: () => void;
  onClaimCell: (team: TeamId) => void;
  onUndoMove: () => void;
  onToggleCorrectionMode: () => void;
  onToggleMute: () => void;
  onOpenMenuDrawer: () => void;
  onOpenSyncModal: () => void;
  onTimerToggle: () => void;
  onTimerReset: () => void;
  onBuzzerOpen: () => void;
  onBuzzerLock: () => void;
  onBuzzerCorrectAnswer: () => void;
  onBuzzerWrongAnswer: () => void;
  onBuzzerResetRace: () => void;
  onToggleDisplayMode: () => void;
}

export const SideControlPanel: React.FC<SideControlPanelProps> = ({
  state,
  presence,
  isDisplayOnly,
  isMuted,
  correctionMode,
  onRevealOrHideAnswer,
  onNewQuestion,
  onDeselectCell,
  onClaimCell,
  onUndoMove,
  onToggleCorrectionMode,
  onToggleMute,
  onOpenMenuDrawer,
  onOpenSyncModal,
  onTimerToggle,
  onTimerReset,
  onBuzzerOpen,
  onBuzzerLock,
  onBuzzerCorrectAnswer,
  onBuzzerWrongAnswer,
  onBuzzerResetRace,
  onToggleDisplayMode,
}) => {
  const selectedCell =
    state.selectedCellId !== null ? state.cells[state.selectedCellId] : null;

  const team1OwnedCount = state.cells.filter((c) => c.owner === 'team1').length;
  const team2OwnedCount = state.cells.filter((c) => c.owner === 'team2').length;

  const hasSelection = selectedCell !== null;
  const canUndo = state.moveHistory.some((m) => m.round === state.currentRound);
  const buzzer = state.buzzer;

  const buzzerWinnerTeam =
    buzzer.winner === 'team1'
      ? state.team1
      : buzzer.winner === 'team2'
      ? state.team2
      : null;

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
      className={`w-full h-full flex flex-col justify-between px-4 py-3 select-none ${panelBg} text-white relative overflow-y-auto`}
      aria-label="لوحة التحكم والأسئلة"
    >
      {/* Top Header: Round Title + Studio Menu Button */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-start justify-between gap-2">
          {/* Stylized 3D Broadcast Round Title */}
          <div className="flex flex-col leading-none pr-1">
            <div className="text-[11px] font-bold tracking-wider text-amber-300/90 mb-0.5">
              ELITE CLASH · الجولة {state.currentRound} من {state.settings.totalRounds}
            </div>
            <div
              className="transform -rotate-6 origin-right select-none"
              style={{
                fontFamily: `'${state.settings.fontFamily}', 'Alexandria', 'Cairo', sans-serif`,
              }}
            >
              <div
                className="text-2xl xl:text-3xl font-black text-[#FF5733] tracking-tight"
                style={{
                  textShadow: '0 3px 0 #230E3B, 0 5px 8px rgba(0,0,0,0.35)',
                }}
              >
                {roundFirstWord}
              </div>
              <div
                className="text-2xl xl:text-3xl font-black text-[#FFD700] -mt-1 mr-3 tracking-tight"
                style={{
                  textShadow: '0 3px 0 #230E3B, 0 5px 8px rgba(0,0,0,0.35)',
                }}
              >
                {roundSecondWord}
              </div>
            </div>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-1.5">
            {isDisplayOnly && (
              <button
                type="button"
                onClick={onToggleDisplayMode}
                title="العودة لوضع الاستوديو"
                className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-extrabold transition cursor-pointer"
              >
                وضع الاستوديو
              </button>
            )}

            <button
              type="button"
              onClick={handleFullscreen}
              title="ملء الشاشة"
              aria-label="ملء الشاشة"
              className="w-10 h-10 rounded-xl bg-[#230E3B]/75 hover:bg-[#230E3B] text-white flex items-center justify-center transition cursor-pointer border border-white/15"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {!isDisplayOnly && (
              <button
                type="button"
                onClick={onOpenMenuDrawer}
                aria-label="القائمة وإعدادات المباراة"
                className="w-11 h-11 rounded-2xl bg-white text-[#230E3B] shadow-[0_4px_0_#cbd5e1] active:translate-y-0.5 flex items-center justify-center transition cursor-pointer hover:bg-slate-50"
              >
                <Menu className="w-6 h-6 stroke-[2.75]" />
              </button>
            )}
          </div>
        </div>

        {/* Host Quick Utility Strip + Activate Buzzer & Host Controller Button */}
        {!isDisplayOnly && (
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={onOpenSyncModal}
              data-testid="btn-activate-buzzer"
              aria-label="تفعيل الجرس وجهاز التحكم"
              className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 shadow transition cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">الجرس والتحكم ({state.roomCode})</span>
            </button>

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

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onToggleCorrectionMode}
                title="تصحيح ملكية الخلايا"
                aria-label="تصحيح ملكية الخلايا"
                className={`flex-1 flex items-center justify-center py-1.5 px-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  correctionMode
                    ? 'bg-amber-400 text-slate-950 border-amber-200 shadow'
                    : 'bg-[#230E3B]/80 hover:bg-[#230E3B] text-white border-white/15'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
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

        {/* Live Team Buzzer & Host Connection Status Strip */}
        <div
          className="rounded-xl bg-[#230E3B]/85 border border-white/10 px-2.5 py-1.5 flex items-center justify-between text-[11px] font-bold"
          data-testid="buzzer-connection-strip"
        >
          <div className="flex items-center gap-1">
            <span className="text-white/70">جرس 1:</span>
            <span
              data-testid="status-team1-conn"
              className={
                presence.team1Connected ? 'text-emerald-400 font-black' : 'text-white/45'
              }
            >
              {presence.team1Connected ? 'متصل' : 'غير متصل'}
            </span>
          </div>
          <span className="text-white/25">·</span>
          <div className="flex items-center gap-1">
            <span className="text-white/70">جرس 2:</span>
            <span
              data-testid="status-team2-conn"
              className={
                presence.team2Connected ? 'text-orange-400 font-black' : 'text-white/45'
              }
            >
              {presence.team2Connected ? 'متصل' : 'غير متصل'}
            </span>
          </div>
          <span className="text-white/25">·</span>
          <div className="flex items-center gap-1">
            <span className="text-white/70">المقدم:</span>
            <span
              data-testid="status-host-conn"
              className={
                presence.hosts > 0 ? 'text-amber-300 font-black' : 'text-white/45'
              }
            >
              {presence.hosts > 0 ? `متصل (${presence.hosts})` : 'غير متصل'}
            </span>
          </div>
        </div>
      </div>

      {/* Center Dark Purple Question & Buzzer Container */}
      <div
        className={`my-1.5 flex-1 flex flex-col justify-between rounded-[26px] p-3.5 pt-6 relative shadow-2xl ${cardOuterBg}`}
      >
        {/* Top Floating Letter Hexagon Badge */}
        <div className="relative flex-1 flex flex-col">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center">
            <svg width="62" height="68" viewBox="0 0 80 88" aria-hidden="true">
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
            className={`w-full flex-1 rounded-2xl border px-3.5 pt-8 pb-2.5 flex flex-col items-center justify-between text-center ${cardInnerBg}`}
          >
            {/* Category & Timer Header */}
            <div className="w-full flex items-center justify-between text-xs text-purple-200/80 px-1">
              <span>
                {state.currentQuestion
                  ? state.currentQuestion.category
                  : 'بنك الأسئلة · 336 سؤال'}
              </span>

              {state.settings.timerSeconds > 0 && hasSelection && (
                <div className="flex items-center gap-1">
                  <span
                    className={`font-mono font-extrabold text-xs tabular-nums ${
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
              className="my-auto py-2 px-1 flex items-center justify-center"
              data-testid="question-box"
            >
              {!hasSelection ? (
                <p className="text-base xl:text-lg font-extrabold text-white/90 leading-relaxed">
                  اختر خلية لإظهار السؤال...
                </p>
              ) : state.questionExhaustedForLetter ? (
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-amber-300">
                    انتهت جميع الأسئلة المتاحة لحرف ({selectedCell.letter}) في هذه المباراة!
                  </p>
                  <p className="text-xs text-white/75">
                    يمكنك طرح سؤال خارجي مباشر أو منح الخلية للفريق الفائز.
                  </p>
                </div>
              ) : (
                <p className="text-base xl:text-[19px] font-extrabold text-white leading-relaxed">
                  {state.currentQuestion?.question}
                </p>
              )}
            </div>

            {/* Buzzer Control & Automatic Winner Result Section */}
            {hasSelection && (
              <div className="w-full space-y-2 pt-1 border-t border-white/10">
                {/* 1. When a team has buzzed in first! */}
                {buzzer.status === 'locked_by_winner' && buzzerWinnerTeam ? (
                  <div
                    data-testid="buzzer-winner-banner"
                    style={{
                      backgroundColor: buzzerWinnerTeam.color,
                    }}
                    className="w-full rounded-xl p-2.5 text-slate-950 shadow-lg space-y-2"
                  >
                    <div className="flex items-center justify-between px-1">
                      <span
                        className="text-sm xl:text-base font-black"
                        data-testid="buzzer-winner-text"
                      >
                        {buzzerWinnerTeam.name} ضغط أولًا!
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-lg bg-slate-950 text-amber-300 font-mono font-black text-xs tabular-nums"
                        data-testid="buzzer-answer-timer"
                      >
                        عداد الإجابة: {buzzer.answerTimerRemaining}ث
                      </span>
                    </div>

                    {!isDisplayOnly && (
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={onBuzzerCorrectAnswer}
                          data-testid="btn-buzz-correct"
                          className="py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-slate-900 text-emerald-400 font-black text-xs flex items-center justify-center gap-1 cursor-pointer shadow"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>إجابة صحيحة</span>
                        </button>

                        <button
                          type="button"
                          onClick={onBuzzerWrongAnswer}
                          data-testid="btn-buzz-wrong"
                          className="py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-slate-900 text-rose-400 font-black text-xs flex items-center justify-center gap-1 cursor-pointer shadow"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>إجابة خاطئة</span>
                        </button>

                        <button
                          type="button"
                          onClick={onBuzzerResetRace}
                          data-testid="btn-buzz-reset"
                          className="py-1.5 px-2 rounded-lg bg-slate-950/80 hover:bg-slate-900 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>إعادة السباق</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 2. When waiting to open buzzer or buzzer is currently open for racing */
                  !isDisplayOnly && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold px-1">
                        <span
                          data-testid="buzzer-state-label"
                          className={
                            buzzer.status === 'open'
                              ? 'text-emerald-300 font-black'
                              : buzzer.status === 'exhausted'
                              ? 'text-rose-300 font-black'
                              : 'text-amber-300'
                          }
                        >
                          {buzzer.status === 'open'
                            ? buzzer.lockedOutTeams.length === 1
                              ? `الجرس مفتوح لـ ${
                                  buzzer.lockedOutTeams[0] === 'team1'
                                    ? state.team2.name
                                    : state.team1.name
                                } فقط!`
                              : 'الجرس مفتوح الآن — بانتظار ضغطة الفريقين!'
                            : buzzer.status === 'exhausted'
                            ? 'أخطأ الفريقان في هذا السؤال'
                            : 'الجرس مقفول (استعداد)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={onBuzzerOpen}
                          disabled={buzzer.status === 'open'}
                          data-testid="btn-open-buzzer"
                          className={`py-1.5 px-2 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition ${
                            buzzer.status !== 'open'
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow'
                              : 'bg-emerald-500/25 text-emerald-200/50 cursor-not-allowed'
                          }`}
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>فتح الجرس</span>
                        </button>

                        <button
                          type="button"
                          onClick={onBuzzerLock}
                          disabled={buzzer.status !== 'open'}
                          data-testid="btn-lock-buzzer"
                          className={`py-1.5 px-2 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition ${
                            buzzer.status === 'open'
                              ? 'bg-rose-500 hover:bg-rose-400 text-white cursor-pointer shadow'
                              : 'bg-white/10 text-white/40 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>قفل الجرس</span>
                        </button>

                        <button
                          type="button"
                          onClick={onBuzzerResetRace}
                          data-testid="btn-buzz-reset"
                          className="py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>إعادة السباق</span>
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Revealed Answer Banner (Visible when answerRevealed is true) */}
        {hasSelection && state.answerRevealed && state.currentQuestion && (
          <div
            data-testid="revealed-answer-banner"
            className="mt-2.5 w-full rounded-xl bg-[#273B40] border-2 border-[#28B81E] px-3.5 py-1.5 flex items-center justify-between shadow-md"
          >
            <Check className="w-4 h-4 text-[#28B81E] stroke-[3] shrink-0" />
            <span className="text-sm xl:text-base font-extrabold text-[#4ADE80] text-center flex-1">
              {state.currentQuestion.answer}
            </span>
            <span className="w-4" aria-hidden="true" />
          </div>
        )}

        {/* Question Control Buttons (Hidden in Audience Display Mode) */}
        {!isDisplayOnly && (
          <div className="mt-2.5 grid grid-cols-2 gap-2.5 shrink-0">
            <button
              type="button"
              disabled={!hasSelection || !state.currentQuestion}
              onClick={onRevealOrHideAnswer}
              data-testid="btn-toggle-answer"
              className={`py-2 px-3 rounded-2xl font-black text-sm transition whitespace-nowrap ${
                hasSelection && state.currentQuestion
                  ? 'bg-[#22C3D1] hover:bg-[#2fd1df] text-[#132A34] shadow-[0_4px_0_#138896] active:translate-y-0.5 cursor-pointer'
                  : 'bg-[#22C3D1]/40 text-[#132A34]/60 shadow-[0_3px_0_#0f5a63] cursor-not-allowed'
              }`}
            >
              {state.answerRevealed ? 'إخفاء الإجابة' : 'عرض الإجابة'}
            </button>

            <button
              type="button"
              disabled={!hasSelection}
              onClick={onNewQuestion}
              data-testid="btn-new-question"
              className={`py-2 px-3 rounded-2xl font-black text-sm transition whitespace-nowrap ${
                hasSelection
                  ? 'bg-[#EDC700] hover:bg-[#f7d316] text-[#2A1D00] shadow-[0_4px_0_#B28F00] active:translate-y-0.5 cursor-pointer'
                  : 'bg-[#EDC700]/40 text-[#2A1D00]/60 shadow-[0_3px_0_#755e00] cursor-not-allowed'
              }`}
            >
              سؤال جديد
            </button>
          </div>
        )}
      </div>

      {/* Bottom Team Score & Cell Claim Bars */}
      <div className="flex flex-col gap-2 shrink-0">
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
          className={`w-full rounded-full border-[3px] px-3 py-1.5 flex items-center justify-between transition shadow-lg ${
            hasSelection && !isDisplayOnly
              ? 'cursor-pointer hover:brightness-105 active:scale-[0.99]'
              : 'cursor-default'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
              <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  d={getRoundedHexPath(24, 24, 20, 4)}
                  fill={state.team1.color}
                  stroke="#14532d"
                  strokeWidth="3.5"
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center font-black text-base text-[#102A13] tabular-nums"
                data-testid="team1-cell-count"
              >
                {team1OwnedCount}
              </span>
            </div>
            <div className="text-right">
              <div
                className={`text-base xl:text-lg font-black leading-tight ${
                  hasSelection && !isDisplayOnly ? 'text-[#0E2911]' : 'text-[#28B81E]'
                }`}
              >
                {state.team1.name}
              </div>
              <div
                className={`text-[10px] font-bold ${
                  hasSelection && !isDisplayOnly ? 'text-[#0E2911]/80' : 'text-white/65'
                }`}
              >
                مسار عمودي (أعلى ↕ أسفل) · الجولات: {state.team1.roundsWon}
              </div>
            </div>
          </div>

          <div className="pl-2">
            <Check
              className={`w-6 h-6 stroke-[3] transition-opacity ${
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
          className={`w-full rounded-full border-[3px] px-3 py-1.5 flex items-center justify-between transition shadow-lg ${
            hasSelection && !isDisplayOnly
              ? 'cursor-pointer hover:brightness-105 active:scale-[0.99]'
              : 'cursor-default'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
              <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  d={getRoundedHexPath(24, 24, 20, 4)}
                  fill={state.team2.color}
                  stroke="#7c2d12"
                  strokeWidth="3.5"
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center font-black text-base text-[#2E1305] tabular-nums"
                data-testid="team2-cell-count"
              >
                {team2OwnedCount}
              </span>
            </div>
            <div className="text-right">
              <div
                className={`text-base xl:text-lg font-black leading-tight ${
                  hasSelection && !isDisplayOnly ? 'text-[#2E1305]' : 'text-[#FF7724]'
                }`}
              >
                {state.team2.name}
              </div>
              <div
                className={`text-[10px] font-bold ${
                  hasSelection && !isDisplayOnly ? 'text-[#2E1305]/80' : 'text-white/65'
                }`}
              >
                مسار أفقي (يمين ↔ يسار) · الجولات: {state.team2.roundsWon}
              </div>
            </div>
          </div>

          <div className="pl-2">
            <Check
              className={`w-6 h-6 stroke-[3] transition-opacity ${
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
