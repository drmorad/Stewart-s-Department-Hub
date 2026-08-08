
import type { CleaningSchedulePlan, ChecklistState, Chemical, TaskDetail, ActiveFilters } from '../types';
import { Language } from '../i18n';
import { PPE_OPTIONS } from '../constants';
import { t } from '../i18n';

// Declare the global jspdf object provided by the script tag in index.html.
declare global {
  interface Window {
    jspdf: any;
  }
}

/**
 * Sanitizes a string for PDF rendering.
 */
const sanitizeForPdf = (text: string | null | undefined): string => {
  if (!text) return '';
  // Basic character sanitation for jsPDF
  return text.replace(/[^\u0009\u000A\u000D\u0020-\u007E\u0600-\u06FF\u0750-\u077F]/g, '');
};

/**
 * Adds a standardized header to the current page of the PDF.
 */
const addHeader = (doc: any, headerText: string, subHeaderText: string, logoBase64: string | null, language: Language) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const font = 'helvetica';

    if (logoBase64) {
        try {
            const img = new Image();
            img.src = logoBase64;
            const imgFormat = (logoBase64.substring(logoBase64.indexOf('/') + 1, logoBase64.indexOf(';'))).toUpperCase();
            const validFormats = ['JPEG', 'PNG', 'JPG'];

            if (validFormats.includes(imgFormat)) {
                const logoHeight = 15;
                const logoWidth = (img.width * logoHeight) / img.height;
                const logoX = language === 'ar' ? pageWidth - margin - logoWidth : margin;
                doc.addImage(logoBase64, imgFormat, logoX, margin - 7, logoWidth, logoHeight);
            }
        } catch (e) {
            console.error("Error adding logo to PDF:", e);
        }
    }
    
    doc.setFont(font, 'bold');
    doc.setFontSize(18);
    doc.text(sanitizeForPdf(headerText), pageWidth / 2, 18, { align: 'center', lang: language });
    
    doc.setFont(font, 'normal');
    doc.setFontSize(11);
    doc.text(subHeaderText, pageWidth / 2, 25, { align: 'center', lang: language });

    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', options);
    const dateText = language === 'ar' ? `تاريخ الإنشاء: ${formattedDate}` : `Generated on: ${formattedDate}`;
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(dateText, pageWidth / 2, 30, { align: 'center', lang: language });
};

/**
 * Adds a standardized footer to all pages of the PDF.
 */
const addFooter = (doc: any, language: Language) => {
    const pageCount = (doc.internal as any).getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const font = 'helvetica';
    
    doc.setFont(font, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const footerText = language === 'ar' ? `صفحة ${i} من ${pageCount}` : `Page ${i} of ${pageCount}`;
        doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center', lang: language });
    }
};

const getTaskNameById = (id: string, schedule: CleaningSchedulePlan): string | null => {
    for (const category of schedule.schedule) {
        for (const item of category.items) {
            if (item.daily.id === id) return item.daily.task;
            if (item.weekly.id === id) return item.weekly.task;
            if (item.monthly.id === id) return item.monthly.task;
        }
    }
    return null;
};

const isTaskValid = (task: TaskDetail) => task.task && task.task.trim() && task.task.trim().toLowerCase() !== 'n/a';

const appendChemicalList = (doc: any, chemicals: Chemical[], language: Language, startY: number, customHeader: string) => {
  doc.addPage();
  const isArabic = language === 'ar';
  const headEn = ['Chemical Name', 'Active Ingredient', 'Used For', 'Application', 'Required PPE'];
  const headAr = ['معدات الوقاية', 'الاستخدام', 'تستخدم لـ', 'المكون النشط', 'اسم المادة'];
  const tableHead = isArabic ? headAr : headEn;

  const tableBody = chemicals.map(chem => {
    const ppeGear = (chem.ppeList || []).map(id => {
      const opt = PPE_OPTIONS.find(o => o.id === id);
      return opt ? t(opt.label) : id;
    }).join(', ') || 'N/A';

    const row = [
      sanitizeForPdf(chem.name),
      sanitizeForPdf(chem.activeIngredient) || 'N/A',
      sanitizeForPdf(chem.usedFor),
      sanitizeForPdf(chem.application),
      sanitizeForPdf(ppeGear)
    ];
    return isArabic ? row.reverse() : row;
  });

  (doc as any).autoTable({
    head: [tableHead],
    body: tableBody,
    startY: 40,
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: 'bold', halign: isArabic ? 'right' : 'left' },
    styles: { fontSize: 8, cellPadding: 2, halign: isArabic ? 'right' : 'left', overflow: 'linebreak' },
    didDrawPage: () => addHeader(doc, customHeader, isArabic ? "ملخص المواد الكيميائية" : "Chemical Master Summary", null, language),
    margin: { top: 40, bottom: 20, left: 10, right: 10 }
  });
};

