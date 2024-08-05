import { approvalModel } from '../approval/approval.model';
import { emiModel } from './emi.model';

const getEMISForLoanNo = async ({
  loanNo,
  clientId,
}: {
  loanNo: string;
  clientId: string;
}) => {
  const getEMIsForLoanNo = await emiModel.getEMIsForLoanNo({
    loanNo,
    clientId,
  });

  const emiData = getEMIsForLoanNo.map(emi => ({
    emiId: emi.emi_id,
    emiLoanNo: emi.loan_no,
    emiDate: emi.emi_date,
    emiAmount: emi.emi_amount,
    emiStatus: emi.emi_status,
    emiCreatedAt: emi.created_at,
    emiUpdatedAt: emi.updated_at,
  }));

  return emiData;
};

const getEMILoanHistory = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const getEMILoanHistory = await emiModel.getEMILoansForCustomer({
    customerId,
    clientId,
  });

  const emiLoanHistory = await Promise.all(
    getEMILoanHistory.map(async emiLoan => {
      const getEMIsForLoanNo = await emiModel.getEMIsForLoanNo({
        loanNo: emiLoan.loan_no || '',
        clientId,
      });

      const approvalDetails = await approvalModel.getApproval({
        leadId: emiLoan?.lead_id || '',
        clientId: clientId,
      });

      const emiData = getEMIsForLoanNo.map(emi => ({
        emiId: emi.emi_id,
        emiLoanNo: emi.loan_no,
        emiDate: emi.emi_date,
        emiAmount: emi.emi_amount,
        emiStatus: emi.emi_status,
        emiCreatedAt: emi.created_at,
        emiUpdatedAt: emi.updated_at,
      }));

      return {
        loanId: emiLoan?.loan_id || '',
        loanNo: emiLoan?.loan_no || '',
        leadId: emiLoan?.lead_id || '',
        loanAmount: approvalDetails?.loan_amt_approved || 0,
        disbursalDate: emiLoan?.disbursal_date || new Date(),
        referenceNo: emiLoan?.disbursal_reference_no || '',
        emis: emiData,
      };
    }),
  );

  return emiLoanHistory;
};

export const emiService = { getEMISForLoanNo, getEMILoanHistory };
