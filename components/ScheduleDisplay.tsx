
import React, { useState } from 'react';
import type { CleaningSchedulePlan, Chemical, ActiveFilters, TaskDetail, ChecklistState } from '../types';
import ChemicalSelector from './ChemicalSelector';
import ChemicalInfoTooltip from './ChemicalInfoTooltip';
import { PPE_OPTIONS } from '../constants';
import { t } from '../i18n';

interface ScheduleDisplayProps {
  schedulePlan: CleaningSchedulePlan;
  chemicals: Chemical[];
  onAssociateChemical: (catIndex: number, itemIndex: number, frequency: 'daily' | 'weekly' | 'monthly', chemicalId: string | null) => void;
  activeFilters: ActiveFilters;
  onOpenDependencySelector: (taskId: string, currentPrerequisites: string[]) => void;
  checklistState: ChecklistState;
}

const isPrerequisiteMet = (prereqId: string, schedule: CleaningSchedulePlan, checklistState: ChecklistState): boolean => {
    if (!schedule || !schedule.schedule) return false;
    
    for (let c = 0; c < schedule.schedule.length; c++) {
        const cat = schedule.schedule[c];
        if (!cat || !cat.items) continue;

        for (let i = 0; i < cat.items.length; i++) {
            const item = cat.items[i];
            if (!item) continue;
            
            if (item.daily && item.daily.id === prereqId) return checklistState[c]?.[i]?.daily || false;
            if (item.weekly && item.weekly.id === prereqId) return checklistState[c]?.[i]?.weekly || false;
            if (item.monthly && item.monthly.id === prereqId) return checklistState[c]?.[i]?.monthly || false;
        }
    }
    return false;
};

