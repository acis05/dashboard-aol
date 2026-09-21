import { requireApiUser, apiError } from "../../../../lib/api-auth";
import { NextResponse } from "next/server";
import { getOAuthState } from "../../../../lib/session";
import { listDatabases } from "../../../../lib/accurate";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireApiUser(); } catch(e:any) { return apiError(e); }
  try {
    const s = await getOAuthState();
    if (!s?.accessToken) return NextResponse.json({ connected:false, databaseConnected:false, databases:[] });
    const databaseConnected = Boolean(s.host && s.sessionId);
    const databases = databaseConnected ? [] : await listDatabases();
    return NextResponse.json({ connected:true, databaseConnected, user:s.user||null, database:s.database||null, databases });
  } catch (e:any) {
    return NextResponse.json({ connected:false, databaseConnected:false, databases:[], error:e.message || "Gagal membaca status OAuth" }, { status:500 });
  }
}
