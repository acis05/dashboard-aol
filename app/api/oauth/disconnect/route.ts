import { requireApiUser, apiError } from "../../../../lib/api-auth";
import { NextResponse } from "next/server";
import { clearOAuthState } from "../../../../lib/session";
export async function POST() {
  try { await requireApiUser(); } catch(e:any) { return apiError(e); } await clearOAuthState(); return NextResponse.json({ ok: true }); }
