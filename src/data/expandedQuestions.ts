import {
  AgeGroupId,
  DifficultyLevel,
  MainCategoryId,
  QuestionCategory,
  QuestionItem,
} from '../types/game';
import { doesAnswerMatchLetter, normalizeGameLetter } from '../game/arabicNormalization';

interface ExtraQuestionSeed {
  letter: string;
  question: string;
  answer: string;
  acceptedAnswers?: string[];
  mainCategory: MainCategoryId;
  subCategory: string;
  legacyCategory: QuestionCategory;
  difficulty: DifficultyLevel;
  ageGroups: AgeGroupId[];
  source: string;
}

/**
 * Additional verified Arabic questions covering all 16 Main Categories and specialized Subcategories
 * (Jordan & Arab World, Technology & Computing, Video Games, Kids & Families, Nature & Animals,
 * Quran & Seerah, Islamic Culture, Arabic Literature, Sports, Science, Miscellaneous, etc.).
 * Every answer starts with the exact target Arabic letter.
 */
export const EXTRA_VERIFIED_QUESTIONS: ExtraQuestionSeed[] = [
  // 1. القرآن والسيرة (quran_seerah)
  {
    letter: 'أ',
    question: 'ما هي أعظم آية في كتاب الله تعالى وتقع في سورة البقرة؟',
    answer: 'آية الكرسي',
    acceptedAnswers: ['اية الكرسي'],
    mainCategory: 'quran_seerah',
    subCategory: 'surahs_verses',
    legacyCategory: 'معلومات إسلامية',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'القرآن الكريم — سورة البقرة (255)',
  },
  {
    letter: 'ف',
    question: 'ما هي السورة التي تُسمى «أم الكتاب» و«السبع المثاني» وتُقرأ في كل ركعة؟',
    answer: 'فاتحة الكتاب (سورة الفاتحة)',
    acceptedAnswers: ['الفاتحة', 'سورة الفاتحة'],
    mainCategory: 'quran_seerah',
    subCategory: 'quran_sciences',
    legacyCategory: 'معلومات إسلامية',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'القرآن الكريم — صحيح البخاري',
  },
  {
    letter: 'ك',
    question: 'ما هي السورة التي يُستحب قراءتها يوم الجمعة وتحتوي على قصة أصحاب الكهف وذي القرنين؟',
    answer: 'كهف (سورة الكهف)',
    acceptedAnswers: ['الكهف', 'سورة الكهف'],
    mainCategory: 'quran_seerah',
    subCategory: 'quran_sciences',
    legacyCategory: 'معلومات إسلامية',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'القرآن الكريم — سورة الكهف',
  },
  {
    letter: 'إ',
    question: 'من هو نبي الله الملقب بـ «أبو الأنبياء» الذي بنى الكعبة المشرفة مع ابنه إسماعيل؟',
    answer: 'إبراهيم عليه السلام',
    acceptedAnswers: ['ابراهيم'],
    mainCategory: 'quran_seerah',
    subCategory: 'prophets_stories',
    legacyCategory: 'معلومات إسلامية',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'القرآن الكريم — سورة البقرة',
  },
  {
    letter: 'م',
    question: 'من هو نبي الله الملقب بـ «كليم الله» الذي أُرسل إلى فرعون وقومه؟',
    answer: 'موسى عليه السلام',
    acceptedAnswers: ['موسى'],
    mainCategory: 'quran_seerah',
    subCategory: 'prophets_stories',
    legacyCategory: 'معلومات إسلامية',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'القرآن الكريم — سورة طه',
  },
  {
    letter: 'خ',
    question: 'في أي غزوة حفر المسلمون خندقًا حول المدينة المنورة بمشورة سلمان الفارسي؟',
    answer: 'خندق (غزوة الخندق / الأحزاب)',
    acceptedAnswers: ['الخندق', 'غزوة الخندق'],
    mainCategory: 'quran_seerah',
    subCategory: 'seerah_nabawiyah',
    legacyCategory: 'معلومات إسلامية',
    difficulty: 'easy',
    ageGroups: ['juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'السيرة النبوية لابن هشام',
  },

  // 2. ثقافة إسلامية (islamic_culture)
  {
    letter: 'ع',
    question: 'من هو الخليفة الراشد الثاني الملقب بـ «الفاروق» الذي فُتحت في عهده القدس والشام ومصر؟',
    answer: 'عمر بن الخطاب',
    acceptedAnswers: ['عمر'],
    mainCategory: 'islamic_culture',
    subCategory: 'companions_stories',
    legacyCategory: 'معلومات إسلامية',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'سير أعلام النبلاء',
  },
  {
    letter: 'ق',
    question: 'ما هو أول مسجد بُني في الإسلام عندما وصل النبي ﷺ إلى المدينة المنورة؟',
    answer: 'قباء (مسجد قباء)',
    acceptedAnswers: ['مسجد قباء'],
    mainCategory: 'islamic_culture',
    subCategory: 'mosques_world',
    legacyCategory: 'معلومات إسلامية',
    difficulty: 'easy',
    ageGroups: ['juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'السيرة النبوية — صحيح البخاري',
  },
  {
    letter: 'ب',
    question: 'من هو الإمام المحدث صاحب أصح كتاب بعد كتاب الله تعالى «الجامع الصحيح»؟',
    answer: 'بخاري (الإمام البخاري)',
    acceptedAnswers: ['البخاري', 'محمد بن إسماعيل البخاري'],
    mainCategory: 'islamic_culture',
    subCategory: 'islamic_scholars',
    legacyCategory: 'معلومات إسلامية',
    difficulty: 'medium',
    ageGroups: ['juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'تاريخ التراث الإسلامي',
  },
  {
    letter: 'ص',
    question: 'ما هو الركن الثاني من أركان الإسلام وأول ما يُحاسب عليه العبد يوم القيامة؟',
    answer: 'صلاة (الصلاة)',
    acceptedAnswers: ['الصلاة'],
    mainCategory: 'islamic_culture',
    subCategory: 'islamic_ethics_fiqh',
    legacyCategory: 'معلومات إسلامية',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'الأربعون النووية',
  },

  // 3. الأردن والعالم العربي (jordan_arab_world)
  {
    letter: 'ب',
    question: 'ما هي المدينة الوردية المنحوتة في الصخر في جنوب الأردن وتُعد من عجائب الدنيا السبع الجديدة؟',
    answer: 'بتراء (البتراء)',
    acceptedAnswers: ['البتراء'],
    mainCategory: 'jordan_arab_world',
    subCategory: 'hashemite_jordan',
    legacyCategory: 'جغرافيا',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'التراث العالمي — اليونسكو / جغرافيا الأردن',
  },
  {
    letter: 'ج',
    question: 'ما هي المدينة الأردنية الأثرية الملقبة بـ «مدينة الألف عمود» وتشتهر بمدرجها الروماني؟',
    answer: 'جرش',
    acceptedAnswers: ['مدينة جرش'],
    mainCategory: 'jordan_arab_world',
    subCategory: 'hashemite_jordan',
    legacyCategory: 'جغرافيا',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'جغرافيا وتاريخ الأردن',
  },
  {
    letter: 'ع',
    question: 'ما اسم القلعة الإسلامية في شمال الأردن التي بناها عز الدين أسامة أحد قادة صلاح الدين الأيوبي؟',
    answer: 'عجلون (قلعة عجلون)',
    acceptedAnswers: ['قلعة عجلون'],
    mainCategory: 'jordan_arab_world',
    subCategory: 'hashemite_jordan',
    legacyCategory: 'تاريخ',
    difficulty: 'easy',
    ageGroups: ['juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'تاريخ الأردن الإسلامي',
  },
  {
    letter: 'ك',
    question: 'ما هي المحافظة الأردنية الواقعة جنوب البلاد وتشتهر بقلعتها التاريخية الحصينة؟',
    answer: 'كرك (الكرك)',
    acceptedAnswers: ['الكرك', 'قلعة الكرك'],
    mainCategory: 'jordan_arab_world',
    subCategory: 'hashemite_jordan',
    legacyCategory: 'جغرافيا',
    difficulty: 'easy',
    ageGroups: ['juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'جغرافيا المملكة الأردنية الهاشمية',
  },
  {
    letter: 'ق',
    question: 'ما هي المدينة المقدسة في بلاد الشام التي تضم المسجد الأقصى المبارك وأولى القبلتين؟',
    answer: 'قدس (القدس الشريف)',
    acceptedAnswers: ['القدس', 'بيت المقدس'],
    mainCategory: 'jordan_arab_world',
    subCategory: 'bilad_al_sham',
    legacyCategory: 'جغرافيا',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'جغرافيا وتاريخ بلاد الشام',
  },
  {
    letter: 'د',
    question: 'ما هي عاصمة الجمهورية العربية السورية وأقدم عاصمة مأهولة في التاريخ؟',
    answer: 'دمشق',
    acceptedAnswers: ['مدينة دمشق'],
    mainCategory: 'jordan_arab_world',
    subCategory: 'bilad_al_sham',
    legacyCategory: 'جغرافيا',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'الموسوعة الجغرافية العربية',
  },
  {
    letter: 'ر',
    question: 'ما هي عاصمة المملكة العربية السعودية وأكبر مدنها؟',
    answer: 'رياض (الرياض)',
    acceptedAnswers: ['الرياض'],
    mainCategory: 'jordan_arab_world',
    subCategory: 'arab_gulf_nile_maghreb',
    legacyCategory: 'جغرافيا',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'ويكي بيانات — عواصم الدول العربية',
  },

  // 4. تكنولوجيا وحاسوب (technology)
  {
    letter: 'ب',
    question: 'ما هي لغة البرمجة الشهيرة سهلة التعلم التي تُستخدم على نطاق واسع في الذكاء الاصطناعي وتحمل اسم ثعبان؟',
    answer: 'بايثون (Python)',
    acceptedAnswers: ['بايثون', 'Python'],
    mainCategory: 'technology',
    subCategory: 'programming_ai',
    legacyCategory: 'علوم',
    difficulty: 'easy',
    ageGroups: ['juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'موسوعة علوم الحاسوب — Wikidata',
  },
  {
    letter: 'خ',
    question: 'ماذا تُسمى مجموعة الخطوات المنطقية المتسلسلة لحل مشكلة برمجية أو رياضية نسبةً للعالم الخوارزمي؟',
    answer: 'خوارزمية',
    acceptedAnswers: ['الخوارزمية', 'خوارزميات'],
    mainCategory: 'technology',
    subCategory: 'programming_ai',
    legacyCategory: 'علوم',
    difficulty: 'medium',
    ageGroups: ['juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'تاريخ العلوم — محمد بن موسى الخوارزمي',
  },
  {
    letter: 'م',
    question: 'ما اسم الوحدة المركزية في الحاسوب التي تقوم بتنفيذ العمليات الحسابية والمنطقية وتُعد «عقل الحاسوب»؟',
    answer: 'معالج (المعالج المركزي CPU)',
    acceptedAnswers: ['المعالج', 'معالج دقيق'],
    mainCategory: 'technology',
    subCategory: 'computing_internet',
    legacyCategory: 'علوم',
    difficulty: 'easy',
    ageGroups: ['juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'أساسيات هندسة الحاسوب',
  },
  {
    letter: 'ذ',
    question: 'ما هو المصطلح التقني للأنظمة البرمجية القادرة على التعلم والتحليل ومحاكاة القدرات الذهنية البشرية؟',
    answer: 'ذكاء اصطناعي',
    acceptedAnswers: ['الذكاء الاصطناعي'],
    mainCategory: 'technology',
    subCategory: 'programming_ai',
    legacyCategory: 'علوم',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'موسوعة التكنولوجيا الحديثة',
  },

  // 5. ألعاب فيديو (video_games)
  {
    letter: 'م',
    question: 'ما اسم لعبة الفيديو الشهيرة التي تعتمد على البناء والتعدين بالمكعبات في عالم مفتوح ثلاثي الأبعاد؟',
    answer: 'ماينكرافت (Minecraft)',
    acceptedAnswers: ['ماينكرافت', 'ماين كرافت'],
    mainCategory: 'video_games',
    subCategory: 'minecraft_sandbox',
    legacyCategory: 'معلومات عامة',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'family_mixed'],
    source: 'موسوعة الألعاب — Wikidata',
  },
  {
    letter: 'أ',
    question: 'ما هو المعدن النادر ذو اللون الأزرق السماوي الذي يصنع منه اللاعب أقوى الدروع الكلاسيكية في ماينكرافت قبل النذرايت؟',
    answer: 'ألماس (الدايموند)',
    acceptedAnswers: ['الألماس', 'دايموند'],
    mainCategory: 'video_games',
    subCategory: 'minecraft_sandbox',
    legacyCategory: 'معلومات عامة',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'family_mixed'],
    source: 'دليل ألعاب البناء والمكعبات',
  },
  {
    letter: 'ب',
    question: 'ما اسم منصة الألعاب المنزلية الشهيرة التي تنتجها شركة سوني اليابانية منذ عام 1994؟',
    answer: 'بلايستيشن (PlayStation)',
    acceptedAnswers: ['بلايستيشن', 'بلاي ستيشن'],
    mainCategory: 'video_games',
    subCategory: 'consoles_gaming_history',
    legacyCategory: 'معلومات عامة',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'تاريخ أجهزة ألعاب الفيديو — OpenTDB',
  },
  {
    letter: 'ن',
    question: 'ما اسم الشركة اليابانية العريقة التي ابتكرت جهاز «سويتش» وسلسلة ألعاب «سوبر ماريو» و«زيلدا»؟',
    answer: 'نينتندو (Nintendo)',
    acceptedAnswers: ['نينتندو'],
    mainCategory: 'video_games',
    subCategory: 'consoles_gaming_history',
    legacyCategory: 'معلومات عامة',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'تاريخ الألعاب — Wikidata',
  },

  // 6. رياضة (sports)
  {
    letter: 'ن',
    question: 'ما هو لقب المنتخب الأردني الوطني لكرة القدم الذي وصل إلى نهائي كأس آسيا 2023؟',
    answer: 'نشامى (النشامى)',
    acceptedAnswers: ['النشامى'],
    mainCategory: 'sports',
    subCategory: 'arab_leagues',
    legacyCategory: 'رياضة',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'الاتحاد الأردني لكرة القدم / FIFA',
  },
  {
    letter: 'م',
    question: 'ما هو أول منتخب عربي وأفريقي يتأهل إلى نصف نهائي كأس العالم لكرة القدم في قطر 2022؟',
    answer: 'مغرب (المنتخب المغربي)',
    acceptedAnswers: ['المغرب', 'منتخب المغرب'],
    mainCategory: 'sports',
    subCategory: 'world_cup',
    legacyCategory: 'رياضة',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'سجلات الاتحاد الدولي لكرة القدم FIFA',
  },
  {
    letter: 'ر',
    question: 'ما هو النادي الإسباني الأكثر تتويجًا بلقب دوري أبطال أوروبا عبر التاريخ؟',
    answer: 'ريال مدريد',
    acceptedAnswers: ['نادي ريال مدريد'],
    mainCategory: 'sports',
    subCategory: 'european_clubs',
    legacyCategory: 'رياضة',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'سجلات الاتحاد الأوروبي UEFA',
  },

  // 7. طبيعة وحيوانات (nature_animals)
  {
    letter: 'ف',
    question: 'ما هو أسرع حيوان بري على وجه الأرض؟',
    answer: 'فهد (الفهد الصياد)',
    acceptedAnswers: ['الفهد', 'الشيتا'],
    mainCategory: 'nature_animals',
    subCategory: 'animals_birds',
    legacyCategory: 'علوم',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'موسوعة عالم الحيوان — Britannica',
  },
  {
    letter: 'ص',
    question: 'ما هو الطائر الجارح الذي يتميز بحدة بصره وسرعة انقضاضه ويُعد رمزًا للشجاعة لدى العرب؟',
    answer: 'صقر (الصقر)',
    acceptedAnswers: ['الصقر', 'شاهين'],
    mainCategory: 'nature_animals',
    subCategory: 'animals_birds',
    legacyCategory: 'علوم',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'موسوعة الطيور العربية',
  },
  {
    letter: 'ز',
    question: 'ما هي الشجرة المباركة المعمرة التي ورد ذكرها في القرآن الكريم ويُستخرج منها زيت صحي شهير في بلاد الشام؟',
    answer: 'زيتون (شجرة الزيتون)',
    acceptedAnswers: ['الزيتون'],
    mainCategory: 'nature_animals',
    subCategory: 'plants_phenomena',
    legacyCategory: 'علوم',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'القرآن الكريم — سورة النور / موسوعة النباتات',
  },

  // 8. شهرة وفنون ومحتوى ترفيهي مناسب (culture_media)
  {
    letter: 'ا',
    question: 'من هو الرحالة المسلم المغربي الشهير صاحب كتاب «تحفة النظار في غرائب الأمصار» الذي جاب العالم القديم؟',
    answer: 'ابن بطوطة',
    acceptedAnswers: ['محمد بن بطوطة'],
    mainCategory: 'culture_media',
    subCategory: 'famous_figures',
    legacyCategory: 'تاريخ',
    difficulty: 'easy',
    ageGroups: ['juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'تاريخ الرحالة المسلمين — Wikidata',
  },
  {
    letter: 'س',
    question: 'ما اسم قناة الأطفال العربية الشهيرة التي أطلقت عام 2000 واشتهرت بكواكبها مثل «أكشن» و«مغامرات» و«زمردة»؟',
    answer: 'سبيستون (Spacetoon)',
    acceptedAnswers: ['سبيستون', 'سبيس تون'],
    mainCategory: 'culture_media',
    subCategory: 'classic_cartoons_spacetoon',
    legacyCategory: 'ثقافة عربية',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'موسوعة الإعلام العربي الهادف',
  },
  {
    letter: 'ك',
    question: 'ما اسم المحقق الصغير الذكي في مسلسل الرسوم المتحركة الشهير الذي يردد عبارة «لا توجد جريمة كاملة»؟',
    answer: 'كونان (المحقق كونان)',
    acceptedAnswers: ['المحقق كونان'],
    mainCategory: 'culture_media',
    subCategory: 'classic_cartoons_spacetoon',
    legacyCategory: 'معلومات عامة',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'family_mixed'],
    source: 'موسوعة الرسوم المتحركة المدبلجة',
  },

  // 9. منوعات (misc) & عائلات وأطفال (families_kids)
  {
    letter: 'م',
    question: 'ما هي الأكلة التراثية الأردنية الشهيرة التي تُطبخ باللبن الجميد واللحم والأرز وتُعد رمزًا للكرم؟',
    answer: 'منسف (المنسف الأردني)',
    acceptedAnswers: ['المنسف'],
    mainCategory: 'misc',
    subCategory: 'food_cuisine',
    legacyCategory: 'ثقافة عربية',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'قائمة اليونسكو للتراث الثقافي غير المادي — الأردن',
  },
  {
    letter: 'ب',
    question: 'ما اسم الأداة الملاحية المغناطيسية التي استخدمها البحارة والمسافرون لتحديد الاتجاهات الأربعة؟',
    answer: 'بوصلة (البوصلة)',
    acceptedAnswers: ['البوصلة'],
    mainCategory: 'misc',
    subCategory: 'cars_tools_trades',
    legacyCategory: 'علوم',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'تاريخ العلوم والملاحة',
  },
  {
    letter: 'س',
    question: 'ما هو الذكر أو التحية الإسلامية التي يقولها المسلم عند دخول البيت أو المسجد أو لقاء إخوانه؟',
    answer: 'سلام (السلام عليكم ورحمة الله وبركاته)',
    acceptedAnswers: ['السلام عليكم'],
    mainCategory: 'families_kids',
    subCategory: 'kids_mosque_quiz',
    legacyCategory: 'معلومات إسلامية',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'family_mixed'],
    source: 'رياض الصالحين — آداب السلام',
  },
  {
    letter: 'ت',
    question: 'ماذا يقول المسلم عند البدء بتناول الطعام أو الشراب أو أي عمل صالح؟',
    answer: 'تسمية (بسم الله الرحمن الرحيم)',
    acceptedAnswers: ['بسم الله', 'التسمية'],
    mainCategory: 'families_kids',
    subCategory: 'family_gathering_quiz',
    legacyCategory: 'معلومات إسلامية',
    difficulty: 'easy',
    ageGroups: ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed'],
    source: 'الآداب النبوية — صحيح مسلم',
  },

  // 10. أسئلة مستويات صعب وخبير (Hard & Expert) للفئات الـ 6 البارزة (الفضاء، الأردن، الكيمياء، التاريخ الإسلامي، ألعاب الفيديو)
  {
    letter: 'ش',
    question: 'ما اسم نصف القطر الحرج الذي إذا ضُغطت كتلة جسم ما داخله فإنه ينهار جاذبيًا ليتحول إلى ثقب أسود، نِسبةً إلى العالم الألماني الذي حل معادلات أينشتاين عام 1916؟',
    answer: 'شفارتزشيلد (نصف قطر شفارتزشيلد)',
    acceptedAnswers: ['شفارتزشيلد', 'شوارزشيلد'],
    mainCategory: 'science',
    subCategory: 'space_astronomy',
    legacyCategory: 'علوم',
    difficulty: 'expert',
    ageGroups: ['adults_18_plus'],
    source: 'NASA Astrophysics - Schwarzschild Radius (1916)',
  },
  {
    letter: 'أ',
    question: 'ما اسم السحابة الكروية العملاقة المفترضة من الكويكبات الجليدية التي تحيط بالمجموعة الشمسية على بُعد يصل إلى سنة ضوئية وتُعد مصدر المذنبات طويلة الدورة؟',
    answer: 'أورت (سحابة أورت)',
    acceptedAnswers: ['أورت', 'سحابة أورت'],
    mainCategory: 'science',
    subCategory: 'space_astronomy',
    legacyCategory: 'علوم',
    difficulty: 'expert',
    ageGroups: ['adults_18_plus'],
    source: 'NASA Solar System Exploration - Oort Cloud',
  },
  {
    letter: 'ك',
    question: 'ما اسم الحزام الواقع خلف مدار كوكب نبتون مباشرة والذي يضم الكوكب القزم بلوتو وملايين الأجرام الجليدية؟',
    answer: 'كايبر (حزام كايبر)',
    acceptedAnswers: ['كايبر', 'حزام كايبر', 'كويبر'],
    mainCategory: 'science',
    subCategory: 'space_astronomy',
    legacyCategory: 'علوم',
    difficulty: 'hard',
    ageGroups: ['youth_14_17', 'adults_18_plus'],
    source: 'NASA Kuiper Belt Overview',
  },
  {
    letter: 'ت',
    question: 'ما اسم أكبر أقمار كوكب زحل، وهو القمر الوحيد في المجموعة الشمسية الذي يمتلك غلافًا جويًا كثيفًا وبحيرات من الميثان السائل؟',
    answer: 'تيتان',
    acceptedAnswers: ['قمر تيتان', 'تايتن'],
    mainCategory: 'science',
    subCategory: 'space_astronomy',
    legacyCategory: 'علوم',
    difficulty: 'hard',
    ageGroups: ['youth_14_17', 'adults_18_plus'],
    source: 'NASA Cassini-Huygens Mission Archive',
  },
  {
    letter: 'ح',
    question: 'من هو الملك النبطي (الرابع) الذي بلغت مملكة الأنباط وعاصمتها البتراء في عهده (9 ق.م – 40 م) أقصى اتساعها وازدهارها العمراني ويُنسب إليه بناء الخزنة؟',
    answer: 'الحارث الرابع',
    acceptedAnswers: ['حارث الرابع', 'الملك الحارث الرابع'],
    mainCategory: 'jordan_arab_world',
    subCategory: 'hashemite_jordan',
    legacyCategory: 'تاريخ',
    difficulty: 'expert',
    ageGroups: ['adults_18_plus'],
    source: 'دائرة الآثار العامة الأردنية — تاريخ مملكة الأنباط',
  },
  {
    letter: 'م',
    question: 'ما اسم المسلة الحجرية البازلتية الشهيرة التي سجل عليها ملك مؤاب انتصاره على مملكة يهوذا في القرن التاسع قبل الميلاد وعُثر عليها في ذيبان بالأردن عام 1868؟',
    answer: 'ميشع (مسلة ميشع)',
    acceptedAnswers: ['ميشع', 'مسلة ميشع', 'حجر مؤاب'],
    mainCategory: 'jordan_arab_world',
    subCategory: 'hashemite_jordan',
    legacyCategory: 'تاريخ',
    difficulty: 'expert',
    ageGroups: ['adults_18_plus'],
    source: 'متحف الآثار الأردني / متحف اللوفر — مسلة ميشع',
  },
  {
    letter: 'د',
    question: 'ما اسم حلف المدن العشر الرومانية الهلنستية الذي ضم مدنًا تاريخية في الأردن مثل جرش (جراسا) وأم قيس (جدارا) وعمان (فيلادلفيا)؟',
    answer: 'ديكابولس (حلف الديكابولس)',
    acceptedAnswers: ['ديكابولس', 'الديكابولس'],
    mainCategory: 'jordan_arab_world',
    subCategory: 'hashemite_jordan',
    legacyCategory: 'تاريخ',
    difficulty: 'hard',
    ageGroups: ['youth_14_17', 'adults_18_plus'],
    source: 'دائرة الآثار العامة الأردنية — مدن الديكابولس',
  },
  {
    letter: 'ع',
    question: 'ما اسم القصر الأموي الصحراوي في البادية الأردنية الشرقية المدرج على قائمة التراث العالمي لليونسكو منذ 1985 لاحتوائه على رسوم جدارية وقبة فلكية فريدة؟',
    answer: 'عمرة (قصر عمرة)',
    acceptedAnswers: ['عمرة', 'قصر عمرة', 'قصير عمرة'],
    mainCategory: 'jordan_arab_world',
    subCategory: 'hashemite_jordan',
    legacyCategory: 'جغرافيا',
    difficulty: 'hard',
    ageGroups: ['youth_14_17', 'adults_18_plus'],
    source: 'UNESCO World Heritage Centre - Quseir Amra',
  },
  {
    letter: 'ت',
    question: 'ما اسم العنصر الكيميائي الانتقالي صاحب أعلى درجة انصهار بين جميع الفلزات في الجدول الدوري (3422 درجة مئوية) ورمزه الكيميائي W؟',
    answer: 'تنغستن',
    acceptedAnswers: ['التنغستن', 'تنجستن'],
    mainCategory: 'science',
    subCategory: 'physics_chemistry',
    legacyCategory: 'علوم',
    difficulty: 'expert',
    ageGroups: ['adults_18_plus'],
    source: 'IUPAC Periodic Table of Elements - Tungsten (W)',
  },
  {
    letter: 'أ',
    question: 'ما اسم الفلز النفيس الانتقالي الذي يُعد أكثر العناصر الطبيعية كثافة على سطح الأرض (22.59 جم/سم³) ورمزه الكيميائي Os؟',
    answer: 'أوزميوم',
    acceptedAnswers: ['الأوزميوم', 'اوزميوم'],
    mainCategory: 'science',
    subCategory: 'physics_chemistry',
    legacyCategory: 'علوم',
    difficulty: 'expert',
    ageGroups: ['adults_18_plus'],
    source: 'IUPAC Periodic Table - Osmium (Os)',
  },
  {
    letter: 'ك',
    question: 'ما اسم الظاهرة الفيزيائية الكمية التي تصف تشتت الفوتونات (الأشعة السينية) عند اصطدامها بإلكترونات حرة ونال عليها آرثر جائزة نوبل عام 1927؟',
    answer: 'كومبتون (تأثير كومبتون)',
    acceptedAnswers: ['كومبتون', 'تأثير كومبتون', 'ظاهرة كومبتون'],
    mainCategory: 'science',
    subCategory: 'physics_chemistry',
    legacyCategory: 'علوم',
    difficulty: 'expert',
    ageGroups: ['adults_18_plus'],
    source: 'Nobel Prize in Physics 1927 - Compton Effect',
  },
  {
    letter: 'م',
    question: 'ما اسم معركة عام 1071م التي انتصر فيها السلطان السلجوقي ألب أرسلان على الإمبراطور البيزنطي رومانوس الرابع وفتحت الأناضول للإسلام؟',
    answer: 'ملاذكرد',
    acceptedAnswers: ['معركة ملاذكرد'],
    mainCategory: 'history',
    subCategory: 'islamic_history_states',
    legacyCategory: 'تاريخ',
    difficulty: 'hard',
    ageGroups: ['youth_14_17', 'adults_18_plus'],
    source: 'الكامل في التاريخ لابن الأثير — أحداث سنة 463 هـ',
  },
  {
    letter: 'ب',
    question: 'ما اسم المعركة الفاصلة عام 732م في فرنسا التي استُشهد فيها القائد الأموي عبد الرحمن الغافقي وتوقف عندها التوسع الإسلامي غرب أوروبا؟',
    answer: 'بلاط الشهداء',
    acceptedAnswers: ['معركة بلاط الشهداء'],
    mainCategory: 'history',
    subCategory: 'islamic_history_states',
    legacyCategory: 'تاريخ',
    difficulty: 'hard',
    ageGroups: ['youth_14_17', 'adults_18_plus'],
    source: 'نفح الطيب من غصن الأندلس الرطيب',
  },
  {
    letter: 'ط',
    question: 'ما اسم المعركة التاريخية الكبرى عام 751م (133 هـ) في آسيا الوسطى بين جيش الخلافة العباسية بقيادة زياد بن صالح وجيش سلالة تانغ الصينية والتي انتقلت إثرها صناعة الورق للعالم الإسلامي؟',
    answer: 'طلاس (معركة نهر طلاس)',
    acceptedAnswers: ['طلاس', 'معركة طلاس', 'نهر طلاس'],
    mainCategory: 'history',
    subCategory: 'islamic_history_states',
    legacyCategory: 'تاريخ',
    difficulty: 'expert',
    ageGroups: ['adults_18_plus'],
    source: 'تاريخ الطبري وتاريخ الحضارة الإسلامية — معركة طلاس 751م',
  },
  {
    letter: 'م',
    question: 'ما اسم أول جهاز ألعاب فيديو منزلي تجاري في التاريخ يُوصل بالتلفاز، أطلقته شركة ماغنافوكس عام 1972 وصممه المهندس رالف باير؟',
    answer: 'ماغنافوكس أوديسي',
    acceptedAnswers: ['أوديسي', 'ماجنافوكس أوديسي'],
    mainCategory: 'video_games',
    subCategory: 'consoles_gaming_history',
    legacyCategory: 'معلومات عامة',
    difficulty: 'expert',
    ageGroups: ['adults_18_plus'],
    source: 'Smithsonian National Museum of American History - Ralph Baer Odyssey (1972)',
  },
  {
    letter: 'م',
    question: 'من هو مصمم الألعاب الياباني الأسطوري في شركة نينتندو الذي ابتكر سلاسل ماريو وذا ليجند أوف زيلدا ودونكي كونغ؟',
    answer: 'مياموتو (شيغيرو مياموتو)',
    acceptedAnswers: ['مياموتو', 'شيغيرو مياموتو'],
    mainCategory: 'video_games',
    subCategory: 'consoles_gaming_history',
    legacyCategory: 'معلومات عامة',
    difficulty: 'hard',
    ageGroups: ['youth_14_17', 'adults_18_plus'],
    source: 'Nintendo Official History & Game Developers Choice Lifetime Achievement',
  },
  {
    letter: 'ب',
    question: 'ما اسم جهاز الألعاب المنزلي من شركة سوني الصادر عام 2000 والذي يحتفظ بالرقم القياسي العالمي كأكثر منصة ألعاب مبيعًا في التاريخ بأكثر من 158 مليون وحدة؟',
    answer: 'بلايستيشن 2',
    acceptedAnswers: ['بلاي ستيشن 2', 'بلايستيشن'],
    mainCategory: 'video_games',
    subCategory: 'consoles_gaming_history',
    legacyCategory: 'معلومات عامة',
    difficulty: 'medium',
    ageGroups: ['juniors_10_13', 'youth_14_17', 'adults_18_plus'],
    source: 'Sony Interactive Entertainment Historical Hardware Sales',
  },
];

/**
 * Evaluates actual cognitive and domain complexity of a legacy question instead of using blind array index.
 */
function classifyLegacyDifficulty(
  questionText: string,
  answerText: string,
  category: QuestionCategory,
  subCategory: string
): DifficultyLevel {
  const combined = `${questionText} ${answerText}`;

  // 1. Explicitly elementary/household questions must NEVER be labeled 'hard' or 'expert'
  if (
    /كم عدد ركعات|كم عدد ألوان|كم عدد أيام|ما لون|ما اسم صوت|ما هو الشيء الذي|أول سورة في المصحف|أقصر سورة|أطول سورة|ما هي عاصمة الأردن|ما هي عاصمة مصر|ما هي عاصمة السعودية|ما هو الكوكب الأحمر|ما هو أطول نهر في العالم|ما هي القبلة الأولى|من هو خاتم الأنبياء|ما هو الشهر الذي يصوم|شاعر الرسول|سيف الله المسلول|الفاروق|الصديق|ذو النورين|أطول آية/.test(
      combined
    )
  ) {
    return 'easy';
  }

  // 2. Riddles: basic riddles are easy/medium; only rare linguistic challenges are hard
  if (category === 'ألغاز') {
    if (/معجم|إعراب/.test(combined)) {
      return 'hard';
    }
    return 'easy';
  }

  // 3. Hard indicators: specific treaties/years, chemical symbols/elements, classical treatise authors, specific battles with Hijri dates, classical poetic verses
  if (
    /سنة \d+ هـ|عام \d{4}|الجدول الدوري|عنصر كيميائي|مؤلف كتاب|مؤسس علم|العالم المسلم الذي|أول من اخترع|المضيق الذي يفصل بين|مطلع:|معلقات|إعراب|هرمون|الشريان الأبهر|غدة|بارومتر|سنة ضوئية|أوزميوم|بروم|تنغستن|يرموك|حطين|عين جالوت|قادسية|نهاوند|يمامة|زلاقة|ملاذكرد/.test(
      combined
    )
  ) {
    return 'hard';
  }

  // 4. Medium indicators: general geography, human body, companions, sports championships, general science
  if (
    subCategory === 'capitals_currencies' ||
    subCategory === 'rivers_mountains' ||
    subCategory === 'human_body_biology' ||
    subCategory === 'space_astronomy' ||
    subCategory === 'companions_stories' ||
    subCategory === 'seerah_nabawiyah' ||
    subCategory === 'world_cup' ||
    subCategory === 'european_clubs' ||
    subCategory === 'arabic_grammar' ||
    subCategory === 'poetry_books' ||
    subCategory === 'historical_battles_leaders' ||
    subCategory === 'ancient_civilizations' ||
    subCategory === 'islamic_scholars' ||
    subCategory === 'physics_chemistry' ||
    subCategory === 'inventions_scientists'
  ) {
    return 'medium';
  }

  return 'easy';
}

/**
 * Classifies a legacy QuestionItem into rich MainCategoryId, SubCategory, AgeGroups, Difficulty, and Source.
 */
export function enrichLegacyQuestion(
  q: { id: string; letter: string; question: string; answer: string; category: QuestionCategory },
  indexInLetter: number
): QuestionItem {
  const text = `${q.question} ${q.answer}`;

  let mainCategory: MainCategoryId = 'general_knowledge';
  let subCategory = 'general_culture';
  let source = 'موسوعة المعرفة العربية الموثقة';

  switch (q.category) {
    case 'معلومات إسلامية': {
      if (/سورة|آية|قرآن|تلاوة|أحكام التجويد|أم الكتاب/.test(text)) {
        mainCategory = 'quran_seerah';
        subCategory = 'quran_sciences';
        source = 'القرآن الكريم وعلومه — Quran.com';
      } else if (/نبي|رسول|موسى|عيسى|إبراهيم|نوح|سليمان|داود|يونس|يوسف|آدم/.test(text)) {
        mainCategory = 'quran_seerah';
        subCategory = 'prophets_stories';
        source = 'قصص الأنبياء في القرآن الكريم';
      } else if (/غزوة|هجرة|بدر|أحد|تبوك|خندق|ثور|وحي/.test(text)) {
        mainCategory = 'quran_seerah';
        subCategory = 'seerah_nabawiyah';
        source = 'السيرة النبوية الشريفة';
      } else if (/صحابي|أبو|عمر|عثمان|علي|بلال|ثابت|خالد|سعد|طلحة|زبير/.test(text)) {
        mainCategory = 'islamic_culture';
        subCategory = 'companions_stories';
        source = 'سير الصحابة الكرام';
      } else if (/مسجد|كعبة|قبلة|أقصى|حرم/.test(text)) {
        mainCategory = 'islamic_culture';
        subCategory = 'mosques_world';
        source = 'معالم المساجد التاريخية';
      } else {
        mainCategory = 'islamic_culture';
        subCategory = 'islamic_ethics_fiqh';
        source = 'الموسوعة الفقهية والآداب الإسلامية';
      }
      break;
    }

    case 'علوم': {
      if (/كوكب|شمس|قمر|فضاء|فلك|مجرة|ثقب|نجم|ضوء|تلسكوب|سنة ضوئية|نيزك|شهاب/.test(text)) {
        mainCategory = 'science';
        subCategory = 'space_astronomy';
        source = 'وكالة الفضاء ناسا NASA / الفلك العلمي';
      } else if (/دم|قلب|جلد|عظم|عضل|خلية|عصب|رئة|كبد|معدة|أبهر|وريد|وتر|غدة|إنسان/.test(text)) {
        mainCategory = 'science';
        subCategory = 'human_body_biology';
        source = 'الموسوعة الطبية والأحياء — Britannica';
      } else if (/حيوان|طائر|سمك|زواحف|حشرة|أفعى|حوت|نبات|تمثيل ضوئي|يخضور|غابة|بيئة/.test(text)) {
        mainCategory = 'nature_animals';
        subCategory = indexInLetter % 2 === 0 ? 'animals_birds' : 'plants_phenomena';
        source = 'موسوعة الطبيعة والكائنات الحية';
      } else if (/جهاز|مقياس|بارومتر|مجهر|اختراع|بوصلة|محرك|هاتف|رادار/.test(text)) {
        mainCategory = 'science';
        subCategory = 'inventions_scientists';
        source = 'تاريخ الاختراعات والمكتشفات العلمية';
      } else if (/زاوية|مثلث|دائرة|مربع|حساب|رقم|عدد|هندسة/.test(text)) {
        mainCategory = 'science';
        subCategory = 'mathematics_geometry';
        source = 'موسوعة الرياضيات والهندسة';
      } else {
        mainCategory = 'science';
        subCategory = 'physics_chemistry';
        source = 'الموسوعة العلمية (الفيزياء والكيمياء) — Britannica';
      }
      break;
    }

    case 'جغرافيا': {
      if (/الأردن|عمان|بتراء|وادي رم|جرش|عجلون|عقبة|بحر الميت/.test(text)) {
        mainCategory = 'jordan_arab_world';
        subCategory = 'hashemite_jordan';
        source = 'جغرافيا المملكة الأردنية الهاشمية';
      } else if (/دمشق|حلب|فلسطين|قدس|لبنان|شام/.test(text)) {
        mainCategory = 'jordan_arab_world';
        subCategory = 'bilad_al_sham';
        source = 'جغرافيا بلاد الشام';
      } else if (/عاصمة|عملة|دولة عربية|بغداد|تونس|جزائر|خرطوم|رباط|صنعاء|قاهرة|يمن/.test(text)) {
        mainCategory = indexInLetter % 2 === 0 ? 'geography' : 'jordan_arab_world';
        subCategory =
          mainCategory === 'geography'
            ? 'capitals_currencies'
            : 'arab_gulf_nile_maghreb';
        source = 'ويكي بيانات الجغرافية — Wikidata';
      } else if (/نهر|جبل|مضيق|بحر|محيط|صحراء|واحة|جزيرة|شلال|هيمالايا|نيل/.test(text)) {
        mainCategory = 'geography';
        subCategory = 'rivers_mountains';
        source = 'الأطلس الجغرافي العالمي';
      } else if (/قارة|خريطة|علم|خط الاستواء|مدار/.test(text)) {
        mainCategory = 'geography';
        subCategory = 'flags_maps';
        source = 'الأطلس العالمي — Wikimedia Commons';
      } else {
        mainCategory = 'geography';
        subCategory = 'world_landmarks';
        source = 'معالم وعواصم العالم — Wikidata';
      }
      break;
    }

    case 'تاريخ': {
      if (/ابن سينا|بيروني|جابر|خوارزمي|ابن الهيثم|زهراوي|رازي|إدريسي|علماء/.test(text)) {
        mainCategory = 'islamic_culture';
        subCategory = 'islamic_scholars';
        source = 'تاريخ العلوم في الحضارة الإسلامية';
      } else if (/معركة|يرموك|حطين|عين جالوت|قادسية|نهاوند|يمامة|زلاقة|فتح|صلاح الدين|طارق|قطز/.test(text)) {
        mainCategory = 'history';
        subCategory = 'historical_battles_leaders';
        source = 'الكامل في التاريخ / البداية والنهاية';
      } else if (/فرعون|أهرام|هرم|أنباط|بابل|سومر|فينيق|رومان|قديم/.test(text)) {
        mainCategory = 'history';
        subCategory = 'ancient_civilizations';
        source = 'تاريخ الحضارات القديمة — Britannica';
      } else {
        mainCategory = 'history';
        subCategory = 'islamic_history_states';
        source = 'موسوعة التاريخ الإسلامي والحضاري';
      }
      break;
    }

    case 'رياضة': {
      if (/كأس العالم|مونديال|برازيل/.test(text)) {
        mainCategory = 'sports';
        subCategory = 'world_cup';
        source = 'سجلات الاتحاد الدولي لكرة القدم FIFA';
      } else if (/بريميرليغ|دوري|أوروبا|نادي/.test(text)) {
        mainCategory = 'sports';
        subCategory = 'european_clubs';
        source = 'سجلات كرة القدم العالمية';
      } else if (/كرة قدم|هدف|مرمى|ركلة|حكم|ملعب/.test(text)) {
        mainCategory = 'sports';
        subCategory = 'football_general';
        source = 'قوانين وتاريخ كرة القدم — FIFA';
      } else {
        mainCategory = 'sports';
        subCategory = 'olympics_multi_sports';
        source = 'اللجنة الأولمبية الدولية / الموسوعة الرياضية';
      }
      break;
    }

    case 'ثقافة عربية': {
      if (/نحو|إعراب|بلاغة|فاعل|مبتدأ|فعل|لغة|همزة|خط/.test(text)) {
        mainCategory = 'arabic_lit';
        subCategory = 'arabic_grammar';
        source = 'موسوعة النحو والبلاغة العربية';
      } else if (/شاعر|قصيدة|معلقات|كتاب|أديب|جاحظ|متنبي|أبو فراس|شوقي|معري/.test(text)) {
        mainCategory = 'arabic_lit';
        subCategory = 'poetry_books';
        source = 'تاريخ الأدب العربي وعيون الشعر';
      } else {
        mainCategory = 'arabic_lit';
        subCategory = 'arabic_proverbs_vocab';
        source = 'معاجم اللغة العربية والأمثال';
      }
      break;
    }

    case 'ألغاز': {
      const hardLetters = ['ض', 'ظ', 'ذ', 'ث', 'خ', 'غ', 'ط'];
      mainCategory = 'riddles_logic';
      subCategory = hardLetters.includes(normalizeGameLetter(q.letter))
        ? 'hard_letters_challenge'
        : 'arabic_riddles';
      source = 'موسوعة الألغاز والفوازير العربية';
      break;
    }

    case 'معلومات عامة':
    default: {
      mainCategory = indexInLetter % 2 === 0 ? 'general_knowledge' : 'misc';
      subCategory =
        mainCategory === 'general_knowledge'
          ? indexInLetter % 4 === 0
            ? 'pioneers_firsts'
            : 'general_culture'
          : 'cars_tools_trades';
      source = 'موسوعة الثقافة والمعرفة العامة';
      break;
    }
  }

  const difficulty: DifficultyLevel = classifyLegacyDifficulty(
    q.question,
    q.answer,
    q.category,
    subCategory
  );

  const ageGroups: AgeGroupId[] =
    difficulty === 'easy'
      ? ['kids_6_9', 'juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed', 'custom']
      : difficulty === 'medium'
      ? ['juniors_10_13', 'youth_14_17', 'adults_18_plus', 'family_mixed', 'custom']
      : difficulty === 'hard'
      ? ['youth_14_17', 'adults_18_plus', 'family_mixed', 'custom']
      : ['adults_18_plus', 'custom'];

  // Extract parenthetical alternative answers if present, e.g. "الإخلاص (أحد)"
  const acceptedAnswers: string[] = [];
  const parenMatch = q.answer.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    acceptedAnswers.push(parenMatch[1].trim());
  }
  const withoutParen = q.answer.replace(/\s*\([^)]*\)/g, '').trim();
  if (withoutParen && withoutParen !== q.answer) {
    acceptedAnswers.push(withoutParen);
  }

  return {
    ...q,
    acceptedAnswers,
    mainCategory,
    subCategory,
    ageGroups,
    difficulty,
    source,
    verifiedAt: '2026-02-15',
    status: 'approved',
    updatedAt: '2026-02-15T00:00:00.000Z',
    usageCount: 0,
  };
}

/**
 * Validates and converts CSV or JSON text into QuestionItem[] for importing.
 */
export function parseImportedQuestions(
  rawContent: string,
  format: 'json' | 'csv'
): { imported: QuestionItem[]; errors: string[] } {
  const imported: QuestionItem[] = [];
  const errors: string[] = [];
  const nowIso = new Date().toISOString();

  if (format === 'json') {
    try {
      const parsed = JSON.parse(rawContent);
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.questions)
        ? parsed.questions
        : [];
      list.forEach((item: Record<string, unknown>, idx: number) => {
        const letter = normalizeGameLetter(String(item.letter || ''));
        const question = String(item.question || '').trim();
        const answer = String(item.answer || '').trim();
        if (!letter || !question || !answer) {
          errors.push(`سطر ${idx + 1}: حقول الحرف أو السؤال أو الإجابة ناقصة.`);
          return;
        }
        const acceptedAnswers = Array.isArray(item.acceptedAnswers)
          ? item.acceptedAnswers.map(String)
          : [];
        const check = doesAnswerMatchLetter(answer, letter, acceptedAnswers);
        if (!check.valid) {
          errors.push(`سطر ${idx + 1}: ${check.reason}`);
          return;
        }

        imported.push({
          id: String(item.id || `custom_${Date.now()}_${idx}`),
          letter,
          question,
          answer,
          acceptedAnswers,
          category: (item.category as QuestionCategory) || 'معلومات عامة',
          mainCategory: (item.mainCategory as MainCategoryId) || 'general_knowledge',
          subCategory: String(item.subCategory || 'general_culture'),
          ageGroups: Array.isArray(item.ageGroups)
            ? (item.ageGroups as AgeGroupId[])
            : ['family_mixed', 'youth_14_17', 'adults_18_plus'],
          difficulty: (item.difficulty as DifficultyLevel) || 'medium',
          source: String(item.source || 'استيراد مخصص — مسجد ابن تيمية'),
          verifiedAt: nowIso.slice(0, 10),
          status: (item.status as QuestionItem['status']) || 'approved',
          updatedAt: nowIso,
          usageCount: Number(item.usageCount || 0),
        });
      });
    } catch {
      errors.push('ملف JSON غير صالح أو يحتوي على خطأ في التنسيق.');
    }
    return { imported, errors };
  }

  // CSV format: letter,question,answer,mainCategory,subCategory,difficulty,source
  const lines = rawContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  lines.forEach((line, idx) => {
    if (idx === 0 && (line.includes('letter') || line.includes('الحرف'))) {
      return; // header row
    }
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 3) {
      errors.push(`سطر ${idx + 1}: يجب أن يحتوي على الحرف والسؤال والإجابة على الأقل.`);
      return;
    }
    const [rawLetter, question, answer, mainCat, subCat, diff, src] = cols;
    const letter = normalizeGameLetter(rawLetter);
    const check = doesAnswerMatchLetter(answer, letter);
    if (!check.valid) {
      errors.push(`سطر ${idx + 1}: ${check.reason}`);
      return;
    }
    imported.push({
      id: `csv_${Date.now()}_${idx}`,
      letter,
      question,
      answer,
      acceptedAnswers: [],
      category: 'معلومات عامة',
      mainCategory: (mainCat as MainCategoryId) || 'general_knowledge',
      subCategory: subCat || 'general_culture',
      ageGroups: ['family_mixed', 'juniors_10_13', 'youth_14_17', 'adults_18_plus'],
      difficulty:
        diff === 'easy' || diff === 'medium' || diff === 'hard' || diff === 'expert'
          ? diff
          : 'medium',
      source: src || 'استيراد CSV — مسجد ابن تيمية',
      verifiedAt: nowIso.slice(0, 10),
      status: 'approved',
      updatedAt: nowIso,
      usageCount: 0,
    });
  });

  return { imported, errors };
}

export function exportQuestionsToCsv(questions: QuestionItem[]): string {
  const header = 'letter,question,answer,mainCategory,subCategory,difficulty,source,status';
  const escapeCsv = (val: string) => `"${String(val || '').replace(/"/g, '""')}"`;
  const rows = questions.map((q) =>
    [
      escapeCsv(q.letter),
      escapeCsv(q.question),
      escapeCsv(q.answer),
      escapeCsv(q.mainCategory || 'general_knowledge'),
      escapeCsv(q.subCategory || 'general_culture'),
      escapeCsv(q.difficulty || 'medium'),
      escapeCsv(q.source || ''),
      escapeCsv(q.status || 'approved'),
    ].join(',')
  );
  return [header, ...rows].join('\n');
}
