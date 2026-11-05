import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Smartphone, Tv, Monitor, X, KeyRound } from 'lucide-react';
import { RoomGameState } from '../types/game';

interface RoomSyncModalProps {
  state: RoomGameState;
  currentRole: 'studio' | 'display' | 'host';
  presence: { displays: number; hosts: number; studios: number; total: number };
  onClose: () => void;
  onSwitchRole: (role: 'studio' | 'display' | 'host') => void;
  onJoinRoom: (roomCode: string) => void;
}

export const RoomSyncModal: React.FC<RoomSyncModalProps> = ({
  state,
  currentRole,
  presence,
  onClose,
  onSwitchRole,
  onJoinRoom,
}) => {
  const [copiedHost, setCopiedHost] = useState(false);
  const [copiedDisplay, setCopiedDisplay] = useState(false);
  const [customRoomInput, setCustomRoomInput] = useState(state.roomCode);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const hostMobileUrl = `${origin}/?mode=host&room=${encodeURIComponent(
    state.roomCode
  )}&pin=${encodeURIComponent(state.hostPin)}`;

  const displayTvUrl = `${origin}/?mode=display&room=${encodeURIComponent(
    state.roomCode
  )}`;

  const copyToClipboard = (text: string, type: 'host' | 'display') => {
    navigator.clipboard?.writeText(text).catch(() => {});
    if (type === 'host') {
      setCopiedHost(true);
      setTimeout(() => setCopiedHost(false), 2000);
    } else {
      setCopiedDisplay(true);
      setTimeout(() => setCopiedDisplay(false), 2000);
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="ربط الجوال وشاشة العرض"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-[#230E3B] border-2 border-white/20 p-6 text-white shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-black">
              التحكم من الجوال ومزامنة شاشة العرض
            </h2>
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

        {/* Room Code & Host PIN Info Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#160826] border border-white/10 p-3.5 text-center">
            <div className="text-xs text-white/65 font-bold mb-1">رمز الغرفة</div>
            <div className="text-2xl font-black tracking-widest text-amber-300 font-mono">
              {state.roomCode}
            </div>
          </div>

          <div className="rounded-2xl bg-[#160826] border border-white/10 p-3.5 text-center">
            <div className="text-xs text-white/65 font-bold mb-1 flex items-center justify-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-cyan-300" />
              <span>رمز حماية المقدم (PIN)</span>
            </div>
            <div className="text-2xl font-black tracking-widest text-cyan-300 font-mono tabular-nums">
              {state.hostPin}
            </div>
          </div>

          <div className="rounded-2xl bg-[#160826] border border-white/10 p-3.5 text-center">
            <div className="text-xs text-white/65 font-bold mb-1">الأجهزة المتصلة الآن</div>
            <div className="text-lg font-black text-emerald-400 tabular-nums">
              {presence.total} جهاز متصل
            </div>
            <div className="text-[11px] text-white/60">
              عرض: {presence.displays} · مقدم: {presence.hosts} · استوديو: {presence.studios}
            </div>
          </div>
        </div>

        {/* QR Code & Direct Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* QR Card for Host Mobile Phone */}
          <div className="rounded-2xl bg-white/5 border border-amber-400/30 p-4 flex flex-col items-center text-center space-y-3">
            <div className="text-sm font-black text-amber-300">
              1. امسح الكود بهاتف المقدم (وضع التحكم الكامل)
            </div>
            <div className="p-3 bg-white rounded-2xl shadow-lg">
              <QRCodeSVG value={hostMobileUrl} size={148} level="M" />
            </div>
            <p className="text-xs text-white/75 leading-relaxed">
              يمنح المقدم رؤية الإجابة السرية فورًا على هاتفه، مع أزرار اختيار الحروف ومنح الخلايا وتشغيل المؤقت.
            </p>
            <button
              type="button"
              onClick={() => copyToClipboard(hostMobileUrl, 'host')}
              className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {copiedHost ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedHost ? 'تم نسخ رابط المقدم!' : 'نسخ رابط هاتف المقدم'}</span>
            </button>
          </div>

          {/* Mode Switcher for Current Device */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="text-sm font-black text-cyan-300">
                2. اختر وضع التشغيل على هذا الجهاز الحالي
              </div>
              <p className="text-xs text-white/75 leading-relaxed">
                إذا كان هذا الجهاز موصولاً بالتلفزيون أو البروجكتر أمام الجمهور، حوّله إلى «وضع شاشة العرض» لإخفاء أزرار الإدارة والإجابات غير المكشوفة.
              </p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onSwitchRole('display');
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-right flex items-center gap-3 transition cursor-pointer ${
                    currentRole === 'display'
                      ? 'bg-cyan-400 text-slate-950 border-cyan-200 font-black'
                      : 'bg-[#160826] hover:bg-white/10 text-white border-white/15 font-bold'
                  }`}
                >
                  <Tv className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-black">وضع شاشة العرض للجمهور (TV Display)</div>
                    <div className="text-[11px] opacity-80">بدون أزرار تحكم ولا إجابات مخفية</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSwitchRole('host');
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-right flex items-center gap-3 transition cursor-pointer ${
                    currentRole === 'host'
                      ? 'bg-amber-400 text-slate-950 border-amber-200 font-black'
                      : 'bg-[#160826] hover:bg-white/10 text-white border-white/15 font-bold'
                  }`}
                >
                  <Smartphone className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-black">وضع هاتف المقدم (Mobile Host)</div>
                    <div className="text-[11px] opacity-80">يرى الإجابة السرية ويتحكم باللوحة عن بُعد</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSwitchRole('studio');
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-right flex items-center gap-3 transition cursor-pointer ${
                    currentRole === 'studio'
                      ? 'bg-emerald-400 text-slate-950 border-emerald-200 font-black'
                      : 'bg-[#160826] hover:bg-white/10 text-white border-white/15 font-bold'
                  }`}
                >
                  <Monitor className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-black">وضع الاستوديو الشامل (All-in-One)</div>
                    <div className="text-[11px] opacity-80">اللوحة وأزرار التحكم معًا في شاشة واحدة</div>
                  </div>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(displayTvUrl, 'display')}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {copiedDisplay ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedDisplay ? 'تم نسخ رابط شاشة العرض!' : 'نسخ رابط شاشة العرض التلفزيونية'}</span>
            </button>
          </div>
        </div>

        {/* Join Another Room Code */}
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
            تغيير رمز الغرفة:
          </label>
          <input
            id="join-room-input"
            type="text"
            value={customRoomInput}
            onChange={(e) => setCustomRoomInput(e.target.value.toUpperCase())}
            className="flex-1 rounded-xl bg-[#160826] border border-white/20 px-3 py-1.5 text-sm font-mono font-bold text-white uppercase"
            placeholder="ELITE1"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition cursor-pointer"
          >
            انتقال للغرفة
          </button>
        </form>
      </div>
    </div>
  );
};
