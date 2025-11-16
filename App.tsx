import React, { useState, useCallback, useEffect } from 'react';
import type { CleaningSchedulePlan, ChecklistState, Chemical, ActiveFilters } from './types';
import { generateCleaningSchedule } from './services/geminiService';
import { exportScheduleToPDF, exportChecklistToPDF } from './services/pdfService';
import { findBestChemicalForTask } from './services/chemicalMatcherService';
import Header from './components/Header';
import ScheduleDisplay from './components/ScheduleDisplay';
import ScheduleChecklist from './components/ScheduleChecklist';
import LoadingSpinner from './components/LoadingSpinner';
import Footer from './components/Footer';
import ChemicalManager from './components/ChemicalManager';
import ConfirmationDialog from './components/ConfirmationDialog';
import { t, setLanguage, Language } from './i18n';

const App: React.FC = () => {
  const [schedule, setSchedule] = useState<CleaningSchedulePlan | null>(() => {
    try {
      const savedSchedule = localStorage.getItem('cleaningSchedule');
      return savedSchedule ? JSON.parse(savedSchedule) : null;
    } catch (error) {
      console.error("Failed to parse schedule from localStorage", error);
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'schedule' | 'checklist'>('schedule');

  const [customHeader, setCustomHeader] = useState<string>(
    () => localStorage.getItem('customHeader') || 'Steward Department'
  );
  
  const [logo, setLogo] = useState<string | null>(() => localStorage.getItem('customLogo'));

  const [checklistState, setChecklistState] = useState<ChecklistState>(() => {
    try {
      const savedState = localStorage.getItem('checklistState');
      return savedState ? JSON.parse(savedState) : {};
    } catch (error) {
      console.error("Failed to parse checklist state from localStorage", error);
      return {};
    }
  });

  const [chemicals, setChemicals] = useState<Chemical[]>(() => {
    try {
      const savedChemicals = localStorage.getItem('chemicals');
      return savedChemicals ? JSON.parse(savedChemicals) : [];
    } catch (error) {
      console.error("Failed to parse chemicals from localStorage", error);
      return [];
    }
  });

  const [isChemicalModalOpen, setIsChemicalModalOpen] = useState(false);
  const [pdfFilename, setPdfFilename] = useState<string>('cleaning_schedule');
  
  // State for PDF export confirmation dialog
  const [isPdfConfirmOpen, setIsPdfConfirmOpen] = useState(false);
  const [pdfExportConfig, setPdfExportConfig] = useState<{
    handler: () => void;
    message: React.ReactNode;
    title: string;
  } | null>(null);

  const [pdfExportFilters, setPdfExportFilters] = useState<ActiveFilters>(() => {
    try {
      const savedFilters = localStorage.getItem('pdfExportFilters');
      if (savedFilters) return JSON.parse(savedFilters);
    } catch (error) {
      console.error("Failed to parse pdfExportFilters from localStorage", error);
    }
    return { daily: true, weekly: true, monthly: true }; // Default all true
  });

  // NEW: State for checklist PDF export filters
  const [pdfChecklistFilters, setPdfChecklistFilters] = useState<ActiveFilters>(() => {
    try {
      const savedFilters = localStorage.getItem('pdfChecklistFilters');
      if (savedFilters) return JSON.parse(savedFilters);
    } catch (error) {
      console.error("Failed to parse pdfChecklistFilters from localStorage", error);
    }
    return { daily: true, weekly: true, monthly: true }; // Default all true
  });
  
  const [pdfExportScope, setPdfExportScope] = useState<'full' | 'filtered'>('full');

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(() => {
    try {
      const savedFilters = localStorage.getItem('activeFilters');
      if (savedFilters) return JSON.parse(savedFilters);
    } catch (error) {
      console.error("Failed to parse activeFilters from localStorage", error);
    }
    return { daily: true, weekly: true, monthly: true }; // Default all true
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [language, _setLanguage] = useState<Language>(
    () => (localStorage.getItem('language') as Language) || 'en'
  );

  // State for duplicate schedule confirmation dialog
  const [isDuplicateConfirmOpen, setIsDuplicateConfirmOpen] = useState(false);
  const [duplicateConfirmConfig, setDuplicateConfirmConfig] = useState<{
    handler: () => void;
    message: React.ReactNode;
    title: string;
  } | null>(null);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    _setLanguage(lang);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    localStorage.setItem('customHeader', customHeader);
  }, [customHeader]);
  
  useEffect(() => {
    if (logo) {
      localStorage.setItem('customLogo', logo);
    } else {
      localStorage.removeItem('customLogo');
    }
  }, [logo]);

  useEffect(() => {
    if (schedule) {
      localStorage.setItem('cleaningSchedule', JSON.stringify(schedule));
    } else {
      localStorage.removeItem('cleaningSchedule');
    }
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('checklistState', JSON.stringify(checklistState));
  }, [checklistState]);

  useEffect(() => {
    localStorage.setItem('chemicals', JSON.stringify(chemicals));
  }, [chemicals]);

  useEffect(() => {
    localStorage.setItem('pdfExportFilters', JSON.stringify(pdfExportFilters));
  }, [pdfExportFilters]);

  useEffect(() => {
    localStorage.setItem('pdfChecklistFilters', JSON.stringify(pdfChecklistFilters));
  }, [pdfChecklistFilters]);
  
  useEffect(() => {
    localStorage.setItem('activeFilters', JSON.stringify(activeFilters));
  }, [activeFilters]);


  const autoAssociateChemicals = (schedulePlan: CleaningSchedulePlan, chemicals: Chemical[]): CleaningSchedulePlan => {
    if (!schedulePlan || chemicals.length === 0) {
      return schedulePlan;
    }

    const newSchedule = JSON.parse(JSON.stringify(schedulePlan));

    newSchedule.schedule.forEach((category: any) => {
      category.items.forEach((item: any) => {
        if (!item.daily.chemicalId) {
          item.daily.chemicalId = findBestChemicalForTask(item.itemName, item.daily.task, chemicals);
        }
        if (!item.weekly.chemicalId) {
          item.weekly.chemicalId = findBestChemicalForTask(item.itemName, item.weekly.task, chemicals);
        }
        if (!item.monthly.chemicalId) {
          item.monthly.chemicalId = findBestChemicalForTask(item.itemName, item.monthly.task, chemicals);
        }
      });
    });
    
    return newSchedule;
  };

  const handleGenerateSchedule = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSchedule(null);
    setChecklistState({}); // Clear old checklist state
    setViewMode('schedule'); // Reset to default view
    localStorage.removeItem('checklistState');

    try {
      const generatedSchedule = await generateCleaningSchedule();
      
      const scheduleWithAutoChemicals = autoAssociateChemicals(generatedSchedule, chemicals);
      
      setSchedule(scheduleWithAutoChemicals);

      const initialState: ChecklistState = {};
      scheduleWithAutoChemicals.schedule.forEach((category, catIndex) => {
        initialState[catIndex] = {};
        category.items.forEach((_, itemIndex) => {
          initialState[catIndex][itemIndex] = {
            daily: false,
            weekly: false,
            monthly: false,
          };
        });
      });
      setChecklistState(initialState);
    } catch (err) {
      console.error('Error generating schedule:', err);
      setError(t('errors.scheduleGenerationFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [chemicals]);
  
  const triggerPdfExport = () => {
    if (!schedule) return;
    
    const type = viewMode;
    
    let handler: () => void;
    let message: React.ReactNode;
    let title: string = t('confirmationDialog.exportTitle');

    // Ensure at least one filter is selected by default for PDF export
    if (type === 'schedule') {
        const anyScheduleFilterActive = pdfExportFilters.daily || pdfExportFilters.weekly || pdfExportFilters.monthly;
        if (!anyScheduleFilterActive) {
            setPdfExportFilters(prev => ({ ...prev, daily: true })); // Default to daily if none selected
        }
    } else { // checklist
        const anyChecklistFilterActive = pdfChecklistFilters.daily || pdfChecklistFilters.weekly || pdfChecklistFilters.monthly;
        if (!anyChecklistFilterActive) {
            setPdfChecklistFilters(prev => ({ ...prev, daily: true })); // Default to daily if none selected
        }
    }

    // Re-evaluate filters after potential default setting
    const currentPdfExportFilters = type === 'schedule' 
        ? (pdfExportFilters.daily || pdfExportFilters.weekly || pdfExportFilters.monthly ? pdfExportFilters : { ...pdfExportFilters, daily: true })
        : (pdfChecklistFilters.daily || pdfChecklistFilters.daily || pdfChecklistFilters.weekly || pdfChecklistFilters.monthly ? pdfChecklistFilters : { ...pdfChecklistFilters, daily: true });

    if (type === 'schedule') {
      const includedFilters = Object.entries(currentPdfExportFilters)
          .filter(([, value]) => value)
          .map(([key]) => t(`main.${key as keyof ActiveFilters}`))
          .join(', ');
      
      const scopeMessage = pdfExportScope === 'full' 
          ? t('confirmationDialog.exportScopeFull') 
          : t('confirmationDialog.exportScopeFiltered');

      handler = () => exportScheduleToPDF(schedule, customHeader, currentPdfExportFilters, pdfFilename, chemicals, logo, language, pdfExportScope, activeFilters);
      message = (
        <>
          <p className="text-gray-600 dark:text-gray-300">
            {t('confirmationDialog.exportScheduleMessage', `${pdfFilename}.pdf`)}
          </p>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {t('confirmationDialog.withFilters')}
            <span className="font-semibold"> {includedFilters}</span>.
          </p>
          <p className="mt-2 text-gray-600 dark:text-gray-300">{scopeMessage}</p>
        </>
      );
    } else { // checklist
      const includedChecklistFilters = Object.entries(currentPdfExportFilters) 
          .filter(([, value]) => value)
          .map(([key]) => t(`main.${key as keyof ActiveFilters}`))
          .join(', ');

      handler = () => exportChecklistToPDF(schedule, checklistState, customHeader, pdfFilename, chemicals, logo, language, currentPdfExportFilters); 
      message = (
        <>
          <p className="text-gray-600 dark:text-gray-300">{t('confirmationDialog.exportChecklistMessage', `${pdfFilename}.pdf`)}</p>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {t('confirmationDialog.withFilters')}
            <span className="font-semibold"> {includedChecklistFilters || t('pdfControls.noFrequenciesSelected')}</span>.
          </p>
        </>
      );
      title = t('confirmationDialog.exportChecklistTitle'); 
    }

    setPdfExportConfig({ handler, message, title });
    setIsPdfConfirmOpen(true);
  };

  const handleConfirmAndExport = () => {
    if (pdfExportConfig?.handler) {
      pdfExportConfig.handler();
    }
    setIsPdfConfirmOpen(false);
    setPdfExportConfig(null);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            setLogo(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const handleToggleCheck = (catIndex: number, itemIndex: number, frequency: 'daily' | 'weekly' | 'monthly') => {
    setChecklistState(prevState => {
      const newState = JSON.parse(JSON.stringify(prevState)); 
      newState[catIndex][itemIndex][frequency] = !newState[catIndex][itemIndex][frequency];
      return newState;
    });
  };

  const handleResetChecks = (frequency: 'daily' | 'weekly' | 'monthly') => {
     setChecklistState(prevState => {
        const newState = JSON.parse(JSON.stringify(prevState));
        Object.keys(newState).forEach(catIndex => {
            Object.keys(newState[catIndex]).forEach(itemIndex => {
                newState[catIndex][itemIndex][frequency] = false;
            });
        });
        return newState;
     });
  };

  const handleAssociateChemical = (catIndex: number, itemIndex: number, frequency: 'daily' | 'weekly' | 'monthly', chemicalId: string | null) => {
    if (!schedule) return;
    const newSchedule = JSON.parse(JSON.stringify(schedule));
    newSchedule.schedule[catIndex].items[itemIndex][frequency].chemicalId = chemicalId;
    setSchedule(newSchedule);
  };

  const handleUpdateTaskNotes = (catIndex: number, itemIndex: number, frequency: 'daily' | 'weekly' | 'monthly', notes: string) => {
    if (!schedule) return;
    const newSchedule = JSON.parse(JSON.stringify(schedule));
    newSchedule.schedule[catIndex].items[itemIndex][frequency].notes = notes;
    setSchedule(newSchedule);
  };

  const handleFilterToggle = (filter: keyof ActiveFilters) => {
    setActiveFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  };
  
  const handlePdfFilterToggle = (filter: keyof ActiveFilters) => {
    setPdfExportFilters(prev => ({...prev, [filter]: !prev[filter] }));
  };

  // NEW: Handler for checklist PDF filters
  const handlePdfChecklistFilterToggle = (filter: keyof ActiveFilters) => {
    setPdfChecklistFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
  };

  const handleAddChemical = (chemical: Omit<Chemical, 'id'>) => {
    setChemicals(prev => [...prev, { ...chemical, id: Date.now().toString() }]);
  };

  const handleBulkAddChemicals = (newChemicals: Omit<Chemical, 'id'>[]) => {
    const chemicalsWithIds = newChemicals.map((chem, index) => ({
      ...chem,
      id: `${Date.now()}-${index}`
    }));
    setChemicals(prev => [...prev, ...chemicalsWithIds]);
  };

  const handleUpdateChemical = (updatedChemical: Chemical) => {
    setChemicals(prev => prev.map(c => c.id === updatedChemical.id ? updatedChemical : c));
  };

  const handleDeleteChemical = (chemicalId: string) => {
    setChemicals(prev => prev.filter(c => c.id !== chemicalId));
  };

  const handleDuplicateSchedule = useCallback(() => {
    if (!schedule) return;

    // Create a deep copy of the current schedule
    const duplicatedSchedule: CleaningSchedulePlan = JSON.parse(JSON.stringify(schedule));
    
    setSchedule(duplicatedSchedule);
    setChecklistState({}); // Reset checklist for the new "copy"
    localStorage.removeItem('checklistState'); // Clear local storage too
    setError(null);
    setIsLoading(false); // Ensure loading is off if it somehow got stuck
  }, [schedule]);

  const triggerDuplicateConfirmation = () => {
      if (!schedule) return; // Only allow duplication if a schedule exists

      setDuplicateConfirmConfig({
          handler: handleDuplicateSchedule,
          message: (
              <p className="text-gray-600 dark:text-gray-300">
                  {t('confirmationDialog.duplicateScheduleMessage')}
              </p>
          ),
          title: t('confirmationDialog.duplicateScheduleTitle'),
      });
      setIsDuplicateConfirmOpen(true);
  };

  const handleConfirmAndDuplicate = () => {
      if (duplicateConfirmConfig?.handler) {
          duplicateConfirmConfig.handler();
      }
      setIsDuplicateConfirmOpen(false);
      setDuplicateConfirmConfig(null);
  };

  const noPdfFiltersSelected = !pdfExportFilters.daily && !pdfExportFilters.weekly && !pdfExportFilters.monthly;
  const noPdfChecklistFiltersSelected = !pdfChecklistFilters.daily && !pdfChecklistFilters.weekly && !pdfChecklistFilters.monthly; // NEW

  // Determine actual filter state for UI, potentially after `triggerPdfExport` has updated defaults
  const effectivePdfExportFilters = viewMode === 'schedule' 
    ? (pdfExportFilters.daily || pdfExportFilters.weekly || pdfExportFilters.monthly ? pdfExportFilters : { ...pdfExportFilters, daily: true })
    : (pdfChecklistFilters.daily || pdfChecklistFilters.weekly || pdfChecklistFilters.monthly ? pdfChecklistFilters : { ...pdfChecklistFilters, daily: true });

  const effectiveNoPdfFiltersSelected = viewMode === 'schedule' 
    ? !(effectivePdfExportFilters.daily || effectivePdfExportFilters.weekly || effectivePdfExportFilters.monthly)
    : !(effectivePdfExportFilters.daily || effectivePdfExportFilters.weekly || effectivePdfExportFilters.monthly);


  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      <Header onToggleTheme={handleThemeToggle} theme={theme} language={language} onLanguageChange={handleLanguageChange} />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="max-w-xl mx-auto mb-8">
            <label htmlFor="customHeader" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('main.departmentNameLabel')}
            </label>
            <input
              type="text"
              id="customHeader"
              value={customHeader}
              onChange={(e) => setCustomHeader(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-full shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
              placeholder={t('main.departmentNamePlaceholder')}
              aria-label="Custom PDF Header"
            />
            <div className="mt-4 flex items-center justify-center gap-4">
              <input
                  type="file"
                  id="logoUpload"
                  className="hidden"
                  accept="image/png, image/jpeg"
                  onChange={handleLogoUpload}
              />
              <label
                  htmlFor="logoUpload"
                  className="cursor-pointer bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-full text-sm transition-transform transform hover:scale-105"
              >
                  <i className="fas fa-upload me-2"></i>
                  {logo ? t('main.changeLogo') : t('main.uploadLogo')}
              </label>
              {logo && (
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-md border dark:border-gray-600 shadow-sm">
                      <img src={logo} alt="Company Logo" className="h-10 w-auto rounded-sm" />
                      <button
                          onClick={() => setLogo(null)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                          title={t('main.removeLogo')}
                          aria-label={t('main.removeLogo')}
                      >
                          <i className="fas fa-trash"></i>
                      </button>
                  </div>
              )}
            </div>
          </div>

          <div className="flex justify-center items-center gap-4 flex-wrap">
            <button
              onClick={handleGenerateSchedule}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 disabled:bg-blue-400 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                t('main.generatingButton')
              ) : (
                <>
                  <i className="fas fa-magic me-2"></i> {t('main.generateButton')}
                </>
              )}
            </button>
            <button
                onClick={() => setIsChemicalModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105"
            >
                <i className="fas fa-flask me-2"></i> {t('main.manageChemicalsButton')}
            </button>
            <button
                onClick={triggerDuplicateConfirmation}
                disabled={!schedule || isLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 disabled:bg-orange-400 disabled:cursor-not-allowed disabled:transform-none"
            >
                <i className="fas fa-copy me-2"></i> {t('main.duplicateScheduleButton')}
            </button>
          </div>
        </div>

        <div className="mt-12">
          {isLoading && <LoadingSpinner />}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center dark:bg-red-900/50 dark:border-red-700 dark:text-red-300" role="alert">
              <strong className="font-bold">Oops! </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {schedule && !isLoading && (
            <>
              <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="pdfFilename" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('pdfControls.filenameLabel')}</label>
                      <div className="flex items-center mt-1">
                        <input
                          type="text"
                          id="pdfFilename"
                          value={pdfFilename}
                          onChange={(e) => setPdfFilename(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          aria-label={t('pdfControls.filenameLabel')}
                        />
                        <span className="text-gray-500 dark:text-gray-400 ms-2">.pdf</span>
                      </div>
                    </div>
                    {viewMode === 'schedule' && (
                      <>
                        <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('pdfControls.pdfExportFilters.label')}</span>
                            <div className="mt-2 flex items-center gap-4">
                                {(['daily', 'weekly', 'monthly'] as const).map(filter => (
                                    <div key={filter} className="flex items-center">
                                        <input
                                            id={`pdf-filter-${filter}`}
                                            name={`pdf-filter-${filter}`}
                                            type="checkbox"
                                            checked={effectivePdfExportFilters[filter]}
                                            onChange={() => handlePdfFilterToggle(filter)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500"
                                        />
                                        <label htmlFor={`pdf-filter-${filter}`} className="ms-2 block text-sm text-gray-900 dark:text-gray-200">
                                            {t(`main.${filter}`)}
                                        </label>
                                    </div>
                                ))}
                            </div>
                             {effectiveNoPdfFiltersSelected && <p className="text-xs text-red-500 mt-1">{t('pdfControls.noFrequenciesSelected')}</p>}
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('pdfControls.pdfExportScope.label')}</span>
                            <div className="mt-2 flex items-center gap-4">
                                <div className="flex items-center">
                                    <input
                                        id="pdf-scope-full"
                                        name="pdf-export-scope"
                                        type="radio"
                                        value="full"
                                        checked={pdfExportScope === 'full'}
                                        onChange={(e) => setPdfExportScope(e.target.value as 'full' | 'filtered')}
                                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500"
                                    />
                                    <label htmlFor="pdf-scope-full" className="ms-2 block text-sm text-gray-900 dark:text-gray-200">
                                        {t('pdfControls.pdfExportScope.full')}
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="pdf-scope-filtered"
                                        name="pdf-export-scope"
                                        type="radio"
                                        value="filtered"
                                        checked={pdfExportScope === 'filtered'}
                                        onChange={(e) => setPdfExportScope(e.target.value as 'full' | 'filtered')}
                                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500"
                                    />
                                    <label htmlFor="pdf-scope-filtered" className="ms-2 block text-sm text-gray-900 dark:text-gray-200">
                                        {t('pdfControls.pdfExportScope.filtered')}
                                    </label>
                                </div>
                            </div>
                        </div>
                      </>
                    )}
                    {viewMode === 'checklist' && ( 
                      <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('pdfControls.pdfExportFilters.label')}</span>
                          <div className="mt-2 flex items-center gap-4">
                              {(['daily', 'weekly', 'monthly'] as const).map(filter => (
                                  <div key={`checklist-pdf-filter-${filter}`} className="flex items-center">
                                      <input
                                          id={`checklist-pdf-filter-${filter}`}
                                          name={`checklist-pdf-filter-${filter}`}
                                          type="checkbox"
                                          checked={effectivePdfExportFilters[filter]}
                                          onChange={() => handlePdfChecklistFilterToggle(filter)} 
                                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500"
                                      />
                                      <label htmlFor={`checklist-pdf-filter-${filter}`} className="ms-2 block text-sm text-gray-900 dark:text-gray-200">
                                          {t(`main.${filter}`)}
                                      </label>
                                  </div>
                              ))}
                          </div>
                          {effectiveNoPdfFiltersSelected && (
                            <p className="text-xs text-red-500 mt-1">{t('pdfControls.noFrequenciesSelected')}</p>
                          )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row md:flex-col gap-3 justify-center">
                    <button
                      onClick={triggerPdfExport}
                      disabled={effectiveNoPdfFiltersSelected}
                      className="w-full justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {viewMode === 'schedule' ? (
                          <><i className="fas fa-file-pdf me-2"></i> {t('pdfControls.exportPdfButton')}</>
                      ) : (
                          <><i className="fas fa-file-signature me-2"></i> {t('pdfControls.exportChecklistPdfButton')}</>
                      )}
                    </button>
                    <button
                      onClick={() => setViewMode(viewMode === 'schedule' ? 'checklist' : 'schedule')}
                      className="w-full justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center"
                    >
                      {viewMode === 'schedule' ? (
                        <><i className="fas fa-check-square me-2"></i> {t('pdfControls.checklistViewButton')}</>
                      ) : (
                        <><i className="fas fa-table me-2"></i> {t('pdfControls.scheduleViewButton')}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center items-center gap-3 mb-6 flex-wrap bg-gray-100 dark:bg-gray-800/50 p-3 rounded-full max-w-md mx-auto">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 me-2">{t('main.viewTasks')}</span>
                <button
                    onClick={() => handleFilterToggle('daily')}
                    className={`font-semibold py-1 px-4 rounded-full text-sm transition-all duration-200 ease-in-out transform hover:scale-105 ${activeFilters.daily ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm'}`}
                >
                    {t('main.daily')}
                </button>
                <button
                    onClick={() => handleFilterToggle('weekly')}
                    className={`font-semibold py-1 px-4 rounded-full text-sm transition-all duration-200 ease-in-out transform hover:scale-105 ${activeFilters.weekly ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm'}`}
                >
                    {t('main.weekly')}
                </button>
                <button
                    onClick={() => handleFilterToggle('monthly')}
                    className={`font-semibold py-1 px-4 rounded-full text-sm transition-all duration-200 ease-in-out transform hover:scale-105 ${activeFilters.monthly ? 'bg-yellow-500 text-white shadow-md' : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm'}`}
                >
                    {t('main.monthly')}
                </button>
              </div>

              {viewMode === 'schedule' ? (
                <ScheduleDisplay 
                    schedulePlan={schedule} 
                    chemicals={chemicals}
                    onAssociateChemical={handleAssociateChemical}
                    activeFilters={activeFilters}
                />
              ) : (
                <ScheduleChecklist 
                  schedulePlan={schedule}
                  checklistState={checklistState}
                  onToggleCheck={handleToggleCheck}
                  onResetChecks={handleResetChecks}
                  chemicals={chemicals}
                  onAssociateChemical={handleAssociateChemical}
                  onUpdateTaskNotes={handleUpdateTaskNotes}
                  activeFilters={activeFilters}
                />
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
      
      <ChemicalManager 
        isOpen={isChemicalModalOpen}
        onClose={() => setIsChemicalModalOpen(false)}
        chemicals={chemicals}
        onAdd={handleAddChemical}
        onBulkAdd={handleBulkAddChemicals}
        onUpdate={handleUpdateChemical}
        onDelete={handleDeleteChemical}
        customHeader={customHeader}
        logo={logo}
        language={language}
      />

      <ConfirmationDialog
        isOpen={isPdfConfirmOpen}
        onClose={() => setIsPdfConfirmOpen(false)}
        onConfirm={handleConfirmAndExport}
        title={pdfExportConfig?.title || t('confirmationDialog.exportTitle')}
      >
        {pdfExportConfig?.message}
      </ConfirmationDialog>

      <ConfirmationDialog
        isOpen={isDuplicateConfirmOpen}
        onClose={() => setIsDuplicateConfirmOpen(false)}
        onConfirm={handleConfirmAndDuplicate}
        title={duplicateConfirmConfig?.title || t('confirmationDialog.duplicateScheduleTitle')}
      >
        {duplicateConfirmConfig?.message}
      </ConfirmationDialog>
    </div>
  );
};

export default App;