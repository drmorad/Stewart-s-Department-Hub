import React from 'react';
import type { Chemical } from '../types';
import { t } from '../i18n';

interface ChemicalInfoTooltipProps {
  chemical: Chemical;
  children: React.ReactNode;
}

const ChemicalInfoTooltip: React.FC<ChemicalInfoTooltipProps> = ({ chemical, children }) => {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20 -translate-x-1/2 start-1/2 dark:bg-gray-100 dark:text-gray-800 shadow-lg">
        {chemical.image && (
            <img src={chemical.image} alt={chemical.name} className="w-full h-32 object-contain rounded-t-lg bg-white dark:bg-gray-900 p-1" />
        )}
        <div className="p-3">
            <h4 className="font-bold text-base mb-1 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block border border-gray-400" style={{ backgroundColor: chemical.color || '#cccccc' }}></span>
            <span>{chemical.name}</span>
            </h4>
            <p className="mb-2"><strong className="font-semibold">{t('chemicalSelector.ingredient')}:</strong> {chemical.activeIngredient || t('na')}</p>
            <p className="whitespace-pre-wrap"><strong className="font-semibold">{t('chemicalSelector.application')}:</strong> {chemical.application}</p>
        </div>
        <div className="absolute start-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-800 dark:border-t-gray-100"></div>
      </div>
    </div>
  );
};

export default ChemicalInfoTooltip;
