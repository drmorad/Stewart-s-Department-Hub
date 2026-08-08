export interface TaskDetail {
  id: string; // Unique identifier for the task
  task: string;
  chemicalId: string | null;
  notes?: string;
  prerequisites?: string[]; // Array of Task IDs that must be completed first
}

export interface ScheduleItem {
  itemName: string;
  daily: TaskDetail;
  weekly: TaskDetail;
  monthly: TaskDetail;
}

export interface ScheduleCategory {
  category: string;
  items: ScheduleItem[];
}

export interface CleaningSchedulePlan {
  schedule: ScheduleCategory[];
}

export type ChecklistStatus = {
  daily: boolean;
  weekly: boolean;
  monthly: boolean;
};

export type ChecklistState = {
  [categoryIndex: number]: {
    [itemIndex: number]: ChecklistStatus;
  };
};

export interface Chemical {
  id: string;
  name: string;
  activeIngredient: string;
  usedFor: string; // Comma-separated keywords for matching
  application: string;
  color?: string; // Optional color for visual identification
  image?: string; // Optional base64 encoded image string
  toxicologicalInfo?: string;
  personalProtection?: string;
  ppeList?: string[]; // Array of selected PPE items keys
}

export type ActiveFilters = {
  daily: boolean;
  weekly: boolean;
  monthly: boolean;
};