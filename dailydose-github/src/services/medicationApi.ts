/**
 * Medication API Service
 * Handles API calls to FDA openFDA and RxNorm APIs for medication lookup and validation
 */

import Fuse from 'fuse.js';

export interface MedicationSearchResult {
  id: string;                    // Unique identifier (RxCUI)
  displayName: string;           // User-friendly name from API
  standardizedName: string;      // Normalized name
  rxcui: string;                 // RxNorm Concept Unique Identifier
  ndc?: string;                  // National Drug Code
  strength?: string;             // Dosage strength info
  dosageForm?: string;           // e.g., "TABLET", "CAPSULE"
  brandName?: string;            // Brand name if available
  genericName?: string;          // Generic name if available
  score?: number;                // Fuzzy search relevance score
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  description: string;
  severity: 'Major' | 'Moderate' | 'Minor';
}

// Common brand-generic name mappings
const BRAND_GENERIC_MAP: Record<string, string[]> = {
  'tylenol': ['acetaminophen'],
  'acetaminophen': ['tylenol'],
  'advil': ['ibuprofen'],
  'motrin': ['ibuprofen'],
  'ibuprofen': ['advil', 'motrin'],
  'aspirin': ['bayer'],
  'bayer': ['aspirin'],
  'aleve': ['naproxen'],
  'naproxen': ['aleve'],
  'zantac': ['ranitidine'],
  'ranitidine': ['zantac'],
  'prilosec': ['omeprazole'],
  'omeprazole': ['prilosec'],
  'lipitor': ['atorvastatin'],
  'atorvastatin': ['lipitor'],
  'singulair': ['montelukast'],
  'montelukast': ['singulair'],
  'nexium': ['esomeprazole'],
  'esomeprazole': ['nexium'],
  'plavix': ['clopidogrel'],
  'clopidogrel': ['plavix'],
};

/**
 * Normalize search query for better matching
 */
function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ');   // Normalize whitespace
}

/**
 * Get synonym suggestions for a query
 */
function getSynonyms(query: string): string[] {
  const normalized = normalizeQuery(query);
  const synonyms = BRAND_GENERIC_MAP[normalized] || [];
  return [normalized, ...synonyms];
}

/**
 * Create fuzzy search instance for medication results
 */
function createFuzzySearch(results: MedicationSearchResult[]): Fuse<MedicationSearchResult> {
  return new Fuse(results, {
    keys: [
      { name: 'displayName', weight: 0.7 },
      { name: 'standardizedName', weight: 0.6 },
      { name: 'brandName', weight: 0.5 },
      { name: 'genericName', weight: 0.5 },
    ],
    threshold: 0.4, // More lenient matching
    includeScore: true,
    shouldSort: true,
    minMatchCharLength: 2,
  });
}

/**
 * Search for medications using the RxNorm API
 * Provides autocomplete suggestions as user types
 */
export async function searchMedications(
  query: string,
  limit: number = 10,
  signal?: AbortSignal
): Promise<MedicationSearchResult[]> {
  const normalizedQuery = normalizeQuery(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  try {
    const synonyms = getSynonyms(normalizedQuery);
    let allResults: MedicationSearchResult[] = [];

    // Search for each synonym to get broader results
    for (const synonym of synonyms.slice(0, 3)) { // Limit to first 3 synonyms
      if (signal?.aborted) break;

      try {
        const response = await fetch(
          `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(synonym)}`,
          { signal }
        );

        if (!response.ok) continue;

        const data = await response.json();

        if (!data.drugGroup || !data.drugGroup.conceptGroup) continue;

        // Extract concepts from all concept groups
        const concepts: any[] = [];
        data.drugGroup.conceptGroup.forEach((group: any) => {
          if (group.conceptProperties) {
            concepts.push(...group.conceptProperties);
          }
        });

        // Map RxNorm results to our format
        const results: MedicationSearchResult[] = concepts
          .slice(0, limit)
          .map((concept: any) => ({
            id: concept.rxcui,
            displayName: concept.name,
            standardizedName: concept.name.toLowerCase().trim(),
            rxcui: concept.rxcui,
            strength: extractStrength(concept.name),
            dosageForm: extractDosageForm(concept.name),
            brandName: extractBrandName(concept.name),
            genericName: extractGenericName(concept.name),
          }));

        allResults = [...allResults, ...results];
      } catch (error) {
        // Continue with other synonyms if one fails
        continue;
      }
    }

    // Remove duplicates based on rxcui
    const uniqueResults = allResults.filter((result, index, self) =>
      index === self.findIndex(r => r.rxcui === result.rxcui)
    );

    // If we have results, apply fuzzy search to rank them
    if (uniqueResults.length > 0) {
      const fuse = createFuzzySearch(uniqueResults);
      const fuzzyResults = fuse.search(normalizedQuery);

      // Convert Fuse results back to our format with scores
      const scoredResults = fuzzyResults.map(result => ({
        ...result.item,
        score: result.score,
      }));

      // Return top results, preferring exact matches and high-scoring fuzzy matches
      return scoredResults
        .sort((a, b) => {
          // Prioritize exact matches
          const aExact = a.displayName.toLowerCase().includes(normalizedQuery);
          const bExact = b.displayName.toLowerCase().includes(normalizedQuery);
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;

          // Then sort by fuzzy score
          return (a.score || 1) - (b.score || 1);
        })
        .slice(0, limit);
    }

    // If no results from API, return empty array for manual entry fallback
    return [];
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return [];
    }
    console.error('Medication search error:', error);
    return [];
  }
}

