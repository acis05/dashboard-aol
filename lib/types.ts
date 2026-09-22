export type AccountType =
  | "COGS"
  | "EXPENSE"
  | "OTHER_EXPENSE"
  | "OTHER_INCOME"
  | "REVENUE"
  | string;

export type Account = {
  id?: number;
  no: string;
  name: string;
  accountType: AccountType;
  suspended?: boolean;
};

export type JournalHeader = {
  id: number;
  number?: string;
  transDate?: string;
  branchId?: number;
  branchName?: string;
  description?: string;
};

export type JournalLine = {
  id?: number;
  accountNo: string;
  accountName?: string;
  accountType?: AccountType;
  amount: number;
  amountType: "DEBIT" | "CREDIT";
  debitAmount?: number;
  creditAmount?: number;
  memo?: string;
  departmentName?: string;
  projectNo?: string;
};

export type MonthlyRow = {
  month: string;
  revenue: number;
  cogs: number;
  expense: number;
  otherIncome: number;
  otherExpense: number;
  grossProfit: number;
  netProfit: number;
};
