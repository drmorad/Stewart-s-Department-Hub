import type { Chemical } from '../types';

// Expanded stop words to be more effective.
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'from',
  'clean', 'wipe', 'scrub', 'sanitize', 'disinfect', 'wash', 'rinse', 'polish', 'deep', 'all',
  'remove', 'buildup', 'grease', 'stains', 'down', 'surfaces', 'equipment', 'tools', 'daily',
  'weekly', 'monthly', 'as', 'needed', 'ensure', 'is', 'are', 'be', 'it', 'its', 'n/a', 'using',
  'solution', 'machine', 'interior', 'exterior', 'parts', 'components', 'check', 'detailed',
  'specific', 'mention'
]);

/**
 * Tokenizes and cleans text for matching.
 * - Converts to lowercase.
 * - Removes punctuation.
 * - Splits into words.
 * - Removes common stop words.
 * - Adds the singular form for words ending in 's' (basic stemming).
 * @param text The input string.
 * @returns A set of cleaned words (tokens).
 */
const getTokens = (text: string): Set<string> => {
  if (!text) return new Set();
  const tokens = new Set<string>();
  
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .forEach(word => {
        if (word.length > 2 && !STOP_WORDS.has(word)) {
            tokens.add(word);
            // Basic stemming: if a word ends in 's', also add its singular form.
            if (word.endsWith('s') && word.length > 3) {
                tokens.add(word.slice(0, -1));
            }
        }
    });
  return tokens;
};

/**
 * Calculates a safety penalty for a chemical based on its toxicological information and personal protection requirements.
 * Higher penalty for more severe warnings.
 * @param chemical The chemical object.
 * @returns The calculated safety penalty.
 */
const calculateSafetyPenalty = (chemical: Chemical): number => {
    let penalty = 0;
    const lowerToxicology = (chemical.toxicologicalInfo || '').toLowerCase();
    const lowerProtection = (chemical.personalProtection || '').toLowerCase();

    // Toxicological info keywords and their penalties
    const toxicologyPenalties = {
        'fatal': 100, 'toxic': 80, 'poison': 80, 'corrosive': 70, 'carcinogen': 90,
        'mutagen': 90, 'reproductive toxin': 90, 'aspiration hazard': 60, 'severe': 50,
        'harmful': 30, 'irritant': 20, 'sensitizer': 20, 'danger': 40,
    };

    // Personal protection keywords and their penalties
    const protectionPenalties = {
        'respirator': 70, 'scba': 80, 'ventilated hood': 60, 'full-face shield': 50,
        'chemical-resistant suit': 70, 'goggles': 20, 'safety glasses': 10,
        'gloves': 10, 'apron': 10, 'mask': 10,
    };

    for (const keyword in toxicologyPenalties) {
        if (lowerToxicology.includes(keyword)) {
            penalty += toxicologyPenalties[keyword as keyof typeof toxicologyPenalties];
        }
    }

    for (const keyword in protectionPenalties) {
        if (lowerProtection.includes(keyword)) {
            penalty += protectionPenalties[keyword as keyof typeof protectionPenalties];
        }
    }
    
    // Add a small base penalty for any specific toxicological/PPE info being present,
    // to slightly de-prioritize chemicals that require *any* safety consideration
    // over those with no information (assuming "no information" implies lower risk for this context).
    if (chemical.toxicologicalInfo && chemical.toxicologicalInfo.toLowerCase() !== 'not specified' && chemical.toxicologicalInfo.trim() !== '') {
        penalty += 5;
    }
    if (chemical.personalProtection && chemical.personalProtection.toLowerCase() !== 'not specified' && chemical.personalProtection.trim() !== '') {
        penalty += 5;
    }

    return penalty;
};


/**
 * Finds the best matching chemical for a given cleaning task using a weighted scoring model.
 *
 * This refined function improves accuracy by:
 * 1.  **Enhanced Tokenization**: Includes basic stemming for plurals (e.g., 'ovens' becomes 'oven').
 * 2.  **Weighted Scoring**: Assigns higher scores to keywords matching the item's name (high relevance)
 *     versus the task description (context).
 * 3.  **Match Quality Scoring**: Differentiates between exact matches (e.g., token 'grill' matches
 *     keyword 'grill') and partial matches (e.g., token 'steel' matches keyword 'stainless steel'),
 *     awarding significantly more points for exact matches.
 * 4.  **Safety Penalty**: Incorporates a penalty based on toxicological information and personal
 *     protection requirements, favoring less hazardous chemicals for general tasks.
 *
 * @param itemName The name of the item to be cleaned (e.g., "Oven").
 * @param taskDescription The description of the cleaning task (e.g., "Deep clean interior").
 * @param chemicals An array of available chemicals.
 * @returns The ID of the best matching chemical, or null if no suitable match is found.
 */
export const findBestChemicalForTask = (
  itemName: string,
  taskDescription: string,
  chemicals: Chemical[]
): string | null => {
  if (!taskDescription || taskDescription.trim().toLowerCase() === 'n/a' || chemicals.length === 0) {
    return null;
  }
  
  // Generate tokens from the item name and task description.
  const itemNameTokens = getTokens(itemName);
  const taskDescriptionTokens = getTokens(taskDescription);
  
  if (itemNameTokens.size === 0 && taskDescriptionTokens.size === 0) {
    return null;
  }

  let bestMatch: { id: string; score: number } | null = null;
  
  // --- Scoring Configuration ---
  // Matches from the item name are more important than from the task description.
  const ITEM_NAME_WEIGHT = 5;
  const TASK_DESC_WEIGHT = 2;
  
  // Exact keyword matches are much more valuable than partial ones.
  const EXACT_MATCH_SCORE = 10;
  const PARTIAL_MATCH_SCORE = 1;

  chemicals.forEach(chemical => {
    // A chemical must have 'usedFor' keywords to be considered.
    if (!chemical.usedFor) {
        return;
    }
      
    const chemicalKeywords = new Set(
      chemical.usedFor
        .toLowerCase()
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)
    );

    if (chemicalKeywords.size === 0) {
      return;
    }

    let currentScore = 0;

    /**
     * Calculates a score for a set of tokens against the chemical's keywords.
     * It finds the best match type (exact or partial) for each token to avoid
     * inflating scores for general terms.
     */
    const calculateContentMatchScore = (tokens: Set<string>, weight: number): number => {
      let score = 0;
      tokens.forEach(token => {
        let bestScoreForToken = 0;
        chemicalKeywords.forEach(keyword => {
          if (keyword === token) { // Exact match is best
            bestScoreForToken = Math.max(bestScoreForToken, EXACT_MATCH_SCORE);
          } else if (keyword.includes(token) || token.includes(keyword)) { // Partial match is good
            bestScoreForToken = Math.max(bestScoreForToken, PARTIAL_MATCH_SCORE);
          }
        });
        score += bestScoreForToken;
      });
      return score * weight;
    };

    // Calculate and combine scores from item name and task description.
    currentScore += calculateContentMatchScore(itemNameTokens, ITEM_NAME_WEIGHT);
    currentScore += calculateContentMatchScore(taskDescriptionTokens, TASK_DESC_WEIGHT);
    
    // Apply safety penalty
    const safetyPenalty = calculateSafetyPenalty(chemical);
    currentScore -= safetyPenalty;

    // Ensure score doesn't go below zero
    currentScore = Math.max(0, currentScore);

    // If this chemical has the highest score so far, it's our new best match.
    if (currentScore > 0 && (!bestMatch || currentScore > bestMatch.score)) {
      bestMatch = { id: chemical.id, score: currentScore };
    }
  });

  return bestMatch ? bestMatch.id : null;
};