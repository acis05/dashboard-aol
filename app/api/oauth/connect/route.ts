import { requireApiUser, apiError } from "../../../../lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try { await requireApiUser(); } catch(e:any) { return apiError(e); }
  const clientId = process.env.ACCURATE_CLIENT_ID;
  const redirectUri = process.env.ACCURATE_REDIRECT_URI;
  if (!clientId || !redirectUri) return NextResponse.json({ error: "ACCURATE_CLIENT_ID / ACCURATE_REDIRECT_URI belum diisi." }, { status: 500 });
  const state = crypto.randomBytes(18).toString("hex");
  const scope = process.env.ACCURATE_SCOPE || "glaccount_view journal_voucher_view";
  const url = new URL("https://account.accurate.id/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);
  const res = NextResponse.redirect(url);
  res.cookies.set("aol_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
