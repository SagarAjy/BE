import {
  Prisma,
  approval_status,
  lead_status,
  loan_status,
  loan_type,
  userreportees,
} from '@prisma/client';
import { prisma } from '../../prisma-client';
import { userReportees } from '../leads/leads.model';
import { disbursalModel } from '../disbursal/disbursal.model';
import { callHistoryModel } from '../call-history/call-history.model';
import { userModel } from '../user/user.model';

const getLoanByLeadId = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const response = await prisma.loan.findFirst({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
  });
  return response;
};

//get all loans with status bank update
const getAllBankUpdateLoans = async ({
  limit,
  offset,
  reporteeUserIds,
  filterBy,
  searchparam,
  userId,
  clientId,
}: {
  limit: number;
  offset: number;
  reporteeUserIds: userReportees[];
  filterBy: string;
  searchparam: string;
  userId: string;
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
          disbursed_by: userId,
        },
        {
          disbursed_by: {
            in: reporteeUserIds.map(reportee => reportee.user_reportee_id),
          },
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
    },
    orderBy: {
      updated_at: 'desc',
    },
  });

  return response;
};

const getAllBankUpdateLoansCount = async ({
  reporteeUserIds,
  filterBy,
  searchparam,
  userId,
  clientId,
}: {
  reporteeUserIds: userReportees[];
  filterBy: string;
  searchparam: string;
  userId: string;
  clientId: string;
}) => {
  const response = await prisma.loan.count({
    where: {
      client_id: clientId,
      status: 'Bank_Update',
      OR: [
        {
          disbursed_by: userId,
        },
        {
          disbursed_by: {
            in: reporteeUserIds.map(reportee => reportee.user_reportee_id),
          },
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
    },
  });

  return response;
};

//reminder mail

//get all pending loan
const getAllLoanPendingReminderMail = async ({
  reporteeUserIds,
  userId,
  clientId,
}: {
  reporteeUserIds: userReportees[];
  userId: string;
  clientId: string;
}) => {
  const response = await prisma.loan.findMany({
    where: {
      status: 'Disbursed',
      loan_type: 'payday',
      client_id: clientId,
    },
  });

  return response;
};

//get all pending loan
const getAllLoanPending = async ({
  limit,
  offset,
  loanFilter,
  reporteeUserIds,
  teleCallers,
  filterBy,
  searchparam,
  userId,
  startDate,
  endDate,
  clientId,
  assigneeId,
}: {
  limit?: number;
  offset?: number;
  loanFilter?: loan_type;
  reporteeUserIds?: userReportees[];
  teleCallers?: Prisma.PromiseReturnType<typeof userModel.getUsersByRole>;
  filterBy?: string;
  searchparam?: string;
  userId: string;
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
      status: loan_status.Disbursed,
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
            disbursed_by: userId,
          },
          {
            disbursed_by: {
              in: reporteeUserIds?.map(reportee => reportee.user_reportee_id),
            },
          },
          {
            leads: {
              collection_user_id: userId,
            },
          },
          {
            leads: {
              collection_user_id: {
                in: reporteeUserIds?.map(reportee => reportee.user_reportee_id),
              },
            },
          },
          {
            leads: {
              collection_user_id: {
                in: teleCallers?.map(teleCaller => teleCaller.user_id) || [],
              },
            },
          },
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

const getAllLoanPendingCount = async ({
  loanFilter,
  reporteeUserIds,
  teleCallers,
  filterBy,
  searchparam,
  userId,
  startDate,
  endDate,
  clientId,
  assigneeId,
}: {
  loanFilter?: loan_type;
  reporteeUserIds?: userReportees[];
  teleCallers?: Prisma.PromiseReturnType<typeof userModel.getUsersByRole>;
  filterBy?: string;
  searchparam?: string;
  userId: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
  assigneeId?: string;
}) => {
  const response = await prisma.loan.count({
    where: {
      client_id: clientId,
      status: loan_status.Disbursed,
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
            disbursed_by: userId,
          },
          {
            disbursed_by: {
              in: reporteeUserIds?.map(reportee => reportee.user_reportee_id),
            },
          },
          {
            leads: {
              collection_user_id: userId,
            },
          },
          {
            leads: {
              collection_user_id: {
                in: reporteeUserIds?.map(reportee => reportee.user_reportee_id),
              },
            },
          },
          {
            leads: {
              collection_user_id: {
                in: teleCallers?.map(teleCaller => teleCaller.user_id) || [],
              },
            },
          },
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

const getAllCollectionExecutiveLoanPending = async ({
  limit,
  offset,
  searchparam,
  loanFilter,
  filterBy,
  startDate,
  endDate,
  clientId,
  assigneeId,
  userId,
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
  userId: string;
}) => {
  const response = await prisma.loan.findMany({
    take: limit,
    skip: offset,
    where: {
      client_id: clientId,
      status: loan_status.Disbursed,
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
        leads: {
          collection_user_id: userId,
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
  });

  return response;
};

const getAllCollectionExecutiveLoanPendingCount = async ({
  loanFilter,
  filterBy,
  searchparam,
  startDate,
  endDate,
  clientId,
  assigneeId,
  userId,
}: {
  loanFilter?: loan_type;
  filterBy?: string;
  searchparam?: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
  assigneeId?: string;
  userId: string;
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
        leads: {
          collection_user_id: userId,
        },
      },
    },
  });

  return response;
};

//get all loans for a customer
const getAllLoansByCustomerId = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const response = await prisma.loan.findMany({
    where: {
      customer_id: customerId,
      client_id: clientId,
    },
    orderBy: {
      updated_at: 'desc',
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

const getLoan = async ({
  loanId,
  clientId,
}: {
  loanId: string;
  clientId: string;
}) => {
  const response = await prisma.loan.findFirst({
    where: {
      loan_id: loanId,
      client_id: clientId,
    },
  });
  return response;
};

const deleteBankUpdate = async ({
  leadId,
  loanId,
  customerId,
  userId,
  clientId,
}: {
  leadId: string;
  loanId: string;
  customerId: string;
  userId: string;
  clientId: string;
}) => {
  await callHistoryModel.createCallHistory({
    customer_id: customerId,
    leadId,
    called_by: userId,
    call_type: 'Deleting from bank-update',
    status: lead_status.Approved,
    remark: 'Deleting from bank-update and changing status to approved',
    clientId: clientId,
  });
  await disbursalModel.deleteDisbursal({ loanId, leadId, clientId });
};

const getDisbursedLoans = async ({
  disbursalDate,
}: {
  disbursalDate: string;
}) => {
  const response = await prisma.loan.findMany({
    where: {
      disbursal_date: disbursalDate,
    },
    select: {
      customer_id: true,
    },
  });
  return response;
};

const getAllLoanByCredited = async ({
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
  const response = await prisma.loan.findMany({
    where: {
      client_id: clientId,
      NOT: [
        {
          status: 'Bank_Update',
        },
      ],
      leads: {
        approval: {
          status: approval_status.Approved,
        },
      },
      disbursal_date: {
        gte: startDate,
        lte: endDate,
      },
      disbursed_by: userId,
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

const updateLoanWaiverAmount = async ({
  loanNo,
  waiverAmount,
  waiverAmountType,
  clientId,
}: {
  loanNo: string;
  waiverAmount: number;
  waiverAmountType: string;
  clientId: string;
}) => {
  const response = await prisma.loan.update({
    where: {
      client_id: clientId,
      loan_no: loanNo,
    },
    data: {
      waiver_request_type: waiverAmountType,
      waiver_request_amount: waiverAmount,
    },
  });

  return response;
};

const getDisbursedLoansCountByCustomerId = async ({
  currentLoanId,
  customerId,
  startDate,
  endDate,
  clientId,
}: {
  currentLoanId: string;
  customerId: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.loan.count({
    where: {
      client_id: clientId,
      customer_id: customerId,
      status: loan_status.Disbursed,
      disbursal_date: {
        gte: startDate,
        lte: endDate,
      },
      NOT: [
        {
          loan_id: currentLoanId,
        },
      ],
    },
  });

  return response;
};

const getAllDisbursedLoan = async ({
  searchparam,
  limit,
  offset,
  startDate,
  endDate,
  clientId,
}: {
  searchparam?: string;
  limit: number;
  offset: number;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.loan.findMany({
    take: limit,
    skip: offset,
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

const getAllDisbursedLoanCount = async ({
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
  const response = await prisma.loan.count({
    where: {
      client_id: clientId,
      disbursal_date: {
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
  });

  return response;
};

export const loanModel = {
  getLoanByLeadId,
  getAllBankUpdateLoans,
  getAllBankUpdateLoansCount,
  getAllLoanPending,
  getAllLoanPendingCount,
  getAllCollectionExecutiveLoanPending,
  getAllCollectionExecutiveLoanPendingCount,
  getAllLoansByCustomerId,
  getLoan,
  deleteBankUpdate,
  getDisbursedLoans,
  getAllLoanByCredited,
  updateLoanWaiverAmount,
  getAllLoanPendingReminderMail,
  getDisbursedLoansCountByCustomerId,
  getAllDisbursedLoan,
  getAllDisbursedLoanCount,
};
