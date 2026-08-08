import type { Chemical } from '../types';

// Stop words to ignore during tokenization
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'from',
  'clean', 'cleaning', 'cleaner', 'wipe', 'scrub', 'sanitize', 'disinfect', 'wash', 'rinse', 'polish', 'deep', 'all',
  'remove', 'buildup', 'grease', 'stains', 'down', 'surfaces', 'equipment', 'tools', 'daily',
  'weekly', 'monthly', 'as', 'needed', 'ensure', 'is', 'are', 'be', 'it', 'its', 'n/a', 'using',
  'solution', 'machine', 'interior', 'exterior', 'parts', 'components', 'check', 'detailed',
  'specific', 'mention', 'use', 'apply', 'procedure', 'instructions', 'method', 'surface', 'pre', 'post',
  'make', 'sure', 'maintain', 'proper', 'regular', 'correct', 'appropriate'
]);

// Maps active ingredients to high-priority equipment categories
const ACTIVE_INGREDIENT_MAP: Record<string, string[]> = {
  'sodium hydroxide': ['grill', 'oven', 'fryer', 'degreaser', 'heavy duty', 'carbon'],
  'potassium hydroxide': ['grill', 'oven', 'fryer', 'degreaser', 'caustic'],
  'phosphoric acid': ['descaler', 'limescale', 'dishwasher', 'coffee', 'ice', 'delimer'],
  'citric acid': ['descaler', 'coffee', 'kettle', 'safe acid'],
  'quaternary ammonium': ['sanitizer', 'surface', 'counter', 'prep', 'food contact'],
  'sodium hypochlorite': ['bleach', 'floor', 'drain', 'sanitizer', 'chlorine'],
  'isopropyl alcohol': ['glass', 'electronic', 'probe', 'no rinse'],
};

// Material Sensitivity Map: Penalize chemicals with these ingredients on certain surfaces
const MATERIAL_SENSITIVITY: Record<string, string[]> = {
  'sodium hydroxide': ['aluminum', 'aluminium', 'brass', 'copper', 'soft metal', 'galvanized'],
  'potassium hydroxide': ['aluminum', 'aluminium', 'brass', 'copper', 'soft metal'],
  'phosphoric acid': ['marble', 'limestone', 'stone', 'soft metal'],
  'sodium hypochlorite': ['stainless steel', 'ss', 'metal', 'prolonged contact']
};

// Expanded Synonyms map to link related kitchen terms and common brands
const SYNONYMS: Record<string, string[]> = {
  'oven': ['combi', 'convotherm', 'rational', 'stove', 'range', 'cooker', 'roaster', 'baking', 'chamber', 'unox', 'retigo', 'alto-shaam', 'turbofan', 'steamer', 'vapor', 'microwave'],
  'combi': ['oven', 'steamer', 'rational', 'convotherm', 'retigo', 'unox', 'alto-shaam', 'vapor'],
  'grill': ['griddle', 'plancha', 'flat top', 'charbroiler', 'salamander', 'broiler', 'bbq', 'barbecue', 'hot plate', 'flattop', 'chargrill', 'contact grill'],
  'griddle': ['grill', 'flat top', 'plancha', 'plate', 'skillet'],
  'fryer': ['vat', 'deep fryer', 'basket', 'oil', 'frying', 'pressure fryer', 'henny penny', 'fryline'],
  'fridge': ['refrigerator', 'chiller', 'cooler', 'walk-in', 'cold room', 'reach-in', 'under-counter', 'cabinet', 'upright', 'foster', 'williams', 'true', 'undercounter'],
  'refrigerator': ['fridge', 'chiller', 'cooler', 'cabinet'],
  'freezer': ['walk-in', 'cold room', 'blast', 'shock', 'irinox', 'chest freezer'],
  'dishwasher': ['warewash', 'dish machine', 'glass washer', 'flight machine', 'hood type', 'conveyor', 'passthrough', 'pot wash', 'hobart', 'winterhalter', 'meiko', 'glasswasher'],
  'warewash': ['dishwasher', 'washing', 'cleaning', 'meiko', 'hobart'],
  'sink': ['basin', 'wash station', 'trough', 'bowl', 'handwash', 'faucet', 'soak', 'pot sink'],
  'floor': ['deck', 'ground', 'grout', 'tile', 'drain', 'skirting', 'vinyl', 'concrete', 'mop', 'walkway', 'kitchen floor'],
  'counter': ['worktable', 'prep table', 'surface', 'bench', 'stainless', 'top', 'pass', 'preparation table'],
  'stainless': ['steel', 'metal', 'counter', 'worktable', 'inox', 'chrome', 'ss'],
  'glass': ['window', 'mirror', 'display', 'sneeze guard', 'panel', 'vitrine', 'sneeze', 'screen', 'glazing'],
  'descaler': ['delimer', 'acid', 'scale remover', 'lime', 'calcium', 'mineral', 'clorox', 'limescale'],
  'degreaser': ['oven cleaner', 'grill cleaner', 'heavy duty', 'carbon remover', 'caustic', 'alkaline', 'fat remover', 'grease lifter'],
  'coffee': ['espresso', 'brewer', 'machine', 'urn', 'percolator', 'grinder', 'bean', 'wmf', 'bunn', 'cappuccino'],
  'ice': ['maker', 'machine', 'bin', 'cuber', 'flaker', 'hoshizaki', 'manitowoc', 'icemaker'],
  'hand': ['soap', 'sanitizer', 'wash', 'lotion', 'dispenser', 'hygiene'],
  'drain': ['floor', 'trough', 'pipe', 'gully', 'grate', 'channel', 'grease trap'],
  'slicer': ['meat slicer', 'cutter', 'blade', 'deli', 'mandoline', 'berkel', 'bizerba', 'gravity slicer'],
  'mixer': ['planetary', 'stand mixer', 'bowl', 'beater', 'whisk', 'dough', 'spiral', 'hobart', 'kitchenaid', 'blender'],
  'cutting': ['board', 'chopping', 'poly', 'block', 'color coded', 'prep board'],
  'sanitizer': ['disinfectant', 'quat', 'bleach', 'alcohol', 'spray', 'sanitising', 'food safe', 'd4', 'anti-bac'],
  'hood': ['canopy', 'vent', 'filter', 'exhaust', 'extraction', 'baffle', 'ventilation'],
  'bratt': ['tilting', 'skillet', 'braising', 'pan'],
  'kettle': ['boiler', 'steam', 'jacketed', 'soup'],
  'salamander': ['broiler', 'melter', 'overhead', 'grill'],
  'blast': ['chiller', 'freezer', 'shock', 'irinox'],
  'tilt': ['skillet', 'pan', 'bratt'],
  'vacuum': ['pack', 'sealer', 'multivac', 'henkelman', 'sous vide']
};

const levenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
    }
  }
  return matrix[b.length][a.length];
};

const getTokens = (text: string): Set<string> => {
  if (!text) return new Set();
  const tokens = new Set<string>();
  text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .forEach(word => {
        if (word.length > 2 && !STOP_WORDS.has(word)) {
            tokens.add(word);
            if (word.endsWith('s') && word.length > 3) tokens.add(word.slice(0, -1));
            else if (word.endsWith('ing') && word.length > 5) tokens.add(word.slice(0, -3));
            else if (word.endsWith('ed') && word.length > 4) tokens.add(word.slice(0, -2));
        }
    });
  return tokens;
};

export const calculateSafetyPenalty = (chemical: Chemical): number => {
    let penalty = 0;
    const tox = (chemical.toxicologicalInfo || '').toLowerCase();
    const ppe = (chemical.personalProtection || '').toLowerCase();
    const ppeListStr = (chemical.ppeList || []).join(' ').toLowerCase();

    const risks = {
        'fatal': 600, 
        'toxic': 400, 
        'carcinogen': 450, 
        'scba': 300, 
        'respirator': 250,
        'corrosive': 200, 
        'burns': 180, 
        'severe': 150, 
        'explosive': 300, 
        'danger': 140,
        'harmful': 100, 
        'warning': 80, 
        'shield': 100, 
        'irritant': 70, 
        'goggles': 60,
        'mask': 50, 
        'gloves': 40, 
        'apron': 40, 
        'boots': 40, 
        'flammable': 150,
        'organ damage': 350,
        'respiratory sensitizer': 300,
        'skin corrosion': 220,
        'serious eye damage': 250
    };

    Object.entries(risks).forEach(([key, val]) => {
        if (tox.includes(key) || ppe.includes(key) || ppeListStr.includes(key)) penalty += val;
    });

    if (chemical.ppeList && chemical.ppeList.length > 0) {
        penalty += (chemical.ppeList.length * 45);
    }
    
    return penalty;
};

const impliesFoodContact = (text: string): boolean => {
    const keywords = ['pot', 'pan', 'plate', 'cutlery', 'utensil', 'prep', 'cutting board', 'chopping', 'surface', 'counter', 'slicer', 'mixer', 'interior', 'food', 'table', 'tray', 'blade', 'contact', 'gastronorm', 'gn', 'prep board', 'worktable', 'cookware', 'utensils'];
    const lowerText = text.toLowerCase();
    return keywords.some(k => lowerText.includes(k));
};

