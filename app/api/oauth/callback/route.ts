import { requireApiUser, apiError } from "../../../../lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "../../../../lib/accurate";
import { setOAuthState } from "../../../../lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try { await requireApiUser(); } catch(e:any) { return apiError(e); }
  try {
    const code = req.nextUrl.searchParams.get("code");
    const returnedState = req.nextUrl.searchParams.get("state");
    const savedState = req.cookies.get("aol_oauth_state")?.value;
    if (!code) throw new Error("Authorization code tidak ditemukan.");
    if (savedState && returnedState && savedState !== returnedState) throw new Error("OAuth state tidak cocok.");
    const redirectUri = process.env.ACCURATE_REDIRECT_URI;
    if (!redirectUri) throw new Error("ACCURATE_REDIRECT_URI belum diisi.");
    const oauth = await exchangeCode(code, redirectUri);
    await setOAuthState(oauth);
    return NextResponse.redirect(new URL("/?oauth=success", req.url));
  } catch (e: any) {
    return NextResponse.redirect(new URL(`/?oauth_error=${encodeURIComponent(e.message || "OAuth gagal")}`, req.url));
  }
}
