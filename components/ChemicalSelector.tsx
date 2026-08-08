
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
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  if (chemicals.length === 0) return null;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border shadow-sm ${!selectedChemical ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-500' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'}`}
        aria-label={t('chemicalSelector.selectChemical')}
      >
         {selectedChemical?.image ? (
             <img src={selectedChemical.image} alt={selectedChemical.name} className="w-full h-full object-cover rounded-lg" />
         ) : (
            <i className="fas fa-flask text-[10px]" style={{ color: selectedChemical ? (selectedChemical.color || 'currentColor') : undefined }}></i>
         )}
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Reagents</span>
            </div>
            <ul className="max-h-72 overflow-y-auto custom-scrollbar">
                <li>
                    <button 
                        onClick={() => { onSelect(null); setIsOpen(false); }}
                        className="w-full text-left p-3.5 text-[10px] font-bold text-red-500 hover:bg-red-50 transition-all border-b border-slate-50 dark:border-slate-800 uppercase tracking-wider"
                    >
                        <i className="fas fa-circle-xmark me-2"></i> {t('chemicalSelector.removeAssociation')}
                    </button>
                </li>
                {chemicals.map(chemical => (
                    <li key={chemical.id}>
                        <button
                            onClick={() => { onSelect(chemical.id); setIsOpen(false); }}
                            className={`w-full text-left p-3.5 transition-all border-b border-slate-50 dark:border-slate-800 flex gap-3 items-center group ${currentChemicalId === chemical.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex-shrink-0 relative overflow-hidden group-hover:border-blue-500 shadow-sm transition-all">
                                {chemical.image ? <img src={chemical.image} className="w-full h-full object-cover" /> : <i className="fas fa-flask text-slate-200 absolute inset-0 m-auto h-fit w-fit"></i>}
                                <div className="absolute top-0 left-0 w-full h-0.5" style={{ backgroundColor: chemical.color }}></div>
                            </div>
                            <div className="min-w-0">
                                <span className={`block font-bold text-[11px] uppercase tracking-tight truncate ${currentChemicalId === chemical.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>{chemical.name}</span>
                                <span className="block text-[9px] text-slate-400 font-medium truncate italic">{chemical.usedFor}</span>
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
