import { approval_status, lead_status, loan_type } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';
import { callHistoryModel } from '../call-history/call-history.model';
import { leadsModel } from '../leads/leads.model';
import { parse } from 'date-fns';
import { clientModel } from '../clients/clients.model';

//add approval
const addApproval = async ({
  customerId,
  userId,
  leadId,
  branch,
  approvalAmount,
  roi,
  monthlyIncome,
  salaryDate,
  repayDate,
  processingFeePercent,
  processingFee,
  conversionFeesPercent,
  conversionFees,
  gst,
  email,
  alternateNumber,
  cibilScore,
  remark,
  status,
  loanPurpose,
  loanType,
  clientId,
}: {
  customerId: string;
  userId: string;
  leadId: string;
  branch: string;
  approvalAmount: number;
  roi: number;
  monthlyIncome: number;
  salaryDate: string;
  repayDate: string;
  processingFeePercent: number;
  processingFee: number;
  conversionFeesPercent: number;
  conversionFees: number;
  gst: number;
  email: string;
  alternateNumber: string;
  cibilScore: number;
  status: approval_status;
  remark: string;
  loanPurpose: string;
  loanType: loan_type;
  clientId: string;
}) => {
  const response = await prisma.approval.create({
    data: {
      approval_id: uuid(),
      credited_by: userId,
      customer_id: customerId,
      lead_id: leadId,
      branch,
      loan_amt_approved: approvalAmount,
      tenure: 0,
      roi,
      monthly_income: monthlyIncome,
      salary_date: salaryDate,
      repay_date: parse(repayDate, 'dd-MM-yyyy', new Date()),
      processing_fee_percent: processingFeePercent,
      processing_fee: processingFee,
      conversion_fee_percent: conversionFeesPercent,
      conversion_fees: conversionFees,
      gst,
      official_email: email,
      alternate_mobile: alternateNumber,
      cibil: cibilScore,
      final_remark: remark,
      status,
      loan_purpose: loanPurpose,
      loan_type: loanType,
      client_id: clientId,
    },
  });

  const clientDetails = await clientModel.getClient({ clientId });

  const loanNo =
    clientDetails?.client_loan_prefix +
    '' +
    (BigInt(clientDetails?.default_loan_no || 0) + BigInt(response.row_no));

  await prisma.approval.update({
    where: {
      approval_id: response.approval_id,
      client_id: clientId,
    },
    data: {
      loan_no: loanNo,
    },
  });

  //*when add ing an approval ,upadte the lead status to approved if approvalStatus is approved otherwise rejected
  await prisma.leads.update({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    data: {
      status:
        status === 'Approved' ? lead_status.Approved : lead_status.Rejected,
      updated_at: new Date(),
    },
  });
  const lead = await leadsModel.getLeadById({
    leadId,
    clientId,
  });
  //creating a call history for status change
  await callHistoryModel.createCallHistory({
    customer_id: lead?.customer_id || '',
    leadId,
    called_by: userId,
    call_type: 'changed status to',
    status: status === 'Approved' ? lead_status.Approved : lead_status.Rejected,
    remark,
    clientId,
  });
};

//update an approval
const updateApproval = async ({
  leadId,
  userId,
  branch,
  approvalAmount,
  roi,
  repayDate,
  processingFeePercent,
  processingFee,
  conversionFeesPercent,
  conversionFees,
  remark,
  status,
  officialEmail,
  creditedAt,
  clientId,
  editRepayDate = false,
}: {
  leadId: string;
  userId: string;
  branch: string;
  approvalAmount: number;
  roi: number;
  repayDate: string;
  processingFeePercent: number;
  processingFee: number;
  conversionFeesPercent?: number;
  conversionFees?: number;
  status: approval_status;
  remark: string;
  officialEmail: string;
  creditedAt: Date;
  clientId: string;
  editRepayDate: boolean;
}) => {
  await prisma.approval.update({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    data: {
      credited_by: userId,
      branch,
      loan_amt_approved: approvalAmount,
      roi,
      official_email: officialEmail,
      repay_date: parse(repayDate, 'dd-MM-yyyy', new Date()),
      processing_fee_percent: processingFeePercent,
      processing_fee: processingFee,
      conversion_fee_percent: conversionFeesPercent || 0,
      conversion_fees: conversionFees || 0,
      remark,
      status,
      updated_at: new Date(),
      created_at: creditedAt,
    },
  });

  if (!editRepayDate) {
    //*when updating an approval ,update the lead status to approved if approvalStatus is approved otherwise rejected
    await prisma.leads.update({
      where: {
        lead_id: leadId,
        client_id: clientId,
      },
      data: {
        status:
          status === 'Approved' ? lead_status.Approved : lead_status.Rejected,
        updated_at: new Date(),
      },
    });
    const lead = await leadsModel.getLeadById({
      leadId,
      clientId,
    });

    await callHistoryModel.createCallHistory({
      customer_id: lead?.customer_id || '',
      leadId,
      called_by: userId,
      call_type: 'updated approval status to',
      status:
        status === 'Approved' ? lead_status.Approved : lead_status.Rejected,
      remark,
      clientId,
    });
  }
};

