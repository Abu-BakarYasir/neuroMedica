import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * OAuth (and PKCE) callback handler.
 *
 * `signInWithOAuth` (e.g. "Continue with Google") sends the user to the
 * provider and then back here with a one-time `?code=...`. We exchange that
 * code for a session server-side so the auth cookies are set before the user
 * lands on a protected, server-rendered route. Without this exchange the code
 * is never redeemed and the sign-in silently fails.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Where to send the user once they're authenticated.
  const next = searchParams.get("next") ?? "/protected/doctors";

  // Surface provider-side errors (e.g. user denied consent) on the error page.
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(oauthError)}`,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/auth/error?error=${encodeURIComponent("No authorization code returned")}`,
  );
}
