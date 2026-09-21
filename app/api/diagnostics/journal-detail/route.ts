import { NextRequest, NextResponse } from "next/server";
import { getJournalDetail } from "../../../../lib/accurate";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!id) return NextResponse.json({ ok: false, error: "Isi ?id=ID_JURNAL" }, { status: 400 });
    const result = await getJournalDetail(id);
    return NextResponse.json({ ok: true, lineCount: result.lines.length, response: result.raw });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 }); }
}
