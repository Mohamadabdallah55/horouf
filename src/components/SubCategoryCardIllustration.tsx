import React from 'react';
import { Check, Info } from 'lucide-react';
import { SubCategoryDefinition } from '../types/game';

interface SubCategoryCardProps {
  subCategory: SubCategoryDefinition;
  selected: boolean;
  questionCount: number;
  customImageUrl?: string;
  onToggleSelect: () => void;
  onOpenInfo: (e: React.MouseEvent) => void;
}

/**
 * Renders original, high-detail SVG background scenes tailored to each subcategory's `artworkTheme`.
 * Strictly no Arabic text is baked into the background SVG — the bold outlined Arabic title
 * is rendered programmatically on top for crisp typography on phones and projectors.
 */
const ThemeSceneSvg: React.FC<{
  theme: string;
  from: string;
  to: string;
  accent: string;
}> = ({ theme, from, to, accent }) => {
  const uid = `grad_${theme}`;
  return (
    <svg
      viewBox="0 0 240 310"
      className="w-full h-full object-cover"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <radialGradient id={`${uid}_glow`} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.45" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Base Sky/Backdrop */}
      <rect width="240" height="310" fill={`url(#${uid})`} />
      <circle cx="120" cy="130" r="110" fill={`url(#${uid}_glow)`} />

      {/* Decorative Sunburst Rays */}
      <g opacity="0.14" stroke="#ffffff" strokeWidth="10">
        <line x1="120" y1="140" x2="0" y2="0" />
        <line x1="120" y1="140" x2="120" y2="0" />
        <line x1="120" y1="140" x2="240" y2="0" />
        <line x1="120" y1="140" x2="240" y2="140" />
        <line x1="120" y1="140" x2="240" y2="310" />
        <line x1="120" y1="140" x2="0" y2="310" />
        <line x1="120" y1="140" x2="0" y2="140" />
      </g>

      {/* Theme-Specific Rich Vector Foreground Elements */}
      {(theme === 'quran' ||
        theme === 'verses' ||
        theme === 'prophets' ||
        theme === 'seerah') && (
        <g>
          {/* Islamic Arch & Mihrab */}
          <path
            d="M30,310 L30,110 Q120,25 210,110 L210,310 Z"
            fill="#000000"
            fillOpacity="0.22"
            stroke={accent}
            strokeWidth="3"
          />
          {/* Crescent & Stars */}
          <path
            d="M135,52 A22,22 0 1,1 105,82 A17,17 0 1,0 135,52 Z"
            fill="#fde047"
          />
          <circle cx="70" cy="65" r="3" fill="#fef08a" />
          <circle cx="175" cy="70" r="3.5" fill="#fef08a" />
          {/* Open Illuminated Mushaf on Rehal Stand */}
          <path
            d="M70,265 L120,235 L170,265 L155,280 L120,252 L85,280 Z"
            fill="#92400e"
            stroke="#fde68a"
            strokeWidth="2"
          />
          <path
            d="M52,225 Q86,210 120,232 Q154,210 188,225 L180,255 Q150,242 120,258 Q90,242 60,255 Z"
            fill="#fef3c7"
            stroke="#f59e0b"
            strokeWidth="3"
          />
        </g>
      )}

      {(theme === 'mosques' ||
        theme === 'islamiyat' ||
        theme === 'companions' ||
        theme === 'scholars' ||
        theme === 'kids_mosque') && (
        <g>
          {/* Golden Mosque Dome & Minarets */}
          <rect x="36" y="130" width="22" height="150" rx="4" fill="#e2e8f0" />
          <polygon points="33,130 47,95 61,130" fill={accent} />
          <rect x="182" y="130" width="22" height="150" rx="4" fill="#e2e8f0" />
          <polygon points="179,130 193,95 207,130" fill={accent} />
          <path
            d="M62,220 Q120,115 178,220 Z"
            fill="#f59e0b"
            stroke="#fef08a"
            strokeWidth="3"
          />
          <rect x="55" y="218" width="130" height="75" rx="8" fill="#f8fafc" />
          <path d="M102,293 L102,248 Q120,232 138,248 L138,293 Z" fill="#0f766e" />
        </g>
      )}

      {(theme === 'football' ||
        theme === 'world_cup' ||
        theme === 'arab_leagues' ||
        theme === 'euro_clubs' ||
        theme === 'olympics') && (
        <g>
          {/* Stadium Pitch Perspective */}
          <path d="M0,215 L240,215 L240,310 L0,310 Z" fill="#15803d" />
          <ellipse
            cx="120"
            cy="255"
            rx="75"
            ry="22"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.6"
            strokeWidth="3"
          />
          {/* Stadium Spotlights */}
          <circle cx="40" cy="45" r="10" fill="#fef08a" opacity="0.85" />
          <circle cx="200" cy="45" r="10" fill="#fef08a" opacity="0.85" />
          {/* Trophy or Soccer Ball */}
          {theme === 'world_cup' || theme === 'euro_clubs' ? (
            <g>
              <path
                d="M92,195 L148,195 L138,255 L102,255 Z"
                fill="#facc15"
                stroke="#fef08a"
                strokeWidth="3"
              />
              <circle
                cx="120"
                cy="185"
                r="30"
                fill="#fde047"
                stroke="#ca8a04"
                strokeWidth="4"
              />
              <rect x="88" y="255" width="64" height="18" rx="4" fill="#854d0e" />
            </g>
          ) : (
            <g>
              <circle
                cx="120"
                cy="230"
                r="40"
                fill="#ffffff"
                stroke="#1e293b"
                strokeWidth="4"
              />
              <polygon
                points="120,206 136,218 130,237 110,237 104,218"
                fill="#0f172a"
              />
              <circle cx="95" cy="205" r="6" fill="#0f172a" />
              <circle cx="145" cy="205" r="6" fill="#0f172a" />
              <circle cx="120" cy="260" r="6" fill="#0f172a" />
            </g>
          )}
        </g>
      )}

      {(theme === 'space' ||
        theme === 'chemistry' ||
        theme === 'biology' ||
        theme === 'inventions' ||
        theme === 'math') && (
        <g>
          {/* Stars & Saturn Ring / Flasks / Atoms */}
          <circle cx="45" cy="60" r="2.5" fill="#ffffff" />
          <circle cx="195" cy="52" r="3" fill="#fde047" />
          <circle cx="175" cy="95" r="2" fill="#ffffff" />
          {theme === 'space' ? (
            <g>
              <ellipse
                cx="120"
                cy="215"
                rx="82"
                ry="24"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="9"
                transform="rotate(-18 120 215)"
              />
              <circle cx="120" cy="215" r="38" fill="#fb923c" />
            </g>
          ) : (
            <g>
              {/* Lab Flask & Atomic Orbits */}
              <ellipse
                cx="120"
                cy="210"
                rx="68"
                ry="24"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3"
                transform="rotate(28 120 210)"
              />
              <ellipse
                cx="120"
                cy="210"
                rx="68"
                ry="24"
                fill="none"
                stroke="#c084fc"
                strokeWidth="3"
                transform="rotate(-28 120 210)"
              />
              <path
                d="M105,175 L135,175 L135,202 L162,255 Q166,268 152,268 L88,268 Q74,268 78,255 L105,202 Z"
                fill="#38bdf8"
                fillOpacity="0.85"
                stroke="#ffffff"
                strokeWidth="3"
              />
            </g>
          )}
        </g>
      )}

      {(theme === 'jordan' ||
        theme === 'sham' ||
        theme === 'arab_world' ||
        theme === 'capitals' ||
        theme === 'flags' ||
        theme === 'landmarks' ||
        theme === 'nature_geo' ||
        theme === 'islamic_history' ||
        theme === 'civilizations' ||
        theme === 'battles') && (
        <g>
          {/* Petra / Treasury Facade & Desert Dunes / Mountains */}
          <path
            d="M0,245 Q65,210 130,240 T240,225 L240,310 L0,310 Z"
            fill="#b45309"
            opacity="0.7"
          />
          <rect
            x="64"
            y="165"
            width="112"
            height="105"
            rx="6"
            fill="#f59e0b"
            stroke="#fef3c7"
            strokeWidth="3"
          />
          <polygon
            points="56,165 120,122 184,165"
            fill="#fbbf24"
            stroke="#fef3c7"
            strokeWidth="3"
          />
          <rect x="80" y="185" width="12" height="80" fill="#78350f" />
          <rect x="114" y="185" width="12" height="80" fill="#78350f" />
          <rect x="148" y="185" width="12" height="80" fill="#78350f" />
        </g>
      )}

      {(theme === 'minecraft' ||
        theme === 'consoles' ||
        theme === 'computing' ||
        theme === 'ai_code') && (
        <g>
          {/* Isometric Voxel Cubes & Gamepad/Circuit Motif */}
          <rect
            x="35"
            y="205"
            width="52"
            height="52"
            rx="6"
            fill="#22c55e"
            stroke="#ffffff"
            strokeWidth="2.5"
          />
          <rect
            x="94"
            y="185"
            width="52"
            height="72"
            rx="6"
            fill="#eab308"
            stroke="#ffffff"
            strokeWidth="2.5"
          />
          <rect
            x="153"
            y="212"
            width="52"
            height="45"
            rx="6"
            fill="#38bdf8"
            stroke="#ffffff"
            strokeWidth="2.5"
          />
          <rect
            x="62"
            y="232"
            width="116"
            height="48"
            rx="22"
            fill="#1e293b"
            stroke="#f8fafc"
            strokeWidth="3"
          />
          <circle cx="92" cy="256" r="9" fill="#38bdf8" />
          <circle cx="148" cy="250" r="6" fill="#ef4444" />
          <circle cx="162" cy="260" r="6" fill="#22c55e" />
        </g>
      )}

      {/* Default / Other Cultural, Nature, Riddles & Family Themes */}
      {![
        'quran',
        'verses',
        'prophets',
        'seerah',
        'mosques',
        'islamiyat',
        'companions',
        'scholars',
        'kids_mosque',
        'football',
        'world_cup',
        'arab_leagues',
        'euro_clubs',
        'olympics',
        'space',
        'chemistry',
        'biology',
        'inventions',
        'math',
        'jordan',
        'sham',
        'arab_world',
        'capitals',
        'flags',
        'landmarks',
        'nature_geo',
        'islamic_history',
        'civilizations',
        'battles',
        'minecraft',
        'consoles',
        'computing',
        'ai_code',
      ].includes(theme) && (
        <g>
          {/* Hills, Books, Stars & Knowledge Emblem */}
          <path
            d="M0,235 Q70,195 140,230 T240,215 L240,310 L0,310 Z"
            fill="#15803d"
            opacity="0.7"
          />
          <circle
            cx="120"
            cy="215"
            r="42"
            fill={accent}
            fillOpacity="0.9"
            stroke="#ffffff"
            strokeWidth="4"
          />
          <polygon
            points="120,182 130,204 154,207 136,223 141,246 120,234 99,246 104,223 86,207 110,204"
            fill="#0f172a"
          />
        </g>
      )}

      {/* Bottom dark vignette for crispness */}
      <rect
        x="0"
        y="255"
        width="240"
        height="55"
        fill="#000000"
        fillOpacity="0.32"
      />
    </svg>
  );
};

