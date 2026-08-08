
import React, { useState, useEffect, useMemo } from 'react';
import type { Chemical } from '../types';
import { exportChemicalsToPDF } from '../services/pdfService';
import { extractChemicalInfoFromPdf } from '../services/geminiService';
import { calculateSafetyPenalty } from '../services/chemicalMatcherService';
import { t, Language } from '../i18n';
import { PPE_OPTIONS } from '../constants';

interface ChemicalManagerProps {
  isOpen: boolean;
  onClose: () => void;
  chemicals: Chemical[];
  onAdd: (chemical: Omit<Chemical, 'id'>) => void;
  onBulkAdd: (chemicals: Omit<Chemical, 'id'>[]) => void;
  onUpdate: (chemical: Chemical) => void;
  onDelete: (id: string) => void;
  customHeader: string;
  logo: string | null;
  language: Language;
  pdfFilename: string;
}

const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } } 
        else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.8)); } 
        else { reject(new Error('Canvas context not available')); }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

const getSafetyLevel = (chem: Chemical): 'high' | 'medium' | 'low' => {
    const penalty = calculateSafetyPenalty(chem);
    if (penalty >= 100) return 'high';
    if (penalty >= 40) return 'medium';
    return 'low';
};

const ChemicalManager: React.FC<ChemicalManagerProps> = ({ isOpen, onClose, chemicals, onAdd, onBulkAdd, onUpdate, onDelete, customHeader, logo, language, pdfFilename }) => {
  const [name, setName] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [usedFor, setUsedFor] = useState('');
  const [application, setApplication] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [image, setImage] = useState<string | null>(null);
  const [toxicologicalInfo, setToxicologicalInfo] = useState('');
  const [personalProtection, setPersonalProtection] = useState('');
  const [ppeList, setPpeList] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showFilters, setShowFilters] = useState(false);
  const [activeSafetyFilter, setActiveSafetyFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [activePpeFilters, setActivePpeFilters] = useState<string[]>([]);
  const [activeKeywordFilter, setActiveKeywordFilter] = useState<string>('');

  const [view, setView] = useState<'form' | 'import'>('form');
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [extractedChemicalsList, setExtractedChemicalsList] = useState<Omit<Chemical, 'id' | 'color' | 'image'>[]>([]);

  useEffect(() => {
    if (!isOpen) { resetForm(); setView('form'); setImportText(''); setImportStatus(null); setSearchTerm(''); setExtractedChemicalsList([]); setShowFilters(false); resetFilters(); }
  }, [isOpen]);

  const resetForm = () => { setName(''); setActiveIngredient(''); setUsedFor(''); setApplication(''); setColor('#3b82f6'); setImage(null); setToxicologicalInfo(''); setPersonalProtection(''); setPpeList([]); setEditingId(null); setExtractionStatus(null); setIsExtracting(false); setExtractedChemicalsList([]); };
  const resetFilters = () => { setActiveSafetyFilter('all'); setActivePpeFilters([]); setActiveKeywordFilter(''); };

  const handleEdit = (chemical: Chemical) => {
    setView('form'); setEditingId(chemical.id); setName(chemical.name); setActiveIngredient(chemical.activeIngredient); setUsedFor(chemical.usedFor); setApplication(chemical.application); setColor(chemical.color || '#3b82f6'); setImage(chemical.image || null); setToxicologicalInfo(chemical.toxicologicalInfo || ''); setPersonalProtection(chemical.personalProtection || ''); setPpeList(chemical.ppeList || []);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const resized = await resizeImage(file, 400, 400);
        setImage(resized);
      } catch (err) {
        console.error("Image upload failed:", err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !usedFor || !application) { alert(t('chemicalManager.alertRequiredFields')); return; }
    const data = { name, activeIngredient, usedFor, application, color, image, toxicologicalInfo, personalProtection, ppeList };
    if (editingId) onUpdate({ ...data, id: editingId }); else onAdd(data);
    resetForm();
  };

  const handleBulkImport = () => {
    if (!importText.trim()) { setImportStatus({ message: t('chemicalManager.importEmpty'), type: 'error' }); return; }
    const lines = importText.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));
    const newChems: Omit<Chemical, 'id'>[] = [];
    lines.forEach(line => {
      const p = line.split(';').map(x => x.trim());
      if (p.length >= 6) newChems.push({ name: p[0], activeIngredient: p[1], usedFor: p[2], application: p[3], toxicologicalInfo: p[4], personalProtection: p[5], color: (p[6]?.startsWith('#')) ? p[6] : undefined });
    });
    if (newChems.length > 0) onBulkAdd(newChems);
    setImportStatus({ message: t('chemicalManager.importSuccess', newChems.length), type: 'success' }); setImportText('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsExtracting(true); setExtractionStatus(null); setExtractedChemicalsList([]);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = (e.target?.result as string).split(',')[1];
        const data = await extractChemicalInfoFromPdf(base64);
        setExtractedChemicalsList(data);
        if (data.length === 1) {
            const c = data[0]; setName(c.name); setActiveIngredient(c.activeIngredient); setUsedFor(c.usedFor); setApplication(c.application); setToxicologicalInfo(c.toxicologicalInfo || ''); setPersonalProtection(c.personalProtection || ''); setPpeList((c.ppeList || []));
            setExtractionStatus({ message: t('chemicalManager.extractionSuccess'), type: 'success' });
        } else setExtractionStatus({ message: `Identified ${data.length} products.`, type: 'success' });
      } catch (err: any) { setExtractionStatus({ message: err.message || t('errors.pdfExtractionFailed'), type: 'error' }); } finally { setIsExtracting(false); }
    };
    reader.readAsDataURL(file); event.target.value = ''; 
  };

  const uniqueKeywords = useMemo(() => {
    const kws = new Set<string>(); chemicals.forEach(c => c.usedFor.split(',').forEach(k => { const t = k.trim().toLowerCase(); if (t) kws.add(t); })); return Array.from(kws).sort();
  }, [chemicals]);

  const filteredChemicals = useMemo(() => {
    return chemicals.filter(chem => {
      const content = (chem.name + (chem.activeIngredient || '') + chem.usedFor).toLowerCase();
      if (searchTerm && !content.includes(searchTerm.toLowerCase())) return false;
      if (activeSafetyFilter !== 'all' && getSafetyLevel(chem) !== activeSafetyFilter) return false;
      if (activePpeFilters.length > 0 && !(activePpeFilters.every(p => (chem.ppeList || []).includes(p)))) return false;
      if (activeKeywordFilter && !(chem.usedFor.split(',').map(k => k.trim().toLowerCase()).includes(activeKeywordFilter.toLowerCase()))) return false;
      return true;
    });
  }, [chemicals, searchTerm, activeSafetyFilter, activePpeFilters, activeKeywordFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 transition-all" onClick={onClose}>
      <div className="bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col animate-fade-in-up overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">{t('chemicalManager.title')}</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Chemical Database Management</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all"><i className="fas fa-times text-xl"></i></button>
        </div>
        
        <div className="flex-grow overflow-hidden lg:flex">
          <div className="lg:w-5/12 border-r border-slate-200 dark:border-slate-800 p-8 overflow-y-auto bg-white dark:bg-slate-900/50">
            <div className="flex gap-2 mb-8 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
              <button onClick={() => setView('form')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all ${view === 'form' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{editingId ? t('chemicalManager.editChemicalTab') : t('chemicalManager.addSingleTab')}</button>
              <button onClick={() => setView('import')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all ${view === 'import' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('chemicalManager.bulkImportTab')}</button>
            </div>
            
            {view === 'form' ? (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-3 mb-4">
                        <i className="fas fa-wand-magic-sparkles text-blue-600"></i>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">AI Extraction Engine</span>
                    </div>
                    <input type="file" id="pdf-extraction-mgr" className="hidden" accept=".pdf" onChange={handleFileChange} />
                    <label htmlFor="pdf-extraction-mgr" className={`w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg shadow-blue-500/20 ${isExtracting ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                        {isExtracting ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-file-pdf"></i>}
                        {isExtracting ? 'ANALYZING DOCUMENT...' : t('chemicalManager.extractFromPdfButton')}
                    </label>
                    {extractionStatus && (
                        <div className={`mt-4 p-3 rounded-xl border text-xs font-medium ${extractionStatus.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-600' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-600'}`}>
                            {extractionStatus.message}
                            {extractedChemicalsList.length > 1 && <button onClick={() => { onBulkAdd(extractedChemicalsList); setExtractedChemicalsList([]); }} className="mt-3 w-full bg-emerald-600 text-white py-2 rounded-lg font-bold">Import All Findings</button>}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="h-16 w-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                            {image ? <img src={image} className="w-full h-full object-cover" /> : <i className="fas fa-flask text-2xl text-slate-300"></i>}
                        </div>
                        <div className="flex-grow">
                            <input type="file" id="img-mgr" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            <label htmlFor="img-mgr" className="cursor-pointer inline-flex bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-xs font-bold hover:border-blue-500 transition-all shadow-sm">{t('chemicalManager.uploadImageButton')}</label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">{t('chemicalManager.nameLabel')}</label>
                          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" required />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">{t('chemicalManager.colorLabel')}</label>
                          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-[46px] p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"/>
                        </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">{t('chemicalManager.activeIngredientLabel')}</label>
                      <input type="text" value={activeIngredient} onChange={e => setActiveIngredient(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-all" />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">{t('chemicalManager.usedForLabel')}</label>
                      <input type="text" value={usedFor} onChange={e => setUsedFor(e.target.value)} placeholder={t('chemicalManager.usedForPlaceholder')} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-all" required />
                      <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{t('chemicalManager.usedForHelpText')}</p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">{t('chemicalManager.applicationLabel')}</label>
                      <textarea value={application} onChange={e => setApplication(e.target.value)} rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-all resize-none"></textarea>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <label className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <i className="fas fa-shield-virus text-blue-500"></i> {t('chemicalManager.ppeChecklistLabel')}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {PPE_OPTIONS.map(opt => (
                                <button key={opt.id} type="button" onClick={() => setPpeList(prev => prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id])} className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${ppeList.includes(opt.id) ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'}`}>
                                    <i className={`fas ${opt.icon} text-[10px] w-4 text-center`}></i>
                                    <span className="text-[10px] font-bold truncate">{t(opt.label)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 sticky bottom-0 bg-white dark:bg-slate-900 py-4 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={resetForm} className="px-6 py-3 rounded-xl text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-all">{t('chemicalManager.resetButton')}</button>
                        <button type="submit" className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                            {editingId ? t('chemicalManager.updateButton') : t('chemicalManager.saveButton')}
                        </button>
                    </div>
                </form>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{t('chemicalManager.bulkImportTitle')}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">{t('chemicalManager.bulkImportInstruction1')}</p>
                    <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-[10px] text-slate-400 font-mono mb-4 italic">
                        {t('chemicalManager.bulkImportFormat')}
                    </div>
                    <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={12} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-inner" placeholder={t('chemicalManager.bulkImportPlaceholder')}></textarea>
                    <button onClick={handleBulkImport} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-all">{t('chemicalManager.importButton')}</button>
                    {importStatus && <div className={`mt-4 p-4 rounded-xl border text-xs font-bold ${importStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{importStatus.message}</div>}
                </div>
              </div>
            )}
          </div>
          
          <div className="lg:w-7/12 p-8 flex flex-col bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">{t('chemicalManager.chemicalListTitle')}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Records: {filteredChemicals.length}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${showFilters ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-500'}`}>{t('chemicalManager.filters.title')}</button>
                    <button onClick={() => exportChemicalsToPDF(chemicals, customHeader, pdfFilename, logo, language)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transform active:scale-95 transition-all flex items-center gap-2">
                        <i className="fas fa-file-pdf text-[10px]"></i> PDF List
                    </button>
                </div>
            </div>
            
            <div className="relative mb-6">
                <input type="text" placeholder={t('chemicalManager.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full ps-11 pe-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all shadow-sm" />
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
            </div>

            {showFilters && (
                <div className="mb-6 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in space-y-6">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Active Filters</span>
                        <button onClick={resetFilters} className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest">{t('chemicalManager.filters.clearAll')}</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('chemicalManager.filters.safetyLevel')}</label>
                            <div className="flex flex-wrap gap-1.5">
                                {(['all', 'low', 'medium', 'high'] as const).map(lvl => (
                                    <button key={lvl} onClick={() => setActiveSafetyFilter(lvl)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${activeSafetyFilter === lvl ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'}`}>{lvl.toUpperCase()}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('chemicalManager.filters.usedFor')}</label>
                            <select value={activeKeywordFilter} onChange={(e) => setActiveKeywordFilter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl p-2.5 text-xs outline-none focus:border-blue-500 transition-all font-bold">
                                <option value="">{t('chemicalManager.filters.selectKeyword')}</option>
                                {uniqueKeywords.map(kw => <option key={kw} value={kw}>{kw.toUpperCase()}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {filteredChemicals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <i className="fas fa-flask-vial text-5xl text-slate-200 mb-4"></i>
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">{t('chemicalManager.noSearchResults')}</p>
                  </div>
                ) : (
                    filteredChemicals.map(chem => {
                        const level = getSafetyLevel(chem);
                        const colors = { 
                            high: 'bg-red-500 dark:bg-red-600 text-white', 
                            medium: 'bg-amber-400 text-slate-900', 
                            low: 'bg-emerald-500 dark:bg-emerald-600 text-white' 
                        };
                        return (
                        <div key={chem.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm hover:border-blue-500/50 transition-all group relative overflow-hidden flex flex-col sm:flex-row gap-6">
                            <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: chem.color }}></div>
                            <div className="h-24 w-24 sm:h-28 sm:w-28 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex-shrink-0 relative group-hover:scale-105 transition-all duration-300 overflow-hidden shadow-inner">
                                {chem.image ? <img src={chem.image} className="h-full w-full object-cover" /> : <i className="fas fa-flask text-3xl text-slate-200 absolute inset-0 m-auto h-fit w-fit"></i>}
                                <div className={`absolute bottom-0 left-0 right-0 py-1 text-[8px] font-black text-center uppercase tracking-widest ${colors[level]}`}>{level} risk</div>
                            </div>
                            <div className="flex-grow min-w-0 flex flex-col justify-center">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="min-w-0">
                                        <h4 className="font-extrabold text-lg text-slate-900 dark:text-white uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">{chem.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mt-0.5">{chem.activeIngredient || 'Component details restricted'}</p>
                                    </div>
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => handleEdit(chem)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all shadow-sm"><i className="fas fa-edit text-xs"></i></button>
                                        <button onClick={() => onDelete(chem.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 transition-all shadow-sm"><i className="fas fa-trash-alt text-xs"></i></button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {(chem.ppeList || []).map(p => <div key={p} className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 dark:bg-slate-800 text-slate-400 text-[10px] border border-slate-100 dark:border-slate-700" title={t(PPE_OPTIONS.find(o => o.id === p)?.label || p)}><i className={`fas ${PPE_OPTIONS.find(o => o.id === p)?.icon || 'fa-shield'}`}></i></div>)}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {(chem.usedFor || '').split(',').map(k => k.trim()).filter(Boolean).slice(0, 4).map((k, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded border border-blue-100 dark:border-blue-900/40">{k}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )})
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChemicalManager;
