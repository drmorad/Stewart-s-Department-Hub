
import React from 'react';
import type { Chemical } from '../types';
import { PPE_OPTIONS } from '../constants';
import { t } from '../i18n';

interface ChemicalInfoTooltipProps {
  chemical: Chemical;
  children: React.ReactNode;
}

const ChemicalInfoTooltip: React.FC<ChemicalInfoTooltipProps> = ({ chemical, children }) => {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full mb-4 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100] -translate-x-1/2 left-1/2 scale-95 group-hover:scale-100">
        {chemical.image && (
            <div className="w-full h-32 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 rounded-t-2xl overflow-hidden relative shadow-inner">
                <img src={chemical.image} alt={chemical.name} className="w-full h-full object-contain p-2" />
            </div>
        )}
        <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: chemical.color || '#3b82f6' }}></div>
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight text-base leading-none">{chemical.name}</h4>
            </div>
            
            <div className="space-y-4">
                <div>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Components</span>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">{chemical.activeIngredient || 'Sanitized Data'}</p>
                </div>
                <div>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Standard Application</span>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{chemical.application}</p>
                </div>
            </div>
            
            {(chemical.ppeList && chemical.ppeList.length > 0) && (
                 <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="block text-[8px] font-bold text-red-500 uppercase tracking-widest mb-2">Hygiene Requisites</span>
                    <div className="flex flex-wrap gap-1">
                        {chemical.ppeList.slice(0, 4).map(ppeId => {
                            const option = PPE_OPTIONS.find(o => o.id === ppeId);
                            return (
                                <div key={ppeId} className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-1">
                                    <i className={`fas ${option?.icon || 'fa-shield'} text-[8px]`}></i> {t(option?.label || ppeId).split(' ').pop()}
                                </div>
                            );
                        })}
                        {chemical.ppeList.length > 4 && (
                            <div className="text-[8px] text-slate-400 font-bold px-1 py-0.5">+{chemical.ppeList.length - 4} more</div>
                        )}
                    </div>
                 </div>
            )}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-[8px] border-x-transparent border-t-[8px] border-t-white dark:border-t-slate-900"></div>
      </div>
    </div>
  );
};

export default ChemicalInfoTooltip;
