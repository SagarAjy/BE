import {
  Prisma,
  approval_status,
  genders,
  lead_status,
  loan_type,
  marital_status,
  waiver_approval_status_type,
} from '@prisma/client';
import { customerModel } from '../customer/customer.model';
import { userModel } from '../user/user.model';
import { leadsModel } from './leads.model';
import { adminModel } from './leads.model.admin';
import { userReporteeModel } from '../user-reportee/user-reportee.model';
import { loanModel } from '../loan/loan.model';
import { leadsCreditModelAdmin } from './leads.credit.model.admin';
import { leadsCreditModel } from './leads.credit.model';
import { leadsFileModel } from './leads.files.model';
import { format } from 'date-fns';
import { downloadLeadsDataType } from './leads.routes';
import { emptyUUID } from '../../constants';
import { processInBatch } from '../../utils';

export type leadType = {
  lead_id: string;
  customer_id: string;
  purpose: string;
  collection_user_id: string | null;
  loan_required: string;
  tenure: number;
  monthly_income: string;
  salary_mode: string | null;
  city: string;
  state: string;
  pincode: string;
  domain_name: string | null;
  ip: string;
  waiver_approval: waiver_approval_status_type;
  client_id: string;
  user_id: string | null;
  credit_manager_id: string | null;
  conversion_time: Date | null;
  conversion_name: string | null;
  utm_source: string;
  status: lead_status;
  created_at: Date;
  updated_at: Date;
  gclid: string | null;
  approval: {
    branch: string;
    loan_type: loan_type;
    loan_amt_approved: number;
    tenure: number;
    roi: number;
    repay_date: Date;
    processing_fee: number;
    monthly_income: number;
    cibil: number;
    credited_by: string;
    status: approval_status;
    updated_at: Date;
  } | null;
}[];
const getLeads = async ({
  limit,
  offset,
  leadsFilter,
  userId,
  searchparam,
  filterBy,
  startDate,
  endDate,
  assigneeId,
  clientId,
}: {
  limit: number;
  offset: number;
  leadsFilter: lead_status;
  userId: string;
  searchparam: string;
  filterBy: string;
  startDate?: Date;
  endDate?: Date;
  assigneeId?: string;
  clientId: string;
}) => {
  const userDetails = await userModel.getUser({ userId, clientId });
  let allLeads;
  let leadsCount;

  if (userDetails?.role === 'Admin' || userDetails?.role === 'Service') {
    allLeads = await adminModel.getAllLeadsAdmin({
      limit,
      offset,
      leadsFilter,
      searchparam,
      filterBy,
      startDate,
      endDate,
      assigneeId: assigneeId?.length
        ? assigneeId === 'null'
          ? null
          : assigneeId
        : undefined,
      clientId,
    });
    leadsCount = await adminModel.getAllLeadsAdminCount({
      leadsFilter,
      filterBy,
      searchparam,
      startDate,
      endDate,
      assigneeId: assigneeId?.length
        ? assigneeId === 'null'
          ? null
          : assigneeId
        : undefined,
      clientId,
    });
  } else if (userDetails?.role === 'Credit_Manager') {
    const creditManagerReportees = await userReporteeModel.getUserReportees({
      userId,
      clientId,
    });
    allLeads = await leadsModel.filterLeadsCreditManager({
      limit,
      offset,
      leadsFilter,
      reporteeUserIds: creditManagerReportees,
      searchparam,
      filterBy,
      startDate,
      endDate,
      userId,
      clientId,
    });
    leadsCount = await leadsModel.getFilterLeadsCountCreditManager({
      leadsFilter,
      reporteeUserIds: creditManagerReportees,
      searchparam,
      filterBy,
      startDate,
      endDate,
      userId,
      clientId,
    });
  } else {
    allLeads = await leadsModel.filterLeads({
      limit,
      offset,
      leadsFilter,
      userId,
      searchparam,
      filterBy,
      startDate,
      endDate,
      clientId,
    });
    leadsCount = await leadsModel.getFilterLeadsCount({
      leadsFilter,
      userId,
      searchparam,
      filterBy,
      startDate,
      endDate,
      clientId,
    });
  }

  const leads = allLeads.map(async lead => {
    const customer = await customerModel.getCustomerById({
      customer_id: lead.customer_id,
      clientId,
    });
    let leadAssigneeName = 'None';
    if (lead.user_id && lead.user_id !== emptyUUID) {
      const leadAssignee = await userModel.getUser({
        userId: lead.user_id || '',
        clientId,
      });
      leadAssigneeName = leadAssignee?.name || '';
    }

    let creditManagerName = 'None';
    if (lead.credit_manager_id && lead.credit_manager_id !== emptyUUID) {
      const creditManager = await userModel.getUser({
        userId: lead.credit_manager_id || '',
        clientId,
      });
      creditManagerName = creditManager?.name || '';
    }

    const loanCount = await leadsModel.getClosedLoanCount({
      customerId: lead.customer_id,
      clientId,
    });

    return {
      id: lead.lead_id,
      leadAssignee: leadAssigneeName || '',
      creditManager: creditManagerName || '',
      customerName: customer?.name || '',
      customerId: customer?.customer_id || '',
      email: customer?.email || '',
      phoneNo: customer?.mobile || '',
      loanRequired: lead.loan_required,
      purpose: lead.purpose,
      tenure: lead.tenure,
      monthlyIncome: lead.monthly_income,
      salaryMode: lead.salary_mode || '',
      city: lead.city,
      state: lead.state,
      pincode: lead.pincode,
      utmSource: lead.utm_source,
      domain: lead.domain_name || '',
      status: lead.status,
      ip: lead.ip,
      waiverApprovalStatus: lead.waiver_approval || 'None',
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      loanCount: loanCount > 1 ? 'Existing_Customer' : 'Fresh_Customer',
    };
  });

  const leadsData = {
    leads: await Promise.all(leads),
    leadsCount,
  };
  return leadsData;
};

