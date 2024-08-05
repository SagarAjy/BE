import { customerModel } from '../customer/customer.model';
import { leadsModel } from '../leads/leads.model';
import { creditReportModel } from './credit-report.model';

const getCreditReport = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const leadDetails = await leadsModel.getLeadById({ leadId, clientId });
  const creditReports = await creditReportModel.getCreditReport({
    customerId: leadDetails?.customer_id || '',
    clientId,
  });
  const liabilities = await creditReportModel.getLiabilities({
    customerId: leadDetails?.customer_id || '',
    clientId,
  });

  let credit = 0;
  let debit = 0;
  liabilities.map(liability => {
    credit = credit + liability.credit;
    debit = debit + liability.debit;
  });
  const obligation = debit - credit;
  const incomes = creditReports?.gross_income || '';
  let grossIncome = 0;
  if (incomes) {
    incomes.map(income => {
      grossIncome += income;
    });
    grossIncome = grossIncome / incomes.length;
  }
  if (!creditReports) return null;
  const netIncome = grossIncome - obligation;

  const report = {
    id: creditReports.credit_report_id || '',
    grossIncome: creditReports.gross_income,
    bandPercent: creditReports.band_percent || 0,
    foirScore: Math.round(creditReports.foir_score || 0) || 0,
    eligibleAmount: Math.round(creditReports.eligibile_amount) || 0,
    liabilities: liabilities.map(liability => {
      return {
        id: liability.liabilities_id,
        liabilityName: liability.liability_name,
        credit: liability.credit,
        debit: liability.debit,
      };
    }),
    netIncome: Math.round(netIncome),
    obligation,
  };

  return report;
};

export const creditReportService = { getCreditReport };
