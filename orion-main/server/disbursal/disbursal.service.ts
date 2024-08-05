import { addMonths, format, parse } from 'date-fns';
import { approvalService } from '../approval/approval.service';
import { leadsModel } from '../leads/leads.model';
import { loanModel } from '../loan/loan.model';
import { userModel } from '../user/user.model';
import { disbursalModel } from './disbursal.model';
import { v4 as uuid } from 'uuid';
import { emiModel } from '../emi/emi.model';

export type emiDataType = {
  emi_id: string;
  loan_id: string;
  loan_no: string;
  emi_date: Date;
  emi_amount: number;
  emi_status: string;
  created_at: Date;
  updated_at: Date;
  client_id: string;
};

const getDisbursal = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const disbursalData = await disbursalModel.getDisbursal({
    leadId,
    clientId,
  });
  if (!disbursalData) return null;

  const getDisbursedByName = await userModel.getUser({
    userId: disbursalData.disbursed_by || '',
    clientId,
  });

  let pdDoneBy;
  if (disbursalData.pd_done_by === null) {
    pdDoneBy = 'None';
  } else {
    const getpdDoneByName = await userModel.getUser({
      userId: disbursalData.pd_done_by || '',
      clientId,
    });
    pdDoneBy = getpdDoneByName?.name;
  }

  const disbursalDataReturn = {
    id: disbursalData.loan_id || '',
    disbursalAmount: disbursalData.disbursal_amount || 0,
    companyAccountNo: disbursalData.company_account_no,
    accountNo: disbursalData.account_no,
    accountType: disbursalData.account_type,
    bankName: disbursalData.bank,
    ifscCode: disbursalData.bank_ifsc || null,
    bankBranch: disbursalData.bank_branch,
    chequeNo: disbursalData.cheque_details || null,
    disbursalDate: disbursalData.disbursal_date,
    utrNo: disbursalData.disbursal_reference_no || '',
    finalRemark: disbursalData.remarks,
    disbursedBy: getDisbursedByName?.name || '',
    pdDoneBy: pdDoneBy || '',
    pdDate: disbursalData.pd_date,
  };
  return disbursalDataReturn;
};

const getExisitingDisbursal = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const leadDetails = await leadsModel.getLeadById({ leadId, clientId });
  if (!leadDetails) return null;
  const disbursalData = await disbursalModel.getExisitingDisbursal({
    customerId: leadDetails?.customer_id,
    clientId,
  });

  if (!disbursalData) return null;

  const getDisbursedByName = await userModel.getUser({
    userId: disbursalData.disbursed_by || '',
    clientId,
  });

  let pdDoneBy;
  if (disbursalData.pd_done_by === null) {
    pdDoneBy = 'None';
  } else {
    const getpdDoneByName = await userModel.getUser({
      userId: disbursalData.pd_done_by || '',
      clientId,
    });
    pdDoneBy = getpdDoneByName?.name;
  }

  const disbursalDataReturn = {
    id: disbursalData.loan_id || '',
    disbursalAmount: disbursalData.disbursal_amount || 0,
    companyAccountNo: disbursalData.company_account_no,
    accountNo: disbursalData.account_no,
    accountType: disbursalData.account_type,
    bankName: disbursalData.bank,
    ifscCode: disbursalData.bank_ifsc || null,
    bankBranch: disbursalData.bank_branch,
    chequeNo: disbursalData.cheque_details || null,
    disbursalDate: disbursalData.disbursal_date,
    utrNo: disbursalData.disbursal_reference_no || '',
    finalRemark: disbursalData.remarks,
    disbursedBy: getDisbursedByName?.name || '',
    pdDoneBy: pdDoneBy || '',
    pdDate: disbursalData.pd_date,
  };
  return disbursalDataReturn;
};

const createEMIsForDisbursal = async ({
  loanId,
  clientId,
}: {
  loanId: string;
  clientId: string;
}) => {
  const loanDetails = await loanModel.getLoan({ loanId, clientId });
  const approvalData = await approvalService.getapproval({
    leadId: loanDetails?.lead_id || '',
    clientId,
  });

  const tenure = approvalData?.loanTenure || 0;
  const approvalAmount = approvalData?.approvalAmount || 0;
  const interest = approvalAmount * 0.0299 * tenure;
  const repayAmount = approvalAmount + interest;
  const monthlyEmi = Math.round(repayAmount / tenure);

  let emiData: emiDataType[] = [];

  emiData = Array.from({ length: tenure }).map((_, index) => ({
    emi_id: uuid(),
    loan_id: loanId,
    loan_no: approvalData?.loanNo || '',
    emi_date:
      parse(
        format(addMonths(new Date(), index + 1), 'dd-MM-yyyy'),
        'dd-MM-yyyy',
        new Date(),
      ) || new Date(),
    emi_amount: monthlyEmi,
    emi_status: 'Pending',
    created_at: new Date(),
    updated_at: new Date(),
    client_id: clientId,
  }));

  const response = await emiModel.createEMI({ emiData });

  return response;
};

export const disbursalService = {
  getDisbursal,
  getExisitingDisbursal,
  createEMIsForDisbursal,
};
