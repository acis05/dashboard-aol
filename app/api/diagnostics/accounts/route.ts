import { NextResponse } from "next/server";
import { rawAccounts } from "../../../../lib/accurate";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json({ ok: true, response: await rawAccounts() }); }
  catch (e: any) { return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 }); }
}
