import { Account, JournalHeader, JournalLine } from "./types";
import { getOAuthState, setOAuthState, OAuthState } from "./session";

const ACCOUNT_HOST = "https://account.accurate.id";

function basicAuth() {
  const id = process.env.ACCURATE_CLIENT_ID || "";
  const secret = process.env.ACCURATE_CLIENT_SECRET || "";
  if (!id || !secret) throw new Error("ACCURATE_CLIENT_ID / ACCURATE_CLIENT_SECRET belum diisi.");
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

async function parseResponse(response: Response) {
  const text = await response.text();
  let body: any;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const safe = typeof body === "string" ? body.slice(0, 700) : JSON.stringify(body).slice(0, 1200);
    throw new Error(`Accurate API ${response.status}: ${safe}`);
  }
  return body;
}

export async function exchangeCode(code: string, redirectUri: string): Promise<OAuthState> {
  const body = new URLSearchParams({ code, grant_type: "authorization_code", redirect_uri: redirectUri });
  const response = await fetch(`${ACCOUNT_HOST}/oauth/token`, {
    method: "POST",
    headers: { Authorization: basicAuth(), "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
    cache: "no-store"
  });
  const data = await parseResponse(response);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + Number(data.expires_in || 1295999) * 1000,
    scope: data.scope,
    user: { name: data.user?.name, email: data.user?.email }
  };
}

async function refreshIfNeeded(state: OAuthState): Promise<OAuthState> {
  if (!state.refreshToken || !state.expiresAt || state.expiresAt - Date.now() > 24 * 60 * 60 * 1000) return state;
  const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: state.refreshToken });
  const response = await fetch(`${ACCOUNT_HOST}/oauth/token`, {
    method: "POST",
    headers: { Authorization: basicAuth(), "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
    cache: "no-store"
  });
  const data = await parseResponse(response);
  const next = {
    ...state,
    accessToken: data.access_token,
    refreshToken: data.refresh_token || state.refreshToken,
    expiresAt: Date.now() + Number(data.expires_in || 1295999) * 1000,
    scope: data.scope || state.scope
  };
  await setOAuthState(next);
  return next;
}

async function authenticatedState(requireDatabase = true) {
  let state = await getOAuthState();
  if (!state?.accessToken) throw new Error("Belum terhubung ke Accurate Online. Klik Connect Accurate Online.");
  state = await refreshIfNeeded(state);
  if (requireDatabase && (!state.host || !state.sessionId)) throw new Error("Database Accurate belum dipilih.");
  return state;
}

async function baseGet(path: string, params: Record<string, string | number | undefined> = {}) {
  const state = await authenticatedState(false);
  const url = new URL(`${ACCOUNT_HOST}${path}`);
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  return parseResponse(await fetch(url, { headers: { Authorization: `Bearer ${state.accessToken}`, Accept: "application/json" }, cache: "no-store" }));
}

async function accurateGet(path: string, params: Record<string, string | number | undefined> = {}) {
  const state = await authenticatedState(true);
  const url = new URL(`${state.host}/accurate${path}`);
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  return parseResponse(await fetch(url, {
    headers: { Authorization: `Bearer ${state.accessToken}`, "X-Session-ID": state.sessionId!, Accept: "application/json" },
    cache: "no-store"
  }));
}

function unwrapList(body: any): any[] {
  const candidates = [body?.d, body?.data, body?.data?.d, body?.result, body?.result?.data, body?.s?.data];
  for (const candidate of candidates) if (Array.isArray(candidate)) return candidate;
  return Array.isArray(body) ? body : [];
}
function unwrapDetail(body: any): any { return body?.d ?? body?.data ?? body?.result ?? body; }

export async function listDatabases() {
  const body = await baseGet("/api/db-list.do");
  return unwrapList(body).map((x: any) => ({ id: Number(x.id), alias: String(x.alias || `Database ${x.id}`) })).filter((x: any) => x.id);
}

export async function openDatabase(id: number) {
  await authenticatedState(false);
  const body = await baseGet("/api/open-db.do", { id });
  const dbs = await listDatabases();
  const state = await authenticatedState(false);
  const database = dbs.find((d) => d.id === id) || { id, alias: `Database ${id}` };
  const next: OAuthState = { ...state, database, host: body.host, sessionId: body.session };
  if (!next.host || !next.sessionId) throw new Error("Response open-db tidak berisi host/session.");
  await setOAuthState(next);
  return next;
}

export async function getAccounts(): Promise<Account[]> {
  const body = await accurateGet("/api/glaccount/list.do", {
    fields: "id,no,name,accountType,suspended", "filter.leafOnly": "true", "filter.suspended": "false",
    "sp.page": 1, "sp.pageSize": 1000, "sp.sort": "no|asc"
  });
  return unwrapList(body).filter((x) => x?.no && x?.name && x?.accountType).map((x) => ({
    id: Number(x.id) || undefined, no: String(x.no), name: String(x.name), accountType: String(x.accountType), suspended: Boolean(x.suspended)
  }));
}

