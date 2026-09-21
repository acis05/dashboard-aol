import { NextResponse } from "next/server";
import { clearAppSession } from "../../../../lib/auth";
import { clearOAuthState } from "../../../../lib/session";
export async function POST(){ await clearAppSession(); await clearOAuthState(); return NextResponse.json({ok:true}); }