export const exportScheduleToPDF = (
  schedulePlan: CleaningSchedulePlan,
  customHeaderText: string,
  columnFilters: ActiveFilters,
  filename: string,
  chemicals: Chemical[],
  logoBase64: string | null,
  language: Language,
  exportScope: 'full' | 'filtered',
  rowFilters: ActiveFilters,
  orientation: 'p' | 'l' = 'p',
  includeNotes: boolean = true,
  includeChemicals: boolean = false
) => {
  if (!window.jspdf) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const isArabic = language === 'ar';
  doc.setFont('helvetica');

  const headEnParts = { item: 'Item / Equipment', daily: 'Daily Tasks', weekly: 'Weekly Tasks', monthly: 'Monthly Tasks' };
  const headArParts = { item: 'العنصر / المعدات', daily: 'المهام اليومية', weekly: 'المهام الأسبوعية', monthly: 'المهام الشهرية' };
  const parts = isArabic ? headArParts : headEnParts;

  const tableHead: string[] = [parts.item];
  if (columnFilters.daily) tableHead.push(parts.daily);
  if (columnFilters.weekly) tableHead.push(parts.weekly);
  if (columnFilters.monthly) tableHead.push(parts.monthly);
  if (isArabic) tableHead.reverse();

  const formatTaskContent = (taskDetail: TaskDetail) => {
    try {
        const task = sanitizeForPdf(taskDetail.task);
        if (!task.trim() || task.trim().toLowerCase() === 'n/a') return 'N/A';

        let result = task;
        if (includeNotes) {
            const notes = sanitizeForPdf(taskDetail.notes);
            if (notes && notes.trim() && notes.trim().toLowerCase() !== 'n/a') {
                const notesLabel = isArabic ? 'ملاحظات' : 'Notes';
                result += `\n(${notesLabel}: ${notes})`;
            }
        }

        if (taskDetail.chemicalId) {
          const chemical = chemicals.find(c => c.id === taskDetail.chemicalId);
          if (chemical) {
            const chemLabel = isArabic ? 'المادة الكيميائية' : 'Chemical';
            result += `\n\n${chemLabel}: ${sanitizeForPdf(chemical.name)}`;
          }
        }
        
        if (taskDetail.prerequisites && taskDetail.prerequisites.length > 0) {
            const prereqNames = taskDetail.prerequisites
                .map(id => getTaskNameById(id, schedulePlan))
                .filter(name => name !== null) as string[];
            if (prereqNames.length > 0) {
                const depsLabel = isArabic ? 'يتطلب' : 'Requires';
                result += `\n\n[${depsLabel}: ${sanitizeForPdf(prereqNames.join(', '))}]`;
            }
        }
        return result;
    } catch (err) {
        console.error("PDF Task Content Formatting Error:", err);
        return "Content Error";
    }
  };

  const tableRows: any[] = [];
  const scheduleData = exportScope === 'filtered' 
    ? schedulePlan.schedule.map(category => ({
        ...category,
        items: category.items.filter(item => {
            if (rowFilters.daily && isTaskValid(item.daily)) return true;
            if (rowFilters.weekly && isTaskValid(item.weekly)) return true;
            if (rowFilters.monthly && isTaskValid(item.monthly)) return true;
            return false;
        })
    })).filter(category => category.items.length > 0)
    : schedulePlan.schedule;

  scheduleData.forEach(category => {
    tableRows.push([{ 
      content: sanitizeForPdf(category.category), 
      colSpan: tableHead.length, 
      styles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [44, 62, 80], halign: 'center' } 
    }]);
    
    category.items.forEach(item => {
      const rowData = [sanitizeForPdf(item.itemName)];
      if (columnFilters.daily) rowData.push(formatTaskContent(item.daily));
      if (columnFilters.weekly) rowData.push(formatTaskContent(item.weekly));
      if (columnFilters.monthly) rowData.push(formatTaskContent(item.monthly));
      tableRows.push(isArabic ? rowData.reverse() : rowData);
    });
  });
  
  try {
    (doc as any).autoTable({
        head: [tableHead],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold', halign: isArabic ? 'right' : 'left' },
        styles: { fontSize: orientation === 'l' ? 10 : 9, cellPadding: 2, valign: 'middle', halign: isArabic ? 'right' : 'left', overflow: 'linebreak' },
        didDrawPage: () => addHeader(doc, customHeaderText, isArabic ? "جدول تنظيف المطبخ الشامل" : "Comprehensive Kitchen Cleaning Schedule", logoBase64, language),
        margin: { top: 40, bottom: 20, left: 10, right: 10 }
    });
  } catch (err) {
      console.error("AutoTable Export Error:", err);
  }

  if (includeChemicals && chemicals.length > 0) {
    appendChemicalList(doc, chemicals, language, (doc as any).lastAutoTable.finalY + 10, customHeaderText);
  }

  addFooter(doc, language);
  const safeFilename = (filename.trim() || 'cleaning_schedule').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`${safeFilename}.pdf`);
};

