
export type Language = 'en' | 'ar';

const translations = {
  en: {
    header: {
      title: "Steward's Cleaning Schedule Generator",
      description: "Instantly create a detailed, professional cleaning plan for your kitchen's preparation, cooking, and buffet equipment.",
      language: "العربية"
    },
    main: {
      departmentNameLabel: "Department or Hotel Name (for PDF Header)",
      departmentNamePlaceholder: "e.g., Grand Hyatt Kitchen",
      uploadLogo: "Upload Logo",
      changeLogo: "Change Logo",
      removeLogo: "Remove Logo",
      generateButton: "Create Cleaning Plan",
      generatingButton: "Generating Plan...",
      manageChemicalsButton: "Manage Chemicals",
      duplicateScheduleButton: "Duplicate Schedule",
      viewTasks: "View tasks:",
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    },
    sync: {
        title: "Cloud Sync",
        connectDrive: "Connect to Google Drive",
        connectDescription: "Keep your cleaning schedule, chemicals, and checklist progress safely backed up to your personal Google Drive account.",
        authorizeButton: "Sign in with Google",
        status: "Sync Status",
        connected: "Connected",
        syncing: "Syncing...",
        lastSync: "Last Synced",
        neverSynced: "Never synced",
        uploadNow: "Upload Now",
        downloadNow: "Cloud Restore",
        disconnect: "Disconnect Drive",
        statusConnected: "Cloud Sync Active",
        noDataOnCloud: "No backup data found on your Google Drive.",
        dataFoundMessage: "Backup data found on Google Drive! Do you want to load it and replace your current local data?"
    },
    pdfControls: {
      filenameLabel: "PDF Filename",
      orientationLabel: "Page Orientation",
      orientationPortrait: "Portrait",
      orientationLandscape: "Landscape",
      includeNotesLabel: "Include Task Notes",
      includeChemicalsLabel: "Include Chemical Summary",
      pdfExportFilters: {
        label: "Frequencies to Include:"
      },
      pdfExportScope: {
        label: "Export Scope:",
        full: "Full Schedule",
        filtered: "Filtered View Only"
      },
      noFrequenciesSelected: "Please select at least one frequency to export.",
      exportPdfButton: "Export as PDF",
      exportChecklistPdfButton: "Export Checklist PDF",
      checklistViewButton: "Checklist View",
      scheduleViewButton: "Schedule View",
    },
    scheduleDisplay: {
      title: "Comprehensive Kitchen Cleaning Schedule",
      itemEquipmentHeader: "Item / Equipment",
      dailyTasksHeader: "Daily Tasks",
      weeklyTasksHeader: "Weekly Tasks",
      monthlyTasksHeader: "Monthly Tasks",
    },
    checklist: {
      title: "Interactive Cleaning Checklist",
      resetDaily: "Reset Daily",
      resetWeekly: "Reset Weekly",
      resetMonthly: "Reset Monthly",
      notesPlaceholder: "Add special instructions...",
      markComplete: "Mark Complete",
      markIncomplete: "Mark Incomplete",
    },
    chemicalManager: {
      title: "Manage Chemicals",
      addSingleTab: "Add Single",
      editChemicalTab: "Edit Chemical",
      bulkImportTab: "Bulk Import",
      addFormTitle: "Add New Chemical",
      extractFromPdfButton: "Extract from PDF",
      extractingButton: "Extracting Data...",
      extractionSuccess: "Data extracted successfully! Please review the pre-filled fields and save.",
      nameLabel: "Name",
      colorLabel: "Color",
      imageLabel: "Chemical Image (Optional)",
      uploadImageButton: "Upload Image",
      removeImageButton: "Remove",
      activeIngredientLabel: "Active Ingredient",
      usedForLabel: "Used For (Keywords)",
      usedForPlaceholder: "e.g., oven, grill, fryer",
      usedForHelpText: "Comma-separated keywords for matching with equipment.",
      applicationLabel: "Application Instructions",
      toxicologicalInfoLabel: "Toxicological Information (Health Effects)",
      personalProtectionLabel: "Additional Safety Instructions",
      ppeChecklistLabel: "Required Personal Protective Equipment (PPE)",
      saveButton: "Save Chemical",
      updateButton: "Update Chemical",
      cancelButton: "Cancel",
      resetButton: "Reset",
      bulkImportTitle: "Bulk Import Chemicals",
      bulkImportInstruction1: "Download the template, fill it out, and upload it back; or paste your data here. (Semicolon separated)",
      bulkImportInstruction2: "Format (Color is optional, at the end):",
      bulkImportFormat: "Name; Ingredient; Keywords; Application; Toxicology; PPE; Color",
      bulkImportPlaceholder: "Degreaser; NaOH; oven,grill; Spray on...; Causes burns; Wear gloves, goggles; #ff8c00",
      importButton: "Import Chemicals",
      downloadTemplate: "Download CSV Template",
      uploadCsvButton: "Upload CSV",
      chemicalListTitle: "Chemical List",
      exportButton: "Export",
      searchPlaceholder: "Search by name, ingredient, or keyword...",
      noChemicals: "No chemicals added yet.",
      noSearchResults: "No chemicals match your search criteria.",
      activeIngredientHeader: "Active Ingredient",
      usedForHeader: "Used For",
      applicationHeader: "Application",
      toxicologicalInfoHeader: "Toxicological Info",
      personalProtectionHeader: "Personal Protection (PPE)",
      alertRequiredFields: "Please fill in Name, Used For, and Application fields.",
      importSuccess: (count: number) => `Successfully imported ${count} chemical(s).`,
      importSkipped: (count: number) => `${count} line(s) were skipped due to incorrect formatting.`,
      importEmpty: "Textarea is empty.",
      filters: {
        title: "Filters",
        showFilters: "Show Filters",
        hideFilters: "Hide Filters",
        clearAll: "Clear All",
        safetyLevel: "Safety Rating",
        safetyAll: "All Ratings",
        safetyHigh: "High Risk",
        safetyMedium: "Medium Risk",
        safetyLow: "Low Risk",
        ppe: "PPE Requirements",
        usedFor: "Used For (Keyword)",
        selectKeyword: "Select usage..."
      }
    },
    chemicalSelector: {
      selectChemical: "Select Chemical",
      removeAssociation: "Remove Association",
      ingredient: "Ingredient",
      application: "Application",
    },
    confirmationDialog: {
      exportTitle: "Confirm PDF Export",
      exportChecklistTitle: "Confirm Checklist PDF Export",
      exportChemicalTitle: "Confirm Chemical List Export",
      duplicateScheduleTitle: "Confirm Schedule Duplication",
      exportScheduleMessage: (filename: string) => `You are about to export the schedule as ${filename}.`,
      exportChecklistMessage: (filename: string) => `You are about to export the current checklist status as ${filename}.`,
      exportChemicalsMessage: (filename: string) => `You are about to export the chemical list as ${filename}.pdf.`,
      duplicateScheduleMessage: "You are about to create an exact copy of the current cleaning schedule. This will clear the current checklist progress.",
      withFilters: "The following frequencies will be included:",
      checklistMessage: "All task frequencies (Daily, Weekly, Monthly) will be included.",
      exportScopeFull: "You are exporting the complete schedule.",
      exportScopeFiltered: "You are exporting only the tasks matching the current view filters.",
      cancel: "Cancel",
      confirm: "Confirm & Export",
    },
    footer: {
      poweredBy: "Powered by AI. Generated by Steward's Cleaning Schedule Generator.",
    },
    errors: {
      scheduleGenerationFailed: "Failed to generate the cleaning schedule. Please check your API key and try again.",
      pdfExtractionFailed: "Failed to extract chemical data from the PDF.",
      fileReadError: "Could not read the file.",
      driveConnectFailed: "Failed to connect to Google Drive. Check your popup blocker.",
      cloudDownloadFailed: "Could not download data from Google Drive."
    },
    ppe: {
      required: "Safety Alert",
      clickToView: "Click to view PPE requirements",
      title: "Required Personal Protective Equipment",
      items: {
        gloves: "Gloves",
        goggles: "Safety Goggles",
        faceShield: "Face Shield",
        mask: "Mask",
        respirator: "Respirator",
        apron: "Apron",
        safetyShoes: "Safety Shoes",
        rubberBoots: "Rubber Boots"
      }
    },
    dependencies: {
        modalTitle: "Manage Task Dependencies",
        instruction: "Select tasks that must be completed BEFORE the current task.",
        searchPlaceholder: "Search prerequisites...",
        saveButton: "Save Dependencies",
        manage: "Link Prerequisites",
        requires: "Requires",
        locked: "Blocked by",
    },
    na: "N/A"
  },
  ar: {
    header: {
      title: "مولد جدول التنظيف لقسم الإشراف الداخلي",
      description: "أنشئ فورًا خطة تنظيف مفصلة واحترافية لأدوات ومعدات مطبخك الخاصة بالتحضير والطهي والبوفيهات الحية.",
      language: "English"
    },
    main: {
      departmentNameLabel: "اسم القسم أو الفندق (لرأسية PDF)",
      departmentNamePlaceholder: "مثال: مطبخ جراند حياة",
      uploadLogo: "تحميل الشعار",
      changeLogo: "تغيير الشعار",
      removeLogo: "إزالة الشعار",
      generateButton: "إنشاء خطة التنظيف",
      generatingButton: "جاري إنشاء الخطة...",
      manageChemicalsButton: "إدارة المواد الكيميائية",
      duplicateScheduleButton: "نسخ الجدول",
      viewTasks: "عرض المهام:",
      daily: "يومي",
      weekly: "أسبوعي",
      monthly: "شهري",
    },
    sync: {
        title: "مزامنة السحابة",
        connectDrive: "الاتصال بجوجل درايف",
        connectDescription: "احتفظ بنسخة احتياطية من جدول التنظيف والمواد الكيميائية وتقدم قائمة التحقق بأمان في حسابك الشخصي على جوجل درايف.",
        authorizeButton: "تسجيل الدخول باستخدام جوجل",
        status: "حالة المزامنة",
        connected: "متصل",
        syncing: "جاري المزامنة...",
        lastSync: "آخر مزامنة",
        neverSynced: "لم تتم المزامنة أبدًا",
        uploadNow: "رفع الآن",
        downloadNow: "استعادة من السحابة",
        disconnect: "قطع الاتصال",
        statusConnected: "المزامنة السحابية نشطة",
        noDataOnCloud: "لم يتم العثور على بيانات احتياطية في جوجل درايف الخاص بك.",
        dataFoundMessage: "تم العثور على بيانات احتياطية في جوجل درايف! هل تريد تحميلها واستبدال بياناتك المحلية الحالية؟"
    },
    pdfControls: {
      filenameLabel: "اسم ملف PDF",
      orientationLabel: "اتجاه الصفحة",
      orientationPortrait: "رأسي",
      orientationLandscape: "أفقي",
      includeNotesLabel: "تضمين ملاحظات المهام",
      includeChemicalsLabel: "تضمين ملخص المواد الكيميائية",
      pdfExportFilters: {
        label: "الترددات المطلوب تضمينها:"
      },
      pdfExportScope: {
        label: "نطاق التصدير:",
        full: "الجدول الكامل",
        filtered: "العرض المفلتر فقط"
      },
      noFrequenciesSelected: "يرجى تحديد تردد واحد على الأقل للتصدير.",
      exportPdfButton: "تصدير كـ PDF",
      exportChecklistPdfButton: "تصدير قائمة التحقق PDF",
      checklistViewButton: "عرض قائمة التحقق",
      scheduleViewButton: "عرض الجدول",
    },
    scheduleDisplay: {
      title: "جدول تنظيف المطبخ الشامل",
      itemEquipmentHeader: "العنصر / المعدات",
      dailyTasksHeader: "المهام اليومية",
      weeklyTasksHeader: "المهام الأسبوعية",
      monthlyTasksHeader: "المهام الشهرية",
    },
    checklist: {
      title: "قائمة التحقق التفاعلية للتنظيف",
      resetDaily: "إعادة تعيين اليومية",
      resetWeekly: "إعادة تعيين الأسبوعية",
      resetMonthly: "إعادة تعيين الشهرية",
      notesPlaceholder: "أضف تعليمات خاصة...",
      markComplete: "تحديد كمكتمل",
      markIncomplete: "تحديد كغير مكتمل",
    },
    chemicalManager: {
      title: "إدارة مواد التنظيف الكيميائية",
      addSingleTab: "إضافة فردية",
      editChemicalTab: "تعديل المادة",
      bulkImportTab: "استيراد جماعي",
      addFormTitle: "إضافة مادة كيميائية جديدة",
      extractFromPdfButton: "استخراج من PDF",
      extractingButton: "جاري استخراج البيانات...",
      extractionSuccess: "تم استخراج البيانات بنجاح! يرجى مراجعة الحقول المملوءة مسبقًا وحفظها.",
      nameLabel: "الاسم",
      colorLabel: "اللون",
      imageLabel: "صورة المادة الكيميائية (اختياري)",
      uploadImageButton: "تحميل صورة",
      removeImageButton: "إزالة",
      activeIngredientLabel: "المكون النشط",
      usedForLabel: "تستخدم لـ (كلمات مفتاحية)",
      usedForPlaceholder: "مثال: فرن, شواية, مقلاة",
      usedForHelpText: "كلمات مفتاحية مفصولة بفواصل للمطابقة مع المعدات.",
      applicationLabel: "تعليمات الاستخدام",
      toxicologicalInfoLabel: "المعلومات السمية (الآثار الصحية)",
      personalProtectionLabel: "تعليمات السلامة الإضافية",
      ppeChecklistLabel: "معدات الحماية الشخصية المطلوبة (PPE)",
      saveButton: "حفظ المادة",
      updateButton: "تحديث المادة",
      cancelButton: "إلغاء",
      resetButton: "إعادة تعيين",
      bulkImportTitle: "استيراد جماعي للمواد الكيميائية",
      bulkImportInstruction1: "قم بتنزيل القالب، واملأه، وأعد تحميله؛ أو الصق بياناتك هنا. (مفصولة بفاصلة منقوطة)",
      bulkImportInstruction2: "التنسيق (اللون اختياري، في النهاية):",
      bulkImportFormat: "الاسم; المكون; الكلمات المفتاحية; الاستخدام; السمية; الحماية; اللون",
      bulkImportPlaceholder: "مزيل شحوم; هيدروكسيد الصوديوم; فرن,شواية; رش على...; يسبب حروق; ارتد قفازات; #ff8c00",
      importButton: "استيراد المواد",
      downloadTemplate: "تحميل قالب CSV",
      uploadCsvButton: "تحميل CSV",
      chemicalListTitle: "قائمة المواد الكيميائية",
      exportButton: "تصدير",
      searchPlaceholder: "ابحث بالاسم، المكون، أو كلمة مفتاحية...",
      noChemicals: "لم تتم إضافة أي مواد كيميائية بعد.",
      noSearchResults: "لا توجد مواد كيميائية تطابق معايير البحث الخاصة بك.",
      activeIngredientHeader: "المكون النشط",
      usedForHeader: "تستخدم لـ",
      applicationHeader: "الاستخدام",
      toxicologicalInfoHeader: "المعلومات السمية",
      personalProtectionHeader: "الحماية الشخصية (PPE)",
      alertRequiredFields: "يرجى ملء حقول الاسم، وتستخدم لـ، وتعليمات الاستخدام.",
      importSuccess: (count: number) => `تم استيراد ${count} مادة (مواد) بنجاح.`,
      importSkipped: (count: number) => `تم تخطي ${count} سطر (أسطر) بسبب التنسيق غير الصحيح.`,
      importEmpty: "مربع النص فارغ.",
      filters: {
        title: "الفلاتر",
        showFilters: "إظهار الفلاتر",
        hideFilters: "إخفاء الفلاتر",
        clearAll: "مسح الكل",
        safetyLevel: "تصنيف السلامة",
        safetyAll: "جميع التصنيفات",
        safetyHigh: "خطر مرتفع",
        safetyMedium: "خطر متوسط",
        safetyLow: "خطر منخفض",
        ppe: "متطلبات الوقاية الشخصية",
        usedFor: "تستخدم لـ (كلمة مفتاحية)",
        selectKeyword: "اختر الاستخدام..."
      }
    },
    chemicalSelector: {
      selectChemical: "اختر المادة الكيميائية",
      removeAssociation: "إزالة الربط",
      ingredient: "المكون",
      application: "الاستخدام",
    },
    confirmationDialog: {
      exportTitle: "تأكيد تصدير PDF",
      exportChecklistTitle: "تأكيد تصدير قائمة التحقق PDF",
      exportChemicalTitle: "تأكيد تصدير قائمة المواد الكيميائية",
      duplicateScheduleTitle: "تأكيد نسخ الجدول",
      exportScheduleMessage: (filename: string) => `أنت على وشك تصدير الجدول باسم ${filename}.`,
      exportChecklistMessage: (filename: string) => `أنت على وشك تصدير حالة قائمة التحقق الحالية باسم ${filename}.`,
      exportChemicalsMessage: (filename: string) => `أنت على وشك تصدير قائمة المواد الكيميائية باسم ${filename}.pdf.`,
      duplicateScheduleMessage: "أنت على وشك إنشاء نسخة طبق الأصل من جدول التنظيف الحالي. سيؤدي هذا إلى مسح تقدم قائمة التحقق الحالية.",
      withFilters: "سيتم تضمين الترددات التالية:",
      checklistMessage: "سيتم تضمين جميع ترددات المهام (يومي، أسبوعي، شهري).",
      exportScopeFull: "أنت تقوم بتصدير الجدول الكامل.",
      exportScopeFiltered: "أنت تقوم بتصدير المهام المطابقة لفلاتر العرض الحالية فقط.",
      cancel: "إلغاء",
      confirm: "تأكيد وتصدير",
    },
    footer: {
      poweredBy: "مدعوم بالذكاء الاصطناعي. تم إنشؤه بواسطة مولد جدول التنظيف للإشراف الداخلي.",
    },
    errors: {
      scheduleGenerationFailed: "فشل في إنشاء جدول التنظيف. يرجى التحقق من مفتاح API الخاص بك والمحاولة مرة أخرى.",
      pdfExtractionFailed: "فشل في استخراج بيانات المواد الكيميائية من ملف PDF.",
      fileReadError: "لا يمكن قراءة الملف.",
      driveConnectFailed: "فشل الاتصال بجوجل درايف. تحقق من مانع المنبثقات.",
      cloudDownloadFailed: "تعذر تنزيل البيانات من جوجل درايف."
    },
    ppe: {
      required: "تنبيه سلامة",
      clickToView: "انقر لعرض متطلبات الحماية",
      title: "معدات الوقاية الشخصية المطلوبة",
      items: {
        gloves: "قفازات",
        goggles: "نظارات واقية",
        faceShield: "واقي الوجه",
        mask: "قناع",
        respirator: "جهاز تنفس",
        apron: "مريلة",
        safetyShoes: "أحذية أمان",
        rubberBoots: "أحذية مطاطية"
      }
    },
    dependencies: {
        modalTitle: "إدارة تبعيات المهام",
        instruction: "حدد المهام التي يجب إكمالها قبل المهمة الحالية.",
        searchPlaceholder: "البحث عن المتطلبات الأساسية...",
        saveButton: "حفظ التبعيات",
        manage: "ربط المتطلبات الأساسية",
        requires: "يتطلب",
        locked: "محظور بواسطة",
    },
    na: "غير متاح"
  }
};

let currentLanguage: Language = (localStorage.getItem('language') as Language) || 'en';

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
};

// Function to get nested property safely
const getNested = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => {
        return acc && acc[part];
    }, obj);
};

export const t = (key: string, args?: any): string => {
  const arabicTranslation = getNested(translations.ar, key);
  const englishTranslation = getNested(translations.en, key);

  let template;

  if (currentLanguage === 'ar' && arabicTranslation) {
    template = arabicTranslation;
  } else {
    template = englishTranslation || key;
  }
  
  if (typeof template === 'function') {
    return template(args);
  }

  return template;
};

// Initialize on load
setLanguage(currentLanguage);