//update tenure of loan in approval table
const updateTenure = async ({
  leadId,
  tenure,
  clientId,
}: {
  leadId: string;
  tenure: number;
  clientId: string;
}) => {
  await prisma.approval.update({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    data: {
      tenure,
      updated_at: new Date(),
    },
  });
};

const updateCreditedBy = async ({
  leadId,
  creditedBy,
  clientId,
}: {
  leadId: string;
  creditedBy: string;
  clientId: string;
}) => {
  await prisma.approval.update({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    data: {
      credited_by: creditedBy,
      updated_at: new Date(),
    },
  });
};

const getApproval = async ({
  leadId,
  startDate,
  endDate,
  clientId,
}: {
  leadId: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.approval.findFirst({
    where: {
      lead_id: leadId,
      client_id: clientId,
      repay_date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      leads: {
        select: {
          collection_user_id: true,
        },
      },
    },
  });
  return response;
};

const getApprovalByLoanNo = async ({
  loanNo,
  clientId,
}: {
  loanNo: string;
  clientId: string;
}) => {
  const response = await prisma.approval.findFirst({
    where: {
      loan_no: loanNo,
      client_id: clientId,
    },
  });
  return response;
};

//for disbursal excel download
const getApprovalByLeadId = async ({
  startDate,
  endDate,
  leadId,
  clientId,
}: {
  startDate?: Date;
  endDate?: Date;
  leadId: string;
  clientId: string;
}) => {
  const response = await prisma.approval.findFirst({
    where: {
      repay_date: {
        gte: startDate,
        lte: endDate,
      },
      lead_id: leadId,
      client_id: clientId,
    },
  });
  return response;
};

const getLatestApproval = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const response = await prisma.approval.findMany({
    where: {
      customer_id: customerId,
      client_id: clientId,
    },
    orderBy: {
      created_at: 'desc', // Assuming there's a 'createdAt' timestamp in your table
    },
    take: 1,
  });
  return response[0];
};

//get approvals of customer using customerId
const getApprovalIfExist = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const response = await prisma.approval.findMany({
    where: { customer_id: customerId, client_id: clientId },
    orderBy: {
      updated_at: 'desc',
    },
    take: 1,
  });
  return response;
};

const getAllApproval = async ({
  startDate,
  endDate,
  clientId,
}: {
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.approval.findMany({
    where: {
      client_id: clientId,
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  return response;
};

const getAllApprovalByCreditedBy = async ({
  startDate,
  endDate,
  userId,
  clientId,
}: {
  startDate?: Date;
  endDate?: Date;
  userId: string;
  clientId: string;
}) => {
  const response = await prisma.approval.findMany({
    where: {
      client_id: clientId,
      created_at: {
        gte: startDate,
        lte: endDate,
      },
      AND: {
        credited_by: userId,
      },
    },
  });
  return response;
};

export const approvalModel = {
  addApproval,
  updateApproval,
  updateCreditedBy,
  getApproval,
  getApprovalByLoanNo,
  updateTenure,
  getApprovalIfExist,
  getAllApproval,
  getAllApprovalByCreditedBy,
  getLatestApproval,
  getApprovalByLeadId,
};
