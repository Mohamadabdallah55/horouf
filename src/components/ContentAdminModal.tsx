import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Download,
  History,
  Image as ImageIcon,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import {
  AGE_GROUP_OPTIONS,
  ALL_SUBCATEGORIES,
  DIFFICULTY_OPTIONS,
  MAIN_CATEGORIES_CATALOG,
} from '../data/categoriesCatalog';
import {
  exportQuestionsToCsv,
  parseImportedQuestions,
} from '../data/expandedQuestions';
import {
  deleteRuntimeQuestion,
  getActiveQuestionBank,
  setRuntimeCustomQuestions,
  upsertRuntimeQuestion,
} from '../data/questions';
import {
  auditQuestionBank,
  doesAnswerMatchLetter,
  normalizeGameLetter,
} from '../game/arabicNormalization';
import { ALL_ARABIC_LETTERS as ARABIC_ALPHABET } from '../game/hexMath';
import {
  AgeGroupId,
  DifficultyLevel,
  MainCategoryId,
  MatchHistoryRecord,
  QuestionItem,
  QuestionStatus,
} from '../types/game';
import { AUDIO_ASSET_MANIFEST, soundFX } from '../utils/soundEffects';

interface ContentAdminModalProps {
  onClose: () => void;
  matchHistory: MatchHistoryRecord[];
  customCardImages: Record<string, string>;
  onUpdateCustomCardImage: (subCategoryId: string, imageUrl: string) => void;
  onQuestionsUpdated: () => void;
}

type AdminTab = 'questions' | 'import_export' | 'cards_media' | 'history_stats' | 'audio';

const QUESTIONS_PER_PAGE = 60;
const subCategoryOrder = new Map(ALL_SUBCATEGORIES.map(({ id }, index) => [id, index]));
const letterOrder = new Map(ARABIC_ALPHABET.map((letter, index) => [letter, index]));
const difficultyOrder = new Map(DIFFICULTY_OPTIONS.map(({ id }, index) => [id, index]));

function compareQuestions(a: QuestionItem, b: QuestionItem): number {
  const aSubCategory = subCategoryOrder.get(a.subCategory ?? '') ?? ALL_SUBCATEGORIES.length;
  const bSubCategory = subCategoryOrder.get(b.subCategory ?? '') ?? ALL_SUBCATEGORIES.length;
  const aLetter = letterOrder.get(normalizeGameLetter(a.letter)) ?? ARABIC_ALPHABET.length;
  const bLetter = letterOrder.get(normalizeGameLetter(b.letter)) ?? ARABIC_ALPHABET.length;
  const aDifficulty = difficultyOrder.get(a.difficulty ?? 'medium') ?? DIFFICULTY_OPTIONS.length;
  const bDifficulty = difficultyOrder.get(b.difficulty ?? 'medium') ?? DIFFICULTY_OPTIONS.length;
  return aSubCategory - bSubCategory ||
    aLetter - bLetter ||
    aDifficulty - bDifficulty;
}

