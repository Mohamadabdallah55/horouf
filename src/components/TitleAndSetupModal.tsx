import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookmarkPlus,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Database,
  Grid,
  Info,
  Layers,
  Play,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Smartphone,
  Trash2,
  Trophy,
  Tv,
  VolumeX,
  X,
} from 'lucide-react';
import {
  AGE_GROUP_OPTIONS,
  ALL_SUBCATEGORIES,
  DEFAULT_CATEGORY_PRESETS,
  DIFFICULTY_OPTIONS,
  FEATURED_SHOWCASE_SUBCATEGORY_IDS,
  MAIN_CATEGORIES_CATALOG,
} from '../data/categoriesCatalog';
import {
  getActiveQuestionBank,
  getFilteredQuestions,
  getLetterCoverageMatrix,
} from '../data/questions';
import { getRoundedHexPath } from '../game/hexMath';
import { normalizeForComparison } from '../game/arabicNormalization';
import {
  AgeGroupId,
  AnswerMode,
  TeamId,
  CategoryPreset,
  DifficultyLevel,
  FontFamilyId,
  MainCategoryId,
  QuestionCategory,
  RoomGameState,
  SubCategoryDefinition,
  VisualThemeId,
} from '../types/game';
import { SubCategoryCardIllustration } from './SubCategoryCardIllustration';

interface TitleAndSetupModalProps {
  state: RoomGameState;
  questionsBankVersion: number;
  customCardImages: Record<string, string>;
  onStartMatch: (config: {
    team1Name: string;
    team2Name: string;
    team1Color: string;
    team2Color: string;
    totalRounds: number;
    timerSeconds: number;
    answerMode: AnswerMode;
    startingTeam: TeamId;
    theme: VisualThemeId;
    fontFamily: FontFamilyId;
    selectedCategories: QuestionCategory[];
    selectedSubCategories: string[];
    ageGroup: AgeGroupId;
    difficultyFilter: DifficultyLevel | 'all';
    mosqueQuietMode: boolean;
  }) => void;
  onOpenSyncModal: () => void;
  onOpenContentAdmin: () => void;
  onSwitchToDisplayMode: () => void;
}

const TEAM1_COLOR_PRESETS = ['#28B81E', '#10B981', '#16A34A', '#06B6D4'];
const TEAM2_COLOR_PRESETS = ['#FF7724', '#F97316', '#F59E0B', '#EC4899'];
const SAVED_PRESETS_KEY = 'elite_clash_custom_category_presets_v1';

const LEFT_BG_LETTERS = [
  { letter: 'ع', x: 75, y: 75 },
  { letter: 'ص', x: 42, y: 245 },
  { letter: 'ي', x: 118, y: 400 },
  { letter: 'ل', x: 64, y: 575 },
  { letter: 'ف', x: 158, y: 730 },
  { letter: 'ن', x: 35, y: 755 },
  { letter: 'غ', x: 112, y: 890 },
];

const RIGHT_BG_LETTERS = [
  { letter: 'ح', x: 1210, y: 40 },
  { letter: 'ر', x: 1355, y: 205 },
  { letter: 'ن', x: 1315, y: 395 },
  { letter: 'و', x: 1410, y: 560 },
  { letter: 'ز', x: 1365, y: 735 },
  { letter: 'م', x: 1250, y: 880 },
];