const getLead = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const leadDetails = await leadsModel.getLeadById({ leadId, clientId });

  let leadAssigneeName = 'None';
  if (leadDetails?.user_id) {
    const leadAssignee = await userModel.getUser({
      userId: leadDetails?.user_id || '',
      clientId,
    });
    leadAssigneeName = leadAssignee?.name || '';
  }

  const lead = {
    id: leadId,
    leadAssignee: leadAssigneeName,
    loanRequired: leadDetails?.loan_required || '',
    purpose: leadDetails?.purpose || '',
    tenure: leadDetails?.tenure || 0,
    monthlyIncome: leadDetails?.monthly_income || '',
    salaryMode: leadDetails?.salary_mode || '',
    city: leadDetails?.city || '',
    state: leadDetails?.state || '',
    pincode: leadDetails?.pincode || '',
    utmSource: leadDetails?.utm_source || 'website',
    domain: leadDetails?.domain_name || '',
    status: leadDetails?.status || 'Fresh_Lead',
    waiverApprovalStatus: leadDetails?.waiver_approval || 'None',
    createdAt: leadDetails?.created_at || new Date(),
  };

  return lead;
};

const getLeadsByCustomerId = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const leadDetails = await leadsModel.getLeadsByCustomerId({
    customerId,
    clientId,
  });

  const leads = leadDetails.map(lead => {
    return {
      id: lead.lead_id,
      requiredAmount: lead.loan_required || '',
      purpose: lead.purpose || '',
      tenure: lead.tenure || 0,
      monthlyIncome: lead.monthly_income || '',
      city: lead.city || '',
      state: lead.state || '',
      pincode: lead.pincode || '',
      source: lead.utm_source,
      status: lead.status,
      createdAt: lead.created_at,
    };
  });

  return leads;
};

