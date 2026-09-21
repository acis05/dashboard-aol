import { getAccounts, getJournalDetail, getJournalHeaders } from "./accurate";
import { MonthlyRow } from "./types";

function isoMonth(value?: string) {
  if (!value) return null;
  if (/^\d{4}-\d{2}/.test(value)) return value.slice(0, 7);
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}` : null;
}

export async function buildDashboard(from: string, to: string, selectedExpenseAccounts: string[]) {
  const [accounts, headers] = await Promise.all([getAccounts(), getJournalHeaders(from, to)]);
  const accountByNo = new Map(accounts.map((a) => [a.no, a]));

  const expenseAccounts = accounts.filter((a) => ["EXPENSE", "OTHER_EXPENSE"].includes(a.accountType));
  const selected = new Set(selectedExpenseAccounts.length ? selectedExpenseAccounts : expenseAccounts.map((a) => a.no));

  const rows = new Map<string, MonthlyRow>();
  const expenseSeries = new Map<string, Map<string, number>>();
  const maxConcurrent = 4;

  for (let i = 0; i < headers.length; i += maxConcurrent) {
    const batch = headers.slice(i, i + maxConcurrent);
    const details = await Promise.all(batch.map(async (h) => ({ h, d: await getJournalDetail(h.id) })));
    for (const { h, d } of details) {
      const month = isoMonth(h.transDate || d.header?.transDate);
      if (!month) continue;
      if (!rows.has(month)) rows.set(month, blankRow(month));
      const row = rows.get(month)!;

      for (const line of d.lines) {
        const account = accountByNo.get(line.accountNo);
        if (!account) continue;
        const signedIncome = line.amountType === "CREDIT" ? line.amount : -line.amount;
        const signedExpense = line.amountType === "DEBIT" ? line.amount : -line.amount;

        switch (account.accountType) {
          case "REVENUE": row.revenue += signedIncome; break;
          case "COGS": row.cogs += signedExpense; break;
          case "EXPENSE": row.expense += signedExpense; break;
          case "OTHER_INCOME": row.otherIncome += signedIncome; break;
          case "OTHER_EXPENSE": row.otherExpense += signedExpense; break;
        }

        if (["EXPENSE", "OTHER_EXPENSE"].includes(account.accountType) && selected.has(account.no)) {
          if (!expenseSeries.has(month)) expenseSeries.set(month, new Map());
          const monthMap = expenseSeries.get(month)!;
          monthMap.set(account.no, (monthMap.get(account.no) || 0) + signedExpense);
        }
      }
    }
  }

  const monthly = [...rows.values()].sort((a, b) => a.month.localeCompare(b.month)).map((r) => ({
    ...r,
    grossProfit: r.revenue - r.cogs,
    netProfit: r.revenue + r.otherIncome - r.cogs - r.expense - r.otherExpense
  }));

  const expenses = monthly.map((m) => {
    const result: Record<string, string | number> = { month: m.month };
    const mm = expenseSeries.get(m.month) || new Map();
    for (const no of selected) result[no] = mm.get(no) || 0;
    return result;
  });

  return {
    accounts: expenseAccounts.map((a) => ({ no: a.no, name: a.name, accountType: a.accountType })),
    monthly,
    expenses,
    meta: {
      journalCount: headers.length,
      maxJournals: Number(process.env.MAX_JOURNALS_PER_LOAD || 200),
      detailMapperFound: monthly.length > 0
    }
  };
}

function blankRow(month: string): MonthlyRow {
  return { month, revenue: 0, cogs: 0, expense: 0, otherIncome: 0, otherExpense: 0, grossProfit: 0, netProfit: 0 };
}
