import { createClient } from "@/lib/supabase/client";
import type { SymptomExploreResponse } from "./types";

export async function exploreSymptoms(
  symptoms: string,
): Promise<SymptomExploreResponse> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Authentication required");

  const res = await fetch("/api/symptoms/explore", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ symptoms }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return (await res.json()) as SymptomExploreResponse;
}
