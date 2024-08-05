import { loan_status, loan_type, userreportees } from '@prisma/client';
import { prisma } from '../../prisma-client';

//get all disbursals
const getDisbursalsForDownload = async ({
  searchparam,
  startDate,
  endDate,
  clientId,
}: {
  searchparam?: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.loan.findMany({
    where: {
      client_id: clientId,
      status: 'Disbursed',
      disbursal_date: {
        gte: startDate,
        lte: endDate,
      },
      OR: [
        {
          loan_no: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
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
      ],
    },
    orderBy: {
      disbursal_date: 'desc',
    },
  });
  return response;
};

//get all disbursals
const getDisbursalsByUserIdForDownload = async ({
  userId,
  searchparam,
  startDate,
  endDate,
  clientId,
}: {
  userId: string;
  searchparam?: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.loan.findMany({
    where: {
      client_id: clientId,
      status: 'Disbursed',
      disbursed_by: userId,
      disbursal_date: {
        gte: startDate,
        lte: endDate,
      },
      OR: [
        {
          loan_no: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
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
      ],
    },
    orderBy: {
      updated_at: 'desc',
    },
  });
  return response;
};

//get collections report
const getCollectionsForDownload = async ({
  searchparam,
  startDate,
  endDate,
  clientId,
}: {
  searchparam?: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.collection.findMany({
    where: {
      client_id: clientId,
      collected_date: {
        gte: startDate,
        lte: endDate,
      },
      OR: [
        {
          loan_no: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          leads: {
            customers: {
              name: {
                contains: searchparam,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          leads: {
            customers: {
              email: {
                contains: searchparam,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          leads: {
            customers: {
              mobile: {
                contains: searchparam,
              },
            },
          },
        },
        {
          reference_no: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
      ],
    },
    orderBy: {
      collected_date: 'desc',
    },
  });
  return response;
};

const getCollectionsByUserIdForDownload = async ({
  userId,
  searchparam,
  startDate,
  endDate,
  userReportee,
  clientId,
}: {
  userId: string;
  searchparam?: string;
  startDate?: Date;
  endDate?: Date;
  userReportee?: userreportees[];
  clientId: string;
}) => {
  const response = await prisma.collection.findMany({
    where: {
      client_id: clientId,
      OR: [
        {
          collected_by: userId,
        },
        {
          collected_by: {
            in: userReportee?.map(user => user.user_reportee_id),
          },
        },
      ],
      AND: {
        leads: {
          approval: {
            repay_date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        collected_date: {
          gte: startDate,
          lte: endDate,
        },
        OR: [
          {
            loan_no: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
          {
            leads: {
              customers: {
                name: {
                  contains: searchparam,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            leads: {
              customers: {
                email: {
                  contains: searchparam,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            leads: {
              customers: {
                mobile: {
                  contains: searchparam,
                },
              },
            },
          },
          {
            reference_no: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        ],
      },
    },
    orderBy: {
      collected_date: 'desc',
    },
  });
  return response;
};

const getAllDisbursedLoanForDownload = async ({
  searchparam,
  startDate,
  endDate,
  clientId,
}: {
  searchparam?: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.loan.findMany({
    where: {
      client_id: clientId,
      disbursal_date: {
        gte: startDate,
        lte: endDate,
      },
      status: loan_status.Disbursed,
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
            email: {
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
      ],
    },
    orderBy: {
      disbursal_date: 'desc',
    },
  });

  return response;
};

//get all pending loans
const getAllLoanPendingForDownload = async ({
  searchparam,
  loanFilter,
  filterBy,
  startDate,
  endDate,
  clientId,
  assigneeId,
}: {
  searchparam?: string;
  loanFilter?: loan_type;
  filterBy?: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
  assigneeId?: string;
}) => {
  const response = await prisma.loan.findMany({
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

export const reportsDownloadModel = {
  getDisbursalsForDownload,
  getDisbursalsByUserIdForDownload,
  getCollectionsForDownload,
  getCollectionsByUserIdForDownload,
  getAllDisbursedLoanForDownload,
  getAllLoanPendingForDownload,
};