const isFoodSafeChemical = (chemical: Chemical): boolean => {
    const text = (chemical.name + ' ' + (chemical.activeIngredient || '') + ' ' + (chemical.application || '') + ' ' + (chemical.usedFor || '')).toLowerCase();
    return text.includes('food safe') || text.includes('food grade') || text.includes('rinse free') || text.includes('no-rinse') || text.includes('sanitizer') || text.includes('d4') || text.includes('food-safe') || text.includes('contact safe') || text.includes('multipurpose');
};

export const findBestChemicalForTask = (
  itemName: string,
  taskDescription: string,
  chemicals: Chemical[]
): string | null => {
  if (chemicals.length === 0) return null;

  const docFrequency: Record<string, number> = {};
  const chemicalTokensMap: Record<string, Set<string>> = {};

  chemicals.forEach(chem => {
      const tokens = getTokens((chem.usedFor || '') + ' ' + chem.name + ' ' + (chem.activeIngredient || ''));
      chemicalTokensMap[chem.id] = tokens;
      tokens.forEach(token => { docFrequency[token] = (docFrequency[token] || 0) + 1; });
  });

  const totalDocs = chemicals.length;
  const getIdf = (term: string) => {
      const count = docFrequency[term] || 0;
      return Math.log((totalDocs + 1) / (count + 0.5)); 
  };

  const itemTokens = getTokens(itemName);
  const taskTokens = getTokens(taskDescription);
  const isFoodContactTask = impliesFoodContact(itemName + ' ' + taskDescription);
  const isStainless = (itemName + ' ' + taskDescription).toLowerCase().includes('stainless');
  
  let bestMatch: { id: string; score: number } | null = null;

  chemicals.forEach(chemical => {
      const chemTokens = chemicalTokensMap[chemical.id];
      const activeIng = (chemical.activeIngredient || '').toLowerCase();
      let relevanceScore = 0;

      const calculateScore = (inputTokens: Set<string>, weight: number) => {
          let score = 0;
          inputTokens.forEach(token => {
              let tokenScore = 0;
              const idf = getIdf(token);
              
              if (chemTokens.has(token)) tokenScore = Math.max(tokenScore, idf * 3.5);
              
              const syns = SYNONYMS[token] || [];
              syns.forEach(syn => { if (chemTokens.has(syn)) tokenScore = Math.max(tokenScore, getIdf(syn) * 2.5); });

              // Active Ingredient Priority Match
              Object.entries(ACTIVE_INGREDIENT_MAP).forEach(([ingredient, relatedTerms]) => {
                  if (activeIng.includes(ingredient) && (inputTokens.has(token) || Array.from(inputTokens).some(t => relatedTerms.includes(t)))) {
                      tokenScore = Math.max(tokenScore, 6.0); 
                  }
              });

              if (tokenScore === 0 && token.length > 3) {
                  chemTokens.forEach(ct => {
                      if (ct.length > 3) {
                          const dist = levenshteinDistance(token, ct);
                          const threshold = token.length > 8 ? 2 : 1;
                          if (dist <= threshold) {
                              tokenScore = Math.max(tokenScore, getIdf(ct) * 0.8);
                          }
                      }
                  });
              }
              score += tokenScore;
          });
          return score * weight;
      };

      relevanceScore += calculateScore(itemTokens, 8.0); 
      relevanceScore += calculateScore(taskTokens, 5.0); 

      // Food Contact Nuance
      if (isFoodContactTask && isFoodSafeChemical(chemical)) relevanceScore *= 2.8;
      else if (isFoodContactTask && !isFoodSafeChemical(chemical)) relevanceScore *= 0.2;

      // Material Sensitivity Nuance
      Object.entries(MATERIAL_SENSITIVITY).forEach(([ingredient, sensitiveSurfaces]) => {
          if (activeIng.includes(ingredient)) {
              sensitiveSurfaces.forEach(surface => {
                  if ((itemName + ' ' + taskDescription).toLowerCase().includes(surface)) {
                      relevanceScore *= 0.4; // Strong penalty for potentially damaging matching
                  }
              });
          }
      });

      // Daily vs Heavy Duty Nuance
      const isMonthlyDeepClean = taskDescription.toLowerCase().includes('deep') || taskDescription.toLowerCase().includes('heavy') || taskDescription.toLowerCase().includes('monthly');
      if (isMonthlyDeepClean && (activeIng.includes('hydroxide') || activeIng.includes('caustic'))) relevanceScore *= 1.5;

      if (relevanceScore > 0.1) {
          const safetyPenalty = calculateSafetyPenalty(chemical);
          relevanceScore -= (safetyPenalty * 0.04);
      }

      if (relevanceScore > 1.0 && (!bestMatch || relevanceScore > bestMatch.score)) {
          bestMatch = { id: chemical.id, score: relevanceScore };
      }
  });

  return bestMatch ? bestMatch.id : null;
};
