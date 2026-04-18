import { SPECIES, SPECIES_BY_INAT_ID, type Species } from '../data/butterflies';

// Create a lookup by scientific name for fallback matching
const SPECIES_BY_SCI_NAME = Object.fromEntries(SPECIES.map(s => [s.name_sci.toLowerCase(), s]));

// Minimum confidence score (0-1 scale) to include a result
// 0.15 = 15% confidence: filters out low-quality guesses but allows reasonable matches
const MIN_SCORE = 0.15;

export interface VisionResult {
  species: Species;
  score: number;
  inatTaxonId: number;
  inatName: string;
}

export interface InatVisionResponse {
  results: VisionResult[];
  rawTop: { taxon_id: number; name: string; score: number }[];
}

/**
 * Send an image file to the iNaturalist Computer Vision API.
 * Requires a valid JWT token obtained via iNaturalist OAuth.
 */
export async function scoreImage(
  imageFile: File,
  jwtToken: string
): Promise<InatVisionResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch('https://api.inaturalist.org/v1/computervision/score_image', {
    method: 'POST',
    headers: {
      Authorization: jwtToken,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`iNaturalist Vision API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as {
    results: Array<{ taxon: { id: number; name: string }; combined_score: number }>;
  };

  const rawTop = data.results.map(r => ({
    taxon_id: r.taxon.id,
    name: r.taxon.name,
    score: r.combined_score,
  }));

  // Filter to only species in our Norwegian butterfly list
  // Also apply minimum score threshold to avoid low-confidence noise
  // Try matching by taxon ID first, then by scientific name (fallback for incorrect taxon IDs)
  const results: VisionResult[] = [];
  for (const r of data.results) {
    if (r.combined_score < MIN_SCORE) break; // iNaturalist results are sorted by score, so we can stop early
    
    let species = SPECIES_BY_INAT_ID[r.taxon.id];
    
    // Fallback: if no exact taxon ID match, try matching by scientific name
    if (!species && r.taxon.name) {
      species = SPECIES_BY_SCI_NAME[r.taxon.name.toLowerCase()];
    }
    
    if (species) {
      results.push({
        species,
        score: r.combined_score,
        inatTaxonId: r.taxon.id,
        inatName: r.taxon.name,
      });
    }
    if (results.length >= 3) break;
  }

  // If no exact match after filtering, try ancestor matching: include any result that is a
  // known Norwegian butterfly (broad filtering by taxon id set) — still respecting MIN_SCORE
  // Also try matching by scientific name as fallback
  if (results.length === 0) {
    for (const r of data.results.slice(0, 10)) {
      if (r.combined_score < MIN_SCORE) break;
      
      let species = SPECIES_BY_INAT_ID[r.taxon.id];
      
      // Fallback: match by scientific name if taxon ID doesn't match
      if (!species && r.taxon.name) {
        species = SPECIES_BY_SCI_NAME[r.taxon.name.toLowerCase()];
      }
      
      if (species) {
        results.push({ species, score: r.combined_score, inatTaxonId: r.taxon.id, inatName: r.taxon.name });
      }
    }
  }

  return { results, rawTop };
}

/**
 * Get the iNaturalist OAuth login URL. Opens a popup for the user to log in.
 * After login, the popup redirects to our callback URL with a code param.
 */
export function getInatAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
  });
  return `https://www.inaturalist.org/oauth/authorize?${params.toString()}`;
}
