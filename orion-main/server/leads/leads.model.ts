import {
  lead_status,
  loan_type,
  waiver_approval_status_type,
} from '@prisma/client';
import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';

export type userReportees = {
  user_id: string;
  user_reportee_id: string;
};

//create lead
const createLead = async ({
  customer_id,
  user_id,
  purpose,
  loan_required,
  tenure,
  monthly_income,
  salary_mode,
  city,
  state,
  pincode,
  domain_name,
  ip,
  utmSource,
  clientId,
  status,
  gclid,
  creditManagerId,
  loan_type,
}: {
  customer_id: string;
  user_id: string | null;
  purpose: string;
  loan_required: string;
  tenure: number;
  monthly_income: string;
  salary_mode: string;
  city: string;
  state: string;
  pincode: string;
  domain_name: string;
  ip: string;
  utmSource: string;
  clientId: string;
  status: lead_status;
  gclid: string | null;
  creditManagerId?: string | null;
  loan_type: loan_type;
}) => {
  const response = await prisma.leads.create({
    data: {
      lead_id: uuid(),
      customer_id,
      user_id,
      credit_manager_id: creditManagerId,
      purpose,
      loan_required,
      tenure,
      monthly_income,
      salary_mode,
      city,
      state,
      pincode,
      domain_name,
      ip,
      utm_source: utmSource,
      client_id: clientId,
      status,
      gclid,
      loan_type,
    },
  });

  return response;
};

