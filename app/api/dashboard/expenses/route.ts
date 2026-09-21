import { NextRequest, NextResponse } from "next/server";
import { buildDashboard } from "../../../../lib/analytics";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try { const u = new URL(req.url); const accounts = u.searchParams.getAll("account"); const data = await buildDashboard(u.searchParams.get("from")!, u.searchParams.get("to")!, accounts); return NextResponse.json({ accounts: data.accounts, expenses: data.expenses, meta: data.meta }); }
  catch(e:any){ return NextResponse.json({error:e.message||"Gagal mengambil biaya"},{status:500}); }
}
