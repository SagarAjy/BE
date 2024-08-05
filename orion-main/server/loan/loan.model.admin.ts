import { loan_status, loan_type } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { userReportees } from '../leads/leads.model';

//get all loan with status bank_update
const getAllBankUpdateLoans = async ({
  limit,
  offset,
  filterBy,
  searchparam,
  clientId,
}: {
  limit: number;
  offset: number;
  filterBy: string;
  searchparam?: string;
  clientId: string;
}) => {
  const response = await prisma.loan.findMany({
    take: limit,
    skip: offset,
    where: {
      client_id: clientId,
      status: 'Bank_Update',
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
          bank: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          bank_branch: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          bank_ifsc: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          account_no: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
      ],
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return response;
};

const getAllBankUpdateLoansCount = async ({
  filterBy,
  searchparam,
  clientId,
}: {
  filterBy: string;
  searchparam?: string;
  clientId: string;
}) => {
  const response = await prisma.loan.count({
    where: {
      status: 'Bank_Update',
      client_id: clientId,
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
          bank: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          bank_branch: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          bank_ifsc: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          account_no: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
      ],
    },
  });

  return response;
};

//get all pending loans
const getAllLoanPending = async ({
  limit,
  offset,
  searchparam,
  loanFilter,
  filterBy,
  startDate,
  endDate,
  clientId,
  assigneeId,
}: {
  limit?: number;
  offset?: number;
  searchparam?: string;
  loanFilter?: loan_type;
  filterBy?: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
  assigneeId?: string;
}) => {
  const response = await prisma.loan.findMany({
    take: limit,
    skip: offset,
    where: {
      client_id: clientId,
      status: 'Disbursed',
      loan_type: loanFilter,
      leads: {
        approval: {
          repay_date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      disbursed_by: assigneeId,
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
            email: {
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
          loan_no: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          leads: {
            approval: {
              branch: {
                contains: searchparam,
                mode: 'insensitive',
              },
            },
          },
        },
      ],
      AND: {
        OR: [
          {
            leads: {
              status: 'Disbursed',
            },
          },
          {
            leads: {
              status: 'Part_Payment',
            },
          },
        ],
      },
    },
    orderBy: {
      leads: {
        approval: {
          repay_date: 'desc',
        },
      },
    },
  });

  return response;
};

//get all pending loans
const getAllLoanPendingForReminderEmail = async ({
  clientId,
}: {
  clientId: string;
}) => {
  const response = await prisma.loan.findMany({
    where: {
      client_id: clientId,
      status: 'Disbursed',
      loan_type: 'payday',
    },
  });

  return response;
};

const getAllLoanPendingCount = async ({
  loanFilter,
  filterBy,
  searchparam,
  startDate,
  endDate,
  clientId,
  assigneeId,
}: {
  loanFilter?: loan_type;
  filterBy?: string;
  searchparam?: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
  assigneeId?: string;
}) => {
  const response = await prisma.loan.count({
    where: {
      client_id: clientId,
      loan_type: loanFilter,
      status: 'Disbursed',
      leads: {
        approval: {
          repay_date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      disbursed_by: assigneeId,
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
            email: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            mobile: {
              contains: searchparam,
            },
          },
        },
        {
          loan_no: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
      ],
      AND: {
        OR: [
          {
            leads: {
              status: 'Disbursed',
            },
          },
          {
            leads: {
              status: 'Part_Payment',
            },
          },
        ],
      },
    },
  });

  return response;
};

export const loanAdminModel = {
  getAllBankUpdateLoans,
  getAllBankUpdateLoansCount,
  getAllLoanPending,
  getAllLoanPendingCount,
  getAllLoanPendingForReminderEmail,
};
