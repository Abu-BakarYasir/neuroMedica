// Shared helpers for deriving a human-friendly display name from a Supabase user.
// Keeping this pure (no Supabase imports) makes it trivially unit-testable and
// guarantees the sidebar and the dashboard greeting stay in sync.

export interface UserLike {
  email?: string | null;
  user_metadata?: {
    full_name?: string | null;
    name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
}

/** Combine first/last name into a single trimmed string (either may be missing). */
export function joinName(
  firstName?: string | null,
  lastName?: string | null
): string {
  return [firstName, lastName]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

/** The local part of an email address ("jane@x.com" -> "jane"). */
export function emailLocalPart(email?: string | null): string {
  if (!email) return "";
  return email.split("@")[0] ?? "";
}

/**
 * Best display name for a user, honouring the custom name a doctor entered at
 * sign-up before falling back to the email. Order of preference:
 *   full_name -> name -> "first last" -> email local part -> fallback.
 */
export function buildDisplayName(
  user?: UserLike | null,
  fallback = "Doctor"
): string {
  const meta = user?.user_metadata ?? {};
  const candidates = [
    meta.full_name,
    meta.name,
    joinName(meta.first_name, meta.last_name),
    emailLocalPart(user?.email),
  ];
  for (const c of candidates) {
    const trimmed = (c ?? "").trim();
    if (trimmed) return trimmed;
  }
  return fallback;
}

/** Display name prefixed with "Dr." unless the name already starts with it. */
export function buildDoctorName(
  user?: UserLike | null,
  fallback = "User"
): string {
  const name = buildDisplayName(user, fallback);
  return /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
}

/**
 * Time-of-day greeting ("Good morning" / "Good afternoon" / "Good evening").
 * Pure (date is injectable) so it can be unit-tested without mocking the clock.
 */
export function timeGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
