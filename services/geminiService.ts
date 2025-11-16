import { GoogleGenAI, Type } from "@google/genai";
import type { CleaningSchedulePlan, ScheduleItem, TaskDetail, Chemical } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

// This interface matches the direct output from the Gemini API based on the schema
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

export const generateCleaningSchedule = async (): Promise<CleaningSchedulePlan> => {
  const prompt = `Generate a comprehensive cleaning schedule plan for a hotel's Steward department. The plan should cover all common kitchen tools and equipment used for food preparation, cooking, and live buffet service.
  
  Structure the output into categories: 'Preparation Tools & Equipment', 'Cooking Equipment', 'Warewashing & Storage', and 'Live Buffet Equipment'.
  
  For each item, provide specific and descriptive cleaning tasks for 'daily', 'weekly', and 'monthly' frequencies. **Crucially, the task descriptions should be detailed enough to help identify the correct cleaning chemical.** For instance, instead of just "Clean it", specify "Wipe down stainless steel surfaces with a food-safe degreaser" or "Delime the coffee machine using a descaling solution". Mentioning materials (stainless steel, glass, cast iron) and types of soil (grease, limescale, carbon buildup) is highly encouraged.
  
  For each task, also provide a concise 'notes' field. This field should contain critical safety warnings, special instructions, or important reminders (e.g., "Use non-abrasive cloth only", "Ensure machine is cool before cleaning", "Disconnect power before servicing"). If no special note is applicable for a task, the value for 'notes' should be "N/A".

  If a cleaning frequency itself is not applicable for an item, provide a short note like 'N/A' or a relevant comment for the main task field.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: scheduleSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText);
    
    // Basic validation to ensure the structure matches our type
    if (parsedData && Array.isArray(parsedData.schedule)) {
        // Transform the AI response to our new, richer data structure
        const transformedSchedule: CleaningSchedulePlan = {
            schedule: parsedData.schedule.map((category: { category: string; items: GeminiScheduleItem[] }) => ({
                ...category,
                items: category.items.map((item: GeminiScheduleItem): ScheduleItem => ({
                    itemName: item.itemName,
                    daily: { task: item.daily.task, notes: item.daily.notes || '', chemicalId: null },
                    weekly: { task: item.weekly.task, notes: item.weekly.notes || '', chemicalId: null },
                    monthly: { task: item.monthly.task, notes: item.monthly.notes || '', chemicalId: null }
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
        name: {
            type: Type.STRING,
            description: "The product or brand name of the chemical. e.g., 'Suma Grill D9'."
        },
        activeIngredient: {
            type: Type.STRING,
            description: "The primary active chemical ingredient. If not explicitly found, return 'Not specified'."
        },
        usedFor: {
            type: Type.STRING,
            description: "A comma-separated list of keywords for what the chemical is used on. e.g., 'oven, grill, fryer, stainless steel'."
        },
        application: {
            type: Type.STRING,
            description: "A brief summary of the application or usage instructions. e.g., 'Spray onto warm surface, leave for 10-30 minutes, wipe clean.'"
        },
        toxicologicalInfo: {
            type: Type.STRING,
            description: "A brief summary of the toxicological information, focusing on potential health effects like skin/eye irritation. If not found, return 'Not specified'."
        },
        personalProtection: {
            type: Type.STRING,
            description: "A summary of exposure controls and personal protection required, listing recommended PPE like gloves, goggles, etc. If not found, return 'Not specified'."
        }
    },
    required: ["name", "activeIngredient", "usedFor", "application", "toxicologicalInfo", "personalProtection"]
};

/**
 * Extracts chemical information from a provided PDF file using a multimodal AI model.
 * @param base64Pdf The base64-encoded string of the PDF file.
 * @returns A promise that resolves to the extracted chemical data.
 */
export const extractChemicalInfoFromPdf = async (base64Pdf: string): Promise<Omit<Chemical, 'id' | 'color' | 'image'>> => {
    const prompt = `You are an expert data extractor specializing in chemical product information sheets and Safety Data Sheets (SDS). Analyze the provided PDF document and extract the following specific details:
1.  **name**: The main product or brand name.
2.  **activeIngredient**: The primary active chemical component. If multiple are listed, pick the most prominent one. If none is clearly listed, state 'Not specified'.
3.  **usedFor**: A concise, comma-separated list of keywords describing the types of equipment or surfaces it's designed for (e.g., oven, grill, fryer, floor, glass, stainless steel).
4.  **application**: A brief, one or two-sentence summary of the application instructions.
5.  **toxicologicalInfo**: A brief summary of the key toxicological information, focusing on potential health effects (e.g., skin/eye irritation, inhalation hazards). If not found, state 'Not specified'.
6.  **personalProtection**: A summary of exposure controls and personal protection required, listing recommended Personal Protective Equipment (PPE) like gloves, goggles, masks, etc. If not found, state 'Not specified'.

Return the extracted information in a structured JSON format.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
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

        // Validate that the parsed data contains the required fields
        if (parsedData && parsedData.name && parsedData.usedFor && parsedData.application) {
            return {
                name: parsedData.name,
                activeIngredient: parsedData.activeIngredient || 'Not specified',
                usedFor: parsedData.usedFor,
                application: parsedData.application,
                toxicologicalInfo: parsedData.toxicologicalInfo || 'Not specified',
                personalProtection: parsedData.personalProtection || 'Not specified',
            };
        } else {
            throw new Error("Extracted data is missing required fields.");
        }
    } catch (error) {
        console.error("Error calling Gemini API for PDF extraction:", error);
        throw new Error("Failed to extract chemical data from the PDF.");
    }
};