export async function getJournalHeaders(from: string, to: string): Promise<JournalHeader[]> {
  const max = Math.max(1, Number(process.env.MAX_JOURNALS_PER_LOAD || 1000));
  const pageSize = Math.min(max, 100);
  const result: JournalHeader[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const body = await accurateGet("/api/journal-voucher/list.do", {
      fields: "id,number,transDate,branchId,branchName,description",
      "filter.transDate.op": "BETWEEN",
      "filter.transDate.val[0]": toAccurateDate(from),
      "filter.transDate.val[1]": toAccurateDate(to),
      "sp.page": page,
      "sp.pageSize": pageSize,
      "sp.sort": "transDate|asc"
    });

    const list = unwrapList(body);
    for (const x of list) {
      if (!x?.id) continue;
      result.push({
        id: Number(x.id),
        number: x.number ? String(x.number) : (x.transNumber ? String(x.transNumber) : undefined),
        transDate: x.transDate ? String(x.transDate) : (x.transDateView ? String(x.transDateView) : undefined),
        branchId: x.branchId ? Number(x.branchId) : undefined,
        branchName: x.branchName ? String(x.branchName) : undefined,
        description: x.description ? String(x.description) : undefined
      });
      if (result.length >= max) break;
    }

    pageCount = Number(body?.sp?.pageCount || body?.data?.sp?.pageCount || 1) || 1;
    page += 1;
  } while (page <= pageCount && result.length < max);

  return result;
}

export async function getJournalDetail(id: number): Promise<{ header: any; lines: JournalLine[]; raw: any }> {
  const body = await accurateGet("/api/journal-voucher/detail.do", { id });
  const detail = unwrapDetail(body);
  const candidateArrays = [
    detail?.detailJournalVoucher,
    detail?.detailJournalVoucherList,
    detail?.details,
    detail?.detail,
    detail?.journalVoucherDetail,
    detail?.journalVoucherDetails
  ];
  const rawLines = candidateArrays.find(Array.isArray) || [];

  const lines: JournalLine[] = rawLines
    .map((x: any) => {
      // Response detail Accurate tidak memakai field accountNo langsung.
      // Nomor akun tersedia pada glAccount.no / accountNoRef.
      const accountNo = x?.glAccount?.no ?? x?.accountNoRef ?? x?.accountNo;
      const accountName = x?.glAccount?.name ?? x?.accountNameRef;
      const accountType = x?.glAccount?.accountType;

      const explicitDebit = x?.debitAmount != null ? Number(x.debitAmount) : undefined;
      const explicitCredit = x?.creditAmount != null ? Number(x.creditAmount) : undefined;
      let amountType = String(x?.amountType || "").toUpperCase();
      if (amountType !== "DEBIT" && amountType !== "CREDIT") {
        if ((explicitCredit || 0) !== 0) amountType = "CREDIT";
        else if ((explicitDebit || 0) !== 0) amountType = "DEBIT";
      }

      let amount = Number(x?.amount ?? 0);
      if (!Number.isFinite(amount) || amount === 0) {
        amount = amountType === "CREDIT" ? Math.abs(explicitCredit || 0) : Math.abs(explicitDebit || 0);
      }

      if (!accountNo || !Number.isFinite(amount) || (amountType !== "DEBIT" && amountType !== "CREDIT")) return null;

      return {
        id: Number(x.id) || undefined,
        accountNo: String(accountNo),
        accountName: accountName ? String(accountName) : undefined,
        accountType: accountType ? String(accountType) : undefined,
        amount: Math.abs(amount),
        amountType: amountType as "DEBIT" | "CREDIT",
        debitAmount: explicitDebit,
        creditAmount: explicitCredit,
        memo: x.memo ? String(x.memo) : undefined,
        departmentName: x.department?.name ? String(x.department.name) : (x.departmentName ? String(x.departmentName) : undefined),
        projectNo: x.project?.no ? String(x.project.no) : (x.projectNo ? String(x.projectNo) : undefined)
      } as JournalLine;
    })
    .filter(Boolean) as JournalLine[];

  return { header: detail, lines, raw: body };
}

export async function rawAccounts() { return accurateGet("/api/glaccount/list.do", { "sp.page": 1, "sp.pageSize": 3 }); }
export async function rawJournals() { return accurateGet("/api/journal-voucher/list.do", { "sp.page": 1, "sp.pageSize": 3 }); }
export function toAccurateDate(iso: string) { const [y,m,d] = iso.split("-"); return `${d}/${m}/${y}`; }
