"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar
} from "recharts";

type ExpenseAccount = { no: string; name: string; accountType: string };
type Monthly = { month: string; revenue: number; cogs: number; expense: number; otherIncome: number; otherExpense: number; grossProfit: number; netProfit: number };
type Payload = { accounts: ExpenseAccount[]; monthly: Monthly[]; expenses: Record<string, string | number>[]; meta: { journalCount: number; maxJournals: number } };

const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
const compact = (n: number) => new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(n || 0);

export default function Dashboard() {
  const year = new Date().getFullYear();
  const [from, setFrom] = useState(`${year}-01-01`);
  const [to, setTo] = useState(`${year}-12-31`);
  const [selected, setSelected] = useState<string[]>([]);
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(extraSelected = selected) {
    setLoading(true); setError("");
    const qs = new URLSearchParams({ from, to });
    extraSelected.forEach((a) => qs.append("account", a));
    try {
      const res = await fetch(`/api/dashboard?${qs.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengambil data");
      setData(json);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load([]); /* first load */ }, []);

  const totals = useMemo(() => (data?.monthly || []).reduce((a, r) => ({ revenue: a.revenue + r.revenue, gross: a.gross + r.grossProfit, net: a.net + r.netProfit }), { revenue: 0, gross: 0, net: 0 }), [data]);

  function toggle(no: string) {
    setSelected((prev) => prev.includes(no) ? prev.filter((x) => x !== no) : [...prev, no]);
  }

  return (
    <main className="shell">
      <header className="header">
        <Image src="/your-aol-dashboard-logo.png" width={390} height={112} alt="Your AOL Dashboard" className="brand" priority />
        <div className="status"><span className="dot" /> Live Accurate API</div>
      </header>

      <section className="filters card">
        <label>Dari<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>Sampai<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <button onClick={() => load()} disabled={loading}>{loading ? "Mengambil data..." : "Refresh Dashboard"}</button>
      </section>

      {error && <section className="error card"><b>Belum berhasil konek.</b><div>{error}</div><p>Buka <code>/api/diagnostics/accounts</code> untuk tes paling sederhana. Kirim pesan error-nya ke saya.</p></section>}

      <section className="kpis">
        <div className="card"><span>Omzet</span><strong>{rupiah(totals.revenue)}</strong></div>
        <div className="card"><span>Laba Kotor</span><strong>{rupiah(totals.gross)}</strong></div>
        <div className="card"><span>Laba Bersih</span><strong>{rupiah(totals.net)}</strong></div>
      </section>

      <section className="grid2">
        <div className="card chartCard">
          <div className="sectionTitle"><div><h2>Total Omzet per Bulan</h2><p>Akun REVENUE, credit dikurangi debit.</p></div></div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.monthly || []}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis tickFormatter={compact}/><Tooltip formatter={(v: any) => rupiah(Number(v))}/><Line type="monotone" dataKey="revenue" name="Omzet" strokeWidth={3} dot={false}/></LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card chartCard">
          <div className="sectionTitle"><div><h2>Laba Rugi per Bulan</h2><p>Revenue, laba kotor, dan laba bersih.</p></div></div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.monthly || []}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis tickFormatter={compact}/><Tooltip formatter={(v: any) => rupiah(Number(v))}/><Legend/><Line type="monotone" dataKey="revenue" name="Revenue" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="grossProfit" name="Laba Kotor" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="netProfit" name="Laba Bersih" strokeWidth={3} dot={false}/></LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card expenseSection">
        <div className="sectionTitle"><div><h2>Biaya per Bulan</h2><p>Pilih akun EXPENSE / OTHER_EXPENSE.</p></div><button className="secondary" onClick={() => load()}>Terapkan akun</button></div>
        <div className="accounts">
          {(data?.accounts || []).map((a) => <label className="account" key={a.no}><input type="checkbox" checked={selected.includes(a.no)} onChange={() => toggle(a.no)}/><span><b>{a.no}</b> {a.name}</span></label>)}
        </div>
        <ResponsiveContainer width="100%" height={330}>
          <BarChart data={data?.expenses || []}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis tickFormatter={compact}/><Tooltip formatter={(v: any) => rupiah(Number(v))}/><Legend/>{selected.slice(0, 8).map((no) => <Bar key={no} dataKey={no} name={data?.accounts.find((a) => a.no === no)?.name || no} stackId="expense" />)}</BarChart>
        </ResponsiveContainer>
        {!selected.length && <p className="hint">Pilih akun biaya lalu klik “Terapkan akun”.</p>}
      </section>

      <footer>Mode percobaan • jurnal diproses langsung dari Accurate • maksimum {data?.meta?.maxJournals || 200} jurnal per load • ditemukan {data?.meta?.journalCount || 0} jurnal.</footer>
    </main>
  );
}
