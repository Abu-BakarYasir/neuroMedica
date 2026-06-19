// Turns raw Supabase OAuth errors into messages a doctor can act on.
//
// The most common reason "Continue with Google" fails in a fresh deployment is
// that the Google provider hasn't been enabled / configured in the Supabase
// dashboard, which surfaces as a "provider is not enabled" / 400 error. A raw
// error string is confusing, so we map the known cases to actionable copy.

export function friendlyOAuthError(
  error: unknown,
  provider = "Google"
): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const msg = raw.toLowerCase();

  if (
    msg.includes("provider is not enabled") ||
    msg.includes("unsupported provider") ||
    msg.includes("validation_failed")
  ) {
    return `${provider} sign-in isn't enabled yet. Please use your email and password, or contact support.`;
  }
  if (msg.includes("redirect") && msg.includes("not allowed")) {
    return `${provider} sign-in is misconfigured (redirect URL not allowed). Please contact support.`;
  }
  if (msg.includes("popup") || msg.includes("cancel")) {
    return `${provider} sign-in was cancelled. Please try again.`;
  }
  if (msg.includes("network") || msg.includes("failed to fetch")) {
    return "Network error reaching the sign-in service. Check your connection and try again.";
  }
  return raw || `Could not sign in with ${provider}. Please try again.`;
}
