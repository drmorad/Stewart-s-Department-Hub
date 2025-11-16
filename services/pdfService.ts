import type { CleaningSchedulePlan, ChecklistState, Chemical, TaskDetail, ActiveFilters } from '../types';
import { Language } from '../i18n';

// CRITICAL FIX REQUIRED: You MUST replace the following placeholder string with the ACTUAL, COMPLETE, and VALID base64 encoded data of the Amiri font file.
// The current placeholder is intentionally minimal to prevent "Failed to execute 'atob' on 'Window'" errors,
// but it is NOT the actual font data and will result in incorrect Arabic rendering in PDFs.
// To get the correct base64 string:
// 1. Obtain the Amiri-Regular.ttf font file.
// 2. Convert it to a base64 string using an online tool or a script (e.g., `base64 -w 0 Amiri-Regular.ttf` on Linux/macOS).
// 3. Paste the ENTIRE resulting base64 string here, ensuring no data URI prefix (like 'data:font/ttf;base64,') is included, as `cleanBase64` handles that.
const AMIRI_FONT_BASE64 = 'AAEAAAARAQAABAAQR0RFRgQsAASAAAAACAAmACoAAAAMAAIAAAABAAD/+AEA'; // <<< REPLACE THIS ENTIRE STRING WITH YOUR ACTUAL FONT DATA >>>

// Declare the global jspdf object provided by the script tag in index.html.
declare global {
  interface Window {
    jspdf: any;
  }
}

/**
 * Cleans a base64 string by removing data URI prefixes (e.g., 'data:mime/type;base64,') and trimming whitespace.
 * This ensures that functions like `atob()` receive a pure base64 encoded string.
 * @param base64String The base64 string, potentially with a data URI prefix.
 * @returns A cleaned base64 string.
 */
const cleanBase64 = (base64String: string | null | undefined): string => {
  if (!base64String) return '';
  let cleaned = base64String.trim();
  const dataUriPrefixMatch = cleaned.match(/^data:[^;]+;base64,/);
  if (dataUriPrefixMatch) {
    cleaned = cleaned.substring(dataUriPrefixMatch[0].length);
  }
  return cleaned;
};

/**
 * Sanitizes a string for PDF rendering.
 * This regex allows basic Latin characters, Arabic characters, and essential whitespace.
 * @param text The string to sanitize.
 * @returns A sanitized string.
 */
const sanitizeForPdf = (text: string | null | undefined): string => {
  if (!text) return '';
  // Whitelist: common punctuation, numbers, Latin, Arabic, and whitespace.
  return text.replace(/[^\u0009\u000A\u000D\u0020-\u007E\u0600-\u06FF\u0750-\u077F]/g, '');
};


/**
 * Adds a standardized header to the current page of the PDF.
 * @param doc The jsPDF instance.
 * @param headerText The main header text.
 * @param subHeaderText The subtitle.
 * @param logoBase64 The base64-encoded logo, or null.
 * @param language The current language ('en' or 'ar').
 */
