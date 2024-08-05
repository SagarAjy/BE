import { lead_status, loan_status, loan_type } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';
import { leadsModel } from '../leads/leads.model';
import { callHistoryModel } from '../call-history/call-history.model';
import { novuNotification } from '../novu/novu.model';
import { loanModel } from '../loan/loan.model';
import { approvalModel } from '../approval/approval.model';

//create disbursal
const addDisbursal = async ({
  userId,
  leadId,
  loanNo,
  loanType,
  disbursalAmount,
  customerId,
  companyAccountNo,
  accountNo,
  accountType,
  bankName,
  ifscCode,
  bankBranch,
  chequeNo,
  disbursalDate,
  pdDoneBy,
  pdDoneDate,
  finalRemark,
  processingFee,
  conversionFee = 0,
  clientId,
}: {
  userId: string;
  leadId: string;
  loanNo: string;
  loanType: loan_type;
  disbursalAmount: number;
  customerId: string;
  companyAccountNo: string;
  accountNo: string;
  accountType: string;
  bankName: string;
  ifscCode: string;
  bankBranch: string;
  chequeNo: string;
  disbursalDate: Date;
  pdDoneBy: string | null;
  pdDoneDate: string;
  finalRemark: string;
  processingFee: number;
  conversionFee?: number;
  clientId: string;
}) => {
  const response = await prisma.loan.create({
    data: {
      loan_id: uuid(),
      lead_id: leadId,
      loan_no: loanNo,
      loan_type: loanType,
      company_account_no: companyAccountNo,
      customer_id: customerId,
      account_no: accountNo,
      bank: bankName,
      bank_branch: bankBranch,
      bank_ifsc: ifscCode,
      pd_done_by: pdDoneBy,
      remarks: finalRemark,
      cheque_details: chequeNo,
      disbursed_by: userId,
      disbursal_date: disbursalDate,
      account_type: accountType,
      status: loan_status.Bank_Update,
      disbursal_amount: disbursalAmount,
      processing_fee: processingFee,
      conversion_fee: conversionFee,
      pd_date: pdDoneDate,
      client_id: clientId,
    },
  });

  //update leadStatus to disbursed when creating disbursal
  await prisma.leads.update({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    data: {
      status: lead_status.Bank_Update,
      updated_at: new Date(),
    },
  });
  const lead = await leadsModel.getLeadById({
    leadId,
    clientId,
  });
  //create call hidstory for status change
  await callHistoryModel.createCallHistory({
    customer_id: lead?.customer_id || '',
    email: lead?.customers.email || '',
    name: lead?.customers.name || '',
    leadId,
    called_by: userId,
    call_type: 'changed status to',
    status: lead_status.Bank_Update,
    remark: finalRemark,
    clientId,
  });
  return response;
};

//update loan no
const updateLoanNo = async ({
  loanId,
  loanNo,
}: {
  loanId: string;
  loanNo: string;
}) => {
  await prisma.loan.update({
    where: {
      loan_id: loanId,
    },
    data: {
      loan_no: loanNo,
      updated_at: new Date(),
    },
  });
};

const updateDisbursal = async ({
  loanId,
  accountNo,
  bankName,
  bankBranch,
  ifscCode,
  disbursalDate,
  accountType,
  clientId,
}: {
  loanId: string;
  accountNo: string;
  bankName: string;
  bankBranch: string;
  ifscCode: string;
  disbursalDate: Date;
  accountType: string;
  clientId: string;
}) => {
  await prisma.loan.update({
    where: {
      loan_id: loanId,
      client_id: clientId,
    },
    data: {
      account_no: accountNo,
      bank: bankName,
      bank_branch: bankBranch,
      bank_ifsc: ifscCode,
      disbursal_date: disbursalDate,
      account_type: accountType,
      client_id: clientId,
    },
  });
};

//update disbursal by loanId
const updateDisbursalUTR = async ({
  loanId,
  disbursalReferenceNo,
  userId,
  clientId,
}: {
  loanId: string;
  disbursalReferenceNo: string;
  userId: string;
  clientId: string;
}) => {
  const response = await prisma.loan.update({
    where: {
      loan_id: loanId,
    },
    data: {
      disbursal_reference_no: disbursalReferenceNo,
      status: 'Disbursed',
    },
  });

  const lead = await leadsModel.getLeadById({
    leadId: response.lead_id,
    clientId,
  });

  await callHistoryModel.createCallHistory({
    customer_id: lead?.customer_id || '',
    leadId: response.lead_id,
    called_by: userId,
    call_type: 'changed status to',
    status: lead_status.Disbursed,
    remark: 'disbursal done',
    clientId,
  });

  const loanDetails = await loanModel.getLoanByLeadId({
    leadId: response.lead_id,
    clientId,
  });
  const approvalDetails = await approvalModel.getApproval({
    leadId: response.lead_id,
    clientId,
  });
  const interestAmount =
    (approvalDetails?.loan_amt_approved || 0) *
    (approvalDetails?.tenure || 0) *
    0.01 *
    (approvalDetails?.roi || 0);
  const repayAmount =
    (approvalDetails?.loan_amt_approved || 0) + interestAmount;

  await novuNotification.sendDisbursalEmailToCustomer({
    email: lead?.customers.email || '',
    name: lead?.customers.name || '',
    id: lead?.customer_id || '',
    loanAccountNo: loanDetails?.account_no || '',
    loanAmount: loanDetails?.disbursal_amount || 0,
    tenure: approvalDetails?.tenure || 0,
    repaymentDate: approvalDetails?.repay_date || new Date(),
    repaymentAmount: repayAmount || 0,
    clientId,
  });
};

//get disbursal by leadId
const getDisbursal = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const response = await prisma.loan.findFirst({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
  });
  return response;
};

const getExisitingDisbursal = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const response = await prisma.loan.findMany({
    where: {
      customer_id: customerId,
      client_id: clientId,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: 1,
  });
  return response[0];
};

const deleteDisbursal = async ({
  loanId,
  leadId,
  clientId,
}: {
  loanId: string;
  leadId: string;
  clientId: string;
}) => {
  await prisma.loan.delete({
    where: {
      loan_id: loanId,
      client_id: clientId,
    },
  });

  const autoDisbursal = await prisma.auto_disbursal.findMany({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
  });

  if (autoDisbursal.length > 0) {
    await prisma.auto_disbursal.delete({
      where: {
        id: autoDisbursal?.at(0)?.id,
        client_id: clientId,
      },
    });
  }

  await prisma.leads.update({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    data: {
      status: lead_status.Approved,
    },
  });
};

const updateDisbursedBy = async ({
  loanId,
  clientId,
  disbursedBy,
}: {
  loanId: string;
  clientId: string;
  disbursedBy: string;
}) => {
  await prisma.loan.update({
    where: {
      loan_id: loanId,
      client_id: clientId,
    },
    data: {
      disbursed_by: disbursedBy,
    },
  });
};

export const disbursalModel = {
  addDisbursal,
  updateLoanNo,
  getDisbursal,
  updateDisbursal,
  updateDisbursalUTR,
  deleteDisbursal,
  getExisitingDisbursal,
  updateDisbursedBy,
};
