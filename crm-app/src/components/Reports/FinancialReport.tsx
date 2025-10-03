import React from "react";
import type { FinancialReportProps, ReportRow } from "../../types/FinancialReportProps";

const FinancialReport: React.FC<FinancialReportProps> = ({ reportData = [] }) => (
  <table>
    <thead>
      <tr><th>Title</th><th>Amount</th></tr>
    </thead>
    <tbody>
      {reportData.map((r: ReportRow) => (
        <tr key={r.id}>
          <td>{r.title}</td>
          <td>{r.amount}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default FinancialReport;
