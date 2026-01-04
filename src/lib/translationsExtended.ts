// Extended language support for LibreTranslate
// LibreTranslate supports 30+ languages through its public API
// This file documents all supported languages

export type LanguageExtended = 
  // Indian languages (original 8)
  | 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'kn' | 'gu' | 'bn'
  // South Asian languages
  | 'ur' | 'pa' | 'ml'
  // European languages
  | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'nl' | 'pl' | 'ru' | 'uk' | 'el' | 'cs' | 'ro'
  // East Asian languages
  | 'ja' | 'ko' | 'zh' | 'vi' | 'th'
  // Middle Eastern
  | 'ar' | 'tr' | 'fa' | 'he';

export const LANGUAGE_NAMES_EXTENDED: Record<LanguageExtended, string> = {
  // Indian Languages
  en: '🇬🇧 English',
  hi: '🇮🇳 हिंदी (Hindi)',
  mr: '🇮🇳 मराठी (Marathi)',
  ta: '🇮🇳 தமிழ் (Tamil)',
  te: '🇮🇳 తెలుగు (Telugu)',
  kn: '🇮🇳 ಕನ್ನಡ (Kannada)',
  gu: '🇮🇳 ગુજરાતી (Gujarati)',
  bn: '🇮🇳 বাংলা (Bengali)',
  
  // South Asian Languages
  ur: '🇵🇰 اردو (Urdu)',
  pa: '🇮🇳 ਪੰਜਾਬੀ (Punjabi)',
  ml: '🇮🇳 മലയാളം (Malayalam)',
  
  // European Languages
  es: '🇪🇸 Español (Spanish)',
  fr: '🇫🇷 Français (French)',
  de: '🇩🇪 Deutsch (German)',
  it: '🇮🇹 Italiano (Italian)',
  pt: '🇵🇹 Português (Portuguese)',
  nl: '🇳🇱 Nederlands (Dutch)',
  pl: '🇵🇱 Polski (Polish)',
  ru: '🇷🇺 Русский (Russian)',
  uk: '🇺🇦 Українська (Ukrainian)',
  el: '🇬🇷 Ελληνικά (Greek)',
  cs: '🇨🇿 Čeština (Czech)',
  ro: '🇷🇴 Română (Romanian)',
  
  // East Asian Languages
  ja: '🇯🇵 日本語 (Japanese)',
  ko: '🇰🇷 한국어 (Korean)',
  zh: '🇨🇳 中文 (Chinese)',
  vi: '🇻🇳 Tiếng Việt (Vietnamese)',
  th: '🇹🇭 ไทย (Thai)',
  
  // Middle Eastern Languages
  ar: '🇸🇦 العربية (Arabic)',
  tr: '🇹🇷 Türkçe (Turkish)',
  fa: '🇮🇷 فارسی (Persian)',
  he: '🇮🇱 עברית (Hebrew)',
};

// LibreTranslate supported language codes
// Full list of 30+ languages that LibreTranslate supports
export const LIBRETRANSLATE_CODES_EXTENDED: Record<LanguageExtended, string> = {
  en: 'en',
  hi: 'hi',
  mr: 'mr',
  ta: 'ta',
  te: 'te',
  kn: 'kn',
  gu: 'gu',
  bn: 'bn',
  ur: 'ur',
  pa: 'pa',
  ml: 'ml',
  es: 'es',
  fr: 'fr',
  de: 'de',
  it: 'it',
  pt: 'pt',
  nl: 'nl',
  pl: 'pl',
  ru: 'ru',
  uk: 'uk',
  el: 'el',
  cs: 'cs',
  ro: 'ro',
  ja: 'ja',
  ko: 'ko',
  zh: 'zh',
  vi: 'vi',
  th: 'th',
  ar: 'ar',
  tr: 'tr',
  fa: 'fa',
  he: 'he',
};

// Summary of LibreTranslate language support
export const LIBRETRANSLATE_INFO = {
  baseUrl: 'https://api.libretranslate.de',
  totalLanguages: 32,
  freeApi: true,
  noAuthRequired: true,
  rateLimit: 'Generous (depends on usage)',
  supportedLanguages: [
    'English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Gujarati', 'Bengali',
    'Urdu', 'Punjabi', 'Malayalam',
    'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Polish', 'Russian', 'Ukrainian',
    'Greek', 'Czech', 'Romanian',
    'Japanese', 'Korean', 'Chinese', 'Vietnamese', 'Thai',
    'Arabic', 'Turkish', 'Persian', 'Hebrew'
  ],
} as const;
