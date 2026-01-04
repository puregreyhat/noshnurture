'use client';

import { useState } from 'react';
import { Language, LANGUAGE_NAMES } from '@/lib/translations';
import { ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

export function LanguageSelector({
  currentLanguage,
  onLanguageChange,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const languages: Language[] = ['en', 'hi', 'mr', 'ta', 'te', 'kn', 'gu', 'bn'];

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 transition-colors"
      >
        <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
          {LANGUAGE_NAMES[currentLanguage]}
        </span>
        <ChevronDown
          size={16}
          className={`text-emerald-600 dark:text-emerald-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 rounded-lg shadow-lg z-50 min-w-[200px]">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                onLanguageChange(lang);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                currentLanguage === lang
                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-100 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
              }`}
            >
              {LANGUAGE_NAMES[lang]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
