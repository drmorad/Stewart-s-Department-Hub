
import React, { useState } from 'react';
import type { CleaningSchedulePlan } from '../types';
import { t } from '../i18n';

interface DependencySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: CleaningSchedulePlan;
  currentTaskId: string;
  currentPrerequisites: string[];
  onSave: (taskId: string, newPrerequisites: string[]) => void;
}

const DependencySelector: React.FC<DependencySelectorProps> = ({ 
  isOpen, onClose, schedule, currentTaskId, currentPrerequisites, onSave 
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentPrerequisites || []));
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-fade-in-up border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-100 dark:border-amber-800">
              <i className="fas fa-link"></i>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">{t('dependencies.modalTitle')}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Task Sequencing Logic</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-all p-2"><i className="fas fa-times text-xl"></i></button>
        </div>
        
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed max-w-md">
                {t('dependencies.instruction')}
            </p>
            <div className="relative">
                <input 
                    type="text" 
                    placeholder={t('dependencies.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold p-4 ps-12 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all shadow-sm"
                />
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
            </div>
        </div>

        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar space-y-10">
          {schedule.schedule.map((category, catIndex) => {
            const hasVisibleItems = category.items.some(item => 
                ['daily', 'weekly', 'monthly'].some(freq => {
                    const taskDetail = (item as any)[freq];
                    return taskDetail && taskDetail.task && taskDetail.task !== 'N/A' && taskDetail.id !== currentTaskId;
                })
            );

            if (!hasVisibleItems) return null;

            return (
                <div key={catIndex} className="animate-fade-in">
                  <div className="flex items-center gap-3 mb-6 sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm z-20 py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight text-sm">{category.category}</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.items.map((item, itemIndex) => (
                      <React.Fragment key={itemIndex}>
                         {['daily', 'weekly', 'monthly'].map((freq) => {
                             const taskDetail = (item as any)[freq];
                             if (!taskDetail || !taskDetail.task || taskDetail.task === 'N/A' || !taskDetail.task.trim() || taskDetail.id === currentTaskId) return null;
                             if (searchTerm && !item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) && !taskDetail.task.toLowerCase().includes(searchTerm.toLowerCase())) return null;

                             const isSelected = selectedIds.has(taskDetail.id);
                             const freqColors = { 
                                daily: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800', 
                                weekly: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800', 
                                monthly: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800' 
                             };

                             return (
                                <button 
                                    key={taskDetail.id} 
                                    onClick={() => handleToggle(taskDetail.id)}
                                    className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all group ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-500'}`}
                                >
                                    <div className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white text-emerald-500' : 'border-slate-200 dark:border-slate-700 text-transparent group-hover:border-blue-500'}`}>
                                        <i className="fas fa-check text-[10px]"></i>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                            <span className={`text-[11px] font-extrabold uppercase tracking-tight ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{item.itemName}</span>
                                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${isSelected ? 'bg-white/20 border-white/20 text-white' : freqColors[freq as keyof typeof freqColors]}`}>
                                                {t(`main.${freq}`)}
                                            </span>
                                        </div>
                                        <p className={`text-xs leading-tight font-medium ${isSelected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>{taskDetail.task}</p>
                                    </div>
                                </button>
                             );
                         })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
            );
          })}
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-all">{t('chemicalManager.cancelButton')}</button>
            <button onClick={() => { onSave(currentTaskId, Array.from(selectedIds)); onClose(); }} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-10 py-3.5 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 transform active:scale-95 transition-all">
                {t('dependencies.saveButton')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default DependencySelector;
