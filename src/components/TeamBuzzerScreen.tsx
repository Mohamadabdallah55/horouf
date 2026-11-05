import React, { useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Lock, WifiOff, XCircle, Maximize2 } from 'lucide-react';
import { RoomGameState, TeamId } from '../types/game';

interface TeamBuzzerScreenProps {
  teamId: TeamId;
  state: RoomGameState;
  wsConnected: boolean;
  authorized: boolean;
  onBuzzPress: (questionNonce: number) => void;
}

export const TeamBuzzerScreen: React.FC<TeamBuzzerScreenProps> = ({
  teamId,
  state,
  wsConnected,
  authorized,
  onBuzzPress,
}) => {
  const team = teamId === 'team1' ? state.team1 : state.team2;
  const otherTeam = teamId === 'team1' ? state.team2 : state.team1;
  const buzzer = state.buzzer;

  const isLockedOut = buzzer.lockedOutTeams.includes(teamId);
  const isWinner = buzzer.status === 'locked_by_winner' && buzzer.winner === teamId;
  const isOtherWinner =
    buzzer.status === 'locked_by_winner' &&
    buzzer.winner !== null &&
    buzzer.winner !== teamId;
  const isReadyToPress =
    wsConnected &&
    authorized &&
    state.phase === 'playing' &&
    state.selectedCellId !== null &&
    buzzer.status === 'open' &&
    !isLockedOut;

  // Prevent duplicate local rapid taps on the same questionNonce
  const lastPressedNonceRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset local guard when buzzer reopens or questionNonce changes
    if (buzzer.status === 'open' && !isLockedOut) {
      lastPressedNonceRef.current = null;
    }
  }, [buzzer.questionNonce, buzzer.status, isLockedOut]);

  // Trigger gentle vibration when this device wins the buzzer
  useEffect(() => {
    if (isWinner && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([80, 40, 120]);
      } catch {
        // Ignore vibration permission errors
      }
    }
  }, [isWinner]);

  const handlePress = () => {
    if (!isReadyToPress) return;
    if (lastPressedNonceRef.current === buzzer.questionNonce) return;
    lastPressedNonceRef.current = buzzer.questionNonce;
    onBuzzPress(buzzer.questionNonce);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Determine visual state label and styling
  let statusHeadline = 'انتظار فتح الجرس...';
  let statusSubtext = 'استعد! سيُفتح الجرس عند طرح السؤال';
  let buttonBgClass = 'bg-black/30 border-white/25 text-white/75';
  let StatusIcon = Lock;

  if (!wsConnected) {
    statusHeadline = 'الاتصال منقطع';
    statusSubtext = 'جاري إعادة الاتصال بالغرفة تلقائيًا...';
    buttonBgClass = 'bg-rose-950/80 border-rose-400 text-rose-200';
    StatusIcon = WifiOff;
  } else if (!authorized) {
    statusHeadline = 'جهاز آخر معتمد لهذا الفريق';
    statusSubtext = 'يرجى الطلب من المقدم إعادة تعيين اتصال الفريق من الشاشة الرئيسية';
    buttonBgClass = 'bg-slate-900/80 border-amber-400 text-amber-200';
    StatusIcon = Lock;
  } else if (isWinner) {
    statusHeadline = 'أنت الأول!';
    statusSubtext = `أجب الآن شفهيًا · الوقت المتبقي للإجابة: ${buzzer.answerTimerRemaining} ثانية`;
    buttonBgClass =
      'bg-white text-slate-950 border-amber-300 shadow-[0_0_60px_rgba(255,255,255,0.85)] scale-[1.01]';
    StatusIcon = CheckCircle2;
  } else if (isOtherWinner) {
    statusHeadline = 'الفريق الآخر سبقك';
    statusSubtext = `${otherTeam.name} ضغط أولًا ويجيب الآن...`;
    buttonBgClass = 'bg-black/55 border-white/20 text-white/60';
    StatusIcon = Lock;
  } else if (isLockedOut || buzzer.status === 'exhausted') {
    statusHeadline = 'انتهت فرصتك في هذا السؤال';
    statusSubtext =
      buzzer.status === 'exhausted'
        ? 'بانتظار انتقال المقدم للسؤال التالي'
        : `الفرصة انتقلت إلى ${otherTeam.name}`;
    buttonBgClass = 'bg-black/60 border-rose-400/40 text-rose-200/80';
    StatusIcon = XCircle;
  } else if (isReadyToPress) {
    statusHeadline = 'اضغط للإجابة';
    statusSubtext = 'الجرس مفتوح الآن — أسرع بالضغط!';
    buttonBgClass =
      'bg-white hover:bg-amber-50 text-slate-950 border-white shadow-[0_18px_0_rgba(0,0,0,0.35)] active:translate-y-2 active:shadow-[0_6px_0_rgba(0,0,0,0.35)] cursor-pointer';
    StatusIcon = Bell;
  }

  return (
    <main
      dir="rtl"
      style={{ backgroundColor: team.color }}
      className="fixed inset-0 w-screen h-screen overflow-hidden flex flex-col justify-between p-5 sm:p-8 select-none text-white"
      data-testid={`team-buzzer-screen-${teamId}`}
      data-buzzer-status={buzzer.status}
      data-is-winner={isWinner ? 'true' : 'false'}
    >
      {/* Top Bar: Team Name & Connection Indicator */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between bg-black/25 rounded-3xl px-6 py-4 border border-white/20">
        <div className="flex items-center gap-3">
          <span
            className={`w-3.5 h-3.5 rounded-full ${
              wsConnected && authorized ? 'bg-white' : 'bg-rose-500'
            }`}
          />
          <div>
            <div className="text-xs font-bold text-white/80">
              غرفة المباراة: {state.roomCode}
            </div>
            <h1
              className="text-2xl sm:text-4xl font-black tracking-tight text-white"
              data-testid="buzzer-team-name"
            >
              {team.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-left bg-black/25 px-4 py-2 rounded-2xl border border-white/15">
            <div className="text-[11px] font-bold text-white/75">الجولات الفائزة</div>
            <div className="text-xl sm:text-2xl font-black tabular-nums text-center">
              {team.roundsWon}
            </div>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="ملء الشاشة"
            className="p-3 rounded-2xl bg-black/25 hover:bg-black/40 text-white transition cursor-pointer"
          >
            <Maximize2 className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Massive Full-Area Buzzer Button */}
      <div className="flex-1 w-full max-w-4xl mx-auto my-4 sm:my-6 flex items-stretch justify-center">
        <button
          type="button"
          disabled={!isReadyToPress}
          onPointerDown={(e) => {
            if (isReadyToPress) {
              e.preventDefault();
              handlePress();
            }
          }}
          onClick={handlePress}
          data-testid="giant-buzzer-button"
          aria-label={statusHeadline}
          className={`w-full h-full rounded-[44px] border-8 flex flex-col items-center justify-center p-6 text-center transition-all duration-150 select-none ${buttonBgClass}`}
        >
          <StatusIcon
            className={`w-20 h-20 sm:w-28 sm:h-28 mb-5 stroke-[2.5] ${
              isWinner
                ? 'text-emerald-600'
                : isReadyToPress
                ? 'text-amber-500 animate-bounce'
                : 'opacity-80'
            }`}
          />

          <span
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight"
            data-testid="buzzer-button-label"
          >
            {statusHeadline}
          </span>

          <span className="mt-4 text-base sm:text-xl font-bold opacity-85 max-w-md">
            {statusSubtext}
          </span>

          {isWinner && (
            <div
              className="mt-6 px-6 py-2.5 rounded-2xl bg-slate-950 text-amber-300 font-mono font-black text-2xl sm:text-3xl tabular-nums"
              data-testid="team-answer-countdown"
            >
              {buzzer.answerTimerRemaining} ث
            </div>
          )}
        </button>
      </div>

      {/* Quiet Footer Status */}
      <footer className="text-center text-xs sm:text-sm font-bold text-white/80">
        نظام الجرس الإلكتروني التلقائي · ELITE CLASH · الأولوية لأول ضغطة تصل إلى الخادم
      </footer>
    </main>
  );
};
