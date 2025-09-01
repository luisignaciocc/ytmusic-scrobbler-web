/**
 * Comprehensive multilingual date detection for YouTube Music playedAt values
 */

export interface DateDetectionResult {
  isToday: boolean;
  isYesterday: boolean;
  detectedLanguage?: string;
  originalValue: string;
}

// Comprehensive list of "Today" translations
const TODAY_TRANSLATIONS = new Map([
  // Latin script
  ['Today', 'en'],           // English
  ['Hoy', 'es'],            // Spanish
  ['Hoje', 'pt'],           // Portuguese
  ['Oggi', 'it'],           // Italian
  ['Aujourd\'hui', 'fr'],   // French
  ['Heute', 'de'],          // German
  ['Vandaag', 'nl'],        // Dutch
  ['Idag', 'sv'],           // Swedish
  ['I dag', 'no'],          // Norwegian
  ['I dag', 'da'],          // Danish (same as Norwegian)
  ['Tänään', 'fi'],         // Finnish
  ['Ma', 'et'],             // Estonian
  ['Šodien', 'lv'],         // Latvian
  ['Šiandien', 'lt'],       // Lithuanian
  ['Dzisiaj', 'pl'],        // Polish
  ['Dnes', 'cs'],           // Czech
  ['Dnes', 'sk'],           // Slovak
  ['Danes', 'sl'],          // Slovenian
  ['Astăzi', 'ro'],         // Romanian
  ['Ma', 'hu'],             // Hungarian
  ['Täna', 'et'],           // Estonian (alternative)
  ['Bugün', 'tr'],          // Turkish
  ['Σήμερα', 'el'],         // Greek
  ['Днес', 'bg'],           // Bulgarian
  ['Данас', 'sr'],          // Serbian
  ['Danas', 'hr'],          // Croatian
  ['Данеска', 'mk'],        // Macedonian
  
  // Cyrillic script
  ['Сегодня', 'ru'],        // Russian
  ['Сьогодні', 'uk'],       // Ukrainian
  ['Сёння', 'be'],          // Belarusian
  
  // Arabic script
  ['اليوم', 'ar'],           // Arabic
  ['امروز', 'fa'],          // Persian/Farsi
  ['آج', 'ur'],             // Urdu
  
  // CJK scripts
  ['今天', 'zh'],            // Chinese Simplified
  ['今日', 'ja'],            // Japanese
  ['오늘', 'ko'],            // Korean
  ['今日', 'zh-hant'],       // Chinese Traditional
  
  // Indic scripts
  ['आज', 'hi'],             // Hindi
  ['আজ', 'bn'],             // Bengali
  ['આજે', 'gu'],            // Gujarati
  ['இன்று', 'ta'],         // Tamil
  ['ఈ రోజు', 'te'],         // Telugu
  ['ಇಂದು', 'kn'],           // Kannada
  ['ഇന്ന്', 'ml'],          // Malayalam
  ['ਅੱਜ', 'pa'],            // Punjabi
  ['આજે', 'gu'],            // Gujarati
  
  // Southeast Asian
  ['วันนี้', 'th'],          // Thai
  ['Hôm nay', 'vi'],        // Vietnamese
  ['Hari ini', 'id'],       // Indonesian
  ['Hari ini', 'ms'],       // Malay
  ['Ngayong araw', 'tl'],   // Filipino/Tagalog
  ['ယနေ့', 'my'],           // Burmese/Myanmar
  
  // African languages
  ['Leo', 'sw'],            // Swahili
  ['Vandag', 'af'],         // Afrikaans
  
  // Other scripts
  ['היום', 'he'],           // Hebrew
  ['დღეს', 'ka'],           // Georgian
  ['այսօր', 'hy'],          // Armenian
]);