const getCreditLeads = async ({
  limit,
  offset,
  leadsFilter,
  userId,
  searchparam,
  filterBy,
  startDate,
  endDate,
  clientId,
}: {
  limit: number;
  offset: number;
  leadsFilter: approval_status;
  userId: string;
  searchparam: string;
  filterBy: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const userDetails = await userModel.getUser({ userId, clientId });
  let allLeads;
  let leadsCount;

  if (userDetails?.role === 'Admin') {
    allLeads = await leadsCreditModelAdmin.getAllCreditLeadsAdmin({
      limit,
      offset,
      approvalFilter: leadsFilter,
      searchparam,
      filterBy,
      startDate,
      endDate,
      clientId,
    });
    leadsCount = await leadsCreditModelAdmin.getAllCreditLeadsAdminCount({
      approvalFilter: leadsFilter,
      filterBy,
      searchparam,
      startDate,
      endDate,
      clientId,
    });
  } else if (userDetails?.role === 'Credit_Manager') {
    const creditManagerReportees = await userReporteeModel.getUserReportees({
      userId,
      clientId,
    });
    allLeads = await leadsCreditModel.filterCreditLeadsCreditManager({
      limit,
      offset,
      leadsFilter,
      reporteeUserIds: creditManagerReportees,
      searchparam,
      filterBy,
      startDate,
      endDate,
      userId,
      clientId,
    });
    leadsCount = await leadsCreditModel.filterCreditLeadsCountCreditManager({
      leadsFilter,
      reporteeUserIds: creditManagerReportees,
      searchparam,
      filterBy,
      startDate,
      endDate,
      userId,
      clientId,
    });
  } else {
    allLeads = await leadsCreditModel.filterCreditLeads({
      limit,
      offset,
      leadsFilter,
      userId,
      searchparam,
      filterBy,
      startDate,
      endDate,
      clientId,
    });
    leadsCount = await leadsCreditModel.getFilterCreditLeadsCount({
      leadsFilter,
      userId,
      searchparam,
      filterBy,
      startDate,
      endDate,
      clientId,
    });
  }

  const leads = allLeads.map(async lead => {
    const customer = await customerModel.getCustomerById({
      customer_id: lead.customer_id,
      clientId,
    });

    let creditedBy = 'N/A';

    if (lead.approval?.credited_by) {
      const response = await userModel.getUser({
        userId: lead.approval?.credited_by || '',
        clientId,
      });
      creditedBy = response?.name || '';
    }

    return {
      id: lead.lead_id,
      loanNo: lead.approval?.loan_no || '',
      loanType: lead.approval?.loan_type || '',
      branch: lead.approval?.branch || '',
      name: customer?.name || '',
      email: customer?.email || '',
      phoneNo: customer?.mobile || '',
      loanAmount: lead.approval?.loan_amt_approved || 0,
      tenure: lead.approval?.tenure || 0,
      roi: lead.approval?.roi || 0,
      repayDate: lead.approval?.repay_date || new Date(),
      processingFee: lead.approval?.processing_fee || 0,
      monthlyIncome: lead.approval?.monthly_income || 0,
      cibil: lead.approval?.cibil || 0,
      creditedBy: creditedBy || '',
      status: lead.approval?.status || approval_status.Approved,
      updatedAt: lead.approval?.updated_at || new Date(),
      createdAt: lead.approval?.created_at || new Date(),
    };
  });

  const leadsData = {
    leads: await Promise.all(leads),
    leadsCount,
  };
  return leadsData;
};

const getDisbursalLeads = async ({
  limit,
  offset,
  leadsFilter,
  userId,
  searchparam,
  filterBy,
  startDate,
  endDate,
  clientId,
}: {
  limit: number;
  offset: number;
  leadsFilter: lead_status;
  userId: string;
  searchparam: string;
  filterBy: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const userDetails = await userModel.getUser({ userId, clientId });
  let allLeads;
  let leadsCount;

  if (userDetails?.role === 'Admin') {
    allLeads = await adminModel.getAllLeadsAdmin({
      limit,
      offset,
      leadsFilter,
      searchparam,
      filterBy,
      startDate,
      endDate,
      clientId,
    });
    leadsCount = await adminModel.getAllLeadsAdminCount({
      leadsFilter,
      filterBy,
      searchparam,
      startDate,
      endDate,
      clientId,
    });
  } else if (userDetails?.role === 'Credit_Manager') {
    const creditManagerReportees = await userReporteeModel.getUserReportees({
      userId,
      clientId,
    });
    allLeads = await leadsModel.filterLeadsCreditManager({
      limit,
      offset,
      leadsFilter,
      reporteeUserIds: creditManagerReportees,
      searchparam,
      filterBy,
      startDate,
      endDate,
      userId,
      clientId,
    });
    leadsCount = await leadsModel.getFilterLeadsCountCreditManager({
      leadsFilter,
      reporteeUserIds: creditManagerReportees,
      searchparam,
      filterBy,
      startDate,
      endDate,
      userId,
      clientId,
    });
  } else {
    allLeads = await leadsModel.filterLeads({
      limit,
      offset,
      leadsFilter,
      userId,
      searchparam,
      filterBy,
      startDate,
      endDate,
      clientId,
    });
    leadsCount = await leadsModel.getFilterLeadsCount({
      leadsFilter,
      userId,
      searchparam,
      filterBy,
      startDate,
      endDate,
      clientId,
    });
  }

  const leads = allLeads.map(async lead => {
    const customer = await customerModel.getCustomerById({
      customer_id: lead.customer_id,
      clientId,
    });
    const creditedBy = await userModel.getUser({
      userId: lead.approval?.credited_by || '',
      clientId,
    });
    const loanDetails = await loanModel.getLoanByLeadId({
      leadId: lead.lead_id,
      clientId,
    });

    return {
      id: lead.lead_id,
      loanNo: loanDetails?.loan_no || '',
      loanType: lead.approval?.loan_type || '',
      branch: lead.approval?.branch || '',
      name: customer?.name || '',
      email: customer?.email || '',
      phoneNo: customer?.mobile || '',
      referenceNo: loanDetails?.disbursal_reference_no || '',
      disbursalAmount: loanDetails?.disbursal_amount || 0,
      disbursalDate: loanDetails?.disbursal_date || new Date(),
      loanAmount: lead.approval?.loan_amt_approved || 0,
      tenure: lead.approval?.tenure || 0,
      roi: lead.approval?.roi || 0,
      repayDate: lead.approval?.repay_date || new Date(),
      processingFee: lead.approval?.processing_fee || 0,
      monthlyIncome: lead.approval?.monthly_income || 0,
      cibil: lead.approval?.cibil || 0,
      creditedBy: creditedBy?.name || '',
      status: lead.approval?.status || 'Fresh_Lead',
      updatedAt: loanDetails?.updated_at || new Date(),
      createdAt: loanDetails?.created_at || new Date(),
    };
  });

  const leadsData = {
    leads: await Promise.all(leads),
    leadsCount,
  };
  return leadsData;
};

const getDownloadLeads = async ({
  leadsFilter,
  userId,
  searchparam,
  startDate,
  endDate,
  assigneeId,
  clientId,
}: {
  leadsFilter: lead_status;
  userId: string;
  searchparam: string;
  startDate?: Date;
  endDate?: Date;
  assigneeId?: string;
  clientId: string;
}) => {
  const BATCH_SIZE = 50;

  async function processLeadsData(
    lead: Prisma.PromiseReturnType<
      typeof leadsFileModel.getDownloadAllLeadsAdmin
    >[0],
  ) {
    const customer = await customerModel.getCustomerById({
      customer_id: lead.customer_id,
      clientId,
    });
    let leadAssigneeName = 'None';
    if (lead.user_id) {
      const leadAssignee = await userModel.getUser({
        userId: lead.user_id || '',
        clientId,
      });
      leadAssigneeName = leadAssignee?.name || '';
    }
    let creditManagerName = 'None';
    if (lead.credit_manager_id) {
      const creditManager = await userModel.getUser({
        userId: lead.credit_manager_id || '',
        clientId,
      });
      creditManagerName = creditManager?.name || '';
    }
    const loanCount = await leadsModel.getClosedLoanCount({
      customerId: lead.customer_id,
      clientId,
    });
    return {
      ['Lead Assignee']: leadAssigneeName || '',
      ['Credit Manager']: creditManagerName || '',
      ['Customer Name']: customer?.name || '',
      ['Customer Id']: customer?.customer_id || '',
      ['Email']: customer?.email || '',
      ['Phone No']: customer?.mobile || '',
      ['Loan Required']: lead.loan_required,
      ['Purpose']: lead.purpose,
      ['Tenure']: lead.tenure.toString(),
      ['Monthly Income']: lead.monthly_income,
      ['Salary Mode']: lead.salary_mode || '',
      ['City']: lead.city,
      ['State']: lead.state,
      ['Pincode']: lead.pincode,
      ['utmSource']: lead.utm_source,
      ['Domain']: lead.domain_name || '',
      ['Status']: lead.status,
      ip: lead.ip,
      ['Created At']: format(lead.created_at, 'dd-MM-yyyy hh:mm:ss'),
      ['Updated At']: format(lead.updated_at, 'dd-MM-yyyy hh:mm:ss'),
      ['Loan Count']: loanCount > 1 ? 'Existing_Customer' : 'Fresh_Customer',
      ['GCLID']: lead.gclid || '',
      ['Conversion Name']: lead.conversion_name || '',
      ['Conversion Time']: format(
        lead.conversion_time || new Date(),
        'dd-MM-yyyy hh:mm:ss',
      ),
    };
  }

  let leads = await leadsFileModel.getDownloadAllLeadsAdmin({
    leadsFilter,
    searchparam,
    startDate,
    endDate,
    assigneeId: assigneeId?.length
      ? assigneeId === 'null'
        ? null
        : assigneeId
      : undefined,
    clientId,
  });

  const processedLeads = await processInBatch(
    leads,
    processLeadsData,
    BATCH_SIZE,
  );

  return processedLeads;
};

export const leadsService = {
  getLeads,
  getLead,
  getLeadsByCustomerId,
  getCreditLeads,
  getDisbursalLeads,
  getDownloadLeads,
};
