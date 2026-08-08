import React, { useState } from 'react';
import type { CleaningSchedulePlan, ChecklistState, Chemical, TaskDetail, ActiveFilters } from '../types';
import ChemicalSelector from './ChemicalSelector';
import { PPE_OPTIONS } from '../constants';
import { t } from '../i18n';

interface ScheduleChecklistProps {
  schedulePlan: CleaningSchedulePlan;
  checklistState: ChecklistState;
  chemicals: Chemical[];
  onToggleCheck: (catIndex: number, itemIndex: number, frequency: 'daily' | 'weekly' | 'monthly') => void;
  onResetChecks: (frequency: 'daily' | 'weekly' | 'monthly') => void;
  onAssociateChemical: (catIndex: number, itemIndex: number, frequency: 'daily' | 'weekly' | 'monthly', chemicalId: string | null) => void;
  onUpdateTaskNotes: (catIndex: number, itemIndex: number, frequency: 'daily' | 'weekly' | 'monthly', notes: string) => void;
  activeFilters: ActiveFilters;
}

const ChecklistItem = ({
    catIndex,
    itemIndex,
    frequency,
    taskDetail,
    isChecked,
    chemicals,
    onToggleCheck,
    onAssociateChemical,
    onUpdateTaskNotes,
    schedulePlan,
    checklistState
}: {
    catIndex: number;
    itemIndex: number;
    frequency: 'daily' | 'weekly' | 'monthly';
    taskDetail: TaskDetail;
    isChecked: boolean;
    chemicals: Chemical[];
    onToggleCheck: (c: number, i: number, f: 'daily' | 'weekly' | 'monthly') => void;
    onAssociateChemical: (c: number, i: number, f: 'daily' | 'weekly' | 'monthly', id: string | null) => void;
    onUpdateTaskNotes: (c: number, i: number, f: 'daily' | 'weekly' | 'monthly', n: string) => void;
    schedulePlan: CleaningSchedulePlan;
    checklistState: ChecklistState;
}) => {
    const [showPPE, setShowPPE] = useState(false);

    if (!taskDetail || !taskDetail.task || taskDetail.task.trim().toLowerCase() === 'n/a' || !taskDetail.task.trim()) {
      return null;
    }
    
    const chemical = chemicals.find(c => c.id === taskDetail.chemicalId);
    const hasPPE = (chemical?.personalProtection && chemical.personalProtection.trim() !== '') || (chemical?.ppeList && chemical.ppeList.length > 0);

    let isBlocked = false;
    let missingPrerequisites: string[] = [];

    if (taskDetail.prerequisites && taskDetail.prerequisites.length > 0) {
        taskDetail.prerequisites.forEach(prereqId => {
            let found = false;
            let isPrereqChecked = false;
            let prereqTaskName = '';

            for (let cIdx = 0; cIdx < schedulePlan.schedule.length; cIdx++) {
                const category = schedulePlan.schedule[cIdx];
                for (let iIdx = 0; iIdx < category.items.length; iIdx++) {
                    const item = category.items[iIdx];
                    if (item.daily.id === prereqId) { 
                        isPrereqChecked = checklistState[cIdx]?.[iIdx]?.daily || false; 
                        prereqTaskName = `${item.itemName}: ${item.daily.task}`; 
                        found = true; 
                    }
                    else if (item.weekly.id === prereqId) { 
                        isPrereqChecked = checklistState[cIdx]?.[iIdx]?.weekly || false; 
                        prereqTaskName = `${item.itemName}: ${item.weekly.task}`; 
                        found = true; 
                    }
                    else if (item.monthly.id === prereqId) { 
                        isPrereqChecked = checklistState[cIdx]?.[iIdx]?.monthly || false; 
                        prereqTaskName = `${item.itemName}: ${item.monthly.task}`; 
                        found = true; 
                    }
                    if (found) break;
                }
                if (found) break;
            }
            if (found && !isPrereqChecked) { isBlocked = true; missingPrerequisites.push(prereqTaskName); }
        });
    }

    return (
      <div className={`p-5 rounded-3xl border transition-all duration-300 shadow-sm relative group ${isChecked ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'} ${isBlocked ? 'border-amber-100 dark:border-amber-900/30 bg-slate-50/50 dark:bg-slate-950/30' : ''}`}>
        <div className="flex items-start gap-5">
          <button 
            onClick={() => !isBlocked && onToggleCheck(catIndex, itemIndex, frequency)}
            className={`w-9 h-9 rounded-xl border-2 flex-shrink-0 flex items-center justify-center transition-all ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : isBlocked ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed text-slate-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-transparent hover:border-blue-500 hover:scale-105 active:scale-95'}`}
            title={isBlocked ? t('dependencies.locked') : undefined}
          >
            {isBlocked ? <i className="fas fa-lock text-[10px]"></i> : <i className="fas fa-check text-xs"></i>}
          </button>
          
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border ${frequency === 'daily' ? 'text-blue-600 bg-blue-50/50 border-blue-100 dark:border-blue-900/30' : frequency === 'weekly' ? 'text-emerald-600 bg-emerald-50/50 border-emerald-100 dark:border-emerald-900/30' : 'text-amber-600 bg-amber-50/50 border-amber-100 dark:border-amber-900/30'}`}>
                        {t(`main.${frequency}`)}
                    </span>
                    {taskDetail.prerequisites && taskDetail.prerequisites.length > 0 && (
                        <span className="flex items-center gap-1.5 text-[8px] font-black bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full uppercase border border-blue-100 dark:border-blue-900/20">
                            <i className="fas fa-link text-[8px]"></i> {t('dependencies.requires')}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <ChemicalSelector
                        chemicals={chemicals}
                        currentChemicalId={taskDetail.chemicalId}
                        onSelect={(id) => onAssociateChemical(catIndex, itemIndex, frequency, id)}
                    />
                    {hasPPE && (
                        <button onClick={() => setShowPPE(!showPPE)} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${showPPE ? 'bg-red-500 text-white' : 'text-red-500 bg-red-50 dark:bg-red-950/30 hover:bg-red-100'}`}>
                            <i className="fas fa-triangle-exclamation text-xs"></i>
                        </button>
                    )}
                </div>
            </div>
            
            <p className={`text-sm font-bold mb-4 leading-relaxed ${isChecked ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'} ${isBlocked ? 'opacity-50' : ''}`}>
                {taskDetail.task}
            </p>

            {isBlocked && (
                <div className="mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 animate-pulse">
                    <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-shield-halved text-amber-600 text-[10px]"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">{t('dependencies.locked')}</span>
                    </div>
                    <ul className="space-y-1.5">
                        {missingPrerequisites.map((p, idx) => (
                            <li key={idx} className="text-[10px] text-amber-700/70 dark:text-amber-400/70 font-bold flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                                {p}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="relative group/notes">
                <i className="fas fa-pen-to-square absolute left-3 top-3 text-[10px] text-slate-300 group-hover/notes:text-blue-400 transition-colors"></i>
                <textarea
                    value={taskDetail.notes || ''}
                    onChange={(e) => onUpdateTaskNotes(catIndex, itemIndex, frequency, e.target.value)}
                    placeholder={t('checklist.notesPlaceholder')}
                    disabled={isBlocked}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-medium p-3 ps-8 text-slate-600 dark:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all h-20 resize-none disabled:opacity-30 disabled:cursor-not-allowed"
                />
            </div>
          </div>
        </div>

        {showPPE && hasPPE && (
            <div className="mt-4 p-5 bg-red-50/80 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30 animate-fade-in shadow-inner">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-[0.2em]">{t('ppe.title')}</span>
                    <button onClick={() => setShowPPE(false)} className="text-red-300 hover:text-red-600"><i className="fas fa-times text-xs"></i></button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {(chemical?.ppeList || []).map(p => (
                        <div key={p} className="bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 p-2 text-[9px] font-black rounded-xl border border-red-50 dark:border-red-900/40 flex items-center gap-2.5 shadow-sm">
                            <i className={`fas ${PPE_OPTIONS.find(o => o.id === p)?.icon || 'fa-check'} text-xs`}></i>
                            <span className="truncate">{t(PPE_OPTIONS.find(o => o.id === p)?.label || p)}</span>
                        </div>
                    ))}
                </div>
                {chemical?.personalProtection && (
                    <div className="p-3 bg-white/50 dark:bg-slate-950/30 rounded-xl border border-red-50 dark:border-red-900/20">
                        <p className="text-[10px] text-red-600/70 dark:text-red-400/70 font-bold italic leading-relaxed">
                            {chemical.personalProtection}
                        </p>
                    </div>
                )}
            </div>
        )}
      </div>
    );
};

const ScheduleChecklist: React.FC<ScheduleChecklistProps> = ({ schedulePlan, checklistState, chemicals, onToggleCheck, onResetChecks, onAssociateChemical, onUpdateTaskNotes, activeFilters }) => {
  return (
    <div className="space-y-12 pb-12 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-[2.5rem] shadow-sm text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-blue-500 rounded-b-full"></div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tighter">{t('checklist.title')}</h2>
        <div className="flex justify-center items-center gap-4 flex-wrap">
            {(['daily', 'weekly', 'monthly'] as const).map(f => activeFilters[f] && (
              <button 
                  key={f}
                  onClick={() => onResetChecks(f)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 shadow-sm"
              >
                  <i className="fas fa-arrows-rotate text-[10px] opacity-50"></i> {t(`checklist.reset${f.charAt(0).toUpperCase() + f.slice(1)}`)}
              </button>
            ))}
        </div>
      </div>

      <div className="space-y-16">
        {schedulePlan.schedule.map((category, catIndex) => (
          <div key={catIndex}>
            <div className="flex items-center gap-5 mb-8">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-100 dark:border-emerald-800 shadow-sm">
                    <i className="fas fa-clipboard-check text-xl"></i>
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{category.category}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{category.items.length} units listed</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {category.items.map((item, itemIndex) => {
                const hasVisibleTasks = (activeFilters.daily && item.daily.task && item.daily.task.trim().toLowerCase() !== 'n/a') ||
                                        (activeFilters.weekly && item.weekly.task && item.weekly.task.trim().toLowerCase() !== 'n/a') ||
                                        (activeFilters.monthly && item.monthly.task && item.monthly.task.trim().toLowerCase() !== 'n/a');
                
                if (!hasVisibleTasks) return null;

                const itemProgress = [
                    checklistState[catIndex]?.[itemIndex]?.daily,
                    checklistState[catIndex]?.[itemIndex]?.weekly,
                    checklistState[catIndex]?.[itemIndex]?.monthly
                ].filter(Boolean).length;
                
                return (
                    <div key={itemIndex} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="min-w-0">
                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{item.itemName}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(itemProgress/3)*100}%` }}></div>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase">{Math.round((itemProgress/3)*100)}%</span>
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                                <i className="fas fa-kitchen-set text-slate-300"></i>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            {activeFilters.daily && (
                                <ChecklistItem
                                    catIndex={catIndex} itemIndex={itemIndex} frequency="daily"
                                    taskDetail={item.daily} isChecked={checklistState[catIndex]?.[itemIndex]?.daily || false}
                                    chemicals={chemicals} onToggleCheck={onToggleCheck} onAssociateChemical={onAssociateChemical}
                                    onUpdateTaskNotes={onUpdateTaskNotes} schedulePlan={schedulePlan} checklistState={checklistState}
                                />
                            )}
                            {activeFilters.weekly && (
                                <ChecklistItem
                                    catIndex={catIndex} itemIndex={itemIndex} frequency="weekly"
                                    taskDetail={item.weekly} isChecked={checklistState[catIndex]?.[itemIndex]?.weekly || false}
                                    chemicals={chemicals} onToggleCheck={onToggleCheck} onAssociateChemical={onAssociateChemical}
                                    onUpdateTaskNotes={onUpdateTaskNotes} schedulePlan={schedulePlan} checklistState={checklistState}
                                />
                            )}
                            {activeFilters.monthly && (
                                <ChecklistItem
                                    catIndex={catIndex} itemIndex={itemIndex} frequency="monthly"
                                    taskDetail={item.monthly} isChecked={checklistState[catIndex]?.[itemIndex]?.monthly || false}
                                    chemicals={chemicals} onToggleCheck={onToggleCheck} onAssociateChemical={onAssociateChemical}
                                    onUpdateTaskNotes={onUpdateTaskNotes} schedulePlan={schedulePlan} checklistState={checklistState}
                                />
                            )}
                        </div>
                    </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleChecklist;
