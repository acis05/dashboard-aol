import { NextResponse } from "next/server";
import { requireAppSession } from "./auth";
export async function requireApiUser(){
  try { return await requireAppSession(); }
  catch (e:any) {
    const status=e?.message==="FORBIDDEN"?403:401;
    throw Object.assign(new Error(status===401?"Silakan login kembali.":"Akses ditolak."),{status});
  }
}
export function apiError(e:any,fallback="Terjadi kesalahan"){
  return NextResponse.json({error:e?.message||fallback},{status:e?.status||500});
}
