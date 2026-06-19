// Helpers for the dashboard search bar.
//
// The header search routes to the Patients page with the query pre-applied,
// which is where patient records actually live. Keeping the URL builder pure
// makes the behaviour testable without a router.

const PATIENTS_PATH = "/protected/doctors/patients";

/** Build the Patients-page href for a search query (empty query -> bare path). */
export function buildPatientsSearchHref(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return PATIENTS_PATH;
  return `${PATIENTS_PATH}?q=${encodeURIComponent(trimmed)}`;
}
