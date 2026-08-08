
import React from 'react';
import { t } from '../i18n';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-950/50 mt-auto py-10 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-6 text-center">
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-slate-400 dark:text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-widest">Protocol Version 4.2</span>
            <div className="hidden md:block w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                {t('footer.poweredBy')}
            </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
