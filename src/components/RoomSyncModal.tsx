import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Bell,
  Check,
  Copy,
  RefreshCw,
  RotateCcw,
  Smartphone,
  Tv,
  Wifi,
  X,
  ExternalLink,
} from 'lucide-react';
import { ClientRole, RoomGameState, RoomPresence, TeamId } from '../types/game';

interface RoomSyncModalProps {
  state: RoomGameState;
  currentRole: ClientRole;
  presence: RoomPresence;
  onClose: () => void;
  onSwitchRole: (role: ClientRole) => void;
  onJoinRoom: (roomCode: string) => void;
  onCreateNewRoom: () => void;
  onResetTeamDevice: (team: TeamId | 'both') => void;
  onUpdateSettings: (partial: Partial<RoomGameState['settings']>) => void;
}

export const RoomSyncModal: React.FC<RoomSyncModalProps> = ({
  state,
  currentRole,
  presence,
  onClose,
  onSwitchRole,
  onJoinRoom,
  onCreateNewRoom,
  onResetTeamDevice,
  onUpdateSettings,
}) => {
  const [copiedKey, setCopiedKey] = useState<'host' | 'team1' | 'team2' | null>(
    null
  );
  const [customRoomInput, setCustomRoomInput] = useState(state.roomCode);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const hostUrl = `${origin}/?mode=host&room=${encodeURIComponent(
    state.roomCode
  )}&pin=${encodeURIComponent(state.hostPin)}`;
  const team1Url = `${origin}/?mode=team1&room=${encodeURIComponent(state.roomCode)}`;
  const team2Url = `${origin}/?mode=team2&room=${encodeURIComponent(state.roomCode)}`;

  const copyLink = (url: string, key: 'host' | 'team1' | 'team2') => {
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="تفعيل الجرس وجهاز تحكم المقدم"
      data-testid="buzzer-setup-modal"
    >
      <div className="w-full max-w-5xl rounded-3xl bg-[#230E3B] border-2 border-amber-400/50 p-5 text-white shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <div className="flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-xl font-black">
                ربط الأجهزة: جرس الفريقين + جهاز تحكم المقدم + شاشة التلفزيون
              </h2>
              <p className="text-xs text-white/70">
                مزامنة لحظية عبر الخادم لجميع الأجهزة المتصلة بغرفة المباراة ({state.roomCode})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة الربط"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Room Code Bar & Auto-Open Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#160826] border border-white/15 p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-white/65 font-bold">رمز غرفة المباراة</div>
              <div
                className="text-2xl font-black tracking-widest text-amber-300 font-mono"
                data-testid="room-code-display"
              >
                {state.roomCode}
              </div>
            </div>
            <button
              type="button"
              onClick={onCreateNewRoom}
              title="إنشاء رمز غرفة جديد وفريد"
              className="px-3 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>غرفة جديدة</span>
            </button>
          </div>

          <div className="rounded-2xl bg-[#160826] border border-white/15 p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-white/65 font-bold">فتح الجرس عند السؤال</div>
              <div className="text-xs font-extrabold text-white mt-0.5">
                {state.settings.autoOpenBuzzerOnQuestion
                  ? 'يُفتح تلقائيًا مع ظهور السؤال'
                  : 'يُفتح يدويًا بزر «فتح الجرس»'}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({
                  autoOpenBuzzerOnQuestion: !state.settings.autoOpenBuzzerOnQuestion,
                })
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                state.settings.autoOpenBuzzerOnQuestion
                  ? 'bg-emerald-400 text-slate-950'
                  : 'bg-white/15 text-white'
              }`}
            >
              {state.settings.autoOpenBuzzerOnQuestion ? 'تلقائي' : 'يدوي'}
            </button>
          </div>

          <div className="rounded-2xl bg-[#160826] border border-white/15 p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-white/65 font-bold">عداد الإجابة بعد الجرس</div>
              <div className="text-xs font-extrabold text-cyan-300 mt-0.5 tabular-nums">
                {state.settings.answerTimerSeconds} ثوانٍ للإجابة
              </div>
            </div>
            <div className="flex items-center gap-1 tabular-nums">
              {[5, 10, 15].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onUpdateSettings({ answerTimerSeconds: sec })}
                  className={`px-2 py-1 rounded-lg text-xs font-black cursor-pointer ${
                    state.settings.answerTimerSeconds === sec
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-white/10 text-white/75'
                  }`}
                >
                  {sec}ث
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Three QR & Link Cards: Host Controller + Team 1 Buzzer + Team 2 Buzzer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Host Mobile Controller */}
          <div className="rounded-3xl bg-[#160826] border-2 border-amber-400/70 p-4 flex flex-col items-center text-center space-y-2.5">
            <div className="w-full flex items-center justify-between">
              <span className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                <span>جهاز تحكم المقدم</span>
              </span>
              <span
                data-testid="modal-host-status"
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                  presence.hosts > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                <Wifi className="w-3 h-3" />
                <span>
                  {presence.hosts > 0
                    ? `متصل (${presence.hosts})`
                    : 'يعرض الإجابة السرية'}
                </span>
              </span>
            </div>

            <div className="p-2.5 bg-white rounded-2xl shadow-lg">
              <QRCodeSVG value={hostUrl} size={125} level="M" />
            </div>

            <div
              className="w-full text-[11px] font-mono text-white/70 bg-black/30 px-2.5 py-1.5 rounded-xl truncate"
              dir="ltr"
            >
              {hostUrl}
            </div>

            <div className="w-full grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => copyLink(hostUrl, 'host')}
                data-testid="btn-copy-host-link"
                className="py-2 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                {copiedKey === 'host' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedKey === 'host' ? 'تم النسخ!' : 'نسخ رابط المقدم'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSwitchRole('host');
                  onClose();
                }}
                data-testid="btn-switch-to-host"
                className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح جهاز التحكم</span>
              </button>
            </div>

            <div className="text-[11px] text-amber-200/80 font-bold">
              يتحكم بالخلايا والجرس ويعرض الجواب الصحيح سرًا للمقدم
            </div>
          </div>

          {/* Card 2: Team 1 (Green) Buzzer Card */}
          <div
            style={{ borderColor: state.team1.color }}
            className="rounded-3xl bg-[#160826] border-2 p-4 flex flex-col items-center text-center space-y-2.5"
          >
            <div className="w-full flex items-center justify-between">
              <span
                className="text-sm font-black"
                style={{ color: state.team1.color }}
              >
                جرس {state.team1.name} (الأخضر)
              </span>
              <span
                data-testid="modal-team1-status"
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                  presence.team1Connected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                <Wifi className="w-3 h-3" />
                <span>{presence.team1Connected ? 'متصل وجاهز' : 'بانتظار الاتصال'}</span>
              </span>
            </div>

            <div className="p-2.5 bg-white rounded-2xl shadow-lg">
              <QRCodeSVG value={team1Url} size={125} level="M" />
            </div>

            <div
              className="w-full text-[11px] font-mono text-white/70 bg-black/30 px-2.5 py-1.5 rounded-xl truncate"
              dir="ltr"
            >
              {team1Url}
            </div>

            <div className="w-full grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => copyLink(team1Url, 'team1')}
                data-testid="btn-copy-team1-link"
                style={{ backgroundColor: state.team1.color }}
                className="py-2 px-2.5 rounded-xl text-slate-950 font-black text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                {copiedKey === 'team1' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedKey === 'team1' ? 'تم النسخ!' : 'نسخ رابط الفريق 1'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSwitchRole('team1');
                  onClose();
                }}
                className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>معاينة جرس 1</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onResetTeamDevice('team1')}
              className="text-[11px] text-white/60 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة تعيين جهاز الفريق الأول</span>
            </button>
          </div>

          {/* Card 3: Team 2 (Orange) Buzzer Card */}
          <div
            style={{ borderColor: state.team2.color }}
            className="rounded-3xl bg-[#160826] border-2 p-4 flex flex-col items-center text-center space-y-2.5"
          >
            <div className="w-full flex items-center justify-between">
              <span
                className="text-sm font-black"
                style={{ color: state.team2.color }}
              >
                جرس {state.team2.name} (البرتقالي)
              </span>
              <span
                data-testid="modal-team2-status"
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                  presence.team2Connected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                <Wifi className="w-3 h-3" />
                <span>{presence.team2Connected ? 'متصل وجاهز' : 'بانتظار الاتصال'}</span>
              </span>
            </div>

            <div className="p-2.5 bg-white rounded-2xl shadow-lg">
              <QRCodeSVG value={team2Url} size={125} level="M" />
            </div>

            <div
              className="w-full text-[11px] font-mono text-white/70 bg-black/30 px-2.5 py-1.5 rounded-xl truncate"
              dir="ltr"
            >
              {team2Url}
            </div>

            <div className="w-full grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => copyLink(team2Url, 'team2')}
                data-testid="btn-copy-team2-link"
                style={{ backgroundColor: state.team2.color }}
                className="py-2 px-2.5 rounded-xl text-slate-950 font-black text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                {copiedKey === 'team2' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedKey === 'team2' ? 'تم النسخ!' : 'نسخ رابط الفريق 2'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSwitchRole('team2');
                  onClose();
                }}
                className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>معاينة جرس 2</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onResetTeamDevice('team2')}
              className="text-[11px] text-white/60 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة تعيين جهاز الفريق الثاني</span>
            </button>
          </div>
        </div>

        {/* Mode Switcher for Current Screen + Room Join Bar */}
        <div className="rounded-2xl bg-black/30 border border-white/10 p-3.5 text-xs text-white/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-amber-300">
              تبديل وضع هذه الشاشة الحالية:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onSwitchRole('studio');
                  onClose();
                }}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer ${
                  currentRole === 'studio'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>وضع الاستوديو الشامل</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSwitchRole('display');
                  onClose();
                }}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer ${
                  currentRole === 'display'
                    ? 'bg-cyan-400 text-slate-950'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>وضع شاشة العرض التلفزيونية للجمهور (بدون أزرار)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSwitchRole('host');
                  onClose();
                }}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer ${
                  currentRole === 'host'
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>وضع جهاز تحكم المقدم</span>
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customRoomInput.trim()) {
                onJoinRoom(customRoomInput.trim().toUpperCase());
              }
            }}
            className="flex items-center gap-2 pt-1 border-t border-white/10"
          >
            <label htmlFor="join-room-input" className="text-xs font-bold text-white/75 shrink-0">
              تغيير رمز الغرفة يدويًا:
            </label>
            <input
              id="join-room-input"
              type="text"
              value={customRoomInput}
              onChange={(e) => setCustomRoomInput(e.target.value.toUpperCase())}
              className="flex-1 rounded-xl bg-[#160826] border border-white/20 px-3 py-1.5 text-xs font-mono font-bold text-white uppercase"
              placeholder="ELITE1"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition cursor-pointer"
            >
              تطبيق الغرفة
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
