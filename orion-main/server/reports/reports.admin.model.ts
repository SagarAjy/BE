import { loan_status, approval_status } from '@prisma/client';
import { prisma } from '../../prisma-client';

// get all loans disbursed in the timespan
const getAllLoan = async ({
  startDate,
  endDate,
  clientId,
}: {
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.loan.findMany({
    where: {
      client_id: clientId,
      status: loan_status.Disbursed,
      leads: {
        approval: {
          status: approval_status.Approved,
        },
      },
      disbursal_date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      leads: {
        select: {
          approval: {
            select: {
              loan_amt_approved: true,
              roi: true,
              tenure: true,
              repay_date: true,
            },
          },
        },
      },
    },
  });
  return response;
};

//get all collections in the timespan
const getCollections = async ({
  startDate,
  endDate,
  clientId,
}: {
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
    },
    orderBy: {
      collected_date: 'desc',
    },
  });
  return response;
};

const getCollectionsForRepay = async ({
  startDate,
  endDate,
  clientId,
}: {
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.collection.findMany({
    where: {
      client_id: clientId,
      leads: {
        approval: {
          repay_date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
    orderBy: {
      collected_date: 'desc',
    },
  });
  return response;
};

//get all collections for loan in the timespan
const getCollectionsForLoans = async ({
  startDate,
  endDate,
  clientId,
}: {
  startDate: Date;
  endDate: Date;
  clientId: string;
}) => {
  const response = await prisma.collection.findMany({
    where: {
      client_id: clientId,
      leads: {
        approval: {
          repay_date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
    select: {
      collected_amount: true,
      leads: {
        select: {
          lead_id: true,
          status: true,
        },
      },
    },
  });
  return response;
};

// get all loans with repay date in the timespan
const getAllRepayLoan = async ({
  startDate,
  endDate,
  clientId,
}: {
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.loan.findMany({
    where: {
      client_id: clientId,
      status: loan_status.Disbursed,
      leads: {
        approval: {
          repay_date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
    include: {
      leads: {
        select: {
          approval: {
            select: {
              loan_amt_approved: true,
              roi: true,
              tenure: true,
              repay_date: true,
            },
          },
        },
      },
    },
  });
  return response;
};

const getAllRepayLoanCount = ({
  startDate,
  endDate,
  clientId,
}: {
  startDate: Date;
  endDate: Date;
  clientId: string;
}) => {
  const response = prisma.loan.count({
    where: {
      client_id: clientId,
      status: loan_status.Disbursed,
      leads: {
        approval: {
          repay_date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
  });
  return response;
};

//get disbursal report
const getDisbursalsReport = async ({
  limit,
  offset,
  userId,
  searchparam,
  startDate,
  endDate,
  clientId,
}: {
  limit?: number;
  offset?: number;
  userId?: string;
  searchparam?: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.loan.findMany({
    take: limit,
    skip: offset,
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
        {
          leads: {
            loan: {
              some: {
                disbursal_reference_no: {
                  contains: searchparam,
                  mode: 'insensitive',
                },
              },
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

const getDisbursalsReportCount = async ({
  userId,
  searchparam,
  startDate,
  endDate,
  clientId,
}: {
  userId?: string;
  searchparam?: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.loan.count({
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
        {
          leads: {
            loan: {
              some: {
                disbursal_reference_no: {
                  contains: searchparam,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
      ],
    },
  });
  return response;
};

//get collections report
const getCollectionsReport = async ({
  limit,
  offset,
  searchparam,
  startDate,
  endDate,
  clientId,
}: {
  limit?: number;
  offset?: number;
  searchparam?: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.collection.findMany({
    take: limit,
    skip: offset,
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

//get collection count by date
const getCollectionsReportCount = async ({
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
  const response = await prisma.collection.count({
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
  });
  return response;
};

export const reportsModelAdmin = {
  getAllLoan,
  getCollections,
  getCollectionsForRepay,
  getCollectionsForLoans,
  getAllRepayLoan,
  getAllRepayLoanCount,
  getDisbursalsReport,
  getDisbursalsReportCount,
  getCollectionsReport,
  getCollectionsReportCount,
};
