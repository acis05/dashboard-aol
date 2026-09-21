"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, AreaChart, Area
} from "recharts";

type Account = { no: string; name: string; accountType: string };
type Monthly = { month: string; revenue: number; cogs: number; expense: number; otherIncome: number; otherExpense: number; grossProfit: number; netProfit: number };
type AuthStatus = { connected: boolean; databaseConnected: boolean; user?: { name?: string; email?: string } | null; database?: { id:number; alias:string } | null; databases?: Array<{id:number; alias:string}> };

type Range = { from: string; to: string };

const fmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const compactFmt = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });
const money = (v: number) => fmt.format(v || 0);
const compact = (v: number) => compactFmt.format(v || 0);

function defaultRange(): Range {
  const y = new Date().getFullYear();
  return { from: `${y}-01-01`, to: `${y}-12-31` };
}

function ChartFilter({ range, onChange, onApply, loading }: { range: Range; onChange: (r: Range) => void; onApply: () => void; loading?: boolean }) {
  return <div className="chartFilter">
    <div className="dateField"><span>Dari</span><input type="date" value={range.from} onChange={e=>onChange({...range,from:e.target.value})}/></div>
    <div className="dateField"><span>Sampai</span><input type="date" value={range.to} onChange={e=>onChange({...range,to:e.target.value})}/></div>
    <button className="miniButton" onClick={onApply} disabled={loading}>{loading ? "Memuat..." : "Terapkan"}</button>
  </div>;
}

