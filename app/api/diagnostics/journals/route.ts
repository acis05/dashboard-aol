import { requireApiUser, apiError } from "../../../../lib/api-auth";
import { NextResponse } from "next/server";
import { rawJournals } from "../../../../lib/accurate";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireApiUser(); } catch(e:any) { return apiError(e); }
  try { return NextResponse.json({ ok: true, response: await rawJournals() }); }
  catch (e: any) { return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 }); }
}
