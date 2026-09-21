import { requireApiUser, apiError } from "../../../../lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { buildDashboard } from "../../../../lib/analytics";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try { await requireApiUser(); } catch(e:any) { return apiError(e); }
  try { const u = new URL(req.url); const data = await buildDashboard(u.searchParams.get("from")!, u.searchParams.get("to")!, []); return NextResponse.json({ monthly: data.monthly, meta: data.meta }); }
  catch(e:any){ return NextResponse.json({error:e.message||"Gagal mengambil laba rugi"},{status:500}); }
}