export default function Dashboard() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [authError, setAuthError] = useState("");
  const [dbLoading, setDbLoading] = useState(false);

  const [revenueRange, setRevenueRange] = useState<Range>(defaultRange());
  const [plRange, setPlRange] = useState<Range>(defaultRange());
  const [expenseRange, setExpenseRange] = useState<Range>(defaultRange());

  const [revenue, setRevenue] = useState<Monthly[]>([]);
  const [profitLoss, setProfitLoss] = useState<Monthly[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Record<string,string|number>[]>([]);

  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [loadingPL, setLoadingPL] = useState(false);
  const [loadingExpense, setLoadingExpense] = useState(false);
  const [dataError, setDataError] = useState("");

  async function loadStatus() {
    try {
      const res = await fetch("/api/oauth/status", { cache: "no-store" });
      const json = await res.json();
      setAuth(json);
    } catch (e:any) { setAuthError(e.message); }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get("oauth_error");
    if (e) setAuthError(e);
    loadStatus();
  }, []);

  useEffect(() => {
    if (auth?.databaseConnected) loadInitial();
  }, [auth?.databaseConnected]);

  async function selectDb(id:number) {
    setDbLoading(true); setAuthError("");
    try {
      const res = await fetch("/api/oauth/select-db", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id}) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memilih database");
      await loadStatus();
    } catch(e:any){ setAuthError(e.message); }
    finally { setDbLoading(false); }
  }

  async function loadInitial() {
    setLoadingRevenue(true); setLoadingPL(true); setLoadingExpense(true); setDataError("");
    try {
      const r = defaultRange();
      const q = new URLSearchParams({ from:r.from, to:r.to });
      const j = await jsonGet(`/api/dashboard?${q}`);
      setRevenue(j.monthly || []);
      setProfitLoss(j.monthly || []);
      setAccounts(j.accounts || []);
      setExpenses(j.expenses || []);
      const first = (j.accounts || []).slice(0,3).map((a:Account)=>a.no);
      setSelected(first);
    } catch(e:any){ setDataError(e.message); }
    finally { setLoadingRevenue(false); setLoadingPL(false); setLoadingExpense(false); }
  }

  async function loadAccounts() {
    try {
      const res = await fetch("/api/accounts", { cache:"no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengambil akun biaya");
      setAccounts(json.accounts || []);
    } catch(e:any){ setDataError(e.message); }
  }

  async function jsonGet(url:string) {
    const res = await fetch(url, { cache:"no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal mengambil data");
    return json;
  }

  async function loadRevenue() {
    setLoadingRevenue(true); setDataError("");
    try { const q = new URLSearchParams({ from: revenueRange.from, to: revenueRange.to }); const j = await jsonGet(`/api/dashboard/revenue?${q}`); setRevenue(j.monthly || []); }
    catch(e:any){ setDataError(e.message); }
    finally { setLoadingRevenue(false); }
  }
  async function loadPL() {
    setLoadingPL(true); setDataError("");
    try { const q = new URLSearchParams({ from: plRange.from, to: plRange.to }); const j = await jsonGet(`/api/dashboard/profit-loss?${q}`); setProfitLoss(j.monthly || []); }
    catch(e:any){ setDataError(e.message); }
    finally { setLoadingPL(false); }
  }
  async function loadExpenses(force = selected) {
    setLoadingExpense(true); setDataError("");
    try {
      const q = new URLSearchParams({ from: expenseRange.from, to: expenseRange.to }); force.forEach(a=>q.append("account",a));
      const j = await jsonGet(`/api/dashboard/expenses?${q}`);
      setExpenses(j.expenses || []);
      if (j.accounts?.length) setAccounts(j.accounts);
    } catch(e:any){ setDataError(e.message); }
    finally { setLoadingExpense(false); }
  }

  function toggle(no:string){ setSelected(p=>p.includes(no)?p.filter(x=>x!==no):[...p,no]); }

  const revenueTotal = useMemo(()=>revenue.reduce((s,r)=>s+r.revenue,0),[revenue]);
  const plTotals = useMemo(()=>profitLoss.reduce((s,r)=>({gross:s.gross+r.grossProfit,net:s.net+r.netProfit}),{gross:0,net:0}),[profitLoss]);

  if (!auth) return <main className="loadingPage"><div className="spinner"/><p>Menyiapkan Your AOL Dashboard...</p></main>;

  if (!auth.connected) {
    return <main className="connectPage">
      <div className="connectCard">
        <Image src="/your-aol-dashboard-logo.png" width={460} height={132} alt="Your AOL Dashboard" className="connectLogo" priority/>
        <div className="eyebrow">ACCURATE ONLINE ANALYTICS</div>
        <h1>Insight keuangan yang lebih cepat, dari data Accurate Anda.</h1>
        <p>Hubungkan akun Accurate Online melalui OAuth. Aplikasi hanya meminta akses baca ke akun perkiraan dan jurnal umum untuk membentuk dashboard finansial.</p>
        {authError && <div className="notice errorNotice">{authError}</div>}
        <a href="/api/oauth/connect" className="connectButton"><span>Connect Accurate Online</span><span className="arrow">→</span></a>
        <div className="privacy">🔒 OAuth 2.0 • token disimpan terenkripsi di cookie server-side</div>
      </div>
    </main>;
  }

  if (!auth.databaseConnected) {
    return <main className="connectPage">
      <div className="connectCard dbCard">
        <Image src="/your-aol-dashboard-logo.png" width={380} height={110} alt="Your AOL Dashboard" className="connectLogo" priority/>
        <div className="successBadge">✓ OAuth berhasil</div>
        <h1>Pilih database Accurate</h1>
        <p>Pilih perusahaan yang ingin ditampilkan di dashboard.</p>
        {authError && <div className="notice errorNotice">{authError}</div>}
        <div className="dbList">
          {(auth.databases || []).map(db=><button key={db.id} disabled={dbLoading} onClick={()=>selectDb(db.id)} className="dbItem"><span className="dbIcon">▦</span><span><b>{db.alias}</b><small>Database ID {db.id}</small></span><span>→</span></button>)}
          {!(auth.databases || []).length && <div className="notice">Tidak ada database yang dapat diakses oleh token ini.</div>}
        </div>
      </div>
    </main>;
  }

  return <main className="appShell">
    <aside className="sidebar">
      <Image src="/your-aol-dashboard-logo.png" width={265} height={76} alt="Your AOL Dashboard" className="sideLogo" priority/>
      <nav>
        <div className="navItem active"><span>⌁</span> Dashboard</div>
        <div className="navItem muted"><span>◫</span> Reports <em>soon</em></div>
        <div className="navItem muted"><span>⚙</span> Settings <em>soon</em></div>
      </nav>
      <div className="sidebarBottom">
        <div className="dbPill"><span className="dbDot"/><div><small>Connected database</small><b>{auth.database?.alias}</b></div></div>
        <button className="disconnect" onClick={async()=>{await fetch('/api/oauth/disconnect',{method:'POST'}); location.href='/';}}>Disconnect</button>
      </div>
    </aside>

    <section className="mainPanel">
      <header className="topbar">
        <div><div className="eyebrow">FINANCIAL OVERVIEW</div><h1>Dashboard</h1><p>Pantau omzet, biaya, dan profitabilitas dari jurnal Accurate Online.</p></div>
        <div className="userChip"><div className="avatar">{(auth.user?.name || auth.user?.email || "A").slice(0,1).toUpperCase()}</div><div><b>{auth.user?.name || "Accurate User"}</b><small>{auth.user?.email || "OAuth connected"}</small></div></div>
      </header>

      {dataError && <div className="notice errorNotice dataNotice"><b>Belum berhasil membaca data.</b><span>{dataError}</span></div>}

      <section className="summaryGrid">
        <div className="metricCard accent"><div className="metricTop"><span>Total Omzet</span><span className="metricIcon">↗</span></div><strong>{money(revenueTotal)}</strong><small>sesuai periode grafik omzet</small></div>
        <div className="metricCard"><div className="metricTop"><span>Laba Kotor</span><span className="metricIcon">◎</span></div><strong>{money(plTotals.gross)}</strong><small>sesuai periode laba rugi</small></div>
        <div className="metricCard"><div className="metricTop"><span>Laba Bersih</span><span className="metricIcon">◆</span></div><strong>{money(plTotals.net)}</strong><small>sesuai periode laba rugi</small></div>
      </section>

      <section className="chartCard modernCard fullCard">
        <div className="cardHead"><div><span className="cardKicker">REVENUE</span><h2>Total Omzet per Bulan</h2><p>Akumulasi akun <b>REVENUE</b> dari jurnal (credit − debit).</p></div><ChartFilter range={revenueRange} onChange={setRevenueRange} onApply={loadRevenue} loading={loadingRevenue}/></div>
        <div className="chartWrap">
          <ResponsiveContainer width="100%" height={330}>
            <AreaChart data={revenue}><defs><linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity={.26}/><stop offset="100%" stopColor="#f43f5e" stopOpacity={.01}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0f5"/><XAxis dataKey="month" tickLine={false} axisLine={false}/><YAxis tickFormatter={compact} tickLine={false} axisLine={false}/><Tooltip formatter={(v:any)=>money(Number(v))}/><Area type="monotone" dataKey="revenue" name="Omzet" stroke="#f43f5e" fill="url(#revFill)" strokeWidth={3} dot={false}/></AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="chartCard modernCard fullCard">
        <div className="cardHead"><div><span className="cardKicker">PROFITABILITY</span><h2>Laba Rugi per Bulan</h2><p>Revenue, laba kotor, dan laba bersih dihitung dari klasifikasi akun jurnal.</p></div><ChartFilter range={plRange} onChange={setPlRange} onApply={loadPL} loading={loadingPL}/></div>
        <div className="chartWrap">
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={profitLoss}><CartesianGrid vertical={false} stroke="#edf0f5"/><XAxis dataKey="month" tickLine={false} axisLine={false}/><YAxis tickFormatter={compact} tickLine={false} axisLine={false}/><Tooltip formatter={(v:any)=>money(Number(v))}/><Legend/><Line type="monotone" dataKey="revenue" name="Revenue" stroke="#f43f5e" strokeWidth={2.5} dot={false}/><Line type="monotone" dataKey="grossProfit" name="Laba Kotor" stroke="#8b5cf6" strokeWidth={2.5} dot={false}/><Line type="monotone" dataKey="netProfit" name="Laba Bersih" stroke="#111827" strokeWidth={3} dot={false}/></LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="chartCard modernCard fullCard expenseCard">
        <div className="cardHead expenseHead"><div><span className="cardKicker">EXPENSES</span><h2>Biaya per Bulan</h2><p>Pilih akun biaya yang ingin dibandingkan.</p></div><ChartFilter range={expenseRange} onChange={setExpenseRange} onApply={()=>loadExpenses()} loading={loadingExpense}/></div>
        <div className="expenseBody">
          <div className="accountPicker">
            <div className="pickerHead"><b>Akun biaya</b><span>{selected.length} dipilih</span></div>
            <div className="accountScroll">{accounts.map(a=><label key={a.no} className={`accountRow ${selected.includes(a.no)?'selected':''}`}><input type="checkbox" checked={selected.includes(a.no)} onChange={()=>toggle(a.no)}/><span className="checkVisual">✓</span><span><b>{a.name}</b><small>{a.no} · {a.accountType}</small></span></label>)}</div>
            <button className="applyAccount" onClick={()=>loadExpenses()} disabled={loadingExpense}>{loadingExpense?"Memuat...":"Tampilkan akun terpilih"}</button>
          </div>
          <div className="expenseChart">
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={expenses} barGap={5}><CartesianGrid vertical={false} stroke="#edf0f5"/><XAxis dataKey="month" tickLine={false} axisLine={false}/><YAxis tickFormatter={compact} tickLine={false} axisLine={false}/><Tooltip formatter={(v:any)=>money(Number(v))}/><Legend/>{selected.slice(0,8).map((no,i)=><Bar key={no} dataKey={no} name={accounts.find(a=>a.no===no)?.name || no} fill={["#f43f5e","#8b5cf6","#0ea5e9","#10b981","#f59e0b","#6366f1","#ec4899","#14b8a6"][i%8]} radius={[6,6,0,0]}/>)}</BarChart>
            </ResponsiveContainer>
            {!selected.length && <div className="emptyChart"><span>▥</span><b>Pilih akun biaya</b><p>Pilih satu atau beberapa akun di sebelah kiri, lalu klik “Tampilkan akun terpilih”.</p></div>}
          </div>
        </div>
      </section>

      <footer className="footer">Your AOL Dashboard · Data dibaca langsung dari Accurate Online melalui OAuth 2.0</footer>
    </section>
  </main>;
}
