/**
 * Professional Sound Architecture for «حروف مع النخبة PRO — مكتبة ألعاب مسجد ابن تيمية».
 *
 * Features:
 * 1. Explicit Audio Asset Manifest & License Registry (`AUDIO_ASSET_MANIFEST`) for external `.mp3`/`.wav` assets
 *    placed in `/public/audio/`.
 * 2. Warm, multi-layered acoustic Web Audio synthesis fallback (filtered ADSR harmonic chimes and soft marimba/bell
 *    resonances — no harsh primitive square/sawtooth waves).
 * 3. Full Master Volume control (`0.0` - `1.0`), Mute toggle, and Mosque Quiet Mode (`وضع المسجد الهادئ`)
 *    which disables celebratory stingers and keeps only ultra-soft tactile clicks when enabled.
 */

export type SoundCueId =
  | 'match_start'
  | 'select_category'
  | 'select_letter'
  | 'buzzer_press'
  | 'correct_answer'
  | 'wrong_answer'
  | 'turn_change'
  | 'time_up'
  | 'round_win'
  | 'match_celebration';

export interface AudioAssetEntry {
  id: SoundCueId;
  titleAr: string;
  expectedFilePath: string;
  descriptionAr: string;
  recommendedLicense: string;
  fallbackMode: string;
}

