/**
 * Medication API Service
 * Handles API calls to FDA openFDA and RxNorm APIs for medication lookup and validation
 */

export interface MedicationSearchResult {
  id: string;                    // Unique identifier (RxCUI)
  displayName: string;           // User-friendly name from API
  standardizedName: string;      // Normalized name
  rxcui: string;                 // RxNorm Concept Unique Identifier
  ndc?: string;                  // National Drug Code
  strength?: string;             // Dosage strength info
  dosageForm?: string;           // e.g., "TABLET", "CAPSULE"
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  description: string;
  severity: 'Major' | 'Moderate' | 'Minor';
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
  if (!query.trim() || query.length < 2) {
    return [];
  }

  try {
    // Using RxNorm API for medication search
    const response = await fetch(
      `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(query)}&maxEntries=${limit}`,
      { signal }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.approximateGroup || !data.approximateGroup.candidate) {
      return [];
    }

    // Map RxNorm results to our format
    const results: MedicationSearchResult[] = data.approximateGroup.candidate
      .slice(0, limit)
      .map((candidate: any) => ({
        id: candidate.rxcui,
        displayName: candidate.name,
        standardizedName: candidate.name.toLowerCase().trim(),
        rxcui: candidate.rxcui,
        strength: extractStrength(candidate.name),
        dosageForm: extractDosageForm(candidate.name),
      }));

    return results;
  } catch (error) {
    console.error('Medication search error:', error);
    // Return empty array on error to allow fallback to manual entry
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
