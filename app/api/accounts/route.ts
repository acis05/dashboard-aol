import { NextResponse } from "next/server";
import { getAccounts } from "../../../lib/accurate";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const accounts = await getAccounts();
    return NextResponse.json({ accounts: accounts.filter(a => ["EXPENSE","OTHER_EXPENSE"].includes(a.accountType)) });
  } catch (e:any) { return NextResponse.json({ error: e.message || "Gagal mengambil akun" }, { status: 500 }); }
}
