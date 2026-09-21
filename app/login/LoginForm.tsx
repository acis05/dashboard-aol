"use client";
import { useState } from "react";

export default function LoginForm(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  async function submit(e:React.FormEvent){
    e.preventDefault(); setLoading(true); setError("");
    try{
      const res=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
      const j=await res.json(); if(!res.ok) throw new Error(j.error||"Login gagal"); window.location.href="/";
    }catch(e:any){setError(e.message||"Login gagal");}finally{setLoading(false);}
  }
  return <div className="loginBox">
    <div className="loginMiniBrand">YOUR AOL DASHBOARD</div>
    <h2>Selamat datang</h2><p className="loginSub">Masukkan email dan password untuk mengakses dashboard.</p>
    {error&&<div className="loginError">{error}</div>}
    <form onSubmit={submit} className="loginForm">
      <label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@perusahaan.com"/></label>
      <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label>
      <button disabled={loading}>{loading?"Memeriksa...":"Login ke Dashboard"}<span>→</span></button>
    </form>
    <div className="loginHelp">Akun akses dibuat oleh administrator aplikasi.</div>
  </div>
}