export const SubCategoryCardIllustration: React.FC<SubCategoryCardProps> = ({
  subCategory,
  selected,
  questionCount,
  customImageUrl,
  onToggleSelect,
  onOpenInfo,
}) => {
  const readinessPct = Math.min(100, Math.max(18, Math.round((questionCount / 15) * 100)));
  const imageSrc = customImageUrl || subCategory.customImageUrl;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggleSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleSelect();
        }
      }}
      data-testid={`subcat-card-${subCategory.id}`}
      aria-pressed={selected}
      className={`group relative rounded-[22px] p-1.5 transition-all duration-200 select-none cursor-pointer ${
        selected
          ? 'bg-white ring-4 ring-[#2563eb] shadow-[0_8px_0_#1e3a8a,0_14px_28px_rgba(0,0,0,0.5)] -translate-y-1'
          : 'bg-slate-100/95 hover:bg-white shadow-[0_6px_0_#334155,0_10px_20px_rgba(0,0,0,0.38)] hover:-translate-y-0.5'
      }`}
    >
      {/* Inner 2:3 Vertical Commercial Mobile Game Frame */}
      <div className="relative w-full aspect-[2/3] rounded-[16px] overflow-hidden bg-slate-950 border-2 border-slate-900/40">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={subCategory.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full transition-transform duration-300 group-hover:scale-105">
            <ThemeSceneSvg
              theme={subCategory.artworkTheme}
              from={subCategory.gradientFrom}
              to={subCategory.gradientTo}
              accent={subCategory.accentColor}
            />
          </div>
        )}

        {/* Multi-stop commercial contrast scrim for guaranteed Arabic title legibility */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.18) 28%, rgba(15,23,42,0.52) 55%, rgba(15,23,42,0.82) 100%)',
          }}
        />

        {/* Top-Left Info Button (`i`) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenInfo(e);
          }}
          title={`معلومات الفئة: ${subCategory.title}`}
          aria-label={`معلومات الفئة: ${subCategory.title}`}
          data-testid={`subcat-info-${subCategory.id}`}
          className="absolute top-2.5 left-2.5 z-20 w-7 h-7 rounded-full bg-white text-slate-950 border-2 border-slate-900 shadow-md flex items-center justify-center hover:scale-110 transition cursor-pointer"
        >
          <Info className="w-4 h-4 stroke-[2.75]" />
        </button>

        {/* Top-Right Question Count Pill */}
        <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-0.5 rounded-full bg-slate-950/85 border border-white/30 text-[11px] font-black text-amber-300 tabular-nums shadow">
          {questionCount} سؤال
        </div>

        {/* Center Outlined Programmatic Arabic Title Overlay */}
        <div className="absolute inset-x-2 top-[24%] bottom-[26%] flex flex-col items-center justify-center text-center pointer-events-none px-1.5">
          {subCategory.isShowcaseFeatured && (
            <span className="mb-1 px-2 py-0.5 rounded-md bg-amber-400/95 text-slate-950 text-[9px] font-black tracking-wide shadow">
              بطاقة فاخرة PRO
            </span>
          )}
          <span
            className="text-xl sm:text-2xl font-black leading-tight text-[#FFE135]"
            style={{
              paintOrder: 'stroke fill',
              WebkitTextStroke: '3.5px #090d16',
              textShadow:
                '0 3px 0 #090d16, 0 6px 14px rgba(0,0,0,0.85)',
            }}
          >
            {subCategory.title}
          </span>
        </div>

        {/* Selected Blue Checkmark Badge (`✓`) */}
        {selected && (
          <div
            data-testid={`subcat-selected-badge-${subCategory.id}`}
            className="absolute bottom-4 right-2.5 z-20 w-9 h-9 rounded-full bg-[#1d6ef5] border-[3px] border-slate-950 shadow-lg flex items-center justify-center text-white"
          >
            <Check className="w-5 h-5 stroke-[3.5]" />
          </div>
        )}

        {/* Bottom Green Availability Bar */}
        <div className="absolute bottom-1.5 inset-x-2.5 h-2 rounded-full bg-slate-950/90 border border-slate-900 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              questionCount >= 5 ? 'bg-[#22c55e]' : 'bg-amber-400'
            }`}
            style={{ width: `${readinessPct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

