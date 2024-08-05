import { differenceInCalendarDays } from 'date-fns';
import { leadsModel } from '../leads/leads.model';
import { userModel } from '../user/user.model';
import { approvalModel } from './approval.model';

const getApprovalLetter = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const lead = await leadsModel.getLeadById({ leadId, clientId });
  const approvalDetails = await approvalModel.getApproval({ leadId, clientId });

  const processingFees = approvalDetails?.processing_fee || 0;
  const gstPercent = approvalDetails?.gst || 0;
  const approvalAmount = approvalDetails?.loan_amt_approved || 0;
  const roi = approvalDetails?.roi || 0;
  const gstAmount = processingFees * gstPercent * 0.01;
  const totalDeductions = processingFees + gstAmount;
  const disbursalAmount = approvalAmount - totalDeductions;

  const tempTenure = differenceInCalendarDays(
    approvalDetails?.repay_date || new Date(),
    approvalDetails?.created_at || new Date(),
  );
  const interestAmount = approvalAmount * tempTenure * roi * 0.01;

  const repaymentAmount = approvalAmount + interestAmount;

  return {
    customerName: lead?.customers.name || '',
    applicationId: approvalDetails?.loan_no || '',
    approvalDate: approvalDetails?.created_at || new Date(),
    approvalAmount,
    roi,
    processingFeesPercent: approvalDetails?.processing_fee_percent || 0,
    processingFees,
    gstAmount,
    totalDeductions,
    disbursalAmount,
    repayDate: approvalDetails?.repay_date || new Date(),
    repayAmount: repaymentAmount,
  };
};

const getapproval = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const approvalData = await approvalModel.getApproval({
    leadId,
    clientId,
  });

  if (!approvalData) return null;
  const userDetails = await userModel.getUser({
    userId: approvalData.credited_by || '',
    clientId,
  });
  const approvalDataReturn = {
    id: approvalData.approval_id || '',
    loanType: approvalData.loan_type,
    loanNo: approvalData.loan_no || '',
    branch: approvalData.branch || '',
    approvalAmount: approvalData.loan_amt_approved || 0,
    loanTenure: approvalData.tenure || 0,
    roi: approvalData.roi || 0,
    salaryDate: approvalData.salary_date || '',
    repayDate: approvalData.repay_date || new Date(),
    processingFeePercent: approvalData.processing_fee_percent || 0,
    processingFee: approvalData.processing_fee || 0,
    conversionFeesPercent: approvalData?.conversion_fee_percent || 0,
    conversionFees: approvalData.conversion_fees || 0,
    gst: approvalData.gst || 0,
    alternateNumber: approvalData.alternate_mobile || '',
    email: approvalData.official_email || '',
    cibilScore: approvalData.cibil || 0,
    monthlyIncome: approvalData.monthly_income || 0,
    status: approvalData.status,
    creditedBy: userDetails?.name || '',
    approvalDate: approvalData.created_at,
    remark: approvalData.final_remark || '',
    additionalRemark: approvalData.remark || '',
    loanPurpose: approvalData.loan_purpose || '',
  };
  return approvalDataReturn;
};

const getExisitiingApproval = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const leadDetails = await leadsModel.getLeadById({ leadId, clientId });

  if (!leadDetails) {
    return null;
  }
  const approvalData = await approvalModel.getLatestApproval({
    customerId: leadDetails?.customer_id,
    clientId,
  });

  if (!approvalData) return null;
  const userDetails = await userModel.getUser({
    userId: approvalData.credited_by || '',
    clientId,
  });
  const approvalDataReturn = {
    id: approvalData.approval_id || '',
    loanType: approvalData.loan_type,
    loanNo: approvalData.loan_no || '',
    branch: approvalData.branch || '',
    approvalAmount: approvalData.loan_amt_approved || 0,
    loanTenure: approvalData.tenure || 0,
    roi: approvalData.roi || 0,
    salaryDate: approvalData.salary_date || '',
    repayDate: approvalData.repay_date || new Date(),
    processingFeePercent: approvalData.processing_fee_percent || 0,
    processingFee: approvalData.processing_fee || 0,
    conversionFeesPercent: approvalData?.conversion_fee_percent || 0,
    conversionFees: approvalData.conversion_fees || 0,
    gst: approvalData.gst || 0,
    alternateNumber: approvalData.alternate_mobile || '',
    email: approvalData.official_email || '',
    cibilScore: approvalData.cibil || 0,
    monthlyIncome: approvalData.monthly_income || 0,
    status: approvalData.status,
    creditedBy: userDetails?.name || '',
    approvalDate: approvalData.created_at,
    remark: approvalData.final_remark || '',
    additionalRemark: approvalData.remark || '',
    loanPurpose: approvalData.loan_purpose || '',
  };
  return approvalDataReturn;
};

const getApprovalIfExist = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const leadDetails = await leadsModel.getLeadById({ leadId, clientId });
  if (!leadDetails) return null;
  const approvalData = await approvalModel.getApprovalIfExist({
    customerId: leadDetails.customer_id || '',
    clientId,
  });

  if (!approvalData[0]) return null;
  if (approvalData[0].status !== 'Approved') return null;
  const approvalDataReturn = {
    id: approvalData[0].approval_id || '',
    branch: approvalData[0].branch || '',
    alternateNumber: approvalData[0].alternate_mobile || '',
    email: approvalData[0].official_email || '',
    cibilScore: approvalData[0].cibil || 0,
    monthlyIncome: approvalData[0].monthly_income || 0,
    roi: approvalData[0].roi || 0,
  };
  return approvalDataReturn;
};

export const approvalService = {
  getapproval,
  getApprovalIfExist,
  getApprovalLetter,
  getExisitiingApproval,
};
