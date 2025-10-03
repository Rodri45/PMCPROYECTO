export interface ReportRow {
  id: string;
  title: string;
  amount: number;
}

export interface FinancialReportProps {
  reportData?: ReportRow[];
}
