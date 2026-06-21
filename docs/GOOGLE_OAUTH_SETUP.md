# Google Sign-In Setup for NeuroMedica

This guide enables the **"Continue with Google"** buttons on the Sign in and Sign up
pages. The app code is already done — these are the one-time dashboard steps.

You will need access to:
1. **Google Cloud Console** for project `neuromedica-500115`
2. The **Supabase** project dashboard for NeuroMedica

Total time: ~10 minutes.

---

## STEP 0 — Get the Supabase callback URL (you'll need it twice)

1. Open https://supabase.com/dashboard and select the NeuroMedica project.
2. Go to **Authentication → Providers → Google**.
3. Copy the value in the **Callback URL (for OAuth)** field. It looks like:

   ```
   https://<PROJECT-REF>.supabase.co/auth/v1/callback
   ```

   Keep this tab open — you'll paste this URL into Google in Step 2, and enable the
   provider here in Step 3.

---

## STEP 1 — Configure the OAuth consent screen (Google)

1. Go to https://console.cloud.google.com/apis/credentials?project=neuromedica-500115
2. If prompted to **Configure consent screen** (or via menu **APIs & Services →
   OAuth consent screen**):
   - User type: **External** → **Create**
   - **App name**: `NeuroMedica`
   - **User support email**: your email
   - **Developer contact email**: your email
   - **Save and Continue** through the remaining screens.
3. On the **Test users** step, click **+ Add Users** and add every Gmail address that
   needs to log in while testing (the app stays in "Testing" mode until published).
   - To allow ANY Google account, go back to the consent screen later and click
     **Publish app**.

---

## STEP 2 — Create the OAuth client (Google)

⚠️ It MUST be a **Web application** client. A "Desktop/installed" client will NOT work.

1. Go to **APIs & Services → Credentials**:
   https://console.cloud.google.com/apis/credentials?project=neuromedica-500115
2. Click **+ CREATE CREDENTIALS → OAuth client ID**.
3. **Application type**: **Web application**
4. **Name**: `NeuroMedica Web`
5. **Authorized JavaScript origins** → **+ Add URI**:
   - `http://localhost:3000`
   - (add the production domain too if there is one, e.g. `https://your-app.vercel.app`)
6. **Authorized redirect URIs** → **+ Add URI** → paste the Supabase callback URL
   from Step 0:
   - `https://<PROJECT-REF>.supabase.co/auth/v1/callback`
   - ⚠️ Must match EXACTLY — no trailing slash.
7. Click **CREATE**.
8. Copy the **Client ID** and **Client Secret** from the popup.
   - Keep the secret private. It goes ONLY into the Supabase dashboard (next step),
     never into the code or a chat message.

---

## STEP 3 — Enable Google in Supabase

1. Back in the Supabase tab → **Authentication → Providers → Google**.
2. Turn ON **Enable Sign in with Google**.
3. Paste the **Client ID** and **Client Secret** from Step 2.
4. Click **Save**.

---

## STEP 4 — Allow the app's redirect URLs in Supabase

1. In Supabase → **Authentication → URL Configuration**.
2. **Site URL**: `http://localhost:3000` (or the production URL).
3. Under **Redirect URLs**, click **Add URL** and add BOTH:
   - `http://localhost:3000/auth/callback`
   - `https://your-app.vercel.app/auth/callback`  *(only if there's a prod domain)*
4. **Save**.

---

## STEP 5 — Test

1. Run the app locally: `npm run dev`
2. Open http://localhost:3000/auth/login
3. Click **Sign in with Google**, choose a Google account (must be a Test user from
   Step 1 unless the app is published).
4. Expected flow: Google → Supabase callback → `http://localhost:3000/auth/callback`
   → lands on `/protected/doctors`, logged in.
5. Repeat on http://localhost:3000/auth/sign-up with **Sign up with Google**.

---

## Troubleshooting

| What you see | Cause / Fix |
|---|---|
| `redirect_uri_mismatch` (Google error) | The redirect URI in Step 2 doesn't exactly match Supabase's callback URL. Re-copy from Supabase, no trailing slash. |
| "Google sign-in isn't enabled yet" (in-app message) | Provider not toggled on or keys not saved in Supabase (Step 3). |
| "redirect URL not allowed" | Add `http://localhost:3000/auth/callback` to Supabase Redirect URLs (Step 4). |
| "Access blocked: app not verified" | The Google account isn't in the consent screen's Test users list, or publish the app (Step 1). |
| Bounces back to login, not logged in | Missing redirect URL (Step 4), or env vars not loaded — restart `npm run dev`. |

---

## What's already done in the code (no action needed)

- "Continue with Google" buttons on both Sign in and Sign up pages.
- `app/auth/callback/route.ts` — exchanges the Google `code` for a session.
- Friendly error messages when the provider isn't configured yet.

The ONLY thing missing is the dashboard configuration in Steps 1–4 above.