//filter leadsby status eg Interested,Fresh_lead
const filterLeads = async ({
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
  const response = await prisma.leads.findMany({
    take: limit,
    skip: offset,
    where: {
      status: leadsFilter,
      client_id: clientId,
      updated_at: {
        gte: startDate,
        lte: endDate,
      },
      OR: [
        {
          customers: {
            name: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            mobile: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            pancard: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            email: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            aadhar_no: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          city: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          state: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
      ],
      user_id: userId,
    },
    orderBy: {
      updated_at: 'desc',
    },
    include: {
      approval: {
        select: {
          branch: true,
          loan_type: true,
          loan_amt_approved: true,
          tenure: true,
          roi: true,
          repay_date: true,
          processing_fee: true,
          monthly_income: true,
          cibil: true,
          credited_by: true,
          status: true,
          updated_at: true,
          created_at: true,
        },
      },
    },
  });

  return response;
};

//count of leads
const getFilterLeadsCount = async ({
  leadsFilter,
  userId,
  searchparam,
  filterBy,
  startDate,
  endDate,
  clientId,
}: {
  leadsFilter: lead_status;
  userId: string;
  searchparam: string;
  filterBy: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.leads.count({
    where: {
      user_id: userId,
      client_id: clientId,
      status: leadsFilter,
      updated_at: {
        gte: startDate,
        lte: endDate,
      },
      OR: [
        {
          customers: {
            name: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            mobile: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            pancard: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            email: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            aadhar_no: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          city: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          state: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
      ],
    },
  });

  return response;
};

const filterLeadsCreditManager = async ({
  limit,
  offset,
  leadsFilter,
  reporteeUserIds,
  searchparam,
  filterBy,
  startDate,
  endDate,
  userId,
  clientId,
}: {
  limit: number;
  offset: number;
  leadsFilter: lead_status;
  reporteeUserIds: userReportees[];
  searchparam: string;
  filterBy: string;
  startDate?: Date;
  endDate?: Date;
  userId: string;
  clientId: string;
}) => {
  const response = await prisma.leads.findMany({
    take: limit,
    skip: offset,
    where: {
      status: leadsFilter,
      client_id: clientId,
      NOT: {
        status: 'Fresh_Lead',
      },
      updated_at: {
        gte: startDate,
        lte: endDate,
      },
      OR: [
        {
          customers: {
            name: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            mobile: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            pancard: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            email: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            aadhar_no: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          city: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          state: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
      ],
      AND: {
        OR: [
          {
            user_id: {
              in: reporteeUserIds.map(reportee => reportee.user_reportee_id),
            },
          },
          {
            credit_manager_id: userId,
          },
        ],
      },
    },
    orderBy: {
      updated_at: 'desc',
    },
    include: {
      approval: {
        select: {
          lead_id: true,
          branch: true,
          loan_type: true,
          loan_amt_approved: true,
          tenure: true,
          roi: true,
          repay_date: true,
          processing_fee: true,
          monthly_income: true,
          cibil: true,
          credited_by: true,
          status: true,
          updated_at: true,
          created_at: true,
        },
      },
    },
  });

  return response;
};

const getLeadsCreditManager = async ({
  reporteeUserIds,
  clientId,
}: {
  reporteeUserIds: userReportees[];
  clientId: string;
}) => {
  const response = await prisma.leads.findMany({
    where: {
      client_id: clientId,
      user_id: {
        in: reporteeUserIds.map(reportee => reportee.user_reportee_id),
      },
    },
    orderBy: {
      updated_at: 'desc',
    },
  });

  return response;
};

//returns count of leads for credit manager
const getFilterLeadsCountCreditManager = async ({
  leadsFilter,
  reporteeUserIds,
  searchparam,
  filterBy,
  startDate,
  endDate,
  userId,
  clientId,
}: {
  leadsFilter: lead_status;
  reporteeUserIds: userReportees[];
  searchparam: string;
  filterBy: string;
  startDate?: Date;
  endDate?: Date;
  userId: string;
  clientId: string;
}) => {
  const response = await prisma.leads.count({
    where: {
      client_id: clientId,
      user_id: {
        in: reporteeUserIds.map(reportee => reportee.user_reportee_id),
      },
      status: leadsFilter,
      updated_at: {
        gte: startDate,
        lte: endDate,
      },
      NOT: {
        status: 'Fresh_Lead',
      },
      OR: [
        {
          customers: {
            name: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            mobile: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            pancard: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            email: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            aadhar_no: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          city: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          state: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
      ],
    },
  });
  return response;
};

//get lead by leadId
const getLeadById = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const response = await prisma.leads.findFirst({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    include: {
      customers: true,
    },
  });
  return response;
};

//get lead by customerId
const getLeadsByCustomerId = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const response = await prisma.leads.findMany({
    where: {
      customer_id: customerId,
      client_id: clientId,
    },
    include: {
      approval: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });
  return response;
};

const updateLeadAssignee = async ({
  leadId,
  leadAssignee,
  userReporting,
  clientId,
}: {
  leadId: string;
  leadAssignee: string;
  userReporting: string | null;
  clientId: string;
}) => {
  const response = await prisma.leads.update({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    data: {
      user_id: leadAssignee,
      credit_manager_id: userReporting,
    },
  });

  return response;
};

const updateLeadStatus = async ({
  leadId,
  status,
  clientId,
}: {
  leadId: string;
  status: lead_status;
  clientId: string;
}) => {
  const response = await prisma.leads.update({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    data: {
      status,
      updated_at: new Date(),
    },
  });

  return response;
};

const updateLeadLoanRequired = async ({
  leadId,
  loanRequired,
  clientId,
}: {
  leadId: string;
  loanRequired: string;
  clientId: string;
}) => {
  const response = await prisma.leads.update({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    data: {
      loan_required: loanRequired,
    },
  });
};

const addLeadConversionName = async ({
  leadId,
  clientId,
  conversionName,
}: {
  leadId: string;
  clientId: string;
  conversionName: string;
}) => {
  const response = await prisma.leads.update({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    data: {
      conversion_name: conversionName,
      conversion_time: new Date(),
    },
  });

  return response;
};

const getClosedLoanCount = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const response = await prisma.leads.count({
    where: {
      customer_id: customerId,
      client_id: clientId,
      OR: [
        {
          status: 'Closed',
        },
        {
          status: 'Settlement',
        },
        {
          status: 'Part_Payment',
        },
      ],
    },
  });
  return response ? response : -1;
};

//assigning collection executives to leads
const assignCollectionExecutiveLeads = ({
  userId,
  leadsId,
  clientId,
}: {
  userId: string;
  leadsId: string[];
  clientId: string;
}) => {
  leadsId.map(async lead => {
    await prisma.leads.update({
      where: {
        lead_id: lead,
        client_id: clientId,
      },
      data: {
        collection_user_id: userId,
        updated_at: new Date(),
      },
    });
  });
};

const getLeadByCollectionUserId = async ({
  userId,
  startDate,
  endDate,
  clientId,
}: {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.leads.findMany({
    where: {
      client_id: clientId,
      collection_user_id: userId,
      updated_at: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  return response;
};

const getLeadByCollectionUserIdCount = async ({
  userId,
  startDate,
  endDate,
  clientId,
}: {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.leads.count({
    where: {
      client_id: clientId,
      collection_user_id: userId,
      updated_at: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  return response;
};

const getLeadByCollectionUserIdCountClosed = async ({
  userId,
  startDate,
  endDate,
  clientId,
}: {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.leads.count({
    where: {
      client_id: clientId,
      collection_user_id: userId,
      status: lead_status.Closed,
      updated_at: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  return response;
};

// get leads by collection managers reportees
const getLeadByCollectionReporteeUserId = async ({
  userId,
  reporteeUserIds,
  startDate,
  endDate,
  clientId,
}: {
  userId: string;
  reporteeUserIds: userReportees[];
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.leads.findMany({
    where: {
      client_id: clientId,
      OR: [
        {
          collection_user_id: userId,
        },
        {
          collection_user_id: {
            in: reporteeUserIds.map(reportee => reportee.user_reportee_id),
          },
        },
      ],
      updated_at: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  return response;
};

const getLeadByUserId = async ({
  userId,
  clientId,
}: {
  userId: string;
  clientId: string;
}) => {
  const response = await prisma.leads.findMany({
    where: {
      user_id: userId,
      client_id: clientId,
    },
  });
  return response;
};

const getLeadCountByUserId = async ({
  userId,
  startDate,
  endDate,
  clientId,
}: {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.leads.count({
    where: {
      client_id: clientId,
      user_id: userId,
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  return response;
};

const leadAssignedCountByUserId = async ({
  startDate,
  endDate,
  userId,
  clientId,
}: {
  startDate: Date;
  endDate: Date;
  userId: string;
  clientId: string;
}) => {
  const response = await prisma.$queryRaw`
  SELECT COUNT(*) FROM leads
  WHERE created_at <> updated_at 
  AND client_id = ${clientId}::UUID
  AND user_id=${userId}::UUID
  AND created_at >= ${startDate}
  AND created_at <= ${endDate}
`;
  return response;
};

const updateLeadWaiverRequest = async ({
  leadId,
  waiverRequest,
  clientId,
}: {
  leadId: string;
  waiverRequest: waiver_approval_status_type;
  clientId: string;
}) => {
  const response = await prisma.leads.update({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    data: {
      waiver_approval: waiverRequest,
    },
  });

  return response;
};

const getWaiverRequests = async ({
  limit,
  offset,
  searchparam,
  clientId,
}: {
  limit: number;
  offset: number;
  searchparam?: string;
  clientId: string;
}) => {
  const response = await prisma.leads.findMany({
    take: limit,
    skip: offset,
    where: {
      client_id: clientId,
      OR: [
        {
          waiver_approval: 'Requested',
        },
        {
          waiver_approval: 'Accepted',
        },
        {
          waiver_approval: 'Rejected',
        },
      ],
      AND: {
        OR: [
          {
            customers: {
              name: {
                contains: searchparam,
                mode: 'insensitive',
              },
            },
          },
          {
            customers: {
              mobile: {
                contains: searchparam,
                mode: 'insensitive',
              },
            },
          },
          {
            customers: {
              pancard: {
                contains: searchparam,
                mode: 'insensitive',
              },
            },
          },
          {
            customers: {
              email: {
                contains: searchparam,
                mode: 'insensitive',
              },
            },
          },
          {
            customers: {
              aadhar_no: {
                contains: searchparam,
                mode: 'insensitive',
              },
            },
          },
          {
            city: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
          {
            state: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        ],
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    include: {
      approval: {
        select: {
          loan_no: true,
          loan_amt_approved: true,
          repay_date: true,
          roi: true,
          tenure: true,
        },
      },
    },
  });
  return response;
};

const getWaiverRequestsCount = async ({
  searchparam,
  clientId,
}: {
  searchparam?: string;
  clientId: string;
}) => {
  const response = await prisma.leads.count({
    where: {
      client_id: clientId,
      OR: [
        {
          waiver_approval: 'Requested',
        },
        {
          waiver_approval: 'Accepted',
        },
        {
          waiver_approval: 'Rejected',
        },
      ],
      AND: {
        OR: [
          {
            customers: {
              name: {
                contains: searchparam,
                mode: 'insensitive',
              },
            },
          },
          {
            customers: {
              mobile: {
                contains: searchparam,
                mode: 'insensitive',
              },
            },
          },
          {
            customers: {
              pancard: {
                contains: searchparam,
                mode: 'insensitive',
              },
            },
          },
          {
            customers: {
              email: {
                contains: searchparam,
                mode: 'insensitive',
              },
            },
          },
          {
            customers: {
              aadhar_no: {
                contains: searchparam,
                mode: 'insensitive',
              },
            },
          },
          {
            city: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
          {
            state: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        ],
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });
  return response;
};

const getLatestLeadByCustomerId = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const latestEntry = await prisma.leads.findMany({
    where: { customer_id: customerId, client_id: clientId },
    orderBy: {
      created_at: 'desc', // Assuming there's a 'createdAt' timestamp in your table
    },
    take: 1,
  });
  return latestEntry[0];
};

const getAllLeadsByDate = async ({
  clientId,
  startDate,
  endDate,
}: {
  clientId: string;
  startDate: Date;
  endDate: Date;
}) => {
  const response = await prisma.leads.findMany({
    where: {
      client_id: clientId,
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });
  return response;
};

const getLeadsCountByStatus = async ({
  clientId,
  startDate,
  endDate,
  userId,
  status,
}: {
  clientId: string;
  startDate: Date;
  endDate: Date;
  userId: string;
  status: lead_status;
}) => {
  const response = await prisma.leads.count({
    where: {
      user_id: userId,
      client_id: clientId,
      updated_at: {
        gte: startDate,
        lte: endDate,
      },
      status,
    },
  });
  return response;
};

const getLeadsByStatus = async ({
  clientId,
  startDate,
  endDate,
  userId,
  status,
}: {
  clientId: string;
  startDate: Date;
  endDate: Date;
  userId: string;
  status: lead_status;
}) => {
  const response = await prisma.leads.findMany({
    where: {
      user_id: userId,
      client_id: clientId,
      updated_at: {
        gte: startDate,
        lte: endDate,
      },
      status,
    },
  });
  return response;
};

export const leadsModel = {
  createLead,
  getLeadById,
  filterLeads,
  getFilterLeadsCount,
  getLeadsByCustomerId,
  filterLeadsCreditManager,
  getFilterLeadsCountCreditManager,
  updateLeadAssignee,
  updateLeadStatus,
  updateLeadLoanRequired,
  addLeadConversionName,
  getClosedLoanCount,
  assignCollectionExecutiveLeads,
  getLeadByCollectionUserId,
  getLeadsCreditManager,
  getLeadByUserId,
  getLeadByCollectionUserIdCount,
  getLeadByCollectionUserIdCountClosed,
  getLeadByCollectionReporteeUserId,
  getLeadCountByUserId,
  leadAssignedCountByUserId,
  updateLeadWaiverRequest,
  getWaiverRequests,
  getWaiverRequestsCount,
  getLatestLeadByCustomerId,
  getAllLeadsByDate,
  getLeadsCountByStatus,
  getLeadsByStatus,
};
