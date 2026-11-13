import React, { useId, useState } from 'react';
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
  const uid = useId();
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
  const imageSrc = customImageUrl || subCategory.customImageUrl;
  const [failedImage, setFailedImage] = useState<string>();
  const countLabel = questionCount === 0 ? 'لا أسئلة مطابقة' : `${questionCount} سؤال`;

  return (
    <div className={`group relative isolate rounded-2xl border bg-[#120b25] shadow-lg transition-colors ${
      selected ? 'border-cyan-300' : 'border-white/15 hover:border-white/40'
    }`}>
      <button
        type="button"
        onClick={onToggleSelect}
        data-testid={`subcat-card-${subCategory.id}`}
        aria-label={`${subCategory.title}، ${countLabel}`}
        aria-pressed={selected}
        className="relative block aspect-[4/5] w-full overflow-hidden rounded-2xl text-start focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
      >
        {imageSrc && imageSrc !== failedImage ? (
          <img
            src={imageSrc}
            alt=""
            className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105"
            loading="lazy"
            decoding="async"
            onError={() => setFailedImage(imageSrc)}
          />
        ) : (
          <ThemeSceneSvg
            theme={subCategory.artworkTheme}
            from={subCategory.gradientFrom}
            to={subCategory.gradientTo}
            accent={subCategory.accentColor}
          />
        )}

        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#100920] via-[#100920]/15 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 px-2.5 pb-2.5 pt-6 sm:px-3 sm:pb-3">
          <span className="text-[clamp(0.8rem,2vw,1rem)] font-black leading-snug text-white">
            {subCategory.title}
          </span>
          <span className="text-[11px] font-bold text-white/80 tabular-nums">{countLabel}</span>
        </span>

        {selected && (
          <span
            aria-hidden="true"
            data-testid={`subcat-selected-badge-${subCategory.id}`}
            className="absolute start-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-300 text-slate-950 shadow"
          >
            <Check className="h-4 w-4 stroke-[3]" />
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onOpenInfo}
        title={`معلومات الفئة: ${subCategory.title}`}
        aria-label={`معلومات الفئة: ${subCategory.title}`}
        data-testid={`subcat-info-${subCategory.id}`}
        className="absolute end-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-white/25 bg-[#100920]/80 text-white hover:bg-[#100920] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        <Info className="h-4 w-4" />
      </button>
    </div>
  );
};
