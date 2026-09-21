import { Account, JournalHeader, JournalLine } from "./types";

function config() {
  const host = (process.env.ACCURATE_API_HOST || "").replace(/\/$/, "");
  const token = process.env.ACCURATE_ACCESS_TOKEN || "";
  const sessionId = process.env.ACCURATE_SESSION_ID || "";

  if (!host) throw new Error("ACCURATE_API_HOST belum diisi di Railway Variables.");
  if (!token) throw new Error("ACCURATE_ACCESS_TOKEN belum diisi di Railway Variables.");
  return { host, token, sessionId };
}

function headers() {
  const { token, sessionId } = config();
  const result: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json"
  };
  if (sessionId) result["X-Session-ID"] = sessionId;
  return result;
}

async function accurateGet(path: string, params: Record<string, string | number | undefined> = {}) {
  const { host } = config();
  const url = new URL(`${host}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, { headers: headers(), cache: "no-store" });
  const text = await response.text();
  let body: any;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }

  if (!response.ok) {
    const safe = typeof body === "string" ? body.slice(0, 500) : JSON.stringify(body).slice(0, 1000);
    throw new Error(`Accurate API ${response.status}: ${safe}`);
  }
  return body;
}

function unwrapList(body: any): any[] {
  const candidates = [
    body?.d,
    body?.data,
    body?.data?.d,
    body?.result,
    body?.result?.data,
    body?.s?.data
  ];
  for (const candidate of candidates) if (Array.isArray(candidate)) return candidate;
  if (Array.isArray(body)) return body;
  return [];
}

function unwrapDetail(body: any): any {
  return body?.d ?? body?.data ?? body?.result ?? body;
}

export async function getAccounts(): Promise<Account[]> {
  const body = await accurateGet("/api/glaccount/list.do", {
    fields: "id,no,name,accountType,suspended",
    "filter.leafOnly": "true",
    "filter.suspended": "false",
    "sp.page": 1,
    "sp.pageSize": 1000,
    "sp.sort": "no|asc"
  });
  return unwrapList(body)
    .filter((x) => x?.no && x?.name && x?.accountType)
    .map((x) => ({
      id: Number(x.id) || undefined,
      no: String(x.no),
      name: String(x.name),
      accountType: String(x.accountType),
      suspended: Boolean(x.suspended)
    }));
}

export async function getJournalHeaders(from: string, to: string): Promise<JournalHeader[]> {
  const max = Math.max(1, Number(process.env.MAX_JOURNALS_PER_LOAD || 200));
  const pageSize = Math.min(max, 1000);
  const body = await accurateGet("/api/journal-voucher/list.do", {
    fields: "id,number,transDate,branchId,branchName,description",
    "filter.transDate.op": "BETWEEN",
    "filter.transDate.val[0]": toAccurateDate(from),
    "filter.transDate.val[1]": toAccurateDate(to),
    "sp.page": 1,
    "sp.pageSize": pageSize,
    "sp.sort": "transDate|asc"
  });
  return unwrapList(body)
    .filter((x) => x?.id)
    .slice(0, max)
    .map((x) => ({
      id: Number(x.id),
      number: x.number ? String(x.number) : undefined,
      transDate: x.transDate ? String(x.transDate) : undefined,
      branchId: x.branchId ? Number(x.branchId) : undefined,
      branchName: x.branchName ? String(x.branchName) : undefined,
      description: x.description ? String(x.description) : undefined
    }));
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
    .filter((x: any) => x?.accountNo && x?.amount !== undefined && x?.amountType)
    .map((x: any) => ({
      id: Number(x.id) || undefined,
      accountNo: String(x.accountNo),
      amount: Number(x.amount || 0),
      amountType: String(x.amountType).toUpperCase() === "CREDIT" ? "CREDIT" : "DEBIT",
      memo: x.memo ? String(x.memo) : undefined,
      departmentName: x.departmentName ? String(x.departmentName) : undefined,
      projectNo: x.projectNo ? String(x.projectNo) : undefined
    }));
  return { header: detail, lines, raw: body };
}

export async function rawAccounts() {
  return accurateGet("/api/glaccount/list.do", { "sp.page": 1, "sp.pageSize": 3 });
}

export async function rawJournals() {
  return accurateGet("/api/journal-voucher/list.do", { "sp.page": 1, "sp.pageSize": 3 });
}

export function toAccurateDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
