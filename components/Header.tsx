
import React from 'react';
import ThemeToggle from './ThemeToggle';
import { t, Language } from '../i18n';

interface HeaderProps {
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    language: Language;
    onLanguageChange: (lang: Language) => void;
    syncStatus: 'none' | 'connected' | 'syncing';
    onOpenSync: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme, language, onLanguageChange, syncStatus, onOpenSync }) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white p-2.5 rounded-xl">
            <i className="fas fa-broom text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase leading-none">
              STEWARD
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Hygiene & Sanitation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
                <button
                    onClick={() => onLanguageChange(language === 'en' ? 'ar' : 'en')}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase"
                >
                    {language === 'en' ? 'Arabic' : 'English'}
                </button>
            </div>

            <button
                onClick={onOpenSync}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-bold ${
                    syncStatus === 'none' 
                    ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-500' 
                    : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                }`}
                title={t('sync.title')}
            >
                <i className={`fas fa-cloud-arrow-up ${syncStatus === 'syncing' ? 'animate-bounce' : ''}`}></i>
                <span className="hidden sm:inline">Cloud Sync</span>
                {syncStatus !== 'none' && (
                    <span className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-400' : 'bg-emerald-500'}`}></span>
                )}
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