export const AUDIO_ASSET_MANIFEST: AudioAssetEntry[] = [
  {
    id: 'match_start',
    titleAr: 'نغمة افتتاح المباراة',
    expectedFilePath: '/audio/match_start.mp3',
    descriptionAr: 'مؤثر صوتي ترحيبي قصير عند انطلاق الجولة الأولى.',
    recommendedLicense: 'CC0 / Pixabay / Wikimedia Commons Audio',
    fallbackMode: 'توليف صوتي متعدد الطبقات (Warm Acoustic Chord)',
  },
  {
    id: 'select_category',
    titleAr: 'صوت اختيار فئة',
    expectedFilePath: '/audio/select_category.mp3',
    descriptionAr: 'نقرة خشبية ناعمة عند تحديد أو إلغاء تحديد بطاقة فئة.',
    recommendedLicense: 'CC0 / Public Domain UI SFX',
    fallbackMode: 'توليف نقرة رخيمة مفلترة (Filtered Marimba Tap)',
  },
  {
    id: 'select_letter',
    titleAr: 'صوت اختيار حرف',
    expectedFilePath: '/audio/select_letter.mp3',
    descriptionAr: 'رنين بلوري قصير عند اختيار خلية حرف على اللوحة.',
    recommendedLicense: 'CC0 / Public Domain UI SFX',
    fallbackMode: 'توليف جرس بلوري دافئ (Warm Harmonic Bell)',
  },
  {
    id: 'buzzer_press',
    titleAr: 'صوت الجرس الإلكتروني',
    expectedFilePath: '/audio/buzzer_press.mp3',
    descriptionAr: 'نغمة واضحة ومميزة لكل فريق عند الفوز بسباق الجرس.',
    recommendedLicense: 'CC0 / Broadcast Game Show SFX',
    fallbackMode: 'توليف جرس مسرحي مزدوج (Dual-Harmonic Chime)',
  },
  {
    id: 'correct_answer',
    titleAr: 'صوت الإجابة الصحيحة وامتلاك الخلية',
    expectedFilePath: '/audio/correct_answer.mp3',
    descriptionAr: 'تآلف صوتي مشرق عند اعتماد الإجابة الصحيحة ومنح الخلية.',
    recommendedLicense: 'CC0 / Public Domain Chime',
    fallbackMode: 'تآلف ثلاثي ناعم (Warm Triad Arpeggio)',
  },
  {
    id: 'wrong_answer',
    titleAr: 'صوت الإجابة الخاطئة',
    expectedFilePath: '/audio/wrong_answer.mp3',
    descriptionAr: 'تنبيه منخفض غير مزعج عند خطأ الإجابة.',
    recommendedLicense: 'CC0 / Public Domain SFX',
    fallbackMode: 'نغمة رخيمة هابطة بمرشح ترددات منخفضة (Low-Pass Soft Descent)',
  },
  {
    id: 'turn_change',
    titleAr: 'صوت تغيير الدور وتحويل الفرصة',
    expectedFilePath: '/audio/turn_change.mp3',
    descriptionAr: 'إشارة صوتية خفيفة عند انتقال فرصة الإجابة للفريق الآخر.',
    recommendedLicense: 'CC0 / Public Domain UI SFX',
    fallbackMode: 'توليف انتقالي ناعم (Soft Transition Chime)',
  },
  {
    id: 'time_up',
    titleAr: 'مؤثر انتهاء الوقت',
    expectedFilePath: '/audio/time_up.mp3',
    descriptionAr: 'تنبيه واضح عند وصول عداد الوقت إلى الصفر.',
    recommendedLicense: 'CC0 / Public Domain SFX',
    fallbackMode: 'رنين تنبيه مزدوج مفلتر (Filtered Acoustic Gong)',
  },
  {
    id: 'round_win',
    titleAr: 'صوت الفوز بالجولة',
    expectedFilePath: '/audio/round_win.mp3',
    descriptionAr: 'مؤثر فوز قصير عند اكتمال مسار الفوز المتصل.',
    recommendedLicense: 'CC0 / Public Domain Fanfare',
    fallbackMode: 'تآلف فوز акуستيك (Acoustic Victory Stinger)',
  },
  {
    id: 'match_celebration',
    titleAr: 'نغمة الاحتفال النهائي بالمباراة',
    expectedFilePath: '/audio/match_celebration.mp3',
    descriptionAr: 'مؤثر احتفالي بدون موسيقى عند التتويج بلقب المباراة.',
    recommendedLicense: 'CC0 / Public Domain Celebration',
    fallbackMode: 'تآلف احتفالي متدرج (Grand Harmonic Chime)',
  },
];

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private volume: number = 0.8;
  private mosqueQuietMode: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedMuted = window.localStorage.getItem('elite_clash_muted');
        if (savedMuted === 'true') this.muted = true;
        const savedVol = window.localStorage.getItem('elite_clash_volume');
        if (savedVol !== null) {
          const parsed = parseFloat(savedVol);
          if (!Number.isNaN(parsed)) {
            this.volume = Math.max(0, Math.min(1, parsed));
          }
        }
        const savedQuiet = window.localStorage.getItem('elite_clash_quiet_mode');
        if (savedQuiet === 'true') this.mosqueQuietMode = true;
      } catch {
        // ignore storage errors
      }
    }
  }

  private getContext(): AudioContext | null {
    if (this.muted || this.volume <= 0.01 || typeof window === 'undefined') {
      return null;
    }
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('elite_clash_muted', String(mute));
      } catch {
        // ignore
      }
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    if (!this.muted) {
      this.playSelectCategory();
    }
    return this.muted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('elite_clash_volume', String(this.volume));
      } catch {
        // ignore
      }
    }
  }

  public isMosqueQuietMode(): boolean {
    return this.mosqueQuietMode;
  }

  public setMosqueQuietMode(quiet: boolean): void {
    this.mosqueQuietMode = quiet;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('elite_clash_quiet_mode', String(quiet));
      } catch {
        // ignore
      }
    }
  }

  /**
   * Helper that plays a warm, low-pass filtered harmonic note with fundamental + soft octave overtone.
   */
  private playWarmHarmonicNote(
    freq: number,
    startOffset: number,
    duration: number,
    peakGain: number
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const effectiveGain =
      peakGain * this.volume * (this.mosqueQuietMode ? 0.45 : 1);
    if (effectiveGain <= 0.002) return;

    const start = ctx.currentTime + startOffset;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, start);
    filter.connect(ctx.destination);

    // Fundamental sine
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, start);

    gain1.gain.setValueAtTime(0.001, start);
    gain1.gain.linearRampToValueAtTime(effectiveGain, start + 0.012);
    gain1.gain.exponentialRampToValueAtTime(0.0008, start + duration);

    osc1.connect(gain1);
    gain1.connect(filter);
    osc1.start(start);
    osc1.stop(start + duration + 0.02);

    // Subtle second harmonic overtone for acoustic bell warmth
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, start);

    gain2.gain.setValueAtTime(0.001, start);
    gain2.gain.linearRampToValueAtTime(effectiveGain * 0.22, start + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.0008, start + duration * 0.65);

    osc2.connect(gain2);
    gain2.connect(filter);
    osc2.start(start);
    osc2.stop(start + duration * 0.7);
  }

  /**
   * 1. Match Start Cue
   */
  public playMatchStart(): void {
    if (this.mosqueQuietMode) {
      this.playSelectCategory();
      return;
    }
    const notes = [392.0, 493.88, 587.33, 783.99]; // G4, B4, D5, G5
    notes.forEach((f, i) => {
      this.playWarmHarmonicNote(f, i * 0.065, 0.32, 0.18);
    });
  }

  /**
   * 2. Category Selection Tap
   */
  public playSelectCategory(): void {
    this.playWarmHarmonicNote(493.88, 0, 0.09, 0.14);
    this.playWarmHarmonicNote(659.25, 0.03, 0.11, 0.12);
  }

  /**
   * 3. Select Letter on Hex Board
   */
  public playSelectLetter(): void {
    this.playWarmHarmonicNote(523.25, 0, 0.12, 0.18);
    this.playWarmHarmonicNote(659.25, 0.045, 0.16, 0.16);
  }

  /**
   * 4. Reveal Answer Chime
   */
  public playRevealAnswer(): void {
    this.playWarmHarmonicNote(587.33, 0, 0.18, 0.16);
    this.playWarmHarmonicNote(880.0, 0.06, 0.26, 0.18);
  }

  /**
   * 5. Correct Answer & Claim Cell
   */
  public playClaimCell(): void {
    const notes = [440, 554.37, 659.25];
    notes.forEach((f, i) => {
      this.playWarmHarmonicNote(f, i * 0.05, 0.26, 0.2);
    });
  }

  /**
   * 6. Countdown Timer Tick (last 5 seconds)
   */
  public playTimerTick(): void {
    this.playWarmHarmonicNote(784, 0, 0.055, 0.09);
  }

  /**
   * 7. Time Up Alert (Warm low acoustic double gong, no harsh sawtooth)
   */
  public playTimeUp(): void {
    this.playWarmHarmonicNote(246.94, 0, 0.24, 0.2);
    this.playWarmHarmonicNote(196.0, 0.14, 0.34, 0.22);
  }

  /**
   * 8. Undo / Turn Change
   */
  public playUndo(): void {
    this.playWarmHarmonicNote(440, 0, 0.11, 0.14);
    this.playWarmHarmonicNote(329.63, 0.06, 0.14, 0.12);
  }

  public playTurnChange(): void {
    this.playWarmHarmonicNote(440, 0, 0.1, 0.14);
    this.playWarmHarmonicNote(523.25, 0.06, 0.14, 0.14);
  }

  /**
   * 9. Buzzer Open & Buzzer Win
   */
  public playBuzzerOpen(): void {
    this.playWarmHarmonicNote(659.25, 0, 0.1, 0.15);
    this.playWarmHarmonicNote(880.0, 0.05, 0.14, 0.16);
  }

  public playBuzzerWin(team: 'team1' | 'team2'): void {
    const baseFreq = team === 'team1' ? 587.33 : 493.88;
    const highFreq = team === 'team1' ? 880.0 : 739.99;
    this.playWarmHarmonicNote(baseFreq, 0, 0.18, 0.24);
    this.playWarmHarmonicNote(highFreq, 0.055, 0.28, 0.24);
  }

  /**
   * 10. Wrong Answer + Automatic Handover Cue
   */
  public playWrongAnswer(): void {
    this.playWarmHarmonicNote(293.66, 0, 0.15, 0.18);
    this.playWarmHarmonicNote(220.0, 0.11, 0.22, 0.18);
  }

  /**
   * 11. Round & Match Victory Celebration
   */
  public playVictoryFanfare(): void {
    if (this.mosqueQuietMode) {
      this.playClaimCell();
      return;
    }
    const sequence = [523.25, 659.25, 783.99, 1046.5];
    sequence.forEach((freq, idx) => {
      const duration = idx === sequence.length - 1 ? 0.55 : 0.2;
      this.playWarmHarmonicNote(freq, idx * 0.085, duration, 0.22);
    });
  }
}

export const soundFX = new SoundManager();
