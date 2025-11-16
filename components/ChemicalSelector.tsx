import React, { useState, useEffect, useRef } from 'react';
import type { Chemical } from '../types';
import { t } from '../i18n';

interface ChemicalSelectorProps {
  chemicals: Chemical[];
  currentChemicalId: string | null;
  onSelect: (chemicalId: string | null) => void;
}

const ChemicalSelector: React.FC<ChemicalSelectorProps> = ({ chemicals, currentChemicalId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedChemical = chemicals.find(c => c.id === currentChemicalId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  const handleSelect = (id: string | null) => {
    onSelect(id);
    setIsOpen(false);
  }

  if (chemicals.length === 0) {
      return null;
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative group">
         <button
            onClick={() => setIsOpen(!isOpen)}
            className={`cursor-pointer text-lg ${!selectedChemical ? 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300' : ''}`}
            style={{ color: selectedChemical ? (selectedChemical.color || '#0d9488') : undefined }}
            aria-label={t('chemicalSelector.selectChemical')}
          >
            <i className="fas fa-flask"></i>
         </button>

         {selectedChemical && (
            <div className="absolute bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20 -translate-x-1/2 start-1/2 dark:bg-gray-100 dark:text-gray-800 shadow-lg">
                {selectedChemical.image && (
                    <img src={selectedChemical.image} alt={selectedChemical.name} className="w-full h-32 object-contain rounded-t-lg bg-white dark:bg-gray-900 p-1" />
                )}
                <div className="p-3">
                    <h4 className="font-bold text-base mb-1 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full inline-block border border-gray-400" style={{ backgroundColor: selectedChemical.color || '#cccccc' }}></span>
                    <span>{selectedChemical.name}</span>
                    </h4>
                    <p className="mb-2"><strong className="font-semibold">{t('chemicalSelector.ingredient')}:</strong> {selectedChemical.activeIngredient || t('na')}</p>
                    <p className="whitespace-pre-wrap"><strong className="font-semibold">{t('chemicalSelector.application')}:</strong> {selectedChemical.application}</p>
                </div>
                <div className="absolute start-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-800 dark:border-t-gray-100"></div>
            </div>
         )}
      </div>

      {isOpen && (
        <div className="absolute start-0 mt-2 w-60 bg-white rounded-md shadow-lg z-30 border dark:bg-gray-800 dark:border-gray-600">
            <ul className="max-h-60 overflow-auto py-1">
                <li>
                    <button 
                        onClick={() => handleSelect(null)}
                        className="w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        <i className="fas fa-times-circle me-2 text-red-500"></i>
                        {t('chemicalSelector.removeAssociation')}
                    </button>
                </li>
                {chemicals.map(chemical => (
                    <li key={chemical.id}>
                        <button
                            onClick={() => handleSelect(chemical.id)}
                            className={`w-full text-start px-4 py-2 text-sm ${currentChemicalId === chemical.id ? 'font-bold bg-blue-50 dark:bg-blue-900/50' : ''} text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700`}
                        >
                           <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center overflow-hidden">
                                    {chemical.image ? (
                                        <img src={chemical.image} alt={chemical.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <i className="fas fa-flask text-lg text-gray-400"></i>
                                    )}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full inline-block border dark:border-gray-500" style={{ backgroundColor: chemical.color || '#cccccc' }}></span>
                                        <span className="font-medium">{chemical.name}</span>
                                    </div>
                                    <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">{chemical.usedFor}</span>
                                </div>
                           </div>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
};

export default ChemicalSelector;
