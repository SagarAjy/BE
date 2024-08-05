import { lead_status, loan_status, userreportees } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { userReportees } from '../leads/leads.model';

const getAllLoanCollectedApprovedByUserId = async ({
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
  const response = await prisma.loan.findMany({
    where: {
      client_id: clientId,
      status: lead_status.Disbursed,
      leads: {
        approval: {
          repay_date: {
            gte: startDate,
            lte: endDate,
          },
          credited_by: userId,
        },
      },
    },
    orderBy: {
      leads: {
        approval: {
          repay_date: 'desc',
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

const getAllLoanCollectedByUserId = async ({
  userId,
  startDate,
  endDate,
  userReportees,
  clientId,
}: {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  userReportees: userreportees[];
  clientId: string;
}) => {
  const response = await prisma.loan.findMany({
    where: {
      client_id: clientId,
      status: lead_status.Disbursed,
      leads: {
        approval: {
          repay_date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      OR: [
        {
          leads: {
            collection_user_id: userId,
          },
        },
        {
          leads: {
            collection_user_id: {
              in: userReportees.map(user => user.user_reportee_id),
            },
          },
        },
      ],
    },
    orderBy: {
      leads: {
        approval: {
          repay_date: 'desc',
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

//get all collections
const getCollectionsReport = async ({
  limit,
  offset,
  userId,
  searchparam,
  startDate,
  endDate,
  userReportees,
  clientId,
}: {
  limit?: number;
  offset?: number;
  userId: string;
  searchparam?: string;
  startDate?: Date;
  endDate?: Date;
  userReportees?: userreportees[];
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
        {
          leads: {
            customers: {
              employer: {
                some: {
                  employer_name: {
                    contains: searchparam,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
        },
      ],
      AND: {
        OR: [
          {
            leads: {
              collection_user_id: {
                in: userReportees?.map(reportee => reportee.user_reportee_id),
              },
            },
          },
          {
            leads: {
              collection_user_id: userId,
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

//get collections data count
const getCollectionsReportCount = async ({
  userId,
  searchparam,
  startDate,
  endDate,
  userReportees,
  clientId,
}: {
  userId: string;
  searchparam?: string;
  startDate?: Date;
  endDate?: Date;
  userReportees?: userreportees[];
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
        {
          leads: {
            customers: {
              employer: {
                some: {
                  employer_name: {
                    contains: searchparam,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
        },
      ],
      AND: {
        OR: [
          {
            leads: {
              collection_user_id: {
                in: userReportees?.map(reportee => reportee.user_reportee_id),
              },
            },
          },
          {
            leads: {
              collection_user_id: userId,
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

//get collection data for credit manager and loan officers
const getCollectionsByApprovedBy = async ({
  startDate,
  endDate,
  userId,
  clientId,
}: {
  startDate?: Date;
  endDate?: Date;
  userId: string;
  clientId: string;
}) => {
  const response = await prisma.collection.findMany({
    where: {
      client_id: clientId,
      collected_date: {
        gte: startDate,
        lte: endDate,
      },
      leads: {
        approval: {
          credited_by: userId,
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

//get collection adata for telecallers
const getCollectionsByCollectionUserId = async ({
  reportees,
  startDate,
  endDate,
  clientId,
}: {
  reportees: userReportees[];
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
      leads: {
        collection_user_id: {
          in: reportees.map(reportee => reportee.user_reportee_id),
        },
      },
    },
  });
  return response;
};

// get count of collections by collection manager reportees
const getLeadByCollectionUserIdCount = async ({
  userId,
  reporteeUserIds,
  status,
  startDate,
  endDate,
  clientId,
}: {
  userId: string;
  reporteeUserIds: userReportees[];
  status: lead_status;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.leads.count({
    where: {
      client_id: clientId,
      status,
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

const getDisbursedLoansByUserId = async ({
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
  const response = await prisma.loan.findMany({
    where: {
      client_id: clientId,
      disbursed_by: userId,
      status: loan_status.Disbursed,
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
            },
          },
        },
      },
    },
  });

  return response;
};

const getLoanCountByRepayDate = async ({
  reportees,
  startDate,
  endDate,
  clientId,
}: {
  reportees: userReportees[];
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.leads.count({
    where: {
      client_id: clientId,
      collection_user_id: {
        in: reportees.map(reportee => reportee.user_reportee_id),
      },
      approval: {
        repay_date: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
  });
  return response;
};

const getLoanByRepayDateAndReportees = async ({
  reportees,
  startDate,
  endDate,
  clientId,
}: {
  reportees: userReportees[];
  startDate: Date;
  endDate: Date;
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
        collection_user_id: {
          in: reportees.map(reportee => reportee.user_reportee_id),
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

const getCollectionByDate = async ({
  reportees,
  startDate,
  endDate,
  clientId,
}: {
  reportees: userReportees[];
  startDate: Date;
  endDate: Date;
  clientId: string;
}) => {
  const response = await prisma.collection.findMany({
    where: {
      collected_date: {
        gte: startDate,
        lte: endDate,
      },
      client_id: clientId,
      OR: [
        {
          leads: {
            collection_user_id: {
              in: reportees.map(reportee => reportee.user_reportee_id),
            },
          },
        },
      ],
    },
  });
  return response;
};

const getCollectionByReportee = async ({
  userId,
  userReportees,
  startDate,
  endDate,
  clientId,
}: {
  userId: string;
  userReportees?: userReportees[];
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
      OR: [
        {
          leads: {
            collection_user_id: userId,
          },
        },
        {
          leads: {
            collection_user_id: {
              in: userReportees?.map(reportee => reportee.user_reportee_id),
            },
          },
        },
      ],
    },
  });
  return response;
};

const getClosedLoanCollectionByUser = async ({
  userId,
  startDate,
  endDate,
  clientId,
}: {
  userId: string;
  startDate: Date;
  endDate: Date;
  clientId: string;
}) => {
  const response = await prisma.collection.findMany({
    where: {
      leads: {
        approval: {
          repay_date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      client_id: clientId,
      OR: [
        {
          leads: {
            status: lead_status.Closed,
          },
        },
        {
          leads: {
            status: lead_status.Part_Payment,
          },
        },
        {
          leads: {
            status: lead_status.Settlement,
          },
        },
      ],
    },
  });

  return response;
};

export const reportsModel = {
  getAllLoanCollectedApprovedByUserId,
  getAllLoanCollectedByUserId,
  getCollectionsReport,
  getCollectionsReportCount,
  getCollectionsByApprovedBy,
  getCollectionsByCollectionUserId,
  getLeadByCollectionUserIdCount,
  getDisbursedLoansByUserId,
  getLoanCountByRepayDate,
  getLoanByRepayDateAndReportees,
  getCollectionByDate,
  getCollectionByReportee,
  getClosedLoanCollectionByUser,
};
