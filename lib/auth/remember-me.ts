// "Remember me" support for the login form.
//
// Supabase persists the session itself; what users actually expect from the
// checkbox is that their email is pre-filled next time so they don't retype it.
// We store only the email address (never the password) in localStorage.

const STORAGE_KEY = "neuromedica.rememberedEmail";

function safeStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    // localStorage can throw in private-mode / sandboxed contexts.
    return null;
  }
}

/** Persist the email if "remember me" is checked, otherwise clear it. */
export function setRememberedEmail(email: string, remember: boolean): void {
  const storage = safeStorage();
  if (!storage) return;
  const trimmed = email.trim();
  if (remember && trimmed) {
    storage.setItem(STORAGE_KEY, trimmed);
  } else {
    storage.removeItem(STORAGE_KEY);
  }
}

/** Read the remembered email (empty string if none). */
export function getRememberedEmail(): string {
  const storage = safeStorage();
  if (!storage) return "";
  return storage.getItem(STORAGE_KEY) ?? "";
}

/** Whether a remembered email exists. */
export function hasRememberedEmail(): boolean {
  return getRememberedEmail().length > 0;
}
