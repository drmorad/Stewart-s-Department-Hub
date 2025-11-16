import React from 'react';
import type { CleaningSchedulePlan, Chemical, ActiveFilters, TaskDetail } from '../types';
import ChemicalSelector from './ChemicalSelector';
import ChemicalInfoTooltip from './ChemicalInfoTooltip'; // Corrected import path
import { t } from '../i18n';

interface ScheduleDisplayProps {
  schedulePlan: CleaningSchedulePlan;
  chemicals: Chemical[];
  onAssociateChemical: (catIndex: number, itemIndex: number, frequency: 'daily' | 'weekly' | 'monthly', chemicalId: string | null) => void;
  activeFilters: ActiveFilters;
}

const TaskCell: React.FC<{
  taskDetail: TaskDetail;
  chemicals: Chemical[];
  onSelect: (id: string | null) => void;
}> = ({ taskDetail, chemicals, onSelect }) => {
  const chemical = chemicals.find(c => c.id === taskDetail.chemicalId);
  return (
    <div className="flex gap-2 items-start">
      <ChemicalSelector
        chemicals={chemicals}
        currentChemicalId={taskDetail.chemicalId}
        onSelect={onSelect}
      />
      <div className="flex-grow">
        {chemical && (
          <ChemicalInfoTooltip chemical={chemical}>
            <span
              className="w-3 h-3 rounded-full inline-block me-2 border border-gray-300 dark:border-gray-600 align-middle cursor-pointer"
              style={{ backgroundColor: chemical.color || '#cccccc' }}
            ></span>
          </ChemicalInfoTooltip>
        )}
        <span className="align-middle">{taskDetail.task}</span>
        {taskDetail.notes && taskDetail.notes.trim() && taskDetail.notes.trim().toLowerCase() !== 'n/a' && (
           <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic ps-1 flex items-start gap-2">
            <i className="fas fa-info-circle mt-0.5 text-blue-500 flex-shrink-0"></i>
            <p className="flex-1">{taskDetail.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};


const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedulePlan, chemicals, onAssociateChemical, activeFilters }) => {
  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
        {t('scheduleDisplay.title')}
      </h2>
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
                  {category.items.map((item, itemIndex) => (
                        <tr key={itemIndex} className={itemIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 align-top">
                            <div className="flex items-center gap-2">
                              <span>{item.itemName}</span>
                            </div>
                          </td>
                          {activeFilters.daily && (
                            <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300 align-top">
                              <TaskCell taskDetail={item.daily} chemicals={chemicals} onSelect={(id) => onAssociateChemical(catIndex, itemIndex, 'daily', id)} />
                            </td>
                          )}
                          {activeFilters.weekly && (
                            <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300 align-top">
                              <TaskCell taskDetail={item.weekly} chemicals={chemicals} onSelect={(id) => onAssociateChemical(catIndex, itemIndex, 'weekly', id)} />
                            </td>
                          )}
                          {activeFilters.monthly && (
                            <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300 align-top">
                              <TaskCell taskDetail={item.monthly} chemicals={chemicals} onSelect={(id) => onAssociateChemical(catIndex, itemIndex, 'monthly', id)} />
                            </td>
                          )}
                        </tr>
                      )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleDisplay;