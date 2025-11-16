import React, { useState, useEffect, useRef } from 'react';
import type { Chemical } from '../types';
import { exportChemicalsToPDF } from '../services/pdfService';
import { extractChemicalInfoFromPdf } from '../services/geminiService';
import ConfirmationDialog from './ConfirmationDialog';
import { t, Language } from '../i18n';

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
}

const ChemicalManager: React.FC<ChemicalManagerProps> = ({ isOpen, onClose, chemicals, onAdd, onBulkAdd, onUpdate, onDelete, customHeader, logo, language }) => {
  const [name, setName] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [usedFor, setUsedFor] = useState('');
  const [application, setApplication] = useState('');
  const [color, setColor] = useState('#cccccc');
  const [image, setImage] = useState<string | null>(null);
  const [toxicologicalInfo, setToxicologicalInfo] = useState('');
  const [personalProtection, setPersonalProtection] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState('chemical_list');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<'form' | 'import'>('form');
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [isPdfConfirmOpen, setIsPdfConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setView('form');
      setImportText('');
      setImportStatus(null);
      setSearchTerm('');
    }
  }, [isOpen]);

  const resetForm = () => {
    setName('');
    setActiveIngredient('');
    setUsedFor('');
    setApplication('');
    setColor('#cccccc');
    setImage(null);
    setToxicologicalInfo('');
    setPersonalProtection('');
    setEditingId(null);
    setExtractionStatus(null);
    setIsExtracting(false);
  };

  const handleEdit = (chemical: Chemical) => {
    setView('form');
    setEditingId(chemical.id);
    setName(chemical.name);
    setActiveIngredient(chemical.activeIngredient);
    setUsedFor(chemical.usedFor);
    setApplication(chemical.application);
    setColor(chemical.color || '#cccccc');
    setImage(chemical.image || null);
    setToxicologicalInfo(chemical.toxicologicalInfo || '');
    setPersonalProtection(chemical.personalProtection || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !usedFor || !application) {
        alert(t('chemicalManager.alertRequiredFields'));
        return;
    }

    const chemicalData = { name, activeIngredient, usedFor, application, color, image, toxicologicalInfo, personalProtection };
    if (editingId) {
      onUpdate({ ...chemicalData, id: editingId });
    } else {
      onAdd(chemicalData);
    }
    resetForm();
  };

  const triggerPdfExportConfirmation = () => {
    setIsPdfConfirmOpen(true);
  };

  const handleConfirmAndExport = () => {
    exportChemicalsToPDF(chemicals, customHeader, pdfFilename, logo, language);
    setIsPdfConfirmOpen(false);
  };

  const handleBulkImport = () => {
    if (!importText.trim()) {
      setImportStatus({ message: t('chemicalManager.importEmpty'), type: 'error' });
      return;
    }

    const lines = importText.split('\n').filter(line => line.trim() !== '');
    const newChemicals: Omit<Chemical, 'id'>[] = [];
    let failedCount = 0;

    lines.forEach(line => {
      const parts = line.split(';').map(p => p.trim());
       if (parts.length >= 6) { // Minimum required fields for a valid entry
        const newChem: Omit<Chemical, 'id'> = {
          name: parts[0],
          activeIngredient: parts[1],
          usedFor: parts[2],
          application: parts[3],
          toxicologicalInfo: parts[4] || undefined,
          personalProtection: parts[5] || undefined,
          color: (parts[6] && parts[6].startsWith('#')) ? parts[6] : undefined,
        };
        newChemicals.push(newChem);
      } else {
        failedCount++;
      }
    });

    if (newChemicals.length > 0) {
      onBulkAdd(newChemicals);
    }

    let statusMessage = '';
    if (newChemicals.length > 0) {
      statusMessage += t('chemicalManager.importSuccess', newChemicals.length) + ' ';
    }
    if (failedCount > 0) {
      statusMessage += t('chemicalManager.importSkipped', failedCount);
    }
    
    setImportStatus({ message: statusMessage, type: newChemicals.length > 0 ? 'success' : 'error' });
    setImportText('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setExtractionStatus(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64String = (e.target?.result as string).split(',')[1];
        if (!base64String) {
          throw new Error(t('errors.fileReadError'));
        }
        
        const extractedData = await extractChemicalInfoFromPdf(base64String);
        
        setName(extractedData.name);
        setActiveIngredient(extractedData.activeIngredient);
        setUsedFor(extractedData.usedFor);
        setApplication(extractedData.application);
        setToxicologicalInfo(extractedData.toxicologicalInfo || '');
        setPersonalProtection(extractedData.personalProtection || '');
        setExtractionStatus({ message: t('chemicalManager.extractionSuccess'), type: 'success' });

      } catch (err: any) {
        setExtractionStatus({ message: err.message || t('errors.pdfExtractionFailed'), type: 'error' });
      } finally {
        setIsExtracting(false);
        if(fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
      setExtractionStatus({ message: t('errors.fileReadError'), type: 'error' });
      setIsExtracting(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            setImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const filteredChemicals = chemicals.filter(chem =>
    (chem.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chem.activeIngredient || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chem.usedFor || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col dark:bg-gray-800" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-5 border-b dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('chemicalManager.title')}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <i className="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto p-5 md:flex md:gap-6">
            <div className="md:w-1/3 mb-6 md:mb-0">
              <div className="flex border-b border-gray-200 dark:border-gray-600 mb-4">
                <button
                  onClick={() => setView('form')}
                  className={`py-2 px-4 font-semibold text-sm transition-colors ${view === 'form' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  {editingId ? t('chemicalManager.editChemicalTab') : t('chemicalManager.addSingleTab')}
                </button>
                <button
                  onClick={() => setView('import')}
                  className={`py-2 px-4 font-semibold text-sm transition-colors ${view === 'import' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  {t('chemicalManager.bulkImportTab')}
                </button>
              </div>
              
              {view === 'form' && (
                <>
                  <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">{editingId ? t('chemicalManager.editChemicalTab') : t('chemicalManager.addFormTitle')}</h3>
                  
                  <div className="space-y-4">
                    {!editingId && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
                        <input type="file" accept=".pdf" onChange={handleFileChange} ref={fileInputRef} className="hidden" id="pdf-upload" disabled={isExtracting} />
                        <label
                          htmlFor="pdf-upload"
                          className={`w-full text-center block font-bold py-2 px-4 rounded-md shadow-sm transition-all cursor-pointer ${isExtracting ? 'bg-gray-400 text-gray-800 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white transform hover:scale-105'}`}
                        >
                          {isExtracting ? (
                            <><i className="fas fa-spinner fa-spin me-2"></i>{t('chemicalManager.extractingButton')}</>
                          ) : (
                            <><i className="fas fa-file-pdf me-2"></i>{t('chemicalManager.extractFromPdfButton')}</>
                          )}
                        </label>
                        {extractionStatus && (
                          <p className={`text-xs mt-2 text-center ${
                            extractionStatus.type === 'success' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-500 dark:text-red-400'
                          }`}>
                            {extractionStatus.message}
                          </p>
                        )}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                       <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">{t('chemicalManager.imageLabel')}</label>
                          <div className="mt-1 flex items-center gap-4">
                              <span className="inline-block h-20 w-20 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
                                  {image ? (
                                      <img src={image} alt="Chemical Preview" className="h-full w-full object-cover" />
                                  ) : (
                                      <div className="h-full w-full flex items-center justify-center">
                                          <i className="fas fa-camera text-3xl text-gray-400"></i>
                                      </div>
                                  )}
                              </span>
                              <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                              <div className="flex flex-col gap-2">
                                  <label htmlFor="image-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                                      <span>{t('chemicalManager.uploadImageButton')}</span>
                                  </label>
                                  {image && (
                                      <button type="button" onClick={() => setImage(null)} className="text-red-600 hover:text-red-800 text-sm font-medium">
                                          {t('chemicalManager.removeImageButton')}
                                      </button>
                                  )}
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-grow">
                          <label htmlFor="chem-name" className="block text-sm font-medium text-gray-600 dark:text-gray-300">{t('chemicalManager.nameLabel')}</label>
                          <input id="chem-name" type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" required />
                        </div>
                        <div>
                          <label htmlFor="chem-color" className="block text-sm font-medium text-gray-600 dark:text-gray-300">{t('chemicalManager.colorLabel')}</label>
                          <input id="chem-color" type="color" value={color} onChange={e => setColor(e.target.value)} className="mt-1 block w-12 h-9 p-1 border border-gray-300 rounded-md shadow-sm cursor-pointer dark:bg-gray-700 dark:border-gray-600" title="Select a color"/>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="chem-ingredient" className="block text-sm font-medium text-gray-600 dark:text-gray-300">{t('chemicalManager.activeIngredientLabel')}</label>
                        <input id="chem-ingredient" type="text" value={activeIngredient} onChange={e => setActiveIngredient(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                      </div>
                      <div>
                        <label htmlFor="chem-used-for" className="block text-sm font-medium text-gray-600 dark:text-gray-300">{t('chemicalManager.usedForLabel')}</label>
                        <input id="chem-used-for" type="text" value={usedFor} onChange={e => setUsedFor(e.target.value)} placeholder={t('chemicalManager.usedForPlaceholder')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" required />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('chemicalManager.usedForHelpText')}</p>
                      </div>
                      <div>
                        <label htmlFor="chem-application" className="block text-sm font-medium text-gray-600 dark:text-gray-300">{t('chemicalManager.applicationLabel')}</label>
                        <textarea id="chem-application" value={application} onChange={e => setApplication(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" required></textarea>
                      </div>
                      <div>
                        <label htmlFor="chem-toxicology" className="block text-sm font-medium text-gray-600 dark:text-gray-300">{t('chemicalManager.toxicologicalInfoLabel')}</label>
                        <textarea id="chem-toxicology" value={toxicologicalInfo} onChange={e => setToxicologicalInfo(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"></textarea>
                      </div>
                      <div>
                        <label htmlFor="chem-protection" className="block text-sm font-medium text-gray-600 dark:text-gray-300">{t('chemicalManager.personalProtectionLabel')}</label>
                        <textarea id="chem-protection" value={personalProtection} onChange={e => setPersonalProtection(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"></textarea>
                      </div>
                      <div className="flex items-center gap-4">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-transform transform hover:scale-105">
                          {editingId ? t('chemicalManager.updateButton') : t('chemicalManager.saveButton')}
                        </button>
                        {editingId && <button type="button" onClick={resetForm} className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">{t('chemicalManager.cancelButton')}</button>}
                        {!editingId && <button type="button" onClick={resetForm} className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">{t('chemicalManager.resetButton')}</button>}
                      </div>
                    </form>
                  </div>
                </>
              )}

              {view === 'import' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{t('chemicalManager.bulkImportTitle')}</h3>
                  <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('chemicalManager.bulkImportInstruction1')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('chemicalManager.bulkImportInstruction2')} <br />
                          <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{t('chemicalManager.bulkImportFormat')}</code>
                      </p>
                      <textarea
                          value={importText}
                          onChange={e => setImportText(e.target.value)}
                          rows={10}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 font-mono text-sm"
                          placeholder={t('chemicalManager.bulkImportPlaceholder')}
                      />
                  </div>
                  <button onClick={handleBulkImport} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-transform transform hover:scale-105">
                      <i className="fas fa-file-import me-2"></i> {t('chemicalManager.importButton')}
                  </button>
                  {importStatus && (
                      <p className={`text-sm p-3 rounded-md ${importStatus.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                          {importStatus.message}
                      </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="md:w-2/3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{t('chemicalManager.chemicalListTitle')}</h3>
                  {chemicals.length > 0 && (
                      <div className="flex items-center gap-2">
                          <input type="text" value={pdfFilename} onChange={(e) => setPdfFilename(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-md shadow-sm sm:text-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 w-36" aria-label="PDF Filename for chemicals" />
                          <span className="text-gray-500 dark:text-gray-400 text-sm">.pdf</span>
                          <button onClick={triggerPdfExportConfirmation} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-full text-xs transition-colors whitespace-nowrap" aria-label="Export chemical list to PDF">
                              <i className="fas fa-file-pdf me-2"></i>{t('chemicalManager.exportButton')}
                          </button>
                      </div>
                  )}
              </div>
              {chemicals.length > 0 && (
                <div className="mb-4 relative">
                  <span className="absolute inset-y-0 start-0 flex items-center ps-3">
                    <i className="fas fa-search text-gray-400"></i>
                  </span>
                  <input type="text" placeholder={t('chemicalManager.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-full shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" aria-label="Search chemicals"/>
                </div>
              )}
               <div className="border rounded-lg overflow-hidden max-h-[55vh] overflow-y-auto dark:border-gray-700">
                  {chemicals.length === 0 ? (
                      <p className="text-center text-gray-500 dark:text-gray-400 p-6">{t('chemicalManager.noChemicals')}</p>
                  ) : filteredChemicals.length === 0 ? (
                      <p className="text-center text-gray-500 dark:text-gray-400 p-6">{t('chemicalManager.noSearchResults')}</p>
                  ) : (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                          {filteredChemicals.map(chem => (
                              <li key={chem.id} className="p-4 bg-white dark:bg-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                  <div className="flex justify-between items-start gap-4">
                                      <div className="flex-grow flex items-start gap-4">
                                        <div className="flex-shrink-0 h-24 w-24 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                                            {chem.image ? (
                                                <img src={chem.image} alt={chem.name} className="h-full w-full object-contain rounded-md" />
                                            ) : (
                                                <i className="fas fa-flask text-4xl text-gray-400"></i>
                                            )}
                                        </div>
                                        <div className="flex-grow space-y-3">
                                            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                              <span className="w-4 h-4 rounded-full inline-block border dark:border-gray-600 flex-shrink-0" style={{ backgroundColor: chem.color || '#cccccc' }}></span>
                                              <span>{chem.name}</span>
                                            </h4>
                                            <div>
                                                <p className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    <i className="fas fa-atom w-3 text-center text-blue-500"></i>
                                                    <span>{t('chemicalManager.activeIngredientHeader')}</span>
                                                </p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 ps-5">{chem.activeIngredient || t('na')}</p>
                                            </div>
                                            <div>
                                                <p className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    <i className="fas fa-bullseye w-3 text-center text-green-500"></i>
                                                    <span>{t('chemicalManager.usedForHeader')}</span>
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-1 ps-5">
                                                    {(chem.usedFor || '').split(',').map(keyword => keyword.trim()).filter(Boolean).map((keyword, index) => (
                                                        <span key={index} className="px-2 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full dark:bg-teal-900/70 dark:text-teal-200">{keyword}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                   <i className="fas fa-info-circle w-3 text-center text-yellow-500"></i>
                                                   <span>{t('chemicalManager.applicationHeader')}</span>
                                                </p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap ps-5">{chem.application}</p>
                                            </div>
                                            {chem.toxicologicalInfo && (
                                              <div>
                                                  <p className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    <i className="fas fa-biohazard w-3 text-center text-orange-500"></i>
                                                    <span>{t('chemicalManager.toxicologicalInfoHeader')}</span>
                                                  </p>
                                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap ps-5">{chem.toxicologicalInfo}</p>
                                              </div>
                                            )}
                                            {chem.personalProtection && (
                                              <div>
                                                  <p className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    <i className="fas fa-hard-hat w-3 text-center text-red-500"></i>
                                                    <span>{t('chemicalManager.personalProtectionHeader')}</span>
                                                  </p>
                                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap ps-5">{chem.personalProtection}</p>
                                              </div>
                                            )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col sm:flex-row gap-y-2 sm:gap-x-2 flex-shrink-0">
                                          <button onClick={() => handleEdit(chem)} className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full" aria-label={`Edit ${chem.name}`}><i className="fas fa-pencil-alt"></i></button>
                                          <button onClick={() => onDelete(chem.id)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full" aria-label={`Delete ${chem.name}`}><i className="fas fa-trash"></i></button>
                                      </div>
                                  </div>
                              </li>
                          ))}
                      </ul>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmationDialog
        isOpen={isPdfConfirmOpen}
        onClose={() => setIsPdfConfirmOpen(false)}
        onConfirm={handleConfirmAndExport}
        title={t('chemicalManager.exportButton')}
      >
        <p className="text-gray-600 dark:text-gray-300">
          {t('confirmationDialog.exportChemicalsMessage', `${pdfFilename}.pdf`)}
        </p>
      </ConfirmationDialog>
    </>
  );
};

export default ChemicalManager;