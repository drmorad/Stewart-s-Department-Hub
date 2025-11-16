import React from 'react';
import { t } from '../i18n';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 mt-12 py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-gray-400">
        <p>
          {t('footer.poweredBy')}
        </p>
      </div>
    </footer>
  );
};

export default Footer;