function loadSavedPresets(): CategoryPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const TitleAndSetupModal: React.FC<TitleAndSetupModalProps> = ({
  state,
  questionsBankVersion,
  customCardImages,
  onStartMatch,
  onOpenSyncModal,
  onOpenContentAdmin,
  onSwitchToDisplayMode,
}) => {
  const [team1Name, setTeam1Name] = useState(state.team1.name || 'الفريق الأخضر');
  const [team2Name, setTeam2Name] = useState(state.team2.name || 'الفريق البرتقالي');
  const [team1Color, setTeam1Color] = useState(state.team1.color || '#28B81E');
  const [team2Color, setTeam2Color] = useState(state.team2.color || '#FF7724');
  const [answerMode, setAnswerMode] = useState<AnswerMode>(state.settings.answerMode || 'manual');
  const [startingTeam, setStartingTeam] = useState<TeamId>('team1');
  const [totalRounds, setTotalRounds] = useState(state.settings.totalRounds || 3);
  const [timerSeconds, setTimerSeconds] = useState(state.settings.timerSeconds ?? 30);
  const [theme, setTheme] = useState<VisualThemeId>(state.settings.theme || 'classic');
  const [fontFamily, setFontFamily] = useState<FontFamilyId>(
    state.settings.fontFamily || 'Cairo'
  );
  const [ageGroup, setAgeGroup] = useState<AgeGroupId>(
    state.settings.ageGroup || 'family_mixed'
  );
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | 'all'>(
    state.settings.difficultyFilter || 'all'
  );
  const [mosqueQuietMode, setMosqueQuietMode] = useState<boolean>(
    state.settings.mosqueQuietMode || false
  );

  // Selected Subcategories (defaults to all subcategories if empty)
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>(() => {
    if (
      state.settings.selectedSubCategories &&
      state.settings.selectedSubCategories.length > 0
    ) {
      return state.settings.selectedSubCategories;
    }
    return ALL_SUBCATEGORIES.map((s) => s.id);
  });

  // Side Drawer & Matrix Modals State (keeps original purple Title screen clean while putting PRO tools on the side)
  const [showCategoriesDrawer, setShowCategoriesDrawer] = useState<boolean>(false);
  const categoryTrigger = useRef<HTMLButtonElement>(null);
  const categorySearchInput = useRef<HTMLInputElement>(null);
  const [showLetterCoverageModal, setShowLetterCoverageModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [activeInfoSub, setActiveInfoSub] = useState<SubCategoryDefinition | null>(null);

  useEffect(() => {
    if (!showCategoriesDrawer) return;
    const trigger = categoryTrigger.current;
    categorySearchInput.current?.focus({ preventScroll: true });
    return () => trigger?.focus({ preventScroll: true });
  }, [showCategoriesDrawer]);

  // Favorite presets
  const [customPresets, setCustomPresets] = useState<CategoryPreset[]>(() =>
    loadSavedPresets()
  );
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);

  const allQuestions = useMemo(
    () => getActiveQuestionBank(),
    [questionsBankVersion],
  );

  // Question counts per subcategory respecting current ageGroup & difficultyFilter
  const subCategoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const sub of ALL_SUBCATEGORIES) {
      map[sub.id] = 0;
    }
    for (const q of getFilteredQuestions({ ageGroup, difficultyFilter })) {
      if (q.subCategory && map[q.subCategory] !== undefined) {
        map[q.subCategory]++;
      }
    }
    return map;
  }, [questionsBankVersion, difficultyFilter, ageGroup]);

  // 28-letter coverage matrix for the currently selected categories, ageGroup, and difficultyFilter
  const coverageSummary = useMemo(() => {
    const effectiveSubIds =
      selectedSubIds.length > 0 ? selectedSubIds : ALL_SUBCATEGORIES.map((s) => s.id);
    return getLetterCoverageMatrix({
      selectedSubCategories: effectiveSubIds,
      ageGroup,
      difficultyFilter,
    });
  }, [selectedSubIds, ageGroup, difficultyFilter, questionsBankVersion]);

  // Featured 6 commercial showcase subcategories
  const featuredShowcaseSubs = useMemo(() => {
    return FEATURED_SHOWCASE_SUBCATEGORY_IDS.map((id) =>
      ALL_SUBCATEGORIES.find((s) => s.id === id)
    ).filter((s): s is SubCategoryDefinition => Boolean(s));
  }, []);

  // Filter catalog by search query
  const filteredCatalog = useMemo(() => {
    const q = normalizeForComparison(searchQuery);
    if (!q) return MAIN_CATEGORIES_CATALOG;
    return MAIN_CATEGORIES_CATALOG.map((cat) => {
      const catMatch =
        normalizeForComparison(cat.title).includes(q) || normalizeForComparison(cat.description).includes(q);
      const matchingSubs = cat.subCategories.filter(
        (sub) =>
          catMatch ||
          normalizeForComparison(sub.title).includes(q) ||
          normalizeForComparison(sub.description).includes(q)
      );
      return {
        ...cat,
        subCategories: matchingSubs,
      };
    }).filter((cat) => cat.subCategories.length > 0);
  }, [searchQuery]);

  const toggleSubCategory = (subId: string) => {
    setSelectedSubIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const toggleMainCategoryAll = (mainCatId: MainCategoryId) => {
    const cat = MAIN_CATEGORIES_CATALOG.find((c) => c.id === mainCatId);
    if (!cat) return;
    const subIds = cat.subCategories.map((s) => s.id);
    const allSelected = subIds.every((id) => selectedSubIds.includes(id));
    if (allSelected) {
      setSelectedSubIds((prev) => prev.filter((id) => !subIds.includes(id)));
    } else {
      setSelectedSubIds((prev) => Array.from(new Set([...prev, ...subIds])));
    }
  };

  const selectAllCategories = () => {
    setSelectedSubIds(ALL_SUBCATEGORIES.map((s) => s.id));
  };

  const clearAllCategories = () => {
    setSelectedSubIds([]);
  };

  const selectOnlyShowcaseSix = () => {
    setSelectedSubIds([...FEATURED_SHOWCASE_SUBCATEGORY_IDS]);
  };

  const applyPreset = (preset: CategoryPreset) => {
    setSelectedSubIds(preset.selectedSubCategories);
    setAgeGroup(preset.ageGroup);
    setDifficultyFilter(preset.difficultyFilter);
  };

  const handleSaveCustomPreset = () => {
    const trimmed = newPresetName.trim();
    if (!trimmed || selectedSubIds.length === 0) return;
    const newPreset: CategoryPreset = {
      id: `custom_${Date.now()}`,
      name: trimmed,
      description: `${selectedSubIds.length} فئة فرعية مخصصة`,
      selectedSubCategories: selectedSubIds,
      ageGroup,
      difficultyFilter,
      createdAt: new Date().toISOString(),
    };
    const next = [...customPresets, newPreset];
    setCustomPresets(next);
    try {
      window.localStorage.setItem(SAVED_PRESETS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    setNewPresetName('');
    setShowSavePresetInput(false);
  };

  const handleDeleteCustomPreset = (presetId: string) => {
    const next = customPresets.filter((p) => p.id !== presetId);
    setCustomPresets(next);
    try {
      window.localStorage.setItem(SAVED_PRESETS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleStartGame = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (coverageSummary.totalMatchingQuestions === 0) return;
    const effectiveSubIds =
      selectedSubIds.length > 0
        ? selectedSubIds
        : ALL_SUBCATEGORIES.map((s) => s.id);
    const effectiveMainCatIds = new Set(
      ALL_SUBCATEGORIES.filter((s) => effectiveSubIds.includes(s.id)).map(
        (s) => s.mainCategoryId
      )
    );
    const effectiveCategories: QuestionCategory[] = Array.from(
      new Set(
        MAIN_CATEGORIES_CATALOG.filter((mc) => effectiveMainCatIds.has(mc.id)).flatMap(
          (mc) => [mc.title as QuestionCategory, mc.legacyCategoryName]
        )
      )
    );

    onStartMatch({
      team1Name: team1Name.trim() || 'الفريق الأخضر',
      team2Name: team2Name.trim() || 'الفريق البرتقالي',
      team1Color,
      team2Color,
      totalRounds,
      timerSeconds,
      answerMode,
      startingTeam,
      theme,
      fontFamily,
      selectedCategories: effectiveCategories,
      selectedSubCategories: effectiveSubIds,
      ageGroup,
      difficultyFilter,
      mosqueQuietMode,
    });
  };

  return (
    <div
      dir="rtl"
      className="hr-home fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto overflow-x-hidden select-none"
    >
      {/* Decorative Floating White Hexagons on Left & Right Edges (Original ELITE CLASH Identity) */}
      <svg
        className="pointer-events-none fixed inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {LEFT_BG_LETTERS.map((item, idx) => (
          <g
            key={`left_bg_${idx}`}
            opacity="0.13"
            transform={`rotate(-11 ${item.x} ${item.y})`}
          >
            <path d={getRoundedHexPath(item.x, item.y, 92, 12)} fill="#FFFFFF" />
            <text
              x={item.x}
              y={item.y + 4}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#6A359C"
              fontFamily="Cairo, sans-serif"
              fontWeight="900"
              fontSize="74"
            >
              {item.letter}
            </text>
          </g>
        ))}

        {RIGHT_BG_LETTERS.map((item, idx) => (
          <g
            key={`right_bg_${idx}`}
            opacity="0.13"
            transform={`rotate(-11 ${item.x} ${item.y})`}
          >
            <path d={getRoundedHexPath(item.x, item.y, 92, 12)} fill="#FFFFFF" />
            <text
              x={item.x}
              y={item.y + 4}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#6A359C"
              fontFamily="Cairo, sans-serif"
              fontWeight="900"
              fontSize="74"
            >
              {item.letter}
            </text>
          </g>
        ))}
      </svg>

      {/* Main Content Container: Classic 2-Column Split (Right: 3D Emblem & Side PRO Tools | Left: Match & Team Setup Card) */}
      <div className="hr-home-main relative z-10 flex-1">
        <div className="hr-home-grid w-full mx-auto">
          <header className="hr-brand-header">
            <div className="hr-brand-copy"><div className="hr-brand-kicker"><Trophy size={15}/> ساحة الألعاب · حروف وسرعة وذكاء</div><h1 className="hr-wordmark" aria-label="حروف مع النخبة"><span className="hr-word-horouf">حروف</span><span className="hr-word-with">مع</span><span className="hr-word-elite">النخبة</span></h1><p>حرف بيفرق… ومسار بيفوز!</p></div>
            <div className="hr-brand-info"><b>تحدي الفريقين</b><span>جاوب صح، امتلك الحرف، ووصّل طرفي اللوحة.</span><div className="hr-brand-chips"><span><i style={{background:team1Color}}/> عمودي ↕</span><span><i style={{background:team2Color}}/> أفقي ↔</span><span>25 حرفًا</span></div></div>
            <a className="hr-home-back" href="https://say-it-u1w6.onrender.com/">ساحة الألعاب ↗</a>
          </header>
          {/* Right Column (6 cols): Original 3D Tilted Title Emblem + Side PRO Feature Triggers */}
          <div className="hr-hero-area flex flex-col items-center text-center">
            <div className="hr-board-heading"><b>لوحة التحدي</b><span>5 × 5</span></div>
            <div className="hr-preview" aria-hidden="true">
              <svg viewBox="0 0 410 286" className="hr-preview-svg">
                {['ح','ر','و','ف','ن','خ','ب','ة','س','م','ع','ك','ل','ق','ت','أ','ج','د','ز','ش','ص','ط','ظ','غ','ي'].map((letter,i)=>{
                  const row=Math.floor(i/5),col=i%5,cx=42+col*70+(row%2)*35,cy=38+row*51;
                  const color=col===1 ? team1Color : row===1&&col>=2 ? team2Color : '#fff2d6';
                  return <g key={i}><path d={getRoundedHexPath(cx,cy,38,4)} fill="#190f2b" transform="translate(0 3)"/><path d={getRoundedHexPath(cx,cy,36,4)} fill={color} stroke="#21132d" strokeWidth="2"/><text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#251435" fontSize="26" fontWeight="900">{letter}</text></g>;
                })}
              </svg>
              <div className="hr-preview-legend"><span><i style={{background:team1Color}}/> أعلى ↕ أسفل</span><span><i style={{background:team2Color}}/> يمين ↔ يسار</span></div>
            </div>

            <div className="hr-home-stats"><div><b>{allQuestions.length.toLocaleString('en-US')}</b><span>سؤال بالبنك</span></div><div><b>{selectedSubIds.length}</b><span>فئة محددة</span></div><div><b>25</b><span>خلية باللوحة</span></div></div>
            {/* Side PRO Action Buttons Dock (Categories Drawer, 28-Letter Coverage, Question Bank Admin, Buzzer, Display Mode) */}
            <div className="hr-tool-dock w-full space-y-2">
              {/* Primary Side PRO Trigger: Open Category Cards & 6 Illustrated Showcase Drawer */}
              <button
                type="button"
                onClick={() => setShowCategoriesDrawer(true)}
                ref={categoryTrigger}
                aria-haspopup="dialog"
                aria-expanded={showCategoriesDrawer}
                data-testid="btn-open-categories-drawer"
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-l from-[#311042]/90 via-[#250b36]/90 to-[#311042]/90 hover:from-[#3d1452] hover:to-[#311042] text-white border-2 border-amber-400/70 shadow-xl transition cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                      <span>مكتبة الفئات</span>
                    </div>
                    <div className="text-[11px] text-white/75 font-bold">
                      محدد حاليًا: {selectedSubIds.length} فئة فرعية • {coverageSummary.totalMatchingQuestions} سؤال مطابق
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs group-hover:scale-105 transition">
                  فتح الفئات
                </span>
              </button>

              {/* Secondary Side Buttons Row */}
              <div className="hr-tool-grid grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onOpenSyncModal}
                  data-testid="title-btn-activate-buzzer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg transition cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>{answerMode==='electronic'?'الجرس':'ربط الأجهزة'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLetterCoverageModal(true)}
                  data-testid="btn-open-letter-coverage"
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs shadow-lg transition cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span>تغطية الـ28 حرفًا</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenContentAdmin}
                  data-testid="btn-open-content-admin"
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs shadow-lg transition cursor-pointer"
                >
                  <Database className="w-4 h-4 shrink-0" />
                  <span>بنك الأسئلة ({allQuestions.length})</span>
                </button>

                <button
                  type="button"
                  onClick={onSwitchToDisplayMode}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#311042]/80 hover:bg-[#311042] text-white font-bold text-xs border border-white/25 transition cursor-pointer"
                >
                  <Tv className="w-4 h-4 shrink-0" />
                  <span>شاشة الجمهور</span>
                </button>
              </div>
            </div>
          </div>

          <aside className="hr-mode-area text-white">
            <div className="hr-mode-card">
              <h2>نظام الإجابة</h2>
              <div className="hr-mode-options" role="radiogroup" aria-label="نظام الإجابة">
                {([{id:'manual',symbol:'✋',label:'بدون جرس',desc:'المقدم يحدد الأسرع'},{id:'electronic',symbol:'🔔',label:'جرس إلكتروني',desc:'الأسرع بالضغط'},{id:'turns',symbol:'↔',label:'تناوب الأدوار',desc:'صاحب الحرف أولًا'}] as const).map(mode=><label key={mode.id} className="hr-mode-option" data-active={answerMode===mode.id}><input form="hr-match-form" type="radio" name="answer-mode" value={mode.id} checked={answerMode===mode.id} onChange={()=>setAnswerMode(mode.id)}/><span className="hr-mode-icon" aria-hidden="true">{mode.symbol}</span><span><b>{mode.label}</b><small>{mode.desc}</small></span></label>)}
              </div>
              <div className="hr-start-team"><label htmlFor="hr-first-team">أول اختيار</label><select id="hr-first-team" value={startingTeam} onChange={e=>setStartingTeam(e.target.value as TeamId)}><option value="team1">{team1Name||'الفريق الأول'}</option><option value="team2">{team2Name||'الفريق الثاني'}</option></select><button type="button" onClick={()=>setStartingTeam(Math.random()<0.5?'team1':'team2')}>قرعة</button></div>
            </div>
            <div className="hr-mode-card hr-rules-mini"><h2>طريقة الفوز</h2><p><i style={{background:team1Color}}/> {team1Name||'الفريق الأول'} · أعلى ↕ أسفل</p><p><i style={{background:team2Color}}/> {team2Name||'الفريق الثاني'} · يمين ↔ يسار</p><small>الفريق اللي بجاوب صح بختار الحرف التالي.</small></div>
            <div className="hr-mode-card hr-ready-mini"><h2>ملخص الجولة</h2><p><b>{totalRounds}</b> جولات · <b>{timerSeconds||'∞'}</b> {timerSeconds?'ثانية':'بدون مؤقت'}</p><small>{coverageSummary.totalMatchingQuestions} سؤال متاح</small></div>
          </aside>
          {/* Left Column (6 cols): Classic Match & Team Configuration Card + Difficulty & Age Controls */}
          <div className="hr-settings-area">
            <form
              onSubmit={handleStartGame}
              id="hr-match-form" className="hr-setup rounded-3xl text-white space-y-3"
            >
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  جهّز المواجهة
                </h2>
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-white/10 text-amber-300">
                  25 خلية • 5×5
                </span>
              </div>

              {/* Team 1 & Team 2 Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Team 1 (Green - Top to Bottom) */}
                <div className="rounded-2xl bg-white/5 p-3.5 border border-emerald-400/35 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="team1-name-input"
                      className="text-xs font-extrabold text-emerald-300"
                    >
                      الفريق الأول (مسار عمودي ↕)
                    </label>
                    <span
                      className="w-4 h-4 rounded-full border border-white"
                      style={{ backgroundColor: team1Color }}
                    />
                  </div>
                  <input
                    id="team1-name-input"
                    type="text"
                    value={team1Name}
                    onChange={(e) => setTeam1Name(e.target.value)}
                    maxLength={24}
                    className="w-full rounded-xl bg-[#1F092B] border border-white/20 px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-emerald-400"
                    placeholder="الفريق الأخضر"
                  />
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[11px] text-white/70">اللون:</span>
                    <div className="flex items-center gap-1.5">
                      {TEAM1_COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTeam1Color(c)}
                          aria-label={`اختيار لون الفريق الأول ${c}`}
                          style={{ backgroundColor: c }}
                          className={`w-5 h-5 rounded-full transition cursor-pointer ${
                            team1Color === c
                              ? 'ring-2 ring-white scale-110'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Team 2 (Orange - Right to Left) */}
                <div className="rounded-2xl bg-white/5 p-3.5 border border-orange-400/35 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="team2-name-input"
                      className="text-xs font-extrabold text-orange-300"
                    >
                      الفريق الثاني (مسار أفقي ↔)
                    </label>
                    <span
                      className="w-4 h-4 rounded-full border border-white"
                      style={{ backgroundColor: team2Color }}
                    />
                  </div>
                  <input
                    id="team2-name-input"
                    type="text"
                    value={team2Name}
                    onChange={(e) => setTeam2Name(e.target.value)}
                    maxLength={24}
                    className="w-full rounded-xl bg-[#1F092B] border border-white/20 px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-orange-400"
                    placeholder="الفريق البرتقالي"
                  />
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[11px] text-white/70">اللون:</span>
                    <div className="flex items-center gap-1.5">
                      {TEAM2_COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTeam2Color(c)}
                          aria-label={`اختيار لون الفريق الثاني ${c}`}
                          style={{ backgroundColor: c }}
                          className={`w-5 h-5 rounded-full transition cursor-pointer ${
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

              {/* Difficulty Level (سهل / متوسط / صعب / خبير) & Age Group Calibration */}
              <div className="rounded-2xl bg-[#1F092B]/90 p-3.5 border border-white/15 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-cyan-300">
                      مستوى الصعوبة
                    </span>
                    <span
                      data-testid="matching-questions-badge"
                      className="text-[11px] font-black text-amber-300"
                    >
                      {coverageSummary.totalMatchingQuestions} سؤال متاح • {coverageSummary.readyLettersCount}/28 حرف
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {DIFFICULTY_OPTIONS.map((diff) => (
                      <button
                        key={diff.id}
                        type="button"
                        data-testid={`difficulty-${diff.id}`}
                        onClick={() => setDifficultyFilter(diff.id)}
                        aria-pressed={difficultyFilter === diff.id}
                        title={diff.description}
                        className={`py-1.5 px-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                          difficultyFilter === diff.id
                            ? diff.id === 'expert'
                              ? 'bg-rose-500 text-white shadow ring-2 ring-rose-300'
                              : diff.id === 'hard'
                              ? 'bg-orange-500 text-slate-950 shadow ring-2 ring-orange-200'
                              : 'bg-cyan-400 text-slate-950 shadow'
                            : 'bg-white/5 text-white/80 hover:bg-white/15'
                        }`}
                      >
                        {diff.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Group Selector */}
                <div>
                  <span className="block text-[11px] font-extrabold text-amber-300 mb-1.5">
                    الفئة العمرية
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {AGE_GROUP_OPTIONS.map((ag) => (
                      <button
                        key={ag.id}
                        type="button"
                        data-testid={`age-group-${ag.id}`}
                        onClick={() => setAgeGroup(ag.id)}
                        aria-pressed={ageGroup === ag.id}
                        title={ag.description}
                        className={`px-1.5 py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer truncate ${
                          ageGroup === ag.id
                            ? 'bg-amber-400 text-slate-950 shadow'
                            : 'bg-white/5 text-white/75 hover:bg-white/15'
                        }`}
                      >
                        {ag.shortLabel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transparent Shortage Warning if selected difficulty/categories has missing letters */}
                {coverageSummary.totalMatchingQuestions < 25 && (
                  <div
                    data-testid="setup-difficulty-shortage-warning"
                    className="rounded-xl bg-amber-500/20 border border-amber-400/50 px-3 py-2 text-[11px] text-amber-200 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span>
                        {coverageSummary.totalMatchingQuestions === 0
                          ? 'لا توجد أسئلة مطابقة. غيّر الفئات أو مستوى الصعوبة لبدء المباراة.'
                          : 'اللوحة فيها 25 خلية. أضف فئات أو وسّع مستوى الصعوبة لتوفّر سؤالًا لكل خلية.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rounds & Timer Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <span className="block text-xs font-extrabold text-white/85 mb-1.5">
                    عدد الجولات:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 bg-[#1F092B] p-1 rounded-xl border border-white/15">
                    {[1, 3, 5].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTotalRounds(r)}
                        className={`py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                          totalRounds === r
                            ? 'bg-amber-400 text-slate-950 shadow'
                            : 'text-white/75 hover:text-white'
                        }`}
                      >
                        {r === 1 ? 'جولة 1' : `${r} جولات`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-extrabold text-white/85 mb-1.5">
                    مؤقت السؤال:
                  </span>
                  <div className="grid grid-cols-4 gap-1 bg-[#1F092B] p-1 rounded-xl border border-white/15">
                    {[0, 15, 30, 45].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTimerSeconds(s)}
                        className={`py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                          timerSeconds === s
                            ? 'bg-cyan-400 text-slate-950 shadow'
                            : 'text-white/75 hover:text-white'
                        }`}
                      >
                        {s === 0 ? 'حر' : `${s}ث`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Theme, Font & Quiet Mode Compact Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <select
                  id="visual-theme-select"
                  aria-label="الهوية البصرية"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as VisualThemeId)}
                  className="w-full rounded-xl bg-[#1F092B] border border-white/20 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="classic">المظهر الكلاسيكي (أخضر × برتقالي)</option>
                  <option value="elite_clash">مظهر ELITE CLASH (ذهبي × سيان)</option>
                  <option value="royal_night">المظهر الليلي الملكي</option>
                </select>

                <select
                  id="font-family-select"
                  aria-label="خط الحروف العربية"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value as FontFamilyId)}
                  className="w-full rounded-xl bg-[#1F092B] border border-white/20 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Cairo">خط القاهرة (Cairo)</option>
                  <option value="Alexandria">خط الإسكندرية (Alexandria)</option>
                  <option value="Changa">خط تشانغا (Changa)</option>
                  <option value="Tajawal">خط تجول (Tajawal)</option>
                </select>

                <label className="flex items-center justify-between rounded-xl bg-[#1F092B] px-3 py-2 border border-white/20 cursor-pointer">
                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-300">
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>وضع المسجد الهادئ</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={mosqueQuietMode}
                    onChange={(e) => setMosqueQuietMode(e.target.checked)}
                    className="w-4 h-4 accent-emerald-400 rounded"
                  />
                </label>
              </div>

              {/* Start Match CTA Button */}
              <button
                type="submit"
                data-start="true"
                data-testid="btn-start-match"
                disabled={coverageSummary.totalMatchingQuestions === 0}
                className="hr-start w-full py-3.5 px-6 rounded-2xl bg-gradient-to-l from-amber-400 via-yellow-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-lg shadow-xl shadow-black/30 flex items-center justify-center gap-2 transition transform active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>ابدأ المسابقة الآن</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Studio Attribution Bar */}
      <div className="hr-home-footer relative z-10 text-center">
        <div className="inline-flex items-center gap-3 text-white/75 tracking-widest font-black text-xs sm:text-sm">
          <span>حروف النخبة</span>
          <span className="text-amber-300">•</span>
          <span>ألعاب وتحديات جماعية</span>
        </div>
      </div>

      {/* =====================================================================
          SIDE DRAWER: 6 Commercial Showcase Cards + Full Category Library
          ===================================================================== */}
      {showCategoriesDrawer && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end"
          onClick={() => setShowCategoriesDrawer(false)}
        >
          <div
            data-testid="categories-side-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-library-title"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setShowCategoriesDrawer(false);
              }
            }}
            className="w-full max-w-5xl h-full bg-gradient-to-b from-[#1E295E] via-[#17204A] to-[#0F1636] border-r-2 border-white/20 flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="shrink-0 bg-[#12193B] border-b border-white/15 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="category-library-title" className="text-base sm:text-xl font-black text-white">
                    مكتبة الفئات
                  </h2>
                  <p className="text-xs text-white/70 font-bold">
                    محدد: {selectedSubIds.length} فئة فرعية • {coverageSummary.totalMatchingQuestions} سؤال مطابق للمستوى والعمر
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLetterCoverageModal(true)}
                  className="px-3 py-2 rounded-xl bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/40 text-cyan-200 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>جدول الـ28 حرفًا</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategoriesDrawer(false)}
                  data-testid="btn-close-categories-drawer"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <span>تم وحفظ الاختيار</span>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* 1. Featured 6 High-Craft Commercial Game Cards Section */}
              {!searchQuery.trim() && <section
                aria-label="فئات مختارة"
                data-testid="featured-showcase-6-section"
                className="rounded-3xl bg-gradient-to-b from-[#26357A]/90 to-[#182252]/95 border-2 border-amber-400/50 p-4 sm:p-5 shadow-2xl space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">فئات مختارة</h3>
                  </div>

                  <button
                    type="button"
                    onClick={selectOnlyShowcaseSix}
                    data-testid="btn-select-showcase-6"
                    className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow cursor-pointer transition"
                  >
                    تحديد هذه الفئات
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
                  {featuredShowcaseSubs.map((sub) => (
                    <SubCategoryCardIllustration
                      key={`showcase_${sub.id}`}
                      subCategory={sub}
                      selected={selectedSubIds.includes(sub.id)}
                      questionCount={subCategoryCounts[sub.id] || 0}
                      customImageUrl={customCardImages[sub.id]}
                      onToggleSelect={() => toggleSubCategory(sub.id)}
                      onOpenInfo={(e) => {
                        e.stopPropagation();
                        setActiveInfoSub(sub);
                      }}
                    />
                  ))}
                </div>
              </section>}

              {/* 2. Search, Bulk Select & Ready Presets Toolbar */}
              <section
                aria-label="شريط البحث والحزم الجاهزة"
                className="rounded-3xl bg-[#161F4E]/95 border-2 border-white/15 p-4 shadow-xl space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative w-full flex-1 basis-56">
                    <Search className="w-4 h-4 text-white/60 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      ref={categorySearchInput}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="البحث في الفئات"
                      data-testid="category-search-input"
                      placeholder="ابحث عن فئة رئيسية أو موضوع فرعي (مثل: القرآن، الأردن، كرة قدم، الكيمياء...)"
                      className="w-full rounded-2xl bg-[#0E1538] border border-white/20 pr-10 pl-4 py-2.5 text-sm font-bold text-white placeholder:text-white/50 focus:outline-none focus:border-amber-400"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="مسح البحث"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllCategories}
                      data-testid="btn-select-all-categories"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-black text-xs shadow cursor-pointer transition"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>تحديد الكل ({ALL_SUBCATEGORIES.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={clearAllCategories}
                      data-testid="btn-clear-all-categories"
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 border border-rose-400/30 font-extrabold text-xs cursor-pointer transition"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>إلغاء الكل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSavePresetInput((p) => !p)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 font-extrabold text-xs cursor-pointer transition"
                    >
                      <BookmarkPlus className="w-4 h-4" />
                      <span>حفظ التشكيلة كمفضلة</span>
                    </button>
                  </div>
                </div>

                {showSavePresetInput && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder="اسم التشكيلة المفضلة (مثال: مسابقة شباب المسجد يوم الجمعة)"
                      className="flex-1 rounded-xl bg-[#0E1538] border border-amber-400/50 px-3 py-2 text-xs font-bold text-white"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomPreset}
                      className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
                    >
                      حفظ الآن
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                  <span className="text-xs font-extrabold text-white/70 shrink-0 flex items-center gap-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
                    <span>تشكيلات جاهزة:</span>
                  </span>
                  {DEFAULT_CATEGORY_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      data-testid={`preset-${preset.id}`}
                      title={preset.description}
                      className="shrink-0 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-slate-950 text-xs font-extrabold transition cursor-pointer border border-white/10"
                    >
                      {preset.name}
                    </button>
                  ))}
                  {customPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-amber-400/20 border border-amber-400/40 px-2.5 py-1 text-xs font-extrabold text-amber-200"
                    >
                      <button
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="cursor-pointer hover:text-white"
                      >
                        {preset.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomPreset(preset.id)}
                        className="text-rose-300 hover:text-rose-100 cursor-pointer"
                        title="حذف التشكيلة"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. Full 16 Main Category Sections */}
              <div className="space-y-6" data-testid="categories-library-sections">
                {filteredCatalog.length === 0 && (
                  <p className="rounded-xl border border-white/10 p-4 text-sm text-white/75">
                    ما في فئات تطابق البحث.
                  </p>
                )}
                {filteredCatalog.map((mainCat) => {
                  const subIds = mainCat.subCategories.map((s) => s.id);
                  const selectedInCatCount = subIds.filter((id) =>
                    selectedSubIds.includes(id)
                  ).length;
                  const allInCatSelected =
                    subIds.length > 0 && selectedInCatCount === subIds.length;
                  const isCollapsed = !!collapsedSections[mainCat.id];

                  return (
                    <section
                      key={mainCat.id}
                      data-testid={`main-category-section-${mainCat.id}`}
                      className="space-y-3"
                    >
                      <div className="relative flex items-center justify-between rounded-2xl bg-[#343F56] border-2 border-[#181E2C] px-4 py-3 shadow-[0_6px_0_#181E2C]">
                        <div className="flex items-center gap-3">
                          <div
                            style={{
                              backgroundColor: mainCat.badgeColor,
                              borderColor: mainCat.badgeBorder,
                            }}
                            className="w-11 h-12 rounded-t-xl rounded-b-[20px] border-2 shadow-md flex items-center justify-center text-white font-black text-base shrink-0"
                          >
                            <span>{mainCat.title.slice(0, 2)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleMainCategoryAll(mainCat.id)}
                            data-testid={`toggle-main-cat-${mainCat.id}`}
                            aria-label={`تحديد جميع فئات ${mainCat.title}`}
                            aria-pressed={allInCatSelected}
                            className={`w-10 h-10 rounded-xl border-2 border-[#181E2C] flex items-center justify-center font-black transition cursor-pointer shadow ${
                              allInCatSelected
                                ? 'bg-[#1D9BF0] text-white'
                                : 'bg-[#262F42] text-white/80 hover:bg-[#3A4660]'
                            }`}
                          >
                            <CheckCheck className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="text-center px-2">
                          <h3
                            className="text-base sm:text-xl font-black text-white tracking-wide drop-shadow-[0_2px_0_#000]"
                            style={{ WebkitTextStroke: '0.8px #111827' }}
                          >
                            {mainCat.title}
                          </h3>
                          <p className="text-[11px] text-white/70 font-bold hidden sm:block">
                            {mainCat.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            dir="ltr"
                            className="px-3 py-1 rounded-full bg-[#242C3D] border border-white/10 text-xs font-black text-white/90 tabular-nums"
                          >
                            {selectedInCatCount} / {mainCat.subCategories.length}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setCollapsedSections((prev) => ({
                                ...prev,
                                [mainCat.id]: !prev[mainCat.id],
                              }))
                            }
                            aria-label={`طي أو فتح قسم ${mainCat.title}`}
                            aria-expanded={!isCollapsed}
                            className="w-9 h-9 rounded-xl bg-[#242C3D] hover:bg-[#1B2230] border border-white/15 flex items-center justify-center text-white cursor-pointer transition"
                          >
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 pt-1">
                          {mainCat.subCategories.map((sub) => (
                            <SubCategoryCardIllustration
                              key={sub.id}
                              subCategory={sub}
                              selected={selectedSubIds.includes(sub.id)}
                              questionCount={subCategoryCounts[sub.id] || 0}
                              customImageUrl={customCardImages[sub.id]}
                              onToggleSelect={() => toggleSubCategory(sub.id)}
                              onOpenInfo={(e) => {
                                e.stopPropagation();
                                setActiveInfoSub(sub);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: 28-Letter Statistical Coverage & Staged Question Bank Plan
          ===================================================================== */}
      {showLetterCoverageModal && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowLetterCoverageModal(false)}
        >
          <div
            data-testid="letter-coverage-modal"
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#161F48] border-2 border-white/20 p-5 sm:p-6 text-white shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-amber-300">
                  جدول التوزيع الإحصائي للـ 28 حرفًا وخطة نمو البنك
                </h3>
                <p className="text-xs text-white/75 font-bold mt-0.5">
                  يعرض عدد الأسئلة الموثقة المتوفرة لكل حرف عربي حسب الفئات والمستوى ({difficultyFilter}) والفئة العمرية ({ageGroup})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLetterCoverageModal(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Staged Production Roadmap Progress */}
            <div className="rounded-2xl bg-[#0E1538] border border-white/15 p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-black">
                <span className="text-emerald-300">
                  إجمالي الأسئلة المعتمدة حاليًا في البنك: {allQuestions.length} سؤال موثق (منها 160+ في الرياضة)
                </span>
                <span className="text-amber-300">
                  المرحلة 1 (1,000) • المرحلة 2 (3,000) • المرحلة 3 (10,000) • الهدف (20,000+)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-l from-emerald-400 to-cyan-400 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((allQuestions.length / 1000) * 100))}%` }}
                />
              </div>
            </div>

            {/* 28 Arabic Letters Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
              {coverageSummary.letters.map((cell) => (
                <div
                  key={cell.letter}
                  className={`rounded-2xl p-2.5 border text-center space-y-1 ${
                    cell.hasShortage
                      ? 'bg-rose-950/60 border-rose-400/50 text-rose-200'
                      : cell.totalMatching >= 5
                      ? 'bg-emerald-950/50 border-emerald-400/40 text-emerald-200'
                      : 'bg-amber-950/50 border-amber-400/40 text-amber-200'
                  }`}
                >
                  <div className="text-xl font-black text-white">{cell.letter}</div>
                  <div className="text-xs font-black">
                    {cell.totalMatching} سؤال متاح
                  </div>
                  <div className="text-[10px] text-white/70 font-bold flex items-center justify-center gap-1">
                    <span title="سهل">س:{cell.byDifficulty.easy}</span>
                    <span>•</span>
                    <span title="متوسط">م:{cell.byDifficulty.medium}</span>
                    <span>•</span>
                    <span title="صعب">ص:{cell.byDifficulty.hard}</span>
                    <span>•</span>
                    <span title="خبير">خ:{cell.byDifficulty.expert}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subcategory (i) Details Modal */}
      {activeInfoSub && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setActiveInfoSub(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#182254] border-2 border-white/20 p-5 text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black">{activeInfoSub.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveInfoSub(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-white/90 font-semibold leading-relaxed">
              {activeInfoSub.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-white/5 p-2.5 border border-white/10">
                <span className="text-white/60 block">عدد الأسئلة المطابقة:</span>
                <span className="text-base font-black text-emerald-400">
                  {subCategoryCounts[activeInfoSub.id] || 0} سؤال
                </span>
              </div>
              <div className="rounded-xl bg-white/5 p-2.5 border border-white/10">
                <span className="text-white/60 block">الترخيص والملكية:</span>
                <span className="text-xs font-extrabold text-amber-300">
                  {activeInfoSub.imageLicense}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-2.5 border border-white/10 text-xs">
              <span className="text-white/60 block mb-0.5">المصدر الفني:</span>
              <span className="font-bold text-white/90">
                {activeInfoSub.imageSourceAttribution}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!selectedSubIds.includes(activeInfoSub.id)) {
                    toggleSubCategory(activeInfoSub.id);
                  }
                  setActiveInfoSub(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
              >
                {selectedSubIds.includes(activeInfoSub.id)
                  ? 'محددة بالفعل ✓'
                  : 'تحديد هذه الفئة'}
              </button>
              <button
                type="button"
                onClick={() => setActiveInfoSub(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
