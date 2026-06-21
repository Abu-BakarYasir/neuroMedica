# Colab `/scan` endpoint — return-only change

## Context

The "Scan prescription" feature (`components/doctors/patient-management.tsx`) does **not**
call the local FastAPI backend. It reads an ngrok URL from the Supabase `system_config`
table (`id = 1`, column `ngrok_url`) and POSTs the image to a **FastAPI server running
inside a Colab notebook**:

```
POST {ngrok_url}/scan/
  multipart/form-data:
    file        = <prescription image>
    doctor_id   = <auth.users.id of the logged-in doctor>
```

The frontend expects this JSON back:

```json
{
  "data": {
    "patient_name": "Jane Doe",
    "date": "2026-06-21",
    "medications": [
      { "medicine_name": "Amoxicillin", "dosage": "500mg", "frequency": "TID" }
    ]
  }
}
```

## The problem

Today the Colab endpoint **inserts the extracted row into the `prescriptions` table
itself**, then returns the data (with the new row `id`). Because of that, an incomplete or
mis-read scan is written to the database *before* the doctor reviews it — and the realtime
subscription makes it pop into the dashboard immediately.

We now have an editable review form on the frontend (patient name, date, add/edit/remove
medications) with a **Save changes** button. The cleaner flow is:

1. Colab **only extracts and returns** the data — it does **not** touch Supabase.
2. The doctor reviews/fixes the fields.
3. The frontend's **Save changes** button performs the `insert` into `prescriptions`.

The frontend already handles both cases: when the scan response has **no `id`**, Save does
an `insert`; when it has an `id`, Save does an `update`. So all that's required is to make
Colab stop inserting and stop returning an `id`.

## The change

In the Colab notebook, find the `/scan` route. It currently looks roughly like this:

```python
from fastapi import FastAPI, File, UploadFile, Form
from supabase import create_client

app = FastAPI()
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

@app.post("/scan/")
async def scan(file: UploadFile = File(...), doctor_id: str = Form(...)):
    image_bytes = await file.read()

    # 1. Vision model extracts the fields
    extracted = run_vision_model(image_bytes)
    # extracted = { "patient_name": ..., "date": ..., "medications": [...] }

    # 2. ❌ REMOVE: Colab inserts the row itself
    inserted = (
        supabase.table("prescriptions")
        .insert({
            "doctor_id": doctor_id,
            "patient_name": extracted.get("patient_name"),
            "prescription_date": extracted.get("date"),
            "medications": extracted.get("medications", []),
        })
        .execute()
    )
    row = inserted.data[0]

    return {"data": {**extracted, "id": row["id"]}}
```

Change it to **extract and return only** — drop the insert block:

```python
@app.post("/scan/")
async def scan(file: UploadFile = File(...), doctor_id: str = Form(...)):
    image_bytes = await file.read()

    # Vision model extracts the fields — that's all the server does now.
    extracted = run_vision_model(image_bytes)

    # Normalize the shape the frontend expects. No DB write, no id:
    # the doctor reviews/edits in the UI, then "Save changes" inserts the row.
    return {
        "data": {
            "patient_name": extracted.get("patient_name", ""),
            "date": extracted.get("date", ""),
            "medications": [
                {
                    "medicine_name": m.get("medicine_name", ""),
                    "dosage": m.get("dosage", ""),
                    "frequency": m.get("frequency", ""),
                }
                for m in extracted.get("medications", [])
            ],
        }
    }
```

Key points:

- **Delete the `supabase.table("prescriptions").insert(...)` call** and the `row["id"]`
  usage. The response no longer carries an `id`.
- You can keep `doctor_id` in the form signature (the frontend still sends it), but the
  endpoint no longer needs it for anything. Optionally drop it.
- The Supabase service-role client is no longer needed in the notebook for scanning. Leave
  it if other cells use it; otherwise you can remove it to shrink the notebook's secrets
  footprint.

## After the change — who writes the row

The frontend's `handleSaveRecord` (`patient-management.tsx`) now owns the write. Because
the response has no `id`, it takes the `insert` branch:

```ts
await supabase
  .from("prescriptions")
  .insert({ ...payload, doctor_id: doctorId });
```

This insert runs as the **logged-in doctor** through the anon client, so it is governed by
Row-Level Security. Make sure the `prescriptions` table has an insert policy equivalent to
the one on `patients` (see `supabase/migrations/003_create_patients.sql`):

```sql
-- prescriptions: doctors can insert their own rows
alter table public.prescriptions enable row level security;

drop policy if exists "Doctors can insert own prescriptions" on public.prescriptions;
create policy "Doctors can insert own prescriptions"
  on public.prescriptions for insert
  with check (auth.uid() = doctor_id);
```

> The `prescriptions` table is **not** defined in this repo's migrations — it was created
> outside it (likely from Colab using the service-role key, which bypasses RLS). Once the
> frontend does the insert with the *anon* key, an explicit insert policy like the above is
> required, or the insert will be rejected. Verify select/update/delete policies exist too —
> the dashboard already reads and deletes prescriptions from the browser, so those policies
> presumably exist; add the matching `insert` policy if it's missing.

## Net effect

- A scan that can't be read no longer creates a stray DB row.
- The doctor sees the extracted fields, fills in anything missing, and the record only
  exists once they click **Save changes**.
- No code change needed on the frontend — it already inserts when the response has no `id`.