export const ContentAdminModal: React.FC<ContentAdminModalProps> = ({
  onClose,
  matchHistory,
  customCardImages,
  onUpdateCustomCardImage,
  onQuestionsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('questions');
  const [refreshTick, setRefreshTick] = useState(0);

  // Question Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [letterFilter, setLetterFilter] = useState<string>('all');
  const [mainCatFilter, setMainCatFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | 'all'>('all');
  const [questionPage, setQuestionPage] = useState(0);

  // Add / Edit Question Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLetter, setFormLetter] = useState<string>('أ');
  const [formQuestion, setFormQuestion] = useState<string>('');
  const [formAnswer, setFormAnswer] = useState<string>('');
  const [formAltAnswers, setFormAltAnswers] = useState<string>('');
  const [formMainCat, setFormMainCat] = useState<MainCategoryId>('quran_seerah');
  const [formSubCat, setFormSubCat] = useState<string>('quran_sciences');
  const [formDifficulty, setFormDifficulty] = useState<DifficultyLevel>('easy');
  const [formAgeGroup, setFormAgeGroup] = useState<AgeGroupId>('family_mixed');
  const [formSource, setFormSource] = useState<string>('مكتبة مسجد ابن تيمية');
  const [formStatus, setFormStatus] = useState<QuestionStatus>('approved');
  const [formFeedback, setFormFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Import / Export State
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json');
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    errors: string[];
  } | null>(null);

  // Audio Settings State
  const [volume, setVolume] = useState<number>(() => soundFX.getVolume());
  const [quietMode, setQuietMode] = useState<boolean>(() =>
    soundFX.isMosqueQuietMode()
  );

  const allQuestions = useMemo(() => {
    void refreshTick;
    return getActiveQuestionBank(true);
  }, [refreshTick]);

  const auditIssues = useMemo(
    () => auditQuestionBank(allQuestions),
    [allQuestions]
  );

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      if (
        letterFilter !== 'all' &&
        normalizeGameLetter(q.letter) !== normalizeGameLetter(letterFilter)
      ) {
        return false;
      }
      if (mainCatFilter !== 'all' && q.mainCategory !== mainCatFilter) {
        return false;
      }
      if (difficultyFilter !== 'all' && (q.difficulty ?? 'medium') !== difficultyFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const s = searchQuery.trim();
        if (!q.question.includes(s) && !q.answer.includes(s)) {
          return false;
        }
      }
      return true;
    }).sort(compareQuestions);
  }, [allQuestions, letterFilter, mainCatFilter, difficultyFilter, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE));
  const currentPage = Math.min(questionPage, pageCount - 1);
  const pageStart = currentPage * QUESTIONS_PER_PAGE;
  const visibleQuestions = filteredQuestions.slice(pageStart, pageStart + QUESTIONS_PER_PAGE);

  // Live validation of the Add/Edit Question form
  const liveLetterValidation = useMemo(() => {
    if (!formAnswer.trim()) return null;
    const alts = formAltAnswers
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return doesAnswerMatchLetter(formAnswer, formLetter, alts);
  }, [formAnswer, formLetter, formAltAnswers]);

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) {
      setFormFeedback({
        type: 'error',
        text: 'يرجى إدخال نص السؤال والإجابة الصحيحة.',
      });
      return;
    }

    const alts = formAltAnswers
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const check = doesAnswerMatchLetter(formAnswer, formLetter, alts);
    if (!check.valid) {
      setFormFeedback({
        type: 'error',
        text:
          check.reason ||
          'الإجابة لا تبدأ بالحرف المطلوب وفق قواعد اللعبة (مع مراعاة الـ التعريف والهمزات).',
      });
      return;
    }

    const mainDef = MAIN_CATEGORIES_CATALOG.find((m) => m.id === formMainCat);
    const newItem: QuestionItem = {
      id: editingId || `custom_q_${Date.now()}`,
      letter: normalizeGameLetter(formLetter),
      question: formQuestion.trim(),
      answer: formAnswer.trim(),
      acceptedAnswers: alts,
      category: mainDef?.legacyCategoryName || 'معلومات عامة',
      mainCategory: formMainCat,
      subCategory: formSubCat,
      ageGroups: [formAgeGroup, 'family_mixed'],
      difficulty: formDifficulty,
      source: formSource.trim() || 'مكتبة مسجد ابن تيمية',
      status: formStatus,
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };

    upsertRuntimeQuestion(newItem);
    saveCustomQuestionsToLocalStorage();
    setRefreshTick((t) => t + 1);
    onQuestionsUpdated();

    setEditingId(null);
    setFormQuestion('');
    setFormAnswer('');
    setFormAltAnswers('');
    setFormFeedback({
      type: 'success',
      text: `تم حفظ السؤال بنجاح تحت حرف (${newItem.letter}) وفئة (${newItem.subCategory})!`,
    });
  };

  const handleDeleteQuestion = (id: string) => {
    deleteRuntimeQuestion(id);
    saveCustomQuestionsToLocalStorage();
    setRefreshTick((t) => t + 1);
    onQuestionsUpdated();
  };

  const handleEditClick = (q: QuestionItem) => {
    setEditingId(q.id);
    setFormLetter(q.letter);
    setFormQuestion(q.question);
    setFormAnswer(q.answer);
    setFormAltAnswers((q.acceptedAnswers || []).join('، '));
    setFormMainCat(q.mainCategory || 'general_knowledge');
    setFormSubCat(q.subCategory || 'general_culture');
    setFormDifficulty(q.difficulty || 'medium');
    setFormSource(q.source || 'مكتبة مسجد ابن تيمية');
    setFormStatus(q.status || 'approved');
    setFormFeedback(null);
  };

  const saveCustomQuestionsToLocalStorage = () => {
    try {
      const bank = getActiveQuestionBank(true).filter((q) =>
        q.id.startsWith('custom_') || q.id.startsWith('csv_')
      );
      window.localStorage.setItem(
        'mosque_custom_questions_v1',
        JSON.stringify(bank)
      );
    } catch {
      // ignore storage errors
    }
  };

  const handleRunImport = () => {
    if (!importText.trim()) return;
    const res = parseImportedQuestions(importText, importFormat);
    res.imported.forEach((item) => upsertRuntimeQuestion(item));
    if (res.imported.length > 0) {
      saveCustomQuestionsToLocalStorage();
      setRefreshTick((t) => t + 1);
      onQuestionsUpdated();
    }
    setImportResult({
      importedCount: res.imported.length,
      errors: res.errors,
    });
  };

  const handleDownloadExport = (format: 'json' | 'csv') => {
    const content =
      format === 'json'
        ? JSON.stringify(allQuestions, null, 2)
        : exportQuestionsToCsv(allQuestions);
    const mime =
      format === 'json'
        ? 'application/json;charset=utf-8'
        : 'text/csv;charset=utf-8';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mosque_questions_backup.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const letterDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of ARABIC_ALPHABET) counts[l] = 0;
    for (const q of allQuestions) {
      const norm = normalizeGameLetter(q.letter);
      counts[norm] = (counts[norm] || 0) + 1;
    }
    return counts;
  }, [allQuestions]);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="لوحة إدارة المحتوى وبنك الأسئلة — مكتبة مسجد ابن تيمية"
      data-testid="content-admin-modal"
    >
      <div className="w-full max-w-6xl h-[92vh] rounded-3xl bg-[#160b2e] border-2 border-amber-400/50 text-white shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="px-5 py-3.5 bg-[#230E3B] border-b border-white/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-amber-300">
                لوحة إدارة المحتوى وبنك الأسئلة — مكتبة ألعاب مسجد ابن تيمية
              </h2>
              <p className="text-xs text-white/70">
                إجمالي الأسئلة المعتمدة: {allQuestions.length} سؤال · 16 فئة رئيسية ·{' '}
                {ALL_SUBCATEGORIES.length} تصنيفًا فرعيًا · تدقيق تلقائي للحروف والـ التعريف
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق لوحة إدارة المحتوى"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 bg-[#1b0c36] border-b border-white/10 flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            data-testid="admin-tab-questions"
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition ${
              activeTab === 'questions'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>إدارة الأسئلة ({allQuestions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import_export')}
            data-testid="admin-tab-import"
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition ${
              activeTab === 'import_export'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>استيراد وتصدير (JSON / CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cards_media')}
            data-testid="admin-tab-cards"
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition ${
              activeTab === 'cards_media'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>بطاقات الفئات ومصادر الصور</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history_stats')}
            data-testid="admin-tab-stats"
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition ${
              activeTab === 'history_stats'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>سجل المباريات وإحصائيات الحروف</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            data-testid="admin-tab-audio"
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition ${
              activeTab === 'audio'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>الهوية الصوتية ووضع المسجد</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: QUESTIONS CRUD & VALIDATOR */}
          {activeTab === 'questions' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left 5 Cols: Add / Edit Question Form with Automatic Arabic Letter Validator */}
              <form
                onSubmit={handleSaveQuestion}
                className="lg:col-span-5 rounded-2xl bg-[#230E3B] border border-white/15 p-4 space-y-3 h-fit"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-amber-300 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span>
                      {editingId ? 'تعديل سؤال حالي' : 'إضافة سؤال جديد ومراجع'}
                    </span>
                  </h3>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setFormQuestion('');
                        setFormAnswer('');
                        setFormAltAnswers('');
                      }}
                      className="text-xs text-rose-300 underline cursor-pointer"
                    >
                      إلغاء التعديل
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-white/75 mb-1">
                      الحرف المرتبط
                    </label>
                    <select
                      value={formLetter}
                      onChange={(e) => setFormLetter(e.target.value)}
                      data-testid="admin-input-letter"
                      className="w-full rounded-xl bg-[#140824] border border-white/20 px-2.5 py-2 text-sm font-black text-amber-300"
                    >
                      {ARABIC_ALPHABET.map((l) => (
                        <option key={l} value={l}>
                          حرف ({l})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-white/75 mb-1">
                      الصعوبة
                    </label>
                    <select
                      value={formDifficulty}
                      onChange={(e) =>
                        setFormDifficulty(e.target.value as DifficultyLevel)
                      }
                      className="w-full rounded-xl bg-[#140824] border border-white/20 px-2.5 py-2 text-xs font-bold text-white"
                    >
                      <option value="easy">سهل</option>
                      <option value="medium">متوسط</option>
                      <option value="hard">صعب</option>
                      <option value="expert">خبير</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-white/75 mb-1">
                      الحالة
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) =>
                        setFormStatus(e.target.value as QuestionStatus)
                      }
                      className="w-full rounded-xl bg-[#140824] border border-white/20 px-2.5 py-2 text-xs font-bold text-emerald-300"
                    >
                      <option value="approved">معتمد للعب</option>
                      <option value="pending_review">قيد المراجعة</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-white/75 mb-1">
                      الفئة الرئيسية
                    </label>
                    <select
                      value={formMainCat}
                      onChange={(e) => {
                        const nextMain = e.target.value as MainCategoryId;
                        setFormMainCat(nextMain);
                        const firstSub = MAIN_CATEGORIES_CATALOG.find(
                          (m) => m.id === nextMain
                        )?.subCategories[0]?.id;
                        if (firstSub) setFormSubCat(firstSub);
                      }}
                      className="w-full rounded-xl bg-[#140824] border border-white/20 px-2.5 py-2 text-xs font-bold text-white"
                    >
                      {MAIN_CATEGORIES_CATALOG.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-white/75 mb-1">
                      الفئة الفرعية
                    </label>
                    <select
                      value={formSubCat}
                      onChange={(e) => setFormSubCat(e.target.value)}
                      className="w-full rounded-xl bg-[#140824] border border-white/20 px-2.5 py-2 text-xs font-bold text-white"
                    >
                      {(
                        MAIN_CATEGORIES_CATALOG.find((m) => m.id === formMainCat)
                          ?.subCategories || ALL_SUBCATEGORIES
                      ).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-white/75 mb-1">
                    المستوى العمري المناسب
                  </label>
                  <select
                    value={formAgeGroup}
                    onChange={(e) => setFormAgeGroup(e.target.value as AgeGroupId)}
                    className="w-full rounded-xl bg-[#140824] border border-white/20 px-3 py-2 text-xs font-bold text-white"
                  >
                    {AGE_GROUP_OPTIONS.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-white/75 mb-1">
                    نص السؤال بالعربية الفصحى
                  </label>
                  <textarea
                    rows={2}
                    value={formQuestion}
                    onChange={(e) => setFormQuestion(e.target.value)}
                    data-testid="admin-input-question"
                    placeholder="اكتب السؤال هنا بوضوح..."
                    className="w-full rounded-xl bg-[#140824] border border-white/20 px-3 py-2 text-xs font-bold text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-white/75 mb-1">
                      الإجابة الصحيحة (تبدأ بحرف {formLetter})
                    </label>
                    <input
                      type="text"
                      value={formAnswer}
                      onChange={(e) => setFormAnswer(e.target.value)}
                      data-testid="admin-input-answer"
                      placeholder={`مثال: إجابة تبدأ بحرف ${formLetter}`}
                      className="w-full rounded-xl bg-[#140824] border border-white/20 px-3 py-2 text-xs font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-white/75 mb-1">
                      إجابات بديلة مقبولة (مفصولة بفاصلة)
                    </label>
                    <input
                      type="text"
                      value={formAltAnswers}
                      onChange={(e) => setFormAltAnswers(e.target.value)}
                      placeholder="بديل 1, بديل 2"
                      className="w-full rounded-xl bg-[#140824] border border-white/20 px-3 py-2 text-xs font-bold text-white"
                    />
                  </div>
                </div>

                {/* Live Letter Rule Check Indicator */}
                {liveLetterValidation && (
                  <div
                    className={`rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-2 ${
                      liveLetterValidation.valid
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                    }`}
                  >
                    {liveLetterValidation.valid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          الإجابة مطابقة لحرف ({formLetter}) مع مراعاة «الـ» التعريف والهمزات.
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{liveLetterValidation.reason}</span>
                      </>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-white/75 mb-1">
                    مصدر المعلومة والتوثيق
                  </label>
                  <input
                    type="text"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full rounded-xl bg-[#140824] border border-white/20 px-3 py-1.5 text-xs font-bold text-white/80"
                  />
                </div>

                {formFeedback && (
                  <div
                    data-testid="admin-form-feedback"
                    className={`rounded-xl p-2.5 text-xs font-extrabold ${
                      formFeedback.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                    }`}
                  >
                    {formFeedback.text}
                  </div>
                )}

                <button
                  type="submit"
                  data-testid="admin-btn-save-question"
                  className="w-full py-2.5 rounded-xl bg-[#28B81E] hover:bg-[#32d127] text-white font-black text-sm shadow-lg cursor-pointer transition"
                >
                  {editingId ? 'تحديث السؤال واعتماده' : 'حفظ السؤال في بنك المسجد'}
                </button>
              </form>

              {/* Right 7 Cols: Searchable Question Bank Table & Audit Status */}
              <div className="lg:col-span-7 space-y-3">
                {/* Bank Health & Filter Bar */}
                <div className="rounded-2xl bg-[#230E3B] border border-white/15 p-3.5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-extrabold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>
                        فحص جودة البنك: {auditIssues.length === 0 ? 'جميع الأسئلة مطابقة للحروف وخالية من التكرار' : `${auditIssues.length} ملاحظة`}
                      </span>
                    </div>
                    <span className="text-xs text-amber-300 font-bold">
                      نتائج البحث: {filteredQuestions.length} سؤال
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-white/45 absolute right-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setQuestionPage(0);
                        }}
                        placeholder="ابحث في نص السؤال أو الجواب..."
                        className="w-full rounded-xl bg-[#140824] border border-white/20 pr-9 pl-3 py-1.5 text-xs font-bold text-white"
                      />
                    </div>

                    <select
                      aria-label="تصفية حسب الحرف"
                      value={letterFilter}
                      onChange={(e) => {
                        setLetterFilter(e.target.value);
                        setQuestionPage(0);
                      }}
                      className="rounded-xl bg-[#140824] border border-white/20 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      <option value="all">جميع الحروف (28 حرفًا)</option>
                      {ARABIC_ALPHABET.map((l) => (
                        <option key={l} value={l}>
                          حرف ({l}) — {letterDistribution[l] || 0} سؤال
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="تصفية حسب الفئة"
                      value={mainCatFilter}
                      onChange={(e) => {
                        setMainCatFilter(e.target.value);
                        setQuestionPage(0);
                      }}
                      className="rounded-xl bg-[#140824] border border-white/20 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      <option value="all">جميع الفئات الرئيسية (16)</option>
                      {MAIN_CATEGORIES_CATALOG.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="تصفية حسب الصعوبة"
                      value={difficultyFilter}
                      onChange={(e) => {
                        setDifficultyFilter(e.target.value as DifficultyLevel | 'all');
                        setQuestionPage(0);
                      }}
                      className="rounded-xl bg-[#140824] border border-white/20 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      {DIFFICULTY_OPTIONS.map(({ id, label }) => (
                        <option key={id} value={id}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Questions List */}
                <div key={currentPage} className="space-y-2 max-h-[54vh] overflow-y-auto pr-1">
                  {visibleQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-2xl bg-[#230E3B]/90 border border-white/10 p-3 flex items-start justify-between gap-3 hover:border-amber-400/40 transition"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black text-base flex items-center justify-center shrink-0">
                          {q.letter}
                        </span>
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-extrabold text-white">
                            {q.question}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-black">
                              الجواب: {q.answer}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-white/10 text-purple-200 font-bold">
                              {ALL_SUBCATEGORIES.find((s) => s.id === q.subCategory)?.title ||
                                q.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-black">
                              {DIFFICULTY_OPTIONS.find(({ id }) => id === (q.difficulty ?? 'medium'))?.label}
                            </span>
                            <span className="text-white/50">
                              المصدر: {q.source || 'موثق'} · الاستخدام: {q.usageCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditClick(q)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold cursor-pointer"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          aria-label={`حذف السؤال ${q.id}`}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {pageCount > 1 && (
                  <nav aria-label="صفحات بنك الأسئلة" className="flex items-center justify-between gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setQuestionPage(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40"
                    >
                      السابق
                    </button>
                    <span>صفحة {currentPage + 1} من {pageCount}</span>
                    <button
                      type="button"
                      onClick={() => setQuestionPage(currentPage + 1)}
                      disabled={currentPage === pageCount - 1}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40"
                    >
                      التالي
                    </button>
                  </nav>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT / EXPORT JSON & CSV */}
          {activeTab === 'import_export' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl bg-[#230E3B] border border-white/15 p-4 space-y-3">
                <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>استيراد دفعة أسئلة جديدة (JSON أو CSV)</span>
                </h3>
                <p className="text-xs text-white/75 leading-relaxed">
                  يتحقق النظام تلقائيًا من كل سؤال مستورد ويتأكد من تطابق الإجابة مع الحرف العربي (مع معالجة «الـ» التعريف والهمزات) قبل إضافته إلى بنك المسجد.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportFormat('json')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                      importFormat === 'json'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    صيغة JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportFormat('csv')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                      importFormat === 'csv'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    صيغة CSV
                  </button>
                </div>

                <textarea
                  rows={7}
                  dir="ltr"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  data-testid="admin-import-textarea"
                  placeholder={
                    importFormat === 'json'
                      ? '[{"letter": "ق", "question": "ما اسم أول مسجد في الإسلام؟", "answer": "المسجد قباء / قباء", "mainCategory": "islamic_culture", "subCategory": "mosques_world", "difficulty": "easy"}]'
                      : 'letter,question,answer,mainCategory,subCategory,difficulty,source\nق,ما اسم أول مسجد في الإسلام؟,قباء,islamic_culture,mosques_world,easy,السيرة النبوية'
                  }
                  className="w-full rounded-xl bg-[#140824] border border-white/20 p-3 text-xs font-mono text-white"
                />

                <button
                  type="button"
                  onClick={handleRunImport}
                  data-testid="admin-btn-run-import"
                  className="w-full py-2.5 rounded-xl bg-[#28B81E] hover:bg-[#32d127] text-white font-black text-sm cursor-pointer shadow-lg"
                >
                  فحص واستيراد الأسئلة الآن
                </button>

                {importResult && (
                  <div
                    data-testid="admin-import-result"
                    className="rounded-xl bg-[#140824] border border-white/15 p-3 space-y-1.5 text-xs"
                  >
                    <div className="font-black text-emerald-400">
                      تم استيراد واعتماد ({importResult.importedCount}) سؤال بنجاح!
                    </div>
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="text-rose-300">
                        • {err}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-[#230E3B] border border-white/15 p-4 space-y-4">
                <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>تصدير النسخة الاحتياطية الكاملة لبنك الأسئلة</span>
                </h3>
                <p className="text-xs text-white/75 leading-relaxed">
                  يمكنك تنزيل جميع أسئلة المسجد ({allQuestions.length} سؤال) بصيغة JSON أو CSV للاحتفاظ بنسخة احتياطية دائمة أو تعديلها في برنامج Excel ثم إعادة استيرادها.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadExport('json')}
                    data-testid="admin-btn-export-json"
                    className="py-3 px-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير ملف JSON ({allQuestions.length} سؤال)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadExport('csv')}
                    data-testid="admin-btn-export-csv"
                    className="py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير ملف CSV لبرنامج Excel</span>
                  </button>
                </div>

                <div className="rounded-xl bg-[#140824] border border-white/10 p-3 text-xs space-y-1.5 text-white/75">
                  <div className="font-bold text-amber-300">
                    المصادر المعرفية المعتمدة في البنك:
                  </div>
                  <p>• القرآن الكريم وعلومه (Quran.com) والسيرة النبوية الصحيحة.</p>
                  <p>• ويكي بيانات (Wikidata) والموسوعة البريطانية (Britannica).</p>
                  <p>• علوم الفضاء والفلك (NASA Science) وسجلات الرياضة (FIFA).</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORY CARDS & IMAGE LICENSES */}
          {activeTab === 'cards_media' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#230E3B] border border-white/15 p-3.5 text-xs text-white/80">
                جميع بطاقات الفئات الـ {ALL_SUBCATEGORIES.length} مصممة برسومات متجهية أصلية عالية الدقة مع وضع العنوان العربي برمجيًا فوق البطاقة، ويمكنك أيضًا وضع رابط صورة مخصصة (من Wikimedia Commons أو Openverse أو Pexels أو NASA Images) لأي بطاقة فرعية.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ALL_SUBCATEGORIES.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-2xl bg-[#230E3B] border border-white/15 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-amber-300">
                        {sub.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        {sub.imageLicense}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/65">
                      المصدر: {sub.imageSourceAttribution}
                    </p>
                    <input
                      type="url"
                      dir="ltr"
                      value={customCardImages[sub.id] || ''}
                      onChange={(e) =>
                        onUpdateCustomCardImage(sub.id, e.target.value)
                      }
                      placeholder="https://... (رابط صورة مخصصة اختياري)"
                      className="w-full rounded-xl bg-[#140824] border border-white/20 px-2.5 py-1.5 text-[11px] font-mono text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MATCH HISTORY & LETTER COVERAGE STATS */}
          {activeTab === 'history_stats' && (
            <div className="space-y-5">
              {/* 28 Arabic Letters Question Coverage */}
              <div className="rounded-2xl bg-[#230E3B] border border-white/15 p-4 space-y-3">
                <h3 className="text-sm font-black text-amber-300">
                  تغطية بنك الأسئلة عبر الحروف العربية الـ 28
                </h3>
                <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
                  {ARABIC_ALPHABET.map((l) => {
                    const count = letterDistribution[l] || 0;
                    return (
                      <div
                        key={l}
                        className="rounded-xl bg-[#140824] border border-white/10 p-2 text-center"
                      >
                        <div className="text-base font-black text-white">{l}</div>
                        <div className="text-[11px] font-bold text-emerald-400 tabular-nums">
                          {count} سؤال
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Match History Table */}
              <div className="rounded-2xl bg-[#230E3B] border border-white/15 p-4 space-y-3">
                <h3 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                  <History className="w-4 h-4" />
                  <span>سجل المباريات السابقة في مسجد ابن تيمية ({matchHistory.length})</span>
                </h3>
                {matchHistory.length === 0 ? (
                  <p className="text-xs text-white/60 py-4 text-center">
                    لا توجد مباريات مكتملة مسجلة بعد. سيُحفظ سجل كل مباراة تلقائيًا عند انتهائها.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {matchHistory.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-xl bg-[#140824] border border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div className="font-black text-white">
                          {m.team1Name} ({m.team1RoundsWon}) ضد {m.team2Name} (
                          {m.team2RoundsWon})
                        </div>
                        <div className="text-emerald-400 font-extrabold">
                          الفائز: {m.winnerName}
                        </div>
                        <div className="text-white/60">
                          {new Date(m.playedAt).toLocaleDateString('ar-JO')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIO SYSTEM & MOSQUE QUIET MODE */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#230E3B] border border-white/15 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-black text-amber-300">
                    مستوى الصوت الرئيسي ({Math.round(volume * 100)}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      soundFX.setVolume(v);
                      soundFX.playSelectCategory();
                    }}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#140824] border border-white/10 p-3">
                  <div>
                    <div className="text-sm font-black text-emerald-300">
                      وضع المسجد الهادئ
                    </div>
                    <div className="text-[11px] text-white/65">
                      يُخفف المؤثرات الاحتفالية ويكتفي بإشارات صوتية هادئة تناسب حلقات المسجد
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !quietMode;
                      setQuietMode(next);
                      soundFX.setMosqueQuietMode(next);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer ${
                      quietMode
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-white/15 text-white'
                    }`}
                  >
                    {quietMode ? 'مفعّل' : 'عادي'}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-[#230E3B] border border-white/15 p-4 space-y-3">
                <h3 className="text-sm font-black text-amber-300">
                  سجل المؤثرات الصوتية الـ 10 ومواضع الملفات والتراخيص
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {AUDIO_ASSET_MANIFEST.map((asset) => (
                    <div
                      key={asset.id}
                      className="rounded-xl bg-[#140824] border border-white/10 p-3 flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-black text-white">
                          {asset.titleAr}
                        </div>
                        <div className="text-[11px] text-white/60">
                          {asset.descriptionAr}
                        </div>
                        <div className="text-[10px] font-mono text-amber-300/80">
                          {asset.expectedFilePath} · {asset.fallbackMode}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (asset.id === 'match_start') soundFX.playMatchStart();
                          else if (asset.id === 'select_category')
                            soundFX.playSelectCategory();
                          else if (asset.id === 'select_letter')
                            soundFX.playSelectLetter();
                          else if (asset.id === 'buzzer_press')
                            soundFX.playBuzzerWin('team1');
                          else if (asset.id === 'correct_answer')
                            soundFX.playClaimCell();
                          else if (asset.id === 'wrong_answer')
                            soundFX.playWrongAnswer();
                          else if (asset.id === 'turn_change')
                            soundFX.playTurnChange();
                          else if (asset.id === 'time_up') soundFX.playTimeUp();
                          else soundFX.playVictoryFanfare();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer shrink-0"
                      >
                        معاينة
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