// Comprehensive list of "Yesterday" translations
const YESTERDAY_TRANSLATIONS = new Map([
  // Latin script
  ['Yesterday', 'en'],       // English
  ['Ayer', 'es'],           // Spanish
  ['Ontem', 'pt'],          // Portuguese
  ['Ieri', 'it'],           // Italian
  ['Hier', 'fr'],           // French
  ['Gestern', 'de'],        // German
  ['Gisteren', 'nl'],       // Dutch
  ['Igår', 'sv'],           // Swedish
  ['I går', 'no'],          // Norwegian
  ['I går', 'da'],          // Danish
  ['Eilen', 'fi'],          // Finnish
  ['Wczoraj', 'pl'],        // Polish
  ['Včera', 'cs'],          // Czech
  ['Včera', 'sk'],          // Slovak
  ['Včeraj', 'sl'],         // Slovenian
  ['Ieri', 'ro'],           // Romanian
  ['Tegnap', 'hu'],         // Hungarian
  ['Dün', 'tr'],            // Turkish
  ['Χθες', 'el'],           // Greek
  ['Вчера', 'bg'],          // Bulgarian
  ['Јуче', 'sr'],           // Serbian
  ['Jučer', 'hr'],          // Croatian
  
  // Cyrillic script
  ['Вчера', 'ru'],          // Russian
  ['Вчора', 'uk'],          // Ukrainian
  ['Учора', 'be'],          // Belarusian
  
  // Arabic script
  ['أمس', 'ar'],            // Arabic
  ['دیروز', 'fa'],          // Persian/Farsi
  ['کل', 'ur'],             // Urdu
  
  // CJK scripts
  ['昨天', 'zh'],            // Chinese Simplified
  ['昨日', 'ja'],            // Japanese
  ['어제', 'ko'],            // Korean
  ['昨日', 'zh-hant'],       // Chinese Traditional
  
  // Indic scripts
  ['कल', 'hi'],             // Hindi (can mean yesterday or tomorrow, context dependent)
  ['গতকাল', 'bn'],          // Bengali
  ['ગઈકાલે', 'gu'],         // Gujarati
  ['நேற்று', 'ta'],        // Tamil
  ['నిన్న', 'te'],          // Telugu
  ['ನಿನ್ನೆ', 'kn'],         // Kannada
  ['ഇന്നലെ', 'ml'],         // Malayalam
  ['ਕੱਲ੍ਹ', 'pa'],          // Punjabi
  
  // Southeast Asian
  ['เมื่อวาน', 'th'],        // Thai
  ['Hôm qua', 'vi'],        // Vietnamese
  ['Kemarin', 'id'],        // Indonesian
  ['Semalam', 'ms'],        // Malay
  ['Kahapon', 'tl'],        // Filipino/Tagalog
  ['မနေ့က', 'my'],          // Burmese/Myanmar
  
  // African languages
  ['Jana', 'sw'],           // Swahili
  ['Gister', 'af'],         // Afrikaans
  
  // Other scripts
  ['אתמול', 'he'],          // Hebrew
  ['გუშინ', 'ka'],          // Georgian
  ['երեկ', 'hy'],           // Armenian
]);

export function detectDateValue(playedAt: string | null | undefined): DateDetectionResult {
  if (!playedAt) {
    return {
      isToday: false,
      isYesterday: false,
      originalValue: playedAt || '',
    };
  }

  const trimmed = playedAt.trim();
  
  // Check for today
  if (TODAY_TRANSLATIONS.has(trimmed)) {
    return {
      isToday: true,
      isYesterday: false,
      detectedLanguage: TODAY_TRANSLATIONS.get(trimmed),
      originalValue: trimmed,
    };
  }

  // Check for yesterday
  if (YESTERDAY_TRANSLATIONS.has(trimmed)) {
    return {
      isToday: false,
      isYesterday: true,
      detectedLanguage: YESTERDAY_TRANSLATIONS.get(trimmed),
      originalValue: trimmed,
    };
  }

  // No match found
  return {
    isToday: false,
    isYesterday: false,
    originalValue: trimmed,
  };
}

export function isTodaySong(playedAt: string | null | undefined): boolean {
  return detectDateValue(playedAt).isToday;
}

export function isYesterdaySong(playedAt: string | null | undefined): boolean {
  return detectDateValue(playedAt).isYesterday;
}

// Get all supported "today" values for debugging
export function getAllTodayVariants(): string[] {
  return Array.from(TODAY_TRANSLATIONS.keys());
}

// Get all supported "yesterday" values for debugging  
export function getAllYesterdayVariants(): string[] {
  return Array.from(YESTERDAY_TRANSLATIONS.keys());
}

// Get unknown values that should be logged for future expansion
export function getUnknownDateValues(songs: Array<{ playedAt?: string }>): string[] {
  const unknownValues: Set<string> = new Set();
  
  songs.forEach(song => {
    if (song.playedAt) {
      const result = detectDateValue(song.playedAt);
      if (!result.isToday && !result.isYesterday && song.playedAt.trim()) {
        unknownValues.add(song.playedAt.trim());
      }
    }
  });
  
  return Array.from(unknownValues);
}