import React from 'react';
import ThemeToggle from './ThemeToggle';
import { t, Language } from '../i18n';

interface HeaderProps {
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    language: Language;
    onLanguageChange: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme, language, onLanguageChange }) => {
  return (
    <header className="bg-white shadow-md dark:bg-gray-800 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
        <div className="flex items-center justify-center gap-4">
          <i className="fas fa-clipboard-list text-4xl text-blue-600"></i>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            {t('header.title')}
          </h1>
        </div>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          {t('header.description')}
        </p>
      </div>
      <div className="absolute top-5 start-5 flex items-center gap-2">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <button
          onClick={() => onLanguageChange(language === 'en' ? 'ar' : 'en')}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200 font-bold"
          aria-label={`Switch to ${language === 'en' ? 'Arabic' : 'English'}`}
        >
          {t('header.language')}
        </button>
      </div>
    </header>
  );
};

export default Header;