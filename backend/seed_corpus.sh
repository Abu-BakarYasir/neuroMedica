#!/usr/bin/env bash
# One-off corpus seeding for the live neuroMedica RAG demo.
# Ingests across specialties + multiple sources so the panel can ask varied questions.
B="https://neuro-medica-backend-servics.up.railway.app"
LOG="/c/Users/LENOVO/Uni/neuroMedica/backend/seed_corpus.progress.log"
: > "$LOG"

note() { echo "$(date '+%H:%M:%S') $*" | tee -a "$LOG"; }

ingest() { # endpoint, json
  local ep="$1" body="$2"
  local out
  out=$(curl -s -m 540 -X POST "$B$ep" -H "Content-Type: application/json" -d "$body" 2>&1)
  note "[$ep] $body"
  note "   -> $out"
}

# ---- PubMed research articles (broad clinical coverage) ----
PUBMED_QUERIES=(
  # Neurology (core to neuroMedica)
  "acute ischemic stroke management guidelines"
  "epilepsy first line antiseizure medication treatment"
  "migraine prophylaxis and acute treatment"
  "Parkinson disease pharmacological treatment"
  "multiple sclerosis disease modifying therapy"
  "Alzheimer disease treatment guidelines"
  "status epilepticus management"
  "Guillain-Barre syndrome treatment"
  "bacterial meningitis empiric antibiotic treatment"
  # Cardiology
  "hypertension first line treatment guidelines"
  "atrial fibrillation anticoagulation management"
  "heart failure reduced ejection fraction treatment"
  "acute coronary syndrome management"
  "hyperlipidemia statin therapy guidelines"
  # Endocrine
  "type 2 diabetes mellitus management guidelines"
  "diabetic ketoacidosis management"
  "hypothyroidism levothyroxine treatment"
  # Infectious disease
  "urinary tract infection antibiotic treatment"
  "sepsis management surviving sepsis guidelines"
  "cellulitis skin soft tissue infection antibiotics"
  # Respiratory
  "asthma management guidelines"
  "COPD exacerbation treatment"
  "pulmonary embolism diagnosis and treatment"
  # GI / Renal / Psych / Heme
  "GERD proton pump inhibitor treatment"
  "Helicobacter pylori peptic ulcer eradication"
  "chronic kidney disease management guidelines"
  "major depressive disorder antidepressant treatment"
  "venous thromboembolism anticoagulation treatment"
)

# ---- Clinical practice guidelines (guideline source tag) ----
GUIDELINE_QUERIES=(
  "community-acquired pneumonia"
  "atrial fibrillation"
  "type 2 diabetes"
  "ischemic stroke"
  "sepsis"
)

# ---- FDA drug labels (openfda source tag) ----
OPENFDA_DRUGS=(
  "atorvastatin" "metformin" "lisinopril" "apixaban" "levetiracetam"
  "amoxicillin" "azithromycin" "levothyroxine" "sertraline" "amlodipine"
)

note "==== PUBMED (${#PUBMED_QUERIES[@]} topics) ===="
for q in "${PUBMED_QUERIES[@]}"; do
  ingest "/api/ingestion/ingest" "{\"query\":\"$q\",\"max_results\":25}"
done

note "==== GUIDELINES (${#GUIDELINE_QUERIES[@]} topics) ===="
for q in "${GUIDELINE_QUERIES[@]}"; do
  ingest "/api/ingestion/guidelines" "{\"query\":\"$q\",\"max_results\":15}"
done

note "==== OPENFDA (${#OPENFDA_DRUGS[@]} drugs) ===="
for d in "${OPENFDA_DRUGS[@]}"; do
  ingest "/api/ingestion/openfda" "{\"query\":\"$d\",\"max_results\":3}"
done

note "==== RXNORM (drug concepts) ===="
ingest "/api/ingestion/rxnorm" "{\"names\":[\"atorvastatin\",\"metformin\",\"lisinopril\",\"apixaban\",\"levetiracetam\",\"amoxicillin\",\"azithromycin\",\"levothyroxine\",\"sertraline\",\"amlodipine\"]}"

note "==== FINAL STATUS ===="
note "$(curl -s -m 30 "$B/api/ingestion/status")"
note "==== SEEDING COMPLETE ===="
