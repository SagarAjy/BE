import { approval_status, lead_status } from '@prisma/client';
import { prisma } from '../../prisma-client';

//get all leads for admin
const getAllCreditLeadsAdmin = async ({
  limit,
  offset,
  approvalFilter,
  searchparam,
  filterBy,
  startDate,
  endDate,
  clientId,
}: {
  limit?: number;
  offset?: number;
  approvalFilter?: approval_status;
  searchparam?: string;
  filterBy?: string;
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
        status: approvalFilter,
      },
      created_at: {
        gte: startDate,
        lte: endDate,
      },
      status: approvalFilter as lead_status,
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
          created_at: true,
          loan_no: true,
        },
      },
    },
  });

  return response;
};

const getAllCreditLeadsAdminCount = async ({
  approvalFilter,
  filterBy,
  searchparam,
  startDate,
  endDate,
  clientId,
}: {
  approvalFilter: approval_status;
  filterBy: string;
  searchparam: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.leads.count({
    where: {
      client_id: clientId,
      approval: {
        status: approvalFilter,
      },
      created_at: {
        gte: startDate,
        lte: endDate,
      },
      status: approvalFilter as lead_status,
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

export const leadsCreditModelAdmin = {
  getAllCreditLeadsAdmin,
  getAllCreditLeadsAdminCount,
};
