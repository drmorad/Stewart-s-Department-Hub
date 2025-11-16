import React from 'react';
import type { CleaningSchedulePlan, ChecklistState, Chemical, TaskDetail, ActiveFilters } from '../types';
import ChemicalSelector from './ChemicalSelector';
import ChemicalInfoTooltip from './ChemicalInfoTooltip';
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

const ScheduleChecklist: React.FC<ScheduleChecklistProps> = ({ schedulePlan, checklistState, chemicals, onToggleCheck, onResetChecks, onAssociateChemical, onUpdateTaskNotes, activeFilters }) => {

  const renderTaskCell = (
    catIndex: number,
    itemIndex: number,
    frequency: 'daily' | 'weekly' | 'monthly',
    taskDetail: TaskDetail,
    isChecked: boolean
  ) => {
    if (taskDetail.task.trim().toLowerCase() === 'n/a' || !taskDetail.task.trim()) {
      return <span className="text-gray-400 dark:text-gray-500 italic">{t('na')}</span>;
    }
    
    const chemical = chemicals.find(c => c.id === taskDetail.chemicalId);

    return (
      <div>
        <div className="flex items-start gap-2">
          <ChemicalSelector
            chemicals={chemicals}
            currentChemicalId={taskDetail.chemicalId}
            onSelect={(id) => onAssociateChemical(catIndex, itemIndex, frequency, id)}
          />
          <label className="flex-grow flex items-start gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggleCheck(catIndex, itemIndex, frequency)}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 mt-0.5 flex-shrink-0"
            />
            <div className={`transition-colors ${isChecked ? 'line-through text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300' : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100'}`}>
              {chemical && (
                <ChemicalInfoTooltip chemical={chemical}>
                  <span
                    className="w-3 h-3 rounded-full inline-block me-2 border border-gray-300 dark:border-gray-600 align-middle cursor-pointer"
                    style={{ backgroundColor: chemical.color || '#cccccc' }}
                  ></span>
                </ChemicalInfoTooltip>
              )}
              <span className="align-middle">{taskDetail.task}</span>
            </div>
          </label>
        </div>
        <div className="ps-7 mt-2">
          <textarea
              value={taskDetail.notes || ''}
              onChange={(e) => onUpdateTaskNotes(catIndex, itemIndex, frequency, e.target.value)}
              placeholder={t('checklist.notesPlaceholder')}
              className="w-full text-xs p-1.5 border border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 resize-y"
              rows={2}
              aria-label={`Notes for ${taskDetail.task}`}
          />
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 dark:bg-gray-800">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('checklist.title')}
        </h2>
        <div className="flex justify-center items-center gap-3 flex-wrap">
            {activeFilters.daily && (
              <button 
                  onClick={() => onResetChecks('daily')}
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-semibold py-1 px-4 rounded-full text-sm transition-colors dark:bg-blue-900/60 dark:text-blue-300 dark:hover:bg-blue-900/80"
              >
                  <i className="fas fa-undo me-2"></i>{t('checklist.resetDaily')}
              </button>
            )}
            {activeFilters.weekly && (
              <button 
                  onClick={() => onResetChecks('weekly')}
                  className="bg-green-100 text-green-800 hover:bg-green-200 font-semibold py-1 px-4 rounded-full text-sm transition-colors dark:bg-green-900/60 dark:text-green-300 dark:hover:bg-green-900/80"
              >
                  <i className="fas fa-undo me-2"></i>{t('checklist.resetWeekly')}
              </button>
            )}
            {activeFilters.monthly && (
              <button 
                  onClick={() => onResetChecks('monthly')}
                  className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 font-semibold py-1 px-4 rounded-full text-sm transition-colors dark:bg-yellow-900/60 dark:text-yellow-300 dark:hover:bg-yellow-900/80"
              >
                  <i className="fas fa-undo me-2"></i>{t('checklist.resetMonthly')}
              </button>
            )}
        </div>
      </div>
      <div className="space-y-8">
        {schedulePlan.schedule.map((category, catIndex) => (
          <div key={catIndex} className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-xl font-semibold bg-gray-100 p-4 text-gray-700 border-b border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
              {category.category}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4">
                      {t('scheduleDisplay.itemEquipmentHeader')}
                    </th>
                    {activeFilters.daily && (
                      <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('scheduleDisplay.dailyTasksHeader')}
                      </th>
                    )}
                    {activeFilters.weekly && (
                      <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('scheduleDisplay.weeklyTasksHeader')}
                      </th>
                    )}
                    {activeFilters.monthly && (
                      <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('scheduleDisplay.monthlyTasksHeader')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {category.items.map((item, itemIndex) => {
                    const checkedStatus = checklistState?.[catIndex]?.[itemIndex] || { daily: false, weekly: false, monthly: false };
                    return (
                        <tr key={itemIndex} className={itemIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 align-top">
                           <div className="flex items-center gap-2">
                            <span>{item.itemName}</span>
                          </div>
                        </td>
                        {activeFilters.daily && (
                          <td className={`px-6 py-4 whitespace-pre-wrap text-sm align-top transition-colors duration-300 ${checkedStatus.daily ? 'bg-green-50 dark:bg-green-900/40' : ''}`}>
                              {renderTaskCell(catIndex, itemIndex, 'daily', item.daily, checkedStatus.daily)}
                          </td>
                        )}
                        {activeFilters.weekly && (
                          <td className={`px-6 py-4 whitespace-pre-wrap text-sm align-top transition-colors duration-300 ${checkedStatus.weekly ? 'bg-green-50 dark:bg-green-900/40' : ''}`}>
                              {renderTaskCell(catIndex, itemIndex, 'weekly', item.weekly, checkedStatus.weekly)}
                          </td>
                        )}
                        {activeFilters.monthly && (
                          <td className={`px-6 py-4 whitespace-pre-wrap text-sm align-top transition-colors duration-300 ${checkedStatus.monthly ? 'bg-green-50 dark:bg-green-900/40' : ''}`}>
                              {renderTaskCell(catIndex, itemIndex, 'monthly', item.monthly, checkedStatus.monthly)}
                          </td>
                        )}
                        </tr>
                    );
                   })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleChecklist;