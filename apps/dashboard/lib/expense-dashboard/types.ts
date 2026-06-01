export type RawExpenseRecord = {
  id?: string | number | null;
  year?: string | number | null;
  month?: string | number | null;
  day?: string | number | null;
  category?: string | null;
  brand_shop?: string | null;
  description?: string | null;
  php?: string | number | null;
  currency?: string | null;
  total?: string | number | null;
  conversion?: string | number | null;
  [key: string]: string | number | null | undefined;
};

export type ExpenseDataIssue =
  | "missing_year"
  | "missing_month"
  | "invalid_month"
  | "missing_php"
  | "invalid_php"
  | "missing_category";

export type NormalizedExpenseRecord = {
  id: string;
  year: number | null;
  month: number | null;
  day: number | null;
  dateKey: string | null;
  category: string;
  brandShop: string;
  description: string;
  php: number | null;
  isValidAmount: boolean;
  isValidDate: boolean;
  issues: ExpenseDataIssue[];
};

export type MonthlyTotal = {
  dateKey: string;
  year: number;
  month: number;
  totalPhp: number;
  transactionCount: number;
};

export type YearlyTotal = {
  year: number;
  totalPhp: number;
  transactionCount: number;
};

export type CategoryTotal = {
  category: string;
  totalPhp: number;
  transactionCount: number;
  sharePct: number;
};

export type MerchantTotal = {
  merchant: string;
  totalPhp: number;
  transactionCount: number;
};

export type TopCategoryPerMonth = {
  dateKey: string;
  category: string;
  amount: number;
  monthTotal: number;
  percentageOfMonthTotal: number;
};

export type ChangePoint = {
  key: string;
  previousKey: string | null;
  totalPhp: number;
  absoluteChange: number | null;
  percentageChange: number | null;
};

export type CategoryVolatility = {
  category: string;
  variance: number;
  standardDeviation: number;
  range: number;
  averageMonthlySpend: number;
};

export type WordFrequency = {
  word: string;
  frequency: number;
  totalSpend: number;
  weight: number;
};

export type DataQualitySummary = {
  totalRows: number;
  validRows: number;
  invalidAmountRows: number;
  invalidDateRows: number;
  missingCategoryRows: number;
  invalidMonthRows: number;
  rowsExcludedFromFinancialTotals: number;
  rowsExcludedFromTimeSeries: number;
  issueCounts: Record<ExpenseDataIssue, number>;
};

export type ForecastPoint = {
  year: number;
  projectedPhp: number;
};

export type ForecastScenarioPoint = {
  year: number;
  low: number;
  base: number;
  high: number;
};

export type ExpenseDashboardData = {
  sourcePath: string;
  records: NormalizedExpenseRecord[];
  dataQuality: DataQualitySummary;
  monthlyTotals: MonthlyTotal[];
  yearlyTotals: YearlyTotal[];
  categoryTotals: CategoryTotal[];
  topCategories: CategoryTotal[];
  topCategoryPerMonth: TopCategoryPerMonth[];
  monthlyCategoryTotals: Array<Record<string, string | number>>;
  yearlyCategoryTotals: Array<Record<string, string | number>>;
  monthOverMonthChanges: ChangePoint[];
  yearOverYearChanges: ChangePoint[];
  categoryVolatility: CategoryVolatility[];
  merchantTotals: MerchantTotal[];
  frequentPurchaseTerms: WordFrequency[];
  regressionForecast: ForecastPoint[];
  movingAverageForecast: ForecastPoint[];
  forecastScenarios: ForecastScenarioPoint[];
  categories: string[];
  years: number[];
};
