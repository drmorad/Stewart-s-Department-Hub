
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { CleaningSchedulePlan, ChecklistState, Chemical, ActiveFilters } from './types';
import { generateCleaningSchedule } from './services/geminiService';
import { exportScheduleToPDF, exportChecklistToPDF } from './services/pdfService';
import { findBestChemicalForTask } from './services/chemicalMatcherService';
import { initGoogleDrive, authenticateDrive, syncToCloud, loadFromCloud } from './services/googleDriveService';
import Header from './components/Header';
import ScheduleDisplay from './components/ScheduleDisplay';
import ScheduleChecklist from './components/ScheduleChecklist';
import LoadingSpinner from './components/LoadingSpinner';
import Footer from './components/Footer';
import ChemicalManager from './components/ChemicalManager';
import ConfirmationDialog from './components/ConfirmationDialog';
import DependencySelector from './components/DependencySelector';
import SyncManager from './components/SyncManager';
import { t, setLanguage, Language } from './i18n';

const App: React.FC = () => {
  // --- Data State ---
  const [schedule, setSchedule] = useState<CleaningSchedulePlan | null>(() => {
    try {
      const savedSchedule = localStorage.getItem('cleaningSchedule');
      return savedSchedule ? JSON.parse(savedSchedule) : null;
    } catch { return null; }
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
    } catch { return {}; }
  });

  const [chemicals, setChemicals] = useState<Chemical[]>(() => {
    try {
      const savedChemicals = localStorage.getItem('chemicals');
      return savedChemicals ? JSON.parse(savedChemicals) : [];
    } catch { return []; }
  });

  // --- Cloud Sync State ---
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(() => localStorage.getItem('isCloudConnected') === 'true');
  const [cloudUserData, setCloudUserData] = useState(() => {
    try {
      const saved = localStorage.getItem('cloudUserData');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(() => {
    const saved = localStorage.getItem('lastSync');
    return saved ? new Date(saved) : null;
  });

  const syncTimeoutRef = useRef<any | null>(null);

  // --- PDF Export Config State ---
  const [isPdfConfirmOpen, setIsPdfConfirmOpen] = useState(false);
  const [pdfFilename, setPdfFilename] = useState<string>('cleaning_schedule');
  const [pdfFrequencies, setPdfFrequencies] = useState<ActiveFilters>({ daily: true, weekly: true, monthly: true });
  const [pdfExportScope, setPdfExportScope] = useState<'full' | 'filtered'>('full');
  const [pdfOrientation, setPdfOrientation] = useState<'p' | 'l'>('p');
  const [pdfIncludeNotes, setPdfIncludeNotes] = useState<boolean>(true);
  const [pdfIncludeChemicals, setPdfIncludeChemicals] = useState<boolean>(true);

  // --- Other UI State ---
  const [isChemicalModalOpen, setIsChemicalModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({ daily: true, weekly: true, monthly: true });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');
  const [language, _setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'en');
  const [dependencyModalOpen, setDependencyModalOpen] = useState(false);
  const [currentDependencyTask, setCurrentDependencyTask] = useState<{ id: string, prerequisites: string[] } | null>(null);

  // --- Initialization ---
  useEffect(() => {
    initGoogleDrive().catch(console.error);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // --- Persistent Storage Sync ---
  useEffect(() => {
    localStorage.setItem('customHeader', customHeader);
    localStorage.setItem('customLogo', logo || '');
    localStorage.setItem('cleaningSchedule', JSON.stringify(schedule));
    localStorage.setItem('checklistState', JSON.stringify(checklistState));
    localStorage.setItem('chemicals', JSON.stringify(chemicals));
    localStorage.setItem('isCloudConnected', String(isCloudConnected));
    localStorage.setItem('cloudUserData', JSON.stringify(cloudUserData));
    if (lastSync) localStorage.setItem('lastSync', lastSync.toISOString());

    if (isCloudConnected) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        handleCloudSync();
      }, 3000);
    }
  }, [schedule, checklistState, chemicals, customHeader, logo, isCloudConnected]);

  // --- Cloud Actions ---
  const handleCloudSync = async () => {
    if (!isCloudConnected || isSyncing) return;
    setIsSyncing(true);
    try {
      const payload = {
        schedule,
        checklistState,
        chemicals,
        customHeader,
        logo,
        version: 1.1
      };
      await syncToCloud(payload);
      setLastSync(new Date());
    } catch (e) {
      console.error('Auto-sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectDrive = async () => {
    try {
      const { user } = await authenticateDrive();
      setCloudUserData(user);
      setIsCloudConnected(true);
      const cloudData = await loadFromCloud();
      if (cloudData) {
        if (confirm(t('sync.dataFoundMessage'))) {
          applyCloudData(cloudData);
        }
      }
    } catch (e) {
      alert(t('errors.driveConnectFailed'));
    }
  };

  const applyCloudData = (data: any) => {
    if (data.schedule) setSchedule(data.schedule);
    if (data.checklistState) setChecklistState(data.checklistState);
    if (data.chemicals) setChemicals(data.chemicals);
    if (data.customHeader) setCustomHeader(data.customHeader);
    if (data.logo) setLogo(data.logo);
    setLastSync(new Date());
  };

  const handleDownloadFromCloud = async () => {
    setIsSyncing(true);
    try {
      const cloudData = await loadFromCloud();
      if (cloudData) {
        applyCloudData(cloudData);
      } else {
        alert(t('sync.noDataOnCloud'));
      }
    } catch (e) {
      alert(t('errors.cloudDownloadFailed'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectDrive = () => {
    setIsCloudConnected(false);
    setCloudUserData(null);
    localStorage.removeItem('isCloudConnected');
    localStorage.removeItem('cloudUserData');
  };

  // --- UI Handlers ---
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    _setLanguage(lang);
  };

  const handleThemeToggle = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const executePdfExport = () => {
    if (!schedule) return;
    
    // Validate frequencies
    if (!pdfFrequencies.daily && !pdfFrequencies.weekly && !pdfFrequencies.monthly) {
        alert(t('pdfControls.noFrequenciesSelected'));
        return;
    }

    if (viewMode === 'schedule') {
      exportScheduleToPDF(
        schedule, 
        customHeader, 
        pdfFrequencies, 
        pdfFilename, 
        chemicals, 
        logo, 
        language, 
        pdfExportScope, 
        activeFilters,
        pdfOrientation,
        pdfIncludeNotes,
        pdfIncludeChemicals
      );
    } else {
      exportChecklistToPDF(
        schedule, 
        checklistState, 
        customHeader, 
        pdfFilename, 
        chemicals, 
        logo, 
        language, 
        pdfFrequencies, 
        pdfExportScope, 
        activeFilters,
        pdfOrientation,
        pdfIncludeNotes,
        pdfIncludeChemicals
      );
    }
    setIsPdfConfirmOpen(false);
  };

  const handleGenerateSchedule = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const generatedSchedule = await generateCleaningSchedule();
      setSchedule(generatedSchedule);
      const updatedSchedule = JSON.parse(JSON.stringify(generatedSchedule));
      updatedSchedule.schedule.forEach((cat: any) => {
        cat.items.forEach((item: any) => {
          ['daily', 'weekly', 'monthly'].forEach(freq => {
            if (!item[freq].chemicalId) {
              item[freq].chemicalId = findBestChemicalForTask(item.itemName, item[freq].task, chemicals);
            }
          });
        });
      });
      setSchedule(updatedSchedule);
    } catch (err) {
      setError(t('errors.scheduleGenerationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssociateChemical = (catIdx: number, itemIdx: number, freq: 'daily'|'weekly'|'monthly', chemId: string | null) => {
    if (!schedule) return;
    const newSchedule = JSON.parse(JSON.stringify(schedule));
    newSchedule.schedule[catIdx].items[itemIdx][freq].chemicalId = chemId;
    setSchedule(newSchedule);
  };

  const handleToggleCheck = (catIdx: number, itemIdx: number, freq: 'daily'|'weekly'|'monthly') => {
    setChecklistState(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[catIdx]) next[catIdx] = {};
      if (!next[catIdx][itemIdx]) next[catIdx][itemIdx] = { daily: false, weekly: false, monthly: false };
      next[catIdx][itemIdx][freq] = !next[catIdx][itemIdx][freq];
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900">
      <Header 
        onToggleTheme={handleThemeToggle} 
        theme={theme} 
        language={language} 
        onLanguageChange={handleLanguageChange} 
        syncStatus={isCloudConnected ? (isSyncing ? 'syncing' : 'connected') : 'none'}
        onOpenSync={() => setIsSyncModalOpen(true)}
      />

      <main className="flex-grow container mx-auto px-4 py-8 animate-fade-in">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
            <label htmlFor="customHeader" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">{t('main.departmentNameLabel')}</label>
            <input
              type="text" id="customHeader" value={customHeader}
              onChange={(e) => setCustomHeader(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-slate-900 dark:text-white outline-none transition-all text-center font-bold text-xl"
              placeholder={t('main.departmentNamePlaceholder')}
            />
            
            <div className="mt-8 flex items-center justify-center gap-6">
              <input type="file" id="logoUpload" className="hidden" accept="image/png, image/jpeg" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (re) => setLogo(re.target?.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              <label htmlFor="logoUpload" className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-300 font-bold py-3 px-8 rounded-xl text-sm transition-all shadow-sm hover:shadow-md flex items-center gap-2">
                <i className="fas fa-image text-blue-500"></i> {logo ? t('main.changeLogo') : t('main.uploadLogo')}
              </label>
              {logo && (
                <div className="relative group p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                  <img src={logo} alt="Logo" className="h-12 w-auto object-contain rounded" />
                  <button onClick={() => setLogo(null)} className="absolute -top-3 -right-3 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center items-center gap-4 flex-wrap">
            <button 
                onClick={handleGenerateSchedule} 
                disabled={isLoading} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-3"
            >
              {isLoading ? <><i className="fas fa-circle-notch fa-spin"></i> {t('main.generatingButton')}</> : <><i className="fas fa-wand-magic-sparkles"></i> {t('main.generateButton')}</>}
            </button>
            <button 
                onClick={() => setIsChemicalModalOpen(true)} 
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold py-4 px-10 rounded-2xl hover:border-blue-500 transition-all shadow-sm active:scale-95 flex items-center gap-3"
            >
                <i className="fas fa-flask-vial text-blue-500"></i> {t('main.manageChemicalsButton')}
            </button>
          </div>
        </div>

        <div className="min-h-[400px]">
          {isLoading && <LoadingSpinner />}
          {error && <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold text-center animate-fade-in shadow-sm">{error}</div>}
          
          {schedule && !isLoading && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                    <button 
                      onClick={() => setViewMode('schedule')} 
                      className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${viewMode === 'schedule' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      <i className="fas fa-calendar-days me-2"></i> {t('pdfControls.scheduleViewButton')}
                    </button>
                    <button 
                      onClick={() => setViewMode('checklist')} 
                      className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${viewMode === 'checklist' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      <i className="fas fa-list-check me-2"></i> {t('pdfControls.checklistViewButton')}
                    </button>
                  </div>

                  <button 
                    onClick={() => setIsPdfConfirmOpen(true)} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-3 active:scale-95 transition-all text-sm"
                  >
                    <i className="fas fa-file-pdf"></i> 
                    {t('pdfControls.exportPdfButton')}
                  </button>
              </div>
              
              <div className="flex justify-center items-center gap-3 flex-wrap">
                {(['daily', 'weekly', 'monthly'] as const).map(f => (
                  <button 
                    key={f} 
                    onClick={() => setActiveFilters(p => ({...p, [f]: !p[f]}))} 
                    className={`font-bold py-2 px-6 rounded-full text-xs uppercase tracking-wider transition-all border ${activeFilters[f] ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
                  >
                    {t(`main.${f}`)}
                  </button>
                ))}
              </div>

              {viewMode === 'schedule' ? (
                <ScheduleDisplay 
                  schedulePlan={schedule} chemicals={chemicals} onAssociateChemical={handleAssociateChemical} activeFilters={activeFilters}
                  onOpenDependencySelector={(id, deps) => { setCurrentDependencyTask({id, prerequisites: deps}); setDependencyModalOpen(true); }}
                  checklistState={checklistState}
                />
              ) : (
                <ScheduleChecklist 
                  schedulePlan={schedule} checklistState={checklistState} onToggleCheck={handleToggleCheck}
                  onResetChecks={(f) => setChecklistState(prev => {
                    const next = JSON.parse(JSON.stringify(prev));
                    Object.keys(next).forEach(c => Object.keys(next[Number(c)]).forEach(i => next[Number(c)][Number(i)][f] = false));
                    return next;
                  })}
                  chemicals={chemicals} onAssociateChemical={handleAssociateChemical}
                  onUpdateTaskNotes={(c, i, f, n) => {
                    if (!schedule) return;
                    const ns = JSON.parse(JSON.stringify(schedule));
                    ns.schedule[c].items[i][f].notes = n;
                    setSchedule(ns);
                  }}
                  activeFilters={activeFilters}
                />
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
      
      <ChemicalManager 
        isOpen={isChemicalModalOpen} onClose={() => setIsChemicalModalOpen(false)}
        chemicals={chemicals} onAdd={c => setChemicals(p => [...p, {...c, id: Date.now().toString()}])}
        onBulkAdd={cs => setChemicals(p => [...p, ...cs.map((c, i) => ({...c, id: `${Date.now()}-${i}`}))])}
        onUpdate={c => setChemicals(p => p.map(x => x.id === c.id ? c : x))}
        onDelete={id => setChemicals(p => p.filter(x => x.id !== id))}
        customHeader={customHeader} logo={logo} language={language}
        pdfFilename={pdfFilename}
      />

      <SyncManager 
        isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)}
        isConnected={isCloudConnected} onConnect={handleConnectDrive} onDisconnect={handleDisconnectDrive}
        lastSync={lastSync} isSyncing={isSyncing} userData={cloudUserData}
        onForceSync={handleCloudSync} onLoadFromCloud={handleDownloadFromCloud}
      />

      <ConfirmationDialog 
        isOpen={isPdfConfirmOpen} 
        onClose={() => setIsPdfConfirmOpen(false)} 
        onConfirm={executePdfExport} 
        title={t('confirmationDialog.exportTitle')}
      >
        <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    {t('pdfControls.filenameLabel')}
                </label>
                <div className="flex items-center gap-3">
                    <input
                      type="text" 
                      value={pdfFilename} 
                      onChange={(e) => setPdfFilename(e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold rounded-lg outline-none focus:border-blue-500 transition-all"
                    />
                    <span className="text-slate-400 font-bold">.pdf</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-3">{t('pdfControls.pdfExportFilters.label')}</label>
                    <div className="flex gap-2">
                        {(['daily', 'weekly', 'monthly'] as const).map(f => (
                            <button 
                                key={f}
                                onClick={() => setPdfFrequencies(prev => ({...prev, [f]: !prev[f]}))}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${pdfFrequencies[f] ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800'}`}
                            >
                                {f.charAt(0).toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-3">{t('pdfControls.orientationLabel')}</label>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setPdfOrientation('p')}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${pdfOrientation === 'p' ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800'}`}
                        >
                            Portrait
                        </button>
                        <button 
                            onClick={() => setPdfOrientation('l')}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${pdfOrientation === 'l' ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800'}`}
                        >
                            Landscape
                        </button>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={pdfIncludeNotes} onChange={() => setPdfIncludeNotes(!pdfIncludeNotes)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors">{t('pdfControls.includeNotesLabel')}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={pdfIncludeChemicals} onChange={() => setPdfIncludeChemicals(!pdfIncludeChemicals)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors">{t('pdfControls.includeChemicalsLabel')}</span>
                    </label>
                </div>
            </div>
        </div>
      </ConfirmationDialog>

      {schedule && currentDependencyTask && (
        <DependencySelector
          isOpen={dependencyModalOpen} onClose={() => setDependencyModalOpen(false)}
          schedule={schedule} currentTaskId={currentDependencyTask.id} currentPrerequisites={currentDependencyTask.prerequisites}
          onSave={(id, deps) => {
            const ns = JSON.parse(JSON.stringify(schedule));
            let found = false;
            for (const cat of ns.schedule) {
              for (const item of cat.items) {
                for (const f of ['daily', 'weekly', 'monthly']) {
                  if (item[f].id === id) { item[f].prerequisites = deps; found = true; break; }
                }
                if (found) break;
              }
              if (found) break;
            }
            setSchedule(ns);
          }}
        />
      )}
    </div>
  );
};

export default App;
