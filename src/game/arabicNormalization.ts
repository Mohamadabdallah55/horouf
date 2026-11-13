/**
 * Pure Arabic normalization, letter validation, duplicate detection, and CSV/JSON import-export utilities
 * for «حروف مع النخبة PRO — مكتبة ألعاب مسجد ابن تيمية».
 */

const DIACRITICS_REGEX = /[\u064B-\u065F\u0670\u0640]/g;

/**
 * Strips Arabic diacritics (Tashkeel) and Tatweel, and trims punctuation/whitespace.
 */
export function cleanArabicText(input: string): string {
  if (!input) return '';
  return input
    .replace(DIACRITICS_REGEX, '')
    .replace(/^[«"'\s(\-[\]]+|[»"'\s)\-.,!؟?[\]]+$/g, '')
    .trim();
}

/**
 * Normalizes an Arabic character to the canonical 28-letter game alphabet (`أ`..`ي`, with `هـ` for Ha).
 */
export function normalizeArabicCharToGameLetter(char: string): string {
  if (!char) return '';
  const c = char.trim()[0];
  if (!c) return '';
  if (c === 'ا' || c === 'أ' || c === 'إ' || c === 'آ' || c === 'ٱ') {
    return 'أ';
  }
  if (c === 'ه' || c === 'ة') {
    return 'هـ';
  }
  if (c === 'ى' || c === 'ئ') {
    return 'ي';
  }
  if (c === 'ؤ') {
    return 'و';
  }
  return c;
}

/**
 * Normalizes a game letter label (e.g. 'ا' -> 'أ', 'ه' -> 'هـ').
 */
export function normalizeGameLetter(letter: string): string {
  const cleaned = cleanArabicText(letter);
  if (cleaned === 'هـ' || cleaned === 'ه') return 'هـ';
  return normalizeArabicCharToGameLetter(cleaned);
}

/**
 * Extracts the effective starting game letter of an Arabic answer, handling:
 * 1. Direct first character (e.g., "أحمد" -> "أ", "الجزائر" -> "أ" or stripped "ال" -> "ج").
 * 2. Leading definite article "ال" (الـ التعريف), e.g., "القمر" -> matches "ق", "البتراء" -> matches "ب".
 * 3. Leading "أبو " / "ابن " / "بن " / "سورة " / "غزوة " / "معركة " / "نهر " / "جبل " prefixes.
 */
export function getCandidateStartingLetters(answer: string): string[] {
  const cleaned = cleanArabicText(answer);
  if (!cleaned) return [];

  const candidates = new Set<string>();

  // 1. Direct first letter of the full answer
  const directLetter = normalizeArabicCharToGameLetter(cleaned[0]);
  if (directLetter) candidates.add(directLetter);

  // 2. If starts with "ال" (definite article) and has at least 3 chars, extract letter after "ال"
  if (cleaned.startsWith('ال') && cleaned.length > 2) {
    const afterAl = normalizeArabicCharToGameLetter(cleaned[2]);
    if (afterAl) candidates.add(afterAl);
  }

  // 3. Also check common prefixes like "سورة ", "غزوة ", "معركة ", "نهر ", "جبل ", "بحر "
  const prefixes = ['سورة ', 'غزوة ', 'معركة ', 'نهر ', 'جبل ', 'بحر ', 'مدينة ', 'دولة '];
  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix) && cleaned.length > prefix.length) {
      const rest = cleaned.slice(prefix.length).trim();
      if (rest) {
        candidates.add(normalizeArabicCharToGameLetter(rest[0]));
        if (rest.startsWith('ال') && rest.length > 2) {
          candidates.add(normalizeArabicCharToGameLetter(rest[2]));
        }
      }
    }
  }

  return Array.from(candidates);
}

/**
 * Validates whether an Arabic answer (or any of its accepted alternatives) validly starts with
 * the target Arabic letter according to game rules (accounting for «الـ» التعريف and Hamza variants).
 */
export function doesAnswerMatchLetter(
  answer: string,
  targetLetter: string,
  acceptedAnswers: string[] = []
): { valid: boolean; matchedForm: string; reason?: string } {
  const normalizedTarget = normalizeGameLetter(targetLetter);
  if (!normalizedTarget) {
    return { valid: false, matchedForm: '', reason: 'الحرف المطلوب غير محدد.' };
  }

  const allForms = [answer, ...(acceptedAnswers || [])].filter(Boolean);
  for (const form of allForms) {
    const letters = getCandidateStartingLetters(form);
    if (letters.includes(normalizedTarget)) {
      return { valid: true, matchedForm: form };
    }
  }

  const primaryLetters = getCandidateStartingLetters(answer);
  return {
    valid: false,
    matchedForm: '',
    reason: `الإجابة «${answer}» تبدأ بحرف (${primaryLetters.join(' أو ') || '؟'}) ولا تطابق الحرف المطلوب (${normalizedTarget}).`,
  };
}

/**
 * Normalizes an Arabic string for duplicate comparison or fuzzy answer checking.
 */
export function normalizeForComparison(text: string): string {
  const cleaned = cleanArabicText(text);
  return cleaned
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Checks a list of questions for duplicates, letter mismatches, or empty fields.
 */
export interface QuestionValidationIssue {
  questionId: string;
  type: 'letter_mismatch' | 'duplicate_question' | 'missing_fields';
  message: string;
}

export function auditQuestionBank<
  T extends {
    id: string;
    letter: string;
    question: string;
    answer: string;
    acceptedAnswers?: string[];
  }
>(questions: T[]): QuestionValidationIssue[] {
  const issues: QuestionValidationIssue[] = [];
  const seenQuestions = new Map<string, string>();

  for (const q of questions) {
    if (!q.question?.trim() || !q.answer?.trim() || !q.letter?.trim()) {
      issues.push({
        questionId: q.id,
        type: 'missing_fields',
        message: 'السؤال أو الإجابة أو الحرف مفقود.',
      });
      continue;
    }

    const letterCheck = doesAnswerMatchLetter(
      q.answer,
      q.letter,
      q.acceptedAnswers
    );
    if (!letterCheck.valid) {
      issues.push({
        questionId: q.id,
        type: 'letter_mismatch',
        message: letterCheck.reason || 'عدم تطابق الحرف مع الإجابة.',
      });
    }

    const normKey = `${normalizeGameLetter(q.letter)}::${normalizeForComparison(
      q.question
    )}`;
    const existingId = seenQuestions.get(normKey);
    if (existingId && existingId !== q.id) {
      issues.push({
        questionId: q.id,
        type: 'duplicate_question',
        message: `السؤال مكرر مع السؤال رقم (${existingId}).`,
      });
    } else {
      seenQuestions.set(normKey, q.id);
    }
  }

  return issues;
}
