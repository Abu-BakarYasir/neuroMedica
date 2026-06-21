#!/usr/bin/env bash
# Round 2 corpus seeding — deepen neurology + broaden all specialties for the FYP defense.
# Adds 429-retry + inter-call spacing so PubMed efetch doesn't rate-limit us.
B="https://neuro-medica-backend-servics.up.railway.app"
LOG="/c/Users/LENOVO/Uni/neuroMedica/backend/seed_corpus_2.progress.log"
: > "$LOG"

note() { echo "$(date '+%H:%M:%S') $*" | tee -a "$LOG"; }

ingest() { # endpoint, json
  local ep="$1" body="$2" out
  out=$(curl -s -m 540 -X POST "$B$ep" -H "Content-Type: application/json" -d "$body" 2>&1)
  if echo "$out" | grep -q "429"; then
    note "[429] backing off 25s and retrying: $body"
    sleep 25
    out=$(curl -s -m 540 -X POST "$B$ep" -H "Content-Type: application/json" -d "$body" 2>&1)
  fi
  note "[$ep] $body"
  note "   -> $out"
  sleep 2
}

# ---- Neurology deep dive (core to neuroMedica) ----
NEURO=(
  "subarachnoid hemorrhage management"
  "intracerebral hemorrhage management"
  "transient ischemic attack management"
  "myasthenia gravis treatment"
  "trigeminal neuralgia treatment"
  "essential tremor treatment"
  "restless legs syndrome treatment"
  "diabetic peripheral neuropathy treatment"
  "dementia with Lewy bodies management"
  "amyotrophic lateral sclerosis treatment"
  "Bell palsy treatment"
  "cluster headache treatment"
  "idiopathic intracranial hypertension treatment"
  "cerebral venous sinus thrombosis treatment"
  "Wernicke encephalopathy thiamine treatment"
  "neuropathic pain pharmacological treatment"
  "malignant spinal cord compression management"
  "glioblastoma treatment"
  "carotid artery stenosis management"
  "benign paroxysmal positional vertigo treatment"
  "traumatic brain injury management"
  "stroke secondary prevention antiplatelet"
)

# ---- Broaden other specialties ----
GENERAL=(
  # Cardiology
  "stable angina management" "infective endocarditis treatment" "acute pericarditis treatment"
  "deep vein thrombosis treatment" "hypertensive emergency management"
  "supraventricular tachycardia management" "aortic stenosis management"
  # Endocrine / metabolic
  "hyperthyroidism Graves disease treatment" "adrenal insufficiency management"
  "hyperkalemia management" "hyponatremia management" "osteoporosis treatment"
  "type 1 diabetes insulin management"
  # Infectious disease
  "tuberculosis treatment regimen" "HIV antiretroviral therapy initiation"
  "Clostridioides difficile infection treatment" "influenza antiviral treatment"
  "Lyme disease treatment" "endocarditis antibiotic prophylaxis"
  # Respiratory
  "pneumothorax management" "obstructive sleep apnea management"
  "idiopathic pulmonary fibrosis treatment"
  # GI / hepatology
  "inflammatory bowel disease treatment" "acute pancreatitis management"
  "cirrhosis complications management" "upper gastrointestinal bleeding management"
  "hepatitis C direct acting antiviral treatment"
  # Renal / GU
  "acute kidney injury management" "nephrolithiasis kidney stones management"
  "benign prostatic hyperplasia treatment"
  # Rheumatology
  "rheumatoid arthritis treatment" "gout acute and chronic management"
  "systemic lupus erythematosus treatment" "giant cell arteritis treatment"
  "osteoarthritis management"
  # Psychiatry
  "bipolar disorder treatment" "schizophrenia antipsychotic treatment"
  "generalized anxiety disorder treatment" "alcohol withdrawal management"
  "opioid use disorder medication treatment"
  # Heme / Onc / Emergency
  "iron deficiency anemia treatment" "anticoagulation reversal management"
  "anaphylaxis emergency management" "febrile neutropenia management"
)

# ---- Additional clinical guidelines ----
GUIDELINES=(
  "epilepsy" "migraine" "Parkinson disease" "multiple sclerosis"
  "heart failure" "COPD" "asthma" "chronic kidney disease"
  "rheumatoid arthritis" "venous thromboembolism" "tuberculosis"
  "HIV" "stroke prevention" "sepsis pediatric"
)

# ---- Additional FDA drug labels (neuro-heavy) ----
OPENFDA=(
  "warfarin" "clopidogrel" "gabapentin" "pregabalin" "lamotrigine"
  "valproate" "carbamazepine" "phenytoin" "donepezil" "memantine"
  "carbidopa levodopa" "sumatriptan" "prednisone" "omeprazole"
  "ceftriaxone" "vancomycin" "aspirin" "metoprolol" "furosemide"
  "rivaroxaban" "duloxetine" "escitalopram" "quetiapine" "insulin glargine"
)

note "==== NEURO (${#NEURO[@]}) ===="
for q in "${NEURO[@]}"; do ingest "/api/ingestion/ingest" "{\"query\":\"$q\",\"max_results\":25}"; done

note "==== GENERAL (${#GENERAL[@]}) ===="
for q in "${GENERAL[@]}"; do ingest "/api/ingestion/ingest" "{\"query\":\"$q\",\"max_results\":25}"; done

note "==== GUIDELINES (${#GUIDELINES[@]}) ===="
for q in "${GUIDELINES[@]}"; do ingest "/api/ingestion/guidelines" "{\"query\":\"$q\",\"max_results\":15}"; done

note "==== OPENFDA (${#OPENFDA[@]}) ===="
for d in "${OPENFDA[@]}"; do ingest "/api/ingestion/openfda" "{\"query\":\"$d\",\"max_results\":3}"; done

note "==== RXNORM ===="
ingest "/api/ingestion/rxnorm" "{\"names\":[\"warfarin\",\"clopidogrel\",\"gabapentin\",\"pregabalin\",\"lamotrigine\",\"valproate\",\"carbamazepine\",\"phenytoin\",\"donepezil\",\"memantine\",\"carbidopa\",\"levodopa\",\"sumatriptan\",\"rivaroxaban\",\"duloxetine\",\"escitalopram\",\"quetiapine\"]}"

note "==== FINAL STATUS ===="
note "$(curl -s -m 30 "$B/api/ingestion/status")"
note "==== ROUND 2 COMPLETE ===="
