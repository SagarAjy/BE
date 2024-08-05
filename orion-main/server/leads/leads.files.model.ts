import { lead_status } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { userReportees } from './leads.model';

const filterDownloadLeads = async ({
  leadsFilter,
  userId,
  searchparam,
  startDate,
  endDate,
  clientId,
}: {
  leadsFilter: lead_status;
  userId: string;
  searchparam: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.leads.findMany({
    where: {
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

const filterDownloadLeadsCreditManager = async ({
  leadsFilter,
  reporteeUserIds,
  searchparam,
  startDate,
  endDate,
  clientId,
}: {
  leadsFilter: lead_status;
  reporteeUserIds: userReportees[];
  searchparam: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.leads.findMany({
    where: {
      client_id: clientId,
      status: leadsFilter,
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
      user_id: {
        in: reporteeUserIds.map(reportee => reportee.user_reportee_id),
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

const getDownloadAllLeadsAdmin = async ({
  leadsFilter,
  searchparam,
  startDate,
  endDate,
  assigneeId,
  clientId,
}: {
  leadsFilter?: lead_status;
  searchparam?: string;
  startDate?: Date;
  endDate?: Date;
  assigneeId?: string | null;
  clientId: string;
}) => {
  const response = await prisma.leads.findMany({
    where: {
      client_id: clientId,
      status: leadsFilter,
      user_id: assigneeId,
      created_at: {
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
        },
      },
    },
  });

  return response;
};

export const leadsFileModel = {
  getDownloadAllLeadsAdmin,
  filterDownloadLeadsCreditManager,
  filterDownloadLeads,
};
