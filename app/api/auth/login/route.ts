import { NextRequest, NextResponse } from "next/server";
import { ensureBootstrapAdmin, setAppSession } from "../../../../lib/auth";
import { pool } from "../../../../lib/db";
import { verifyPassword } from "../../../../lib/password";

export async function POST(req: NextRequest){
  try{
    await ensureBootstrapAdmin();
    const body=await req.json(); const email=String(body.email||"").trim().toLowerCase(); const password=String(body.password||"");
    if(!email||!password) return NextResponse.json({error:"Email dan password wajib diisi."},{status:400});
    const result=await pool.query(`SELECT id,email,password_hash,role,active FROM app_users WHERE LOWER(email)=LOWER($1) LIMIT 1`,[email]);
    const user=result.rows[0];
    if(!user||!user.active||!verifyPassword(password,user.password_hash)) return NextResponse.json({error:"Email atau password salah."},{status:401});
    await setAppSession({id:Number(user.id),email:String(user.email),role:user.role==="ADMIN"?"ADMIN":"USER"});
    return NextResponse.json({ok:true,role:user.role});
  }catch(e:any){return NextResponse.json({error:e.message||"Login gagal"},{status:500});}
}
