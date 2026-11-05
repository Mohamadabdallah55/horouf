import React, { useState } from 'react';
import { Play, Smartphone, Tv, Sparkles } from 'lucide-react';
import { getRoundedHexPath } from '../game/hexMath';
import { FontFamilyId, RoomGameState, VisualThemeId } from '../types/game';

interface TitleAndSetupModalProps {
  state: RoomGameState;
  onStartMatch: (config: {
    team1Name: string;
    team2Name: string;
    team1Color: string;
    team2Color: string;
    totalRounds: number;
    timerSeconds: number;
    theme: VisualThemeId;
    fontFamily: FontFamilyId;
  }) => void;
  onOpenSyncModal: () => void;
  onSwitchToDisplayMode: () => void;
}

const TEAM1_COLOR_PRESETS = ['#28B81E', '#10B981', '#16A34A', '#06B6D4'];
const TEAM2_COLOR_PRESETS = ['#FF7724', '#F97316', '#F59E0B', '#EC4899'];

export const TitleAndSetupModal: React.FC<TitleAndSetupModalProps> = ({
  state,
  onStartMatch,
  onOpenSyncModal,
  onSwitchToDisplayMode,
}) => {
  const [team1Name, setTeam1Name] = useState(state.team1.name || 'الفريق الأول');
  const [team2Name, setTeam2Name] = useState(state.team2.name || 'الفريق الثاني');
  const [team1Color, setTeam1Color] = useState(state.team1.color || '#28B81E');
  const [team2Color, setTeam2Color] = useState(state.team2.color || '#FF7724');
  const [totalRounds, setTotalRounds] = useState(state.settings.totalRounds || 3);
  const [timerSeconds, setTimerSeconds] = useState(state.settings.timerSeconds ?? 30);
  const [theme, setTheme] = useState<VisualThemeId>(state.settings.theme || 'classic');
  const [fontFamily, setFontFamily] = useState<FontFamilyId>(
    state.settings.fontFamily || 'Cairo'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartMatch({
      team1Name: team1Name.trim() || 'الفريق الأول',
      team2Name: team2Name.trim() || 'الفريق الثاني',
      team1Color,
      team2Color,
      totalRounds,
      timerSeconds,
      theme,
      fontFamily,
    });
  };

  const bgGradient =
    theme === 'elite_clash'
      ? 'bg-gradient-to-br from-[#0d081d] via-[#191035] to-[#0a0614]'
      : 'bg-[#6A359C]';

  return (
    <div
      dir="rtl"
      className={`fixed inset-0 z-50 ${bgGradient} text-white flex flex-col justify-between overflow-y-auto px-6 py-6 select-none`}
    >
      {/* Decorative Background Side Hexagons (Matching Reference Title Screen) */}
      <svg
        className="pointer-events-none fixed inset-0 w-full h-full opacity-20"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {/* Left decorative hexagons */}
        {[
          { x: 90, y: 90, l: 'ع' },
          { x: 30, y: 240, l: 'ص' },
          { x: 140, y: 390, l: 'ي' },
          { x: 80, y: 550, l: 'ل' },
          { x: 180, y: 690, l: 'ض' },
          { x: 110, y: 830, l: 'غ' },
        ].map((item, idx) => (
          <g key={`left_${idx}`} transform={`rotate(-12 ${item.x} ${item.y})`}>
            <path d={getRoundedHexPath(item.x, item.y, 75, 10)} fill="#FFFFFF" />
            <text
              x={item.x}
              y={item.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#4A1D75"
              fontSize="60"
              fontWeight="900"
            >
              {item.l}
            </text>
          </g>
        ))}

        {/* Right decorative hexagons */}
        {[
          { x: 1350, y: 180, l: 'ر' },
          { x: 1290, y: 360, l: 'ن' },
          { x: 1390, y: 520, l: 'ق' },
          { x: 1330, y: 700, l: 'ز' },
        ].map((item, idx) => (
          <g key={`right_${idx}`} transform={`rotate(14 ${item.x} ${item.y})`}>
            <path d={getRoundedHexPath(item.x, item.y, 75, 10)} fill="#FFFFFF" />
            <text
              x={item.x}
              y={item.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#4A1D75"
              fontSize="60"
              fontWeight="900"
            >
              {item.l}
            </text>
          </g>
        ))}
      </svg>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-5xl w-full mx-auto my-auto flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Right Column (in RTL): Custom Inline SVG Title Lockup & Game Brief */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-right space-y-4">
          <div className="inline-flex items-center gap-2 text-amber-300 font-bold text-sm tracking-wide">
            <Sparkles className="w-4 h-4" />
            <span>المسابقة التلفزيونية الرسمية · دوري ELITE CLASH</span>
          </div>

          {/* Bespoke Inline SVG 3D Arabic Title Lockup */}
          <svg
            viewBox="0 0 460 230"
            className="w-full max-w-[380px] h-auto drop-shadow-2xl"
            role="img"
            aria-label="حروف النخبة ELITE CLASH"
          >
            <g transform="rotate(-6 230 115)">
              {/* 3D Extrusion Shadow for حروف */}
              <text
                x="235"
                y="88"
                textAnchor="middle"
                fill="#220C3A"
                fontSize="82"
                fontWeight="900"
                style={{ fontFamily: `'Alexandria', 'Cairo', sans-serif` }}
              >
                حروف
              </text>
              {/* Main Yellow Layer for حروف */}
              <text
                x="225"
                y="78"
                textAnchor="middle"
                fill="#FFE100"
                stroke="#220C3A"
                strokeWidth="3"
                fontSize="82"
                fontWeight="900"
                style={{ fontFamily: `'Alexandria', 'Cairo', sans-serif` }}
              >
                حروف
              </text>

              {/* Center Cyan Ribbon Badge */}
              <rect
                x="145"
                y="98"
                width="170"
                height="34"
                rx="17"
                fill="#22C3D1"
                stroke="#220C3A"
                strokeWidth="3"
              />
              <text
                x="230"
                y="121"
                textAnchor="middle"
                fill="#112A34"
                fontSize="20"
                fontWeight="900"
                style={{ fontFamily: `'Cairo', sans-serif` }}
              >
                ELITE CLASH
              </text>

              {/* 3D Extrusion Shadow for النخبة */}
              <text
                x="236"
                y="202"
                textAnchor="middle"
                fill="#220C3A"
                fontSize="78"
                fontWeight="900"
                style={{ fontFamily: `'Alexandria', 'Cairo', sans-serif` }}
              >
                النخبة
              </text>
              {/* Main Coral-Orange Layer for النخبة */}
              <text
                x="226"
                y="192"
                textAnchor="middle"
                fill="#FF5733"
                stroke="#220C3A"
                strokeWidth="3"
                fontSize="78"
                fontWeight="900"
                style={{ fontFamily: `'Alexandria', 'Cairo', sans-serif` }}
              >
                النخبة
              </text>
            </g>
          </svg>

          <p className="text-white/90 text-sm xl:text-base max-w-md leading-relaxed font-semibold">
            تنافس مباشر بين فريقين على لوحة من 25 خلية سداسية. الفريق الأخضر يصل
            الأعلى بالأسفل، والفريق البرتقالي يصل اليمين باليسار عبر الإجابة على
            بنك يضم 336 سؤالاً موثقًا.
          </p>

          {/* Secondary Mode Buttons: Activate Buzzer & Display Mode */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
            <button
              type="button"
              onClick={onOpenSyncModal}
              data-testid="title-btn-activate-buzzer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm transition cursor-pointer shadow-lg"
            >
              <Smartphone className="w-4 h-4" />
              <span>تفعيل الجرس وربط الفريقين (غرفة: {state.roomCode})</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToDisplayMode}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-extrabold text-sm transition cursor-pointer"
            >
              <Tv className="w-4 h-4" />
              <span>وضع شاشة العرض فقط</span>
            </button>
          </div>
        </div>

        {/* Left Column (in RTL): Match & Team Configuration Card */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg rounded-3xl bg-[#230E3B]/95 border-2 border-white/15 p-6 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-xl font-black text-white">إعدادات المباراة والفرق</h2>
            <span className="text-xs font-bold text-amber-300">
              غرفة البث: {state.roomCode}
            </span>
          </div>

          {/* Team 1 & Team 2 Names and Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Team 1 Config */}
            <div className="rounded-2xl bg-white/5 p-3.5 border border-white/10 space-y-2.5">
              <label
                htmlFor="team1-name-input"
                className="block text-xs font-extrabold text-emerald-300"
              >
                الفريق الأول (المسار العمودي ↕)
              </label>
              <input
                id="team1-name-input"
                type="text"
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                required
                className="w-full rounded-xl bg-[#160826] border border-white/20 px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-emerald-400"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-white/70">اللون:</span>
                <div className="flex items-center gap-1.5">
                  {TEAM1_COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTeam1Color(c)}
                      aria-label={`لون الفريق الأول ${c}`}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full cursor-pointer transition ${
                        team1Color === c
                          ? 'ring-2 ring-white scale-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Team 2 Config */}
            <div className="rounded-2xl bg-white/5 p-3.5 border border-white/10 space-y-2.5">
              <label
                htmlFor="team2-name-input"
                className="block text-xs font-extrabold text-orange-300"
              >
                الفريق الثاني (المسار الأفقي ↔)
              </label>
              <input
                id="team2-name-input"
                type="text"
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                required
                className="w-full rounded-xl bg-[#160826] border border-white/20 px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-orange-400"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-white/70">اللون:</span>
                <div className="flex items-center gap-1.5">
                  {TEAM2_COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTeam2Color(c)}
                      aria-label={`لون الفريق الثاني ${c}`}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full cursor-pointer transition ${
                        team2Color === c
                          ? 'ring-2 ring-white scale-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Rounds & Timer Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                نظام الجولات (الأفضل من):
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-[#160826] p-1 rounded-xl border border-white/10">
                {[
                  { val: 1, label: 'جولة واحدة' },
                  { val: 3, label: '3 جولات' },
                  { val: 5, label: '5 جولات' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setTotalRounds(opt.val)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      totalRounds === opt.val
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : 'text-white/75 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                مؤقت السؤال (بالثواني):
              </label>
              <div className="grid grid-cols-4 gap-1 bg-[#160826] p-1 rounded-xl border border-white/10">
                {[
                  { val: 0, label: 'بدون' },
                  { val: 15, label: '15ث' },
                  { val: 30, label: '30ث' },
                  { val: 45, label: '45ث' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setTimerSeconds(opt.val)}
                    className={`py-1.5 px-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer tabular-nums ${
                      timerSeconds === opt.val
                        ? 'bg-cyan-400 text-slate-950 shadow'
                        : 'text-white/75 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Identity & Font Family */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1.5">
                الهوية البصرية:
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#160826] p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setTheme('classic')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    theme === 'classic'
                      ? 'bg-purple-500 text-white shadow'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  كلاسيكي (بنفسجي)
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('elite_clash')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    theme === 'elite_clash'
                      ? 'bg-amber-400 text-slate-950 shadow'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  ELITE CLASH
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="font-family-select"
                className="block text-xs font-bold text-white/80 mb-1.5"
              >
                خط الحروف العربية:
              </label>
              <select
                id="font-family-select"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value as FontFamilyId)}
                className="w-full rounded-xl bg-[#160826] border border-white/15 px-3 py-2 text-xs font-extrabold text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Cairo">خط القاهرة (Cairo Bold)</option>
                <option value="Alexandria">خط الإسكندرية (Alexandria TV)</option>
                <option value="Changa">خط تشانغا (Changa Display)</option>
                <option value="Tajawal">خط تجول (Tajawal Clean)</option>
              </select>
            </div>
          </div>

          {/* Primary Start CTA */}
          <button
            type="submit"
            data-start="true"
            data-testid="btn-start-match"
            className="w-full py-3.5 px-6 rounded-2xl bg-[#28B81E] hover:bg-[#2fd124] text-white font-black text-lg shadow-[0_6px_0_#156910] active:translate-y-0.5 active:shadow-[0_3px_0_#156910] flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>بدء الجولة الأولى</span>
          </button>
        </form>
      </div>

      {/* Single flat borderless control-hint line in the bottom safe margin */}
      <div className="relative z-10 text-center text-xs text-white/70 font-medium pt-2">
        اختر الخلية السداسية لعرض السؤال · المسافة أو Enter لبدء اللعب · M لكتم الصوت · متوافق مع شاشات العرض 16:9 و Full HD
      </div>
    </div>
  );
};
