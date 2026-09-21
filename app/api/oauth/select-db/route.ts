import { requireApiUser, apiError } from "../../../../lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { openDatabase } from "../../../../lib/accurate";
export async function POST(req: NextRequest) {
  try { await requireApiUser(); } catch(e:any) { return apiError(e); }
  try {
    const { id } = await req.json();
    const s = await openDatabase(Number(id));
    return NextResponse.json({ ok: true, database: s.database });
  } catch (e: any) { return NextResponse.json({ error: e.message || "Gagal membuka database" }, { status: 500 }); }
}