const addHeader = (doc: any, headerText: string, subHeaderText: string, logoBase64: string | null, language: Language) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const isArabic = language === 'ar';
    const font = isArabic ? 'Amiri' : 'helvetica';

    if (logoBase64) {
        try {
            // For doc.addImage, typically the full data URI is expected.
            // The `cleanBase64` function is more for raw base64 strings passed to functions expecting pure base64.
            const img = new Image();
            img.src = logoBase64;
            const imgFormat = (logoBase64.substring(logoBase64.indexOf('/') + 1, logoBase64.indexOf(';'))).toUpperCase();
            const validFormats = ['JPEG', 'PNG', 'JPG'];

            if (validFormats.includes(imgFormat)) {
                const logoHeight = 15;
                const logoWidth = (img.width * logoHeight) / img.height;
                const logoX = isArabic ? pageWidth - margin - logoWidth : margin;
                doc.addImage(logoBase64, imgFormat, logoX, margin - 7, logoWidth, logoHeight);
            } else {
                console.warn(`Unsupported image format for logo: ${imgFormat}`);
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
    const formattedDate = today.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', options);
    const dateText = isArabic ? `تاريخ الإنشاء: ${formattedDate}` : `Generated on: ${formattedDate}`;
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(dateText, pageWidth / 2, 30, { align: 'center', lang: language });
};

/**
 * Adds a standardized "Page X of Y" footer to all pages of the PDF.
 * @param doc The jsPDF instance.
 * @param language The current language ('en' or 'ar').
 */
const addFooter = (doc: any, language: Language) => {
    const pageCount = (doc.internal as any).getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const isArabic = language === 'ar';
    const font = isArabic ? 'Amiri' : 'helvetica';
    
    doc.setFont(font, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const footerText = isArabic ? `صفحة ${i} من ${pageCount}` : `Page ${i} of ${pageCount}`;
        doc.text(
            footerText,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center', lang: language }
        );
    }
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
  rowFilters: ActiveFilters
) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const autoTable = (doc as any).autoTable;
  const isArabic = language === 'ar';
  
  if (isArabic) {
    doc.addFileToVFS('Amiri-Regular.ttf', cleanBase64(AMIRI_FONT_BASE64)); // Apply cleanBase64 here
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  }
  const font = isArabic ? 'Amiri' : 'helvetica';
  doc.setFont(font);

  const headEnParts = { item: 'Item / Equipment', daily: 'Daily Tasks', weekly: 'Weekly Tasks', monthly: 'Monthly Tasks' };
  const headArParts = { item: 'العنصر / المعدات', daily: 'المهام اليومية', weekly: 'المهام الأسبوعية', monthly: 'المهام الشهرية' };
  const parts = isArabic ? headArParts : headEnParts;

  const tableHead: string[] = [parts.item];
  if (columnFilters.daily) tableHead.push(parts.daily);
  if (columnFilters.weekly) tableHead.push(parts.weekly);
  if (columnFilters.monthly) tableHead.push(parts.monthly);
  if (isArabic) tableHead.reverse();


  const tableRows: any[] = [];
  const categoryColSpan = tableHead.length;

  const formatTaskContent = (taskDetail: TaskDetail) => {
    const task = sanitizeForPdf(taskDetail.task);
    
    if (!task.trim() || task.trim().toLowerCase() === 'n/a') {
      return 'N/A';
    }

    let result = task;

    const notes = sanitizeForPdf(taskDetail.notes);
    if (notes && notes.trim() && notes.trim().toLowerCase() !== 'n/a') {
        const notesLabel = isArabic ? 'ملاحظات' : 'Notes';
        result += `\n(${notesLabel}: ${notes})`;
    }

    if (taskDetail.chemicalId) {
      const chemical = chemicals.find(c => c.id === taskDetail.chemicalId);
      if (chemical) {
        const chemLabel = isArabic ? 'المادة الكيميائية' : 'Chemical';
        result += `\n\n${chemLabel}: ${sanitizeForPdf(chemical.name)}`;
      }
    }
    return result;
  };

  const isTaskValid = (task: TaskDetail) => task.task && task.task.trim() && task.task.trim().toLowerCase() !== 'n/a';

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
      colSpan: categoryColSpan, 
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
  
  const taskColCount = (columnFilters.daily ? 1 : 0) + (columnFilters.weekly ? 1 : 0) + (columnFilters.monthly ? 1 : 0);
  const itemColWidth = 40;
  
  const columnStyles: { [key: number]: any } = {
    [isArabic ? tableHead.length - 1 : 0]: { fontStyle: 'bold', cellWidth: itemColWidth },
  };
  
  // Set equal width for task columns if there are any
  if (taskColCount > 0) {
      const availableWidth = doc.internal.pageSize.getWidth() - 20; // page width minus margins
      const remainingWidth = availableWidth - itemColWidth;
      const taskColWidth = remainingWidth / taskColCount;
      
      let currentColIndex = isArabic ? tableHead.length - 2 : 1;
      const increment = isArabic ? -1 : 1;

      if (columnFilters.daily) {
        columnStyles[currentColIndex] = { cellWidth: taskColWidth };
        currentColIndex += increment;
      }
      if (columnFilters.weekly) {
        columnStyles[currentColIndex] = { cellWidth: taskColWidth };
        currentColIndex += increment;
      }
      if (columnFilters.monthly) {
        columnStyles[currentColIndex] = { cellWidth: taskColWidth };
      }
  }


  autoTable({
    head: [tableHead],
    body: tableRows,
    startY: 40,
    theme: 'grid',
    headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold', halign: isArabic ? 'right' : 'left', font: font },
    styles: { fontSize: 9, cellPadding: 2, valign: 'middle', halign: isArabic ? 'right' : 'left', font: font },
    columnStyles: columnStyles,
    didDrawPage: (data: any) => {
      addHeader(doc, customHeaderText, isArabic ? "جدول تنظيف المطبخ الشامل" : "Comprehensive Kitchen Cleaning Schedule", logoBase64, language);
    },
    margin: { top: 40, bottom: 20 }
  });

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
  columnFilters: ActiveFilters // NEW parameter for checklist filters
) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const autoTable = (doc as any).autoTable;
  const isArabic = language === 'ar';
  
  if (isArabic) {
    doc.addFileToVFS('Amiri-Regular.ttf', cleanBase64(AMIRI_FONT_BASE64)); // Apply cleanBase64 here
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  }
  const font = isArabic ? 'Amiri' : 'helvetica';
  doc.setFont(font);

  const headEnParts = { item: 'Item / Equipment', daily: 'Daily Tasks', weekly: 'Weekly Tasks', monthly: 'Monthly Tasks' };
  const headArParts = { item: 'العنصر / المعدات', daily: 'المهام اليومية', weekly: 'المهام الأسبوعية', monthly: 'المهام الشهرية' };
  const parts = isArabic ? headArParts : headEnParts;

  const tableHead: string[] = [parts.item];
  if (columnFilters.daily) tableHead.push(parts.daily);
  if (columnFilters.weekly) tableHead.push(parts.weekly);
  if (columnFilters.monthly) tableHead.push(parts.monthly);
  if (isArabic) tableHead.reverse(); // Reverse only if Arabic, after adding columns

  const tableRows: any[] = [];
  const categoryColSpan = tableHead.length; // Dynamic colSpan

  const formatTask = (taskDetail: TaskDetail, isChecked: boolean) => {
    let sanitizedText = sanitizeForPdf(taskDetail.task);
    if (sanitizedText.trim().toLowerCase() === 'n/a' || !sanitizedText.trim()) return 'N/A';

    const notes = sanitizeForPdf(taskDetail.notes);
    if (notes && notes.trim() && notes.trim().toLowerCase() !== 'n/a') {
        const notesLabel = isArabic ? 'ملاحظات' : 'Notes';
        sanitizedText += `\n(${notesLabel}: ${notes})`;
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

  schedulePlan.schedule.forEach((category, catIndex) => {
    tableRows.push([{ 
      content: sanitizeForPdf(category.category), 
      colSpan: categoryColSpan, // Use dynamic colSpan
      styles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [44, 62, 80], halign: 'center' } 
    }]);

    category.items.forEach((item, itemIndex) => {
      const status = checklistState?.[catIndex]?.[itemIndex] || { daily: false, weekly: false, monthly: false };
      const rowData = [
        sanitizeForPdf(item.itemName),
      ];
      if (columnFilters.daily) rowData.push(formatTask(item.daily, status.daily));
      if (columnFilters.weekly) rowData.push(formatTask(item.weekly, status.weekly));
      if (columnFilters.monthly) rowData.push(formatTask(item.monthly, status.monthly));
      
      tableRows.push(isArabic ? rowData.reverse() : rowData);
    });
  });

  const taskColCount = (columnFilters.daily ? 1 : 0) + (columnFilters.weekly ? 1 : 0) + (columnFilters.monthly ? 1 : 0);
  const itemColWidth = 40; // Fixed width for Item/Equipment column
  
  const columnStyles: { [key: number]: any } = {
    [isArabic ? tableHead.length - 1 : 0]: { fontStyle: 'bold', cellWidth: itemColWidth }, // Item/Equipment column
  };
  
  // Set equal width for task columns if there are any
  if (taskColCount > 0) {
      const availableWidth = doc.internal.pageSize.getWidth() - 20; // page width minus margins
      const remainingWidth = availableWidth - itemColWidth;
      const taskColWidth = remainingWidth / taskColCount;
      
      let currentColIndex = isArabic ? tableHead.length - 2 : 1;
      const increment = isArabic ? -1 : 1;

      if (columnFilters.daily) {
        columnStyles[currentColIndex] = { cellWidth: taskColWidth };
        currentColIndex += increment;
      }
      if (columnFilters.weekly) {
        columnStyles[currentColIndex] = { cellWidth: taskColWidth };
        currentColIndex += increment;
      }
      if (columnFilters.monthly) {
        columnStyles[currentColIndex] = { cellWidth: taskColWidth };
      }
  }


  autoTable({
    head: [tableHead],
    body: tableRows,
    startY: 40,
    theme: 'grid',
    headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold', halign: isArabic ? 'right' : 'left', font: font },
    styles: { fontSize: 9, cellPadding: 2, valign: 'middle', halign: isArabic ? 'right' : 'left', font: font },
    columnStyles: columnStyles,
    didDrawPage: () => {
      addHeader(doc, customHeaderText, isArabic ? "حالة قائمة التحقق من التنظيف" : "Cleaning Checklist Status", logoBase64, language);
    },
    margin: { top: 40, bottom: 20 }
  });

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
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' }); // Use landscape
  const autoTable = (doc as any).autoTable;
  const isArabic = language === 'ar';

  if (isArabic) {
    doc.addFileToVFS('Amiri-Regular.ttf', cleanBase64(AMIRI_FONT_BASE64)); // Apply cleanBase64 here
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  }
  const font = isArabic ? 'Amiri' : 'helvetica';
  doc.setFont(font);

  const headEn = ['Name', 'Used For', 'Safety & Application Details'];
  const headAr = ['تفاصيل السلامة والاستخدام', 'تستخدم لـ', 'الاسم'];
  const tableHead = isArabic ? headAr : headEn;

  const tableBody = chemicals.map(chem => {
    const detailsLabels = {
      ingredient: isArabic ? "المكون النشط" : "Active Ingredient",
      application: isArabic ? "الاستخدام" : "Application",
      toxicology: isArabic ? "المعلومات السمية" : "Toxicology",
      ppe: isArabic ? "الحماية الشخصية" : "PPE"
    };
    
    const details = [
      `${detailsLabels.ingredient}: ${sanitizeForPdf(chem.activeIngredient) || 'N/A'}`,
      `${detailsLabels.application}: ${sanitizeForPdf(chem.application)}`,
      `${detailsLabels.toxicology}: ${sanitizeForPdf(chem.toxicologicalInfo) || 'N/A'}`,
      `${detailsLabels.ppe}: ${sanitizeForPdf(chem.personalProtection) || 'N/A'}`
    ].join('\n\n');

    const row = [
      sanitizeForPdf(chem.name),
      sanitizeForPdf(chem.usedFor),
      details,
    ];
    return isArabic ? row.reverse() : row;
  });
  
  const nameColWidth = 40;
  const usedForColWidth = 60;
  const detailsColWidth = doc.internal.pageSize.getWidth() - nameColWidth - usedForColWidth - 20; // 20 for margins

  const columnStyles: { [key: number]: any } = {
    [isArabic ? 2 : 0]: { fontStyle: 'bold', cellWidth: nameColWidth },
    [isArabic ? 1 : 1]: { cellWidth: usedForColWidth },
    [isArabic ? 0 : 2]: { cellWidth: detailsColWidth },
  };

  autoTable({
    head: [tableHead],
    body: tableBody,
    startY: 40,
    theme: 'grid',
    headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold', halign: isArabic ? 'right' : 'left', font: font },
    styles: { fontSize: 9, cellPadding: 2, valign: 'middle', halign: isArabic ? 'right' : 'left', font: font },
    columnStyles: columnStyles,
    didDrawPage: () => {
      addHeader(doc, customHeaderText, isArabic ? "القائمة الرئيسية للمواد الكيميائية" : "Cleaning Chemical Master List", logoBase64, language);
    },
    margin: { top: 40, bottom: 20 }
  });

  addFooter(doc, language);

  const safeFilename = (filename.trim() || 'chemical_list').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`${safeFilename}.pdf`);
};