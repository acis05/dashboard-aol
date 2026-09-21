import { NextRequest, NextResponse } from "next/server";
import { buildDashboard } from "../../../lib/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || `${new Date().getFullYear()}-01-01`;
    const to = searchParams.get("to") || `${new Date().getFullYear()}-12-31`;
    const accounts = searchParams.getAll("account");
    const data = await buildDashboard(from, to, accounts);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unknown error" }, { status: 500 });
  }
}
