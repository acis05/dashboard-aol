import { NextResponse } from "next/server";
import { clearOAuthState } from "../../../../lib/session";
export async function POST() { await clearOAuthState(); return NextResponse.json({ ok: true }); }
