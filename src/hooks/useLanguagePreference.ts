import { useState, useEffect } from 'react';
import { Language } from '@/lib/translations';

export function useLanguagePreference() {
  const [language, setLanguage] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('preferredLanguage') as Language | null;
    if (saved) {
      setLanguage(saved);
    }
    setIsLoaded(true);
  }, []);

  const updateLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  return { language, updateLanguage, isLoaded };
}