/**
 * Check for drug interactions between two medications
 * Returns severity level and description
 */
export async function checkDrugInteractions(
  rxcui1: string,
  rxcui2: string
): Promise<DrugInteraction | null> {
  if (!rxcui1 || !rxcui2 || rxcui1 === rxcui2) {
    return null;
  }

  try {
    // Using RxNav interaction API
    const response = await fetch(
      `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${rxcui1}&with=${rxcui2}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.interactionTypeGroup || data.interactionTypeGroup.length === 0) {
      return null;
    }

    const interactions = data.interactionTypeGroup[0]?.interactionType || [];

    if (interactions.length === 0) {
      return null;
    }

    const interaction = interactions[0];
    const pairs = interaction.interactionPair || [];

    if (pairs.length === 0) {
      return null;
    }

    const pair = pairs[0];
    const severity = extractSeverity(pair.severity || 'Unknown');

    return {
      drug1: pair.drug[0]?.name || 'Unknown',
      drug2: pair.drug[1]?.name || 'Unknown',
      description: pair.description || 'Potential drug interaction detected.',
      severity,
    };
  } catch (error) {
    console.error('Drug interaction check error:', error);
    // Return null on error to allow user to proceed
    return null;
  }
}

/**
 * Get full medication details from RxNorm
 */
export async function getMedicationDetails(rxcui: string): Promise<any> {
  if (!rxcui) return null;

  try {
    const response = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/properties.json`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get medication details error:', error);
    return null;
  }
}

/**
 * Check FDA adverse event data for a medication
 */
export async function checkFdaAdverseEvents(
  drugName: string
): Promise<{ count: number; events: any[] }> {
  try {
    const response = await fetch(
      `https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:"${encodeURIComponent(drugName)}"&limit=10`
    );

    if (!response.ok) {
      // FDA API may return 404 if no events found
      return { count: 0, events: [] };
    }

    const data = await response.json();

    return {
      count: data.meta?.results?.total || 0,
      events: data.results || [],
    };
  } catch (error) {
    console.error('FDA adverse events check error:', error);
    return { count: 0, events: [] };
  }
}

/**
 * Generate Drugs.com link for medication details
 */
export function generateDrugsComLink(medicationName: string): string {
  const encodedName = encodeURIComponent(medicationName);
  return `https://www.drugs.com/search.php?searchterm=${encodedName}`;
}

// ============ HELPER FUNCTIONS ============

/**
 * Extract strength/dosage information from medication name
 */
function extractStrength(name: string): string | undefined {
  const match = name.match(/(\d+(?:\.\d+)?)\s*(mg|mL|mcg|g|units?)/i);
  return match ? `${match[1]}${match[2]}` : undefined;
}

/**
 * Extract dosage form from medication name
 */
function extractDosageForm(name: string): string | undefined {
  const forms = [
    'tablet',
    'capsule',
    'solution',
    'suspension',
    'injection',
    'cream',
    'ointment',
    'spray',
    'powder',
    'liquid',
    'drop',
    'patch',
  ];

  const lowerName = name.toLowerCase();
  const found = forms.find((form) => lowerName.includes(form));
  return found ? found.charAt(0).toUpperCase() + found.slice(1) : undefined;
}

/**
 * Extract brand name from medication name (simplified heuristic)
 */
function extractBrandName(name: string): string | undefined {
  // This is a simplified approach - in a real implementation,
  // you'd want to use RxNorm's brand name API
  const words = name.split(' ');
  if (words.length > 1) {
    // Often brand names are capitalized or in parentheses
    const brandMatch = name.match(/\(([A-Z][a-z]+)\)/);
    if (brandMatch) return brandMatch[1];
  }
  return undefined;
}

/**
 * Extract generic name from medication name (simplified heuristic)
 */
function extractGenericName(name: string): string | undefined {
  // This is a simplified approach - in a real implementation,
  // you'd want to use RxNorm's generic name API
  const words = name.split(' ');
  if (words.length > 1) {
    // Generic names are usually lowercase
    return words[0].toLowerCase();
  }
  return name.toLowerCase();
}

/**
 * Map interaction severity string to enum
 */
function extractSeverity(
  severity: string
): 'Major' | 'Moderate' | 'Minor' {
  const normalized = severity.toLowerCase();
  if (normalized.includes('major')) return 'Major';
  if (normalized.includes('moderate')) return 'Moderate';
  return 'Minor';
}
