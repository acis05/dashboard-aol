import { requireApiUser, apiError } from "../../../../lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { getJournalDetail } from "../../../../lib/accurate";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try { await requireApiUser(); } catch(e:any) { return apiError(e); }
  try {
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!id) return NextResponse.json({ ok:false, error:"Isi ?id=ID_JURNAL" }, {status:400});
    const result = await getJournalDetail(id);
    return NextResponse.json({ ok:true, header:{ id:result.header?.id, number:result.header?.number, transNumber:result.header?.transNumber, transDate:result.header?.transDate, transactionTypeName:result.header?.transactionTypeName }, lineCount:result.lines.length, lines:result.lines });
  } catch(e:any) { return NextResponse.json({ok:false,error:e?.message||"Error"},{status:500}); }
}
