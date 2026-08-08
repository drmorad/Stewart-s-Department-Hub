
import { GoogleGenAI, Type } from "@google/genai";
import type { CleaningSchedulePlan, ScheduleItem, TaskDetail, Chemical } from '../types';

const taskDetailSchema = {
    type: Type.OBJECT,
    properties: {
        task: {
            type: Type.STRING,
            description: "Detailed cleaning tasks. Mention specific parts or materials, e.g., 'Wipe down stainless steel exterior', 'Clean glass door'."
        },
        notes: {
            type: Type.STRING,
            description: "Optional special instructions, warnings, or notes for this task. e.g., 'Use non-abrasive cloth only', 'Check temperature after cleaning'. Can be 'N/A'."
        }
    },
    required: ["task"]
};


const scheduleSchema = {
  type: Type.OBJECT,
  properties: {
    schedule: {
      type: Type.ARRAY,
      description: "An array of cleaning categories for the steward department.",
      items: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            description: "Name of the equipment category (e.g., Preparation Tools & Equipment, Cooking Equipment)."
          },
          items: {
            type: Type.ARRAY,
            description: "List of items and their cleaning schedule within this category.",
            items: {
              type: Type.OBJECT,
              properties: {
                itemName: {
                  type: Type.STRING,
                  description: "Name of the specific tool or equipment. Be specific, e.g., 'Convotherm Combi Oven', 'Flat Top Grill'."
                },
                daily: taskDetailSchema,
                weekly: taskDetailSchema,
                monthly: taskDetailSchema,
              },
              required: ["itemName", "daily", "weekly", "monthly"]
            }
          }
        },
        required: ["category", "items"]
      }
    }
  },
  required: ["schedule"]
};

interface GeminiTaskDetail {
  task: string;
  notes?: string;
}

interface GeminiScheduleItem {
  itemName: string;
  daily: GeminiTaskDetail;
  weekly: GeminiTaskDetail;
  monthly: GeminiTaskDetail;
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const generateCleaningSchedule = async (): Promise<CleaningSchedulePlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Generate a professional cleaning schedule for a hotel Steward department. 
  Cover categories: 'Preparation Tools & Equipment', 'Cooking Equipment', 'Warewashing & Storage', and 'Live Buffet Equipment'.

  For each item, provide tasks for 'daily', 'weekly', and 'monthly' frequencies. 
  IMPORTANT: Structure tasks to follow a logical hygiene sequence. 
  - Daily: Focus on high-frequency sanitation and food-contact surfaces.
  - Weekly: Focus on medium-depth cleaning and secondary components.
  - Monthly: Focus on deep-cleaning, descaling, or structural maintenance.

  Mention materials (stainless steel, cast iron, glass) and soil types (grease, carbon, limescale) to help the chemical matching engine.
  Use clear, directive language. For notes, include critical safety steps like "Disconnect power", "Allow to cool", or "Wear PPE".`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: scheduleSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText);
    
    if (parsedData && Array.isArray(parsedData.schedule)) {
        const transformedSchedule: CleaningSchedulePlan = {
            schedule: parsedData.schedule.map((category: { category: string; items: GeminiScheduleItem[] }) => ({
                ...category,
                items: category.items.map((item: GeminiScheduleItem): ScheduleItem => ({
                    itemName: item.itemName,
                    daily: { id: generateId(), task: item.daily.task, notes: item.daily.notes || '', chemicalId: null, prerequisites: [] },
                    weekly: { id: generateId(), task: item.weekly.task, notes: item.weekly.notes || '', chemicalId: null, prerequisites: [] },
                    monthly: { id: generateId(), task: item.monthly.task, notes: item.monthly.notes || '', chemicalId: null, prerequisites: [] }
                }))
            }))
        };
        return transformedSchedule;
    } else {
        throw new Error("Invalid data structure received from API.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Could not generate cleaning schedule from the AI model.");
  }
};


const chemicalExtractionSchema = {
    type: Type.OBJECT,
    properties: {
        chemicals: {
            type: Type.ARRAY,
            description: "List of chemicals found in the document.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: {
                        type: Type.STRING,
                        description: "The product or brand name of the chemical. e.g., 'Suma Grill D9'."
                    },
                    activeIngredient: {
                        type: Type.STRING,
                        description: "The primary active chemical ingredient. e.g., 'Sodium Hydroxide'."
                    },
                    usedFor: {
                        type: Type.STRING,
                        description: "A comma-separated list of keywords for equipment/surfaces. e.g., 'oven, grill, stainless steel'."
                    },
                    application: {
                        type: Type.STRING,
                        description: "Brief summary of usage instructions."
                    },
                    toxicologicalInfo: {
                        type: Type.STRING,
                        description: "Key health hazards summary."
                    },
                    personalProtection: {
                        type: Type.STRING,
                        description: "Textual summary of required PPE."
                    },
                    ppeList: {
                        type: Type.ARRAY,
                        description: "Strict mapping to: ['gloves', 'goggles', 'mask', 'faceShield', 'apron', 'respirator', 'safetyShoes', 'rubberBoots'].",
                        items: { type: Type.STRING }
                    }
                },
                required: ["name", "activeIngredient", "usedFor", "application", "toxicologicalInfo", "personalProtection"]
            }
        }
    },
    required: ["chemicals"]
};

export const extractChemicalInfoFromPdf = async (base64Pdf: string): Promise<Omit<Chemical, 'id' | 'color' | 'image'>[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze the provided SDS PDF and extract data. Map PPE strictly to: gloves, goggles, mask, faceShield, apron, respirator, safetyShoes, rubberBoots.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: 'application/pdf',
                            data: base64Pdf,
                        },
                    },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: chemicalExtractionSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);

        if (parsedData && Array.isArray(parsedData.chemicals)) {
            return parsedData.chemicals.map((chem: any) => ({
                name: chem.name,
                activeIngredient: chem.activeIngredient || 'Not specified',
                usedFor: chem.usedFor,
                application: chem.application,
                toxicologicalInfo: chem.toxicologicalInfo || 'Not specified',
                personalProtection: chem.personalProtection || 'Not specified',
                ppeList: (chem.ppeList || []).filter((p: string) => 
                    ['gloves', 'goggles', 'mask', 'faceShield', 'apron', 'respirator', 'safetyShoes', 'rubberBoots'].includes(p)
                ),
            }));
        } else {
            throw new Error("Extracted data is missing the required structure.");
        }
    } catch (error) {
        console.error("Error calling Gemini API for PDF extraction:", error);
        throw new Error("Failed to extract chemical data from the PDF.");
    }
};