export const exportChecklistToPDF = (
  schedulePlan: CleaningSchedulePlan,
  checklistState: ChecklistState,
  customHeaderText: string,
  filename: string,
  chemicals: Chemical[],
  logoBase64: string | null,
  language: Language,
  columnFilters: ActiveFilters,
  exportScope: 'full' | 'filtered',
  rowFilters: ActiveFilters,
  orientation: 'p' | 'l' = 'p',
  includeNotes: boolean = true,
  includeChemicals: boolean = false
) => {
  if (!window.jspdf) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const isArabic = language === 'ar';
  doc.setFont('helvetica');

  const headEnParts = { item: 'Item / Equipment', daily: 'Daily Tasks', weekly: 'Weekly Tasks', monthly: 'Monthly Tasks' };
  const headArParts = { item: 'العنصر / المعدات', daily: 'المهام اليومية', weekly: 'المهام الأسبوعية', monthly: 'المهام الشهرية' };
  const parts = isArabic ? headArParts : headEnParts;

  const tableHead: string[] = [parts.item];
  if (columnFilters.daily) tableHead.push(parts.daily);
  if (columnFilters.weekly) tableHead.push(parts.weekly);
  if (columnFilters.monthly) tableHead.push(parts.monthly);
  if (isArabic) tableHead.reverse();

  const formatTask = (taskDetail: TaskDetail, isChecked: boolean) => {
    let sanitizedText = sanitizeForPdf(taskDetail.task);
    if (sanitizedText.trim().toLowerCase() === 'n/a' || !sanitizedText.trim()) return 'N/A';

    if (includeNotes) {
        const notes = sanitizeForPdf(taskDetail.notes);
        if (notes && notes.trim() && notes.trim().toLowerCase() !== 'n/a') {
            const notesLabel = isArabic ? 'ملاحظات' : 'Notes';
            sanitizedText += `\n(${notesLabel}: ${notes})`;
        }
    }

    if (taskDetail.chemicalId) {
        const chemical = chemicals.find(c => c.id === taskDetail.chemicalId);
        if (chemical) {
            const chemLabel = isArabic ? 'المادة الكيميائية' : 'Chemical';
            sanitizedText += `\n\n${chemLabel}: ${sanitizeForPdf(chemical.name)}`;
        }
    }
    const checkbox = isChecked ? '[X]' : '[ ]';
    return `${checkbox} ${sanitizedText}`;
  };

  const tableRows: any[] = [];
  schedulePlan.schedule.forEach((category, catIndex) => {
    const visibleItems = category.items.filter(item => {
        if (exportScope === 'full') return true;
        if (rowFilters.daily && isTaskValid(item.daily)) return true;
        if (rowFilters.weekly && isTaskValid(item.weekly)) return true;
        if (rowFilters.monthly && isTaskValid(item.monthly)) return true;
        return false;
    });

    if (visibleItems.length > 0) {
        tableRows.push([{ 
          content: sanitizeForPdf(category.category), 
          colSpan: tableHead.length, 
          styles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [44, 62, 80], halign: 'center' } 
        }]);

        category.items.forEach((item, itemIndex) => {
            const isVisible = exportScope === 'full' || (rowFilters.daily && isTaskValid(item.daily)) || (rowFilters.weekly && isTaskValid(item.weekly)) || (rowFilters.monthly && isTaskValid(item.monthly));
            if (isVisible) {
                const status = checklistState?.[catIndex]?.[itemIndex] || { daily: false, weekly: false, monthly: false };
                const rowData = [sanitizeForPdf(item.itemName)];
                if (columnFilters.daily) rowData.push(formatTask(item.daily, status.daily));
                if (columnFilters.weekly) rowData.push(formatTask(item.weekly, status.weekly));
                if (columnFilters.monthly) rowData.push(formatTask(item.monthly, status.monthly));
                tableRows.push(isArabic ? rowData.reverse() : rowData);
            }
        });
    }
  });

  try {
    (doc as any).autoTable({
        head: [tableHead],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold', halign: isArabic ? 'right' : 'left' },
        styles: { fontSize: orientation === 'l' ? 10 : 9, cellPadding: 2, valign: 'middle', halign: isArabic ? 'right' : 'left', overflow: 'linebreak' },
        didDrawPage: () => addHeader(doc, customHeaderText, isArabic ? "قائمة تدقيق التنظيف" : "Cleaning Checklist Status", logoBase64, language),
        margin: { top: 40, bottom: 20, left: 10, right: 10 }
    });
  } catch (err) {
      console.error("AutoTable Export Error:", err);
  }

  if (includeChemicals && chemicals.length > 0) {
    appendChemicalList(doc, chemicals, language, (doc as any).lastAutoTable.finalY + 10, customHeaderText);
  }

  addFooter(doc, language);
  const safeFilename = (filename.trim() || 'checklist_status').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`${safeFilename}.pdf`);
};

export const exportChemicalsToPDF = (
  chemicals: Chemical[],
  customHeaderText: string,
  filename: string,
  logoBase64: string | null,
  language: Language
) => {
  if (!window.jspdf) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
  const isArabic = language === 'ar';
  doc.setFont('helvetica');

  const headEn = ['Chemical Name', 'Active Ingredient', 'Used For', 'Application Instructions', 'Required PPE Gear', 'Safety Notes'];
  const headAr = ['ملاحظات السلامة', 'معدات الوقاية المطلوبة', 'تعليمات الاستخدام', 'تستخدم لـ', 'المكون النشط', 'اسم المادة'];
  const tableHead = isArabic ? headAr : headEn;

  const tableBody = chemicals.map(chem => {
    let ppeGear = 'N/A';
    if (chem.ppeList && chem.ppeList.length > 0) {
        ppeGear = chem.ppeList
            .map(id => {
                const opt = PPE_OPTIONS.find(o => o.id === id);
                return `• ${opt ? t(opt.label) : id}`;
            })
            .join('\n');
    }

    let safetyNotes: string[] = [];
    if (chem.personalProtection && chem.personalProtection.trim()) {
        safetyNotes.push(chem.personalProtection);
    }
    if (chem.toxicologicalInfo && chem.toxicologicalInfo.trim()) {
        safetyNotes.push(`Hazards: ${chem.toxicologicalInfo}`);
    }
    const safetyStr = safetyNotes.length > 0 ? safetyNotes.join('\n\n') : 'N/A';

    const row = [
      sanitizeForPdf(chem.name),
      sanitizeForPdf(chem.activeIngredient) || 'N/A',
      sanitizeForPdf(chem.usedFor),
      sanitizeForPdf(chem.application),
      sanitizeForPdf(ppeGear),
      sanitizeForPdf(safetyStr)
    ];
    return isArabic ? row.reverse() : row;
  });
  
  try {
    (doc as any).autoTable({
        head: [tableHead],
        body: tableBody,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold', halign: isArabic ? 'right' : 'left' },
        styles: { fontSize: 8.5, cellPadding: 3, valign: 'top', halign: isArabic ? 'right' : 'left', overflow: 'linebreak' },
        columnStyles: {
            [isArabic ? 5 : 0]: { fontStyle: 'bold', cellWidth: 35 },
            [isArabic ? 1 : 4]: { cellWidth: 40 },
            [isArabic ? 0 : 5]: { cellWidth: 50 }
        },
        didDrawPage: () => addHeader(doc, customHeaderText, isArabic ? "القائمة الرئيسية للمواد الكيميائية" : "Cleaning Chemical Master List", logoBase64, language),
        margin: { top: 40, bottom: 20, left: 10, right: 10 }
    });
  } catch (err) {
      console.error("Chemical PDF Export Error:", err);
  }

  addFooter(doc, language);
  const safeFilename = (filename.trim() || 'chemical_list').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`${safeFilename}.pdf`);
};