const TaskCell: React.FC<{
  taskDetail: TaskDetail;
  chemicals: Chemical[];
  onSelect: (id: string | null) => void;
  onOpenDependencySelector: (id: string, deps: string[]) => void;
  schedulePlan: CleaningSchedulePlan;
  checklistState: ChecklistState;
  isCompleted?: boolean;
}> = ({ taskDetail, chemicals, onSelect, onOpenDependencySelector, schedulePlan, checklistState, isCompleted }) => {
  const [showPPE, setShowPPE] = useState(false);
  
  if (!taskDetail || !taskDetail.task || taskDetail.task.trim().toLowerCase() === 'n/a') return (
    <div className="py-2 text-xs text-slate-400 italic">N/A</div>
  );

  const chemical = chemicals.find(c => c.id === taskDetail.chemicalId);
  const hasPPE = (chemical?.personalProtection && chemical.personalProtection.trim() !== '') || (chemical?.ppeList && chemical.ppeList.length > 0);
  const hasPrerequisites = taskDetail.prerequisites && taskDetail.prerequisites.length > 0;
  
  let blockedBy: string[] = [];

  if (hasPrerequisites) {
      taskDetail.prerequisites!.forEach(prereqId => {
          if (!isPrerequisiteMet(prereqId, schedulePlan, checklistState)) {
              // Find task name
              for(const cat of schedulePlan.schedule) {
                for(const item of cat.items) {
                    if (item.daily.id === prereqId) blockedBy.push(item.daily.task);
                    else if (item.weekly.id === prereqId) blockedBy.push(item.weekly.task);
                    else if (item.monthly.id === prereqId) blockedBy.push(item.monthly.task);
                }
              }
          }
      });
  }

  const isBlocked = blockedBy.length > 0;

  return (
    <div className={`p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 relative group ${isBlocked ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ChemicalSelector
                chemicals={chemicals}
                currentChemicalId={taskDetail.chemicalId}
                onSelect={onSelect}
            />
            {chemical && (
                <ChemicalInfoTooltip chemical={chemical}>
                    <div className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: chemical.color || '#cccccc' }}></div>
                </ChemicalInfoTooltip>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {hasPPE && (
                <button
                    onClick={() => setShowPPE(!showPPE)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${isCompleted ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100'}`}
                >
                    <i className="fas fa-triangle-exclamation"></i>
                </button>
            )}
            <button 
                onClick={() => onOpenDependencySelector(taskDetail.id, taskDetail.prerequisites || [])}
                className="text-slate-400 hover:text-blue-500 transition-colors"
            >
                <i className="fas fa-link text-[10px]"></i>
            </button>
          </div>
      </div>

      <div className={`${isCompleted ? 'opacity-50' : ''}`}>
        <p className={`text-sm font-medium leading-tight ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
            {taskDetail.task}
        </p>
        
        {isBlocked && (
            <div className="mt-2 text-[9px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded border border-amber-100 dark:border-amber-900/30">
                <i className="fas fa-lock me-1"></i> Requires setup tasks
            </div>
        )}
      </div>

      {taskDetail.notes && taskDetail.notes.trim() && taskDetail.notes.trim().toLowerCase() !== 'n/a' && (
        <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
            <p className="text-[10px] text-slate-500 italic">
                {taskDetail.notes}
            </p>
        </div>
      )}

      {showPPE && hasPPE && (
          <div className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-950/95 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex flex-col shadow-xl">
              <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Required PPE</span>
                  <button onClick={() => setShowPPE(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times text-xs"></i></button>
              </div>
              <div className="flex flex-wrap gap-1.5 overflow-y-auto">
                  {(chemical?.ppeList || []).map(p => (
                      <div key={p} className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-1 text-[9px] font-bold rounded flex items-center gap-1.5">
                          <i className={`fas ${PPE_OPTIONS.find(o => o.id === p)?.icon || 'fa-check'}`}></i>
                          {t(PPE_OPTIONS.find(o => o.id === p)?.label || p)}
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};


const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedulePlan, chemicals, onAssociateChemical, activeFilters, onOpenDependencySelector, checklistState }) => {
  return (
    <div className="space-y-12 pb-12">
      {schedulePlan.schedule.map((category, catIndex) => (
        <div key={catIndex} className="animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-800">
              <i className="fas fa-kitchen-set"></i>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {category.category}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {category.items.map((item, itemIndex) => {
                const itemProgress = [
                    checklistState[catIndex]?.[itemIndex]?.daily,
                    checklistState[catIndex]?.[itemIndex]?.weekly,
                    checklistState[catIndex]?.[itemIndex]?.monthly
                ].filter(Boolean).length;
                const progressWidth = (itemProgress / 3) * 100;

                return (
                    <div key={itemIndex} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:border-blue-500/50 transition-all group">
                        <div className="mb-6">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{item.itemName}</h4>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full border border-slate-100 dark:border-slate-700">#{itemIndex + 1}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${progressWidth}%` }}></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {activeFilters.daily && (
                                <div className="space-y-2">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('main.daily')}</span>
                                    <TaskCell 
                                        taskDetail={item.daily} chemicals={chemicals} 
                                        onSelect={(id) => onAssociateChemical(catIndex, itemIndex, 'daily', id)} 
                                        onOpenDependencySelector={onOpenDependencySelector} 
                                        schedulePlan={schedulePlan} checklistState={checklistState}
                                        isCompleted={checklistState[catIndex]?.[itemIndex]?.daily}
                                    />
                                </div>
                            )}
                            {activeFilters.weekly && (
                                <div className="space-y-2">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('main.weekly')}</span>
                                    <TaskCell 
                                        taskDetail={item.weekly} chemicals={chemicals} 
                                        onSelect={(id) => onAssociateChemical(catIndex, itemIndex, 'weekly', id)} 
                                        onOpenDependencySelector={onOpenDependencySelector} 
                                        schedulePlan={schedulePlan} checklistState={checklistState}
                                        isCompleted={checklistState[catIndex]?.[itemIndex]?.weekly}
                                    />
                                </div>
                            )}
                            {activeFilters.monthly && (
                                <div className="space-y-2">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('main.monthly')}</span>
                                    <TaskCell 
                                        taskDetail={item.monthly} chemicals={chemicals} 
                                        onSelect={(id) => onAssociateChemical(catIndex, itemIndex, 'monthly', id)} 
                                        onOpenDependencySelector={onOpenDependencySelector} 
                                        schedulePlan={schedulePlan} checklistState={checklistState}
                                        isCompleted={checklistState[catIndex]?.[itemIndex]?.monthly}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScheduleDisplay;
