import { lead_status } from '@prisma/client';
import { prisma } from '../../prisma-client';

//get all leads for admin
const getAllLeadsAdmin = async ({
  limit,
  offset,
  leadsFilter,
  searchparam,
  filterBy,
  startDate,
  endDate,
  assigneeId,
  clientId,
}: {
  limit?: number;
  offset?: number;
  leadsFilter?: lead_status;
  searchparam?: string;
  filterBy?: string;
  startDate?: Date;
  endDate?: Date;
  assigneeId?: string | null;
  clientId: string;
}) => {
  const response = await prisma.leads.findMany({
    take: limit,
    skip: offset,
    where: {
      status: leadsFilter,
      client_id: clientId,
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

//get count of all leads
const getAllLeadsAdminCount = async ({
  leadsFilter,
  filterBy,
  searchparam,
  startDate,
  endDate,
  assigneeId,
  clientId,
}: {
  leadsFilter: lead_status;
  filterBy: string;
  searchparam: string;
  startDate?: Date;
  endDate?: Date;
  assigneeId?: string | null;
  clientId: string;
}) => {
  const response = await prisma.leads.count({
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

const leadAssignedCount = async ({
  startDate,
  endDate,
  clientId,
}: {
  startDate: Date;
  endDate: Date;
  clientId: string;
}) => {
  const response = await prisma.$queryRaw`
  SELECT COUNT(*) FROM leads
  WHERE created_at <> updated_at 
  AND client_id=${clientId}::UUID
  AND created_at >= ${startDate}
  AND created_at <= ${endDate}
`;
  return response;
};

const getAllLeadsCountDateWise = async ({
  startDate,
  endDate,
  clientId,
}: {
  startDate: Date;
  endDate: Date;
  clientId: string;
}) => {
  const response = await prisma.leads.count({
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

export const adminModel = {
  getAllLeadsAdmin,
  getAllLeadsAdminCount,
  getAllLeadsCountDateWise,
  leadAssignedCount,
};
