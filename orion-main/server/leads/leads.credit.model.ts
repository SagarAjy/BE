import { approval_status, lead_status } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { userReportees } from './leads.model';

const filterCreditLeads = async ({
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
  const response = await prisma.leads.findMany({
    take: limit,
    skip: offset,
    where: {
      client_id: clientId,
      approval: {
        status: leadsFilter,
      },
      created_at: {
        gte: startDate,
        lte: endDate,
      },
      status: leadsFilter as lead_status,
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
        {
          approval: {
            loan_no: {
              contains: searchparam,
              mode: 'insensitive',
            },
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
          loan_no: true,
        },
      },
    },
  });

  return response;
};

//count of leads
const getFilterCreditLeadsCount = async ({
  leadsFilter,
  userId,
  searchparam,
  filterBy,
  startDate,
  endDate,
  clientId,
}: {
  leadsFilter: approval_status;
  userId: string;
  searchparam: string;
  filterBy: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.leads.count({
    where: {
      client_id: clientId,
      user_id: userId,
      approval: {
        status: leadsFilter,
      },
      created_at: {
        gte: startDate,
        lte: endDate,
      },
      status: leadsFilter as lead_status,
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
        {
          approval: {
            loan_no: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
      ],
    },
  });

  return response;
};

//*return all leads of user for particular credit manager

const filterCreditLeadsCreditManager = async ({
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
  leadsFilter: approval_status;
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
      client_id: clientId,
      approval: {
        status: leadsFilter,
      },
      created_at: {
        gte: startDate,
        lte: endDate,
      },
      status: leadsFilter as lead_status,
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
        {
          approval: {
            loan_no: {
              contains: searchparam,
              mode: 'insensitive',
            },
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
          loan_no: true,
        },
      },
    },
  });

  return response;
};

//returns count of leads for credit manager
const filterCreditLeadsCountCreditManager = async ({
  leadsFilter,
  reporteeUserIds,
  searchparam,
  filterBy,
  startDate,
  endDate,
  userId,
  clientId,
}: {
  leadsFilter: approval_status;
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
      approval: {
        status: leadsFilter,
      },
      created_at: {
        gte: startDate,
        lte: endDate,
      },
      status: leadsFilter as lead_status,
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
        {
          approval: {
            loan_no: {
              contains: searchparam,
              mode: 'insensitive',
            },
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
  });
  return response;
};

export const leadsCreditModel = {
  filterCreditLeads,
  getFilterCreditLeadsCount,
  filterCreditLeadsCreditManager,
  filterCreditLeadsCountCreditManager,
};
