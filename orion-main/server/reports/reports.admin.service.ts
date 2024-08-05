import {
  eachDayOfInterval,
  endOfDay,
  format,
  lastDayOfMonth,
  lastDayOfYear,
  startOfDay,
  startOfMonth,
  startOfYear,
} from 'date-fns';
import { adminModel } from '../leads/leads.model.admin';
import { userAdminModel } from '../user/user.admin.model';
import { approvalModel } from '../approval/approval.model';
import { sanctionTargetModel } from '../sanction-target/sanction-target.model';
import { reportsModel } from './reports.model';
import { loanModel } from '../loan/loan.model';
import { Prisma, roles } from '@prisma/client';
import { userReporteeModel } from '../user-reportee/user-reportee.model';
import { leadsModel } from '../leads/leads.model';
import { processInBatch } from '../../utils';
import { reportsModelAdmin } from './reports.admin.model';

//performance history monthly
const performanceHistoryMonthly = async ({
  year,
  clientId,
}: {
  year: number;
  clientId: string;
}) => {
  var month: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const response = month.map(async (month: number) => {
    const firstDateOfMonth = startOfMonth(new Date(year, month - 1, 1));
    const lastDateOfMonth = lastDayOfMonth(new Date(firstDateOfMonth));

    //get total disbursals
    const getLoanCountByMonth = await reportsModelAdmin.getAllLoan({
      startDate: firstDateOfMonth,
      endDate: lastDateOfMonth,
      clientId,
    });
    const totalDisbursalMonth = getLoanCountByMonth.reduce(
      (accumulator, loan) => {
        return accumulator + (loan.leads.approval?.loan_amt_approved || 0);
      },
      0,
    );

    //get total collections
    const getCollectionCountByMonth = await reportsModelAdmin.getCollections({
      startDate: firstDateOfMonth,
      endDate: lastDateOfMonth,
      clientId,
    });

    const totalCollectionMonth = getCollectionCountByMonth.reduce(
      (accumulator, collection) => {
        return accumulator + collection.collected_amount;
      },
      0,
    );

    //get total leads
    const getTotalLeadsCount = await adminModel.getAllLeadsCountDateWise({
      startDate: firstDateOfMonth,
      endDate: lastDateOfMonth,
      clientId,
    });

    return {
      date: `${format(firstDateOfMonth, 'MMM')}`,
      ['Disbursals']: Math.round(totalDisbursalMonth * 100) / 100,
      ['Collections']: Math.round(totalCollectionMonth * 100) / 100,
      ['Leads']: getTotalLeadsCount,
    };
  });
  return Promise.all(response);
};

//performance history daily
const performanceHistoryDaily = async ({
  year,
  month,
  clientId,
}: {
  year: number;
  month: number;
  clientId: string;
}) => {
  const firstDateOfMonth = startOfMonth(new Date(year, month - 1, 1));
  const lastDateOfMonth = lastDayOfMonth(new Date(firstDateOfMonth));

  //get all the days of a month array
  const allDaysOfMonth = eachDayOfInterval({
    start: firstDateOfMonth,
    end: lastDateOfMonth,
  });

  const response = allDaysOfMonth.map(async date => {
    //get all disbursals date wise
    const getLoanByDay = await reportsModelAdmin.getAllLoan({
      startDate: startOfDay(date),
      endDate: endOfDay(date),
      clientId,
    });

    //calculate total disbursal amount
    const totalDisbursalMonth = getLoanByDay.reduce(
      (accumulator, disbursal) => {
        return accumulator + (disbursal.leads.approval?.loan_amt_approved || 0);
      },
      0,
    );

    //get total leads count by date
    const getTotalLeadsCount = await adminModel.getAllLeadsCountDateWise({
      startDate: startOfDay(date),
      endDate: endOfDay(date),
      clientId,
    });

    //get collection count by date
    const getCollectionCountByDay = await reportsModelAdmin.getCollections({
      startDate: startOfDay(date),
      endDate: endOfDay(date),
      clientId,
    });

    //calculate total collection amount
    const totalCollectionMonth = getCollectionCountByDay.reduce(
      (accumulator, collection) => {
        return accumulator + collection.collected_amount;
      },
      0,
    );
    return {
      date: format(date, 'dd-MM-yyyy'),
      ['Disbursals']: Math.round(totalDisbursalMonth * 100) / 100,
      ['Collections']: Math.round(totalCollectionMonth * 100) / 100,
      ['Leads']: getTotalLeadsCount || 0,
    };
  });

  return Promise.all(response);
};

//admin stats cards
const adminStats = async ({
  year,
  month,
  day,
  clientId,
}: {
  year: number;
  month: number;
  day: number;
  clientId: string;
}) => {
  //check if month if 0 or not
  //if zero then the user is asking for full year data month wise
  //if zero then return that particular month data

  let startDate: Date;
  let endDate: Date;
  // For Monthly data
  if (month !== 0) {
    startDate = startOfMonth(new Date(year, month - 1, 1));
    endDate = lastDayOfMonth(new Date(startDate));

    // FOR DAILY DATA
  } else if (day != 0) {
    const today = new Date();
    startDate = startOfDay(today);
    endDate = endOfDay(today);
  } else {
    startDate = startOfYear(new Date(year, 1, 1));
    endDate = lastDayOfYear(new Date(startDate));
  }

  // BATCH PROCESSING UTIL FUNCTIONS START
  const BATCH_SIZE = 1000;

  async function processLoanForDisbursal(
    loan: Prisma.PromiseReturnType<typeof reportsModelAdmin.getAllLoan>[0],
  ) {
    const prevLoan = await loanModel.getDisbursedLoansCountByCustomerId({
      customerId: loan.customer_id,
      clientId: loan.client_id,
      currentLoanId: loan.loan_id,
    });

    return {
      type: prevLoan === 0 ? 'fresh' : 'reloan',
      amount: loan.leads.approval?.loan_amt_approved || 0,
    };
  }

  async function processLeadForType(
    lead: Prisma.PromiseReturnType<typeof leadsModel.getAllLeadsByDate>[0],
  ) {
    const prevLoan = await loanModel.getDisbursedLoansCountByCustomerId({
      customerId: lead.customer_id,
      clientId: lead.client_id,
      currentLoanId: lead.lead_id,
    });

    return prevLoan === 0 ? 'fresh' : 'reloan';
  }

  async function calculateRepaymentForLoan(
    loan: Prisma.PromiseReturnType<typeof reportsModelAdmin.getAllRepayLoan>[0],
  ) {
    const loanApproval = await approvalModel.getApproval({
      leadId: loan.lead_id,
      startDate,
      endDate,
      clientId,
    });
    const interestAmount =
      (loanApproval?.loan_amt_approved || 0) *
      (loanApproval?.tenure || 0) *
      0.01 *
      (loanApproval?.roi || 0);

    return (loanApproval?.loan_amt_approved || 0) + interestAmount;
  }

  // BATCH PROCESSING UTIL FUNCTIONS END

  const allDisbursedLoan = await reportsModelAdmin.getAllLoan({
    startDate,
    endDate,
    clientId,
  });

  //calculate total disbursal
  const totalDisbursalMonth = allDisbursedLoan.reduce(
    (accumulator, disbursal) => {
      return accumulator + (disbursal.leads.approval?.loan_amt_approved || 0);
    },
    0,
  );

  //get all the target for the user
  const sanctionTargets = await sanctionTargetModel.getAllSanctionTarget({
    startDate,
    clientId,
    endDate,
  });

  //calculate total target
  const totalDisbursalTarget = sanctionTargets.reduce((accumulator, target) => {
    return accumulator + target.target;
  }, 0);
  let delta = 0;
  if (totalDisbursalTarget) {
    delta = Math.floor((totalDisbursalMonth / totalDisbursalTarget) * 100);
  }

  // fresh vs reloan disbursal
  const loanDisbursalResults = await processInBatch(
    allDisbursedLoan,
    processLoanForDisbursal,
    BATCH_SIZE,
  );

  const freshLoanDisbursal = loanDisbursalResults
    .filter(r => r.type === 'fresh')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const reloanDisbursal = loanDisbursalResults
    .filter(r => r.type === 'reloan')
    .reduce((acc, curr) => acc + curr.amount, 0);

  //collection for cases to be repaid in this month
  const collectionsInTimeSpan = await reportsModelAdmin.getCollectionsForRepay({
    startDate,
    endDate,
    clientId,
  });

  //calculate total collection
  const totalCollectionMonth = collectionsInTimeSpan.reduce(
    (accumulator, collection) => {
      return accumulator + collection.collected_amount;
    },
    0,
  );

  //find all loans with repay date in the given time span
  const repayLoans = await reportsModelAdmin.getAllRepayLoan({
    startDate,
    endDate,
    clientId,
  });

  // Use batch processing for repayment calculation
  const repayAmounts = await processInBatch(
    repayLoans,
    calculateRepaymentForLoan,
    BATCH_SIZE,
  );

  const totalRepayAmount = repayAmounts.reduce(
    (accumulator, amount) => accumulator + amount,
    0,
  );

  let delta2 = 0;
  if (totalRepayAmount) {
    delta2 = Math.floor((totalCollectionMonth / totalRepayAmount) * 100);
  }

  const totalLeadsCount = await adminModel.getAllLeadsCountDateWise({
    startDate,
    endDate,
    clientId,
  });

  const leadAssignedCount = await adminModel.leadAssignedCount({
    startDate,
    endDate,
    clientId,
  });

  //@ts-ignore
  const totalAssignedLeads = parseInt(leadAssignedCount[0].count, 10);

  let delta3 = 0;
  if (totalAssignedLeads) {
    delta3 = Math.floor((totalAssignedLeads / totalLeadsCount) * 100);
  }

  const allLeads = await leadsModel.getAllLeadsByDate({
    startDate,
    endDate,
    clientId,
  });

  const leadTypes = await processInBatch(
    allLeads,
    processLeadForType,
    BATCH_SIZE,
  );
  const freshLeadsCount = leadTypes.filter(type => type === 'fresh').length;
  const reloanLeadsCount = leadTypes.filter(type => type === 'reloan').length;

  const response = [
    {
      title: 'Total Disbursal',
      metric: totalDisbursalMonth,
      progress: delta,
      target: totalDisbursalTarget,
      deltaType: 'moderateIncrease',
    },
    {
      title: 'Fresh Disbursal',
      metric: freshLoanDisbursal,
      progress: 0,
      target: 0,
      deltaType: 'moderateIncrease',
    },
    {
      title: 'Reloan Disbursal',
      metric: reloanDisbursal,
      progress: 0,
      target: 0,
      deltaType: 'moderateIncrease',
    },
    {
      title: 'Collection',
      metric: totalCollectionMonth,
      progress: delta2,
      target: totalRepayAmount,
      deltaType: 'moderateIncrease',
    },
    {
      title: 'Fresh Leads',
      metric: freshLeadsCount,
      progress: 0,
      target: 0,
      deltaType: 'moderateIncrease',
    },
    {
      title: 'Reloan Leads',
      metric: reloanLeadsCount,
      progress: 0,
      target: 0,
      deltaType: 'moderateIncrease',
    },
    {
      title: 'In Progress Leads',
      metric: totalAssignedLeads,
      progress: delta3,
      target: totalLeadsCount,
      deltaType: 'moderateIncrease',
    },
  ];
  return response;
};

// daily tracker for collections
const collectionDailyTrack = ({
  month,
  year,
  clientId,
}: {
  month: number;
  year: number;
  clientId: string;
}) => {
  // initialize first and last date of month
  const firstDateOfMonth = startOfMonth(new Date(year, month - 1, 1));
  const lastDateOfMonth = lastDayOfMonth(new Date(firstDateOfMonth));

  console.log(firstDateOfMonth, lastDateOfMonth);
  //get all the days of a month array
  const allDaysOfMonth = eachDayOfInterval({
    start: firstDateOfMonth,
    end: lastDateOfMonth,
  });

  const response = allDaysOfMonth.map(async day => {
    // get all loans with repay date on the given date
    const loans = await reportsModelAdmin.getAllRepayLoan({
      startDate: startOfDay(day),
      endDate: endOfDay(day),
      clientId,
    });

    const loanCount = await reportsModelAdmin.getAllRepayLoanCount({
      startDate: startOfDay(day),
      endDate: endOfDay(day),
      clientId,
    });

    // get collections on date
    const collections = await reportsModelAdmin.getCollectionsForLoans({
      startDate: startOfDay(day),
      endDate: endOfDay(day),
      clientId,
    });

    const partPaymentCases = collections.filter(
      collection => collection.leads.status === 'Part_Payment',
    );
    const partPayemntCasesSet = new Set(
      partPaymentCases.map(c => c.leads.lead_id),
    );

    const collectedCasesSet = new Set(collections.map(c => c.leads.lead_id));

    // get total loan amount of the cases to collect on the day
    const totalLoanAmount = loans.reduce((sum, loan) => {
      return sum + (loan.leads?.approval?.loan_amt_approved || 0);
    }, 0);

    // CURRENTLY ON TOTAL AMOUNT
    const totalRepayAmount = loans.reduce((sum, loan) => {
      const interest =
        (loan.leads?.approval?.loan_amt_approved || 0) *
        (loan.leads?.approval?.roi || 0) *
        (loan.leads?.approval?.tenure || 0) *
        0.01;
      return sum + ((loan.leads?.approval?.loan_amt_approved || 0) + interest);
    }, 0);

    const totalCollection = collections.reduce((sum, collection) => {
      return sum + collection.collected_amount;
    }, 0);

    const totalPartPaymentCollection = partPaymentCases.reduce(
      (sum, partPayment) => {
        return sum + partPayment.collected_amount;
      },
      0,
    );

    return {
      date: format(day, 'dd-MM-yyyy'),
      dueCases: loanCount,
      loanAmount: totalLoanAmount,
      repayAmount: totalRepayAmount,
      collected: totalCollection,
      collectedCases: collectedCasesSet.size,
      collectionPending:
        totalRepayAmount - totalCollection < 0
          ? 0
          : totalRepayAmount - totalCollection,
      partPaymentCases: partPayemntCasesSet.size,
      partPayment: totalPartPaymentCollection,
    };
  });
  return Promise.all(response);
};

//get disbursal role wise date wise
const getDisbursalRoleData = async ({
  month,
  year,
  role,
  clientId,
}: {
  month: number;
  year: number;
  role: roles;
  clientId: string;
}) => {
  let startDate: Date;
  let endDate: Date;
  //check if month if 0 or not
  //if zero then the user is asking for full year data month wise
  //if zero then return that particular month data
  if (month != 0) {
    startDate = startOfMonth(new Date(year, month - 1, 1));
    endDate = lastDayOfMonth(new Date(startDate));
  } else {
    startDate = startOfYear(new Date(year, 0, 1));
    endDate = lastDayOfYear(new Date(startDate));
  }

  const allDisbursalRole = await userAdminModel.getUsersByRole({
    userRole: role,
    clientId,
  });

  if (!allDisbursalRole) return null;
  const response = allDisbursalRole.map(async user => {
    let totalDisbursalAmount = 0;
    const disbursals = await reportsModel.getDisbursedLoansByUserId({
      userId: user.user_id,
      endDate,
      startDate,
      clientId,
    });
    const targetMonthAndYear =
      format(startDate, 'MMMM') + ' ' + startDate.getFullYear();
    const disbursalTarget = await sanctionTargetModel.getSanctionTargetByUserId(
      { userId: user.user_id, monthAndYear: targetMonthAndYear, clientId },
    );
    disbursals.map(disbursals => {
      totalDisbursalAmount =
        (disbursals.leads.approval?.loan_amt_approved || 0) +
        totalDisbursalAmount;
    });

    return {
      name: user.name,
      ['Disbursal Amount']: Math.round(totalDisbursalAmount * 100) / 100,
      ['Disbursal Target']: disbursalTarget?.target || 0,
    };
  });

  return Promise.all(response);
};

//get collection data role wise
const getCollectionByRole = async ({
  month,
  year,
  role,
  clientId,
}: {
  month: number;
  year: number;
  role: roles;
  clientId: string;
}) => {
  let startDate: Date;
  let endDate: Date;
  const BATCH_SIZE = 1000;
  //check if month if 0 or not
  //if zero then the user is asking for full year data month wise
  //if zero then return that particular month data
  if (month != 0) {
    startDate = new Date(year, month - 1, 1);
    endDate = lastDayOfMonth(new Date(startDate));
  } else {
    startDate = new Date(year, 0, 1);
    endDate = lastDayOfYear(new Date(startDate));
  }

  const collectionUsers = await userAdminModel.getUsersByRole({
    userRole: role,
    clientId,
  });

  async function calculateRepaymentForLoan(
    loan: Prisma.PromiseReturnType<
      typeof reportsModel.getAllLoanCollectedByUserId
    >[0],
  ) {
    const loanApproval = await approvalModel.getApproval({
      leadId: loan.lead_id,
      startDate,
      endDate,
      clientId,
    });
    const interestAmount =
      (loanApproval?.loan_amt_approved || 0) *
      (loanApproval?.tenure || 0) *
      0.01 *
      (loanApproval?.roi || 0);

    return (loanApproval?.loan_amt_approved || 0) + interestAmount;
  }

  if (!collectionUsers) return null;
  const response = collectionUsers.map(async collectionUser => {
    // find reportees for collection user
    const userReportees = await userReporteeModel.getUserReportees({
      userId: collectionUser.user_id,
      clientId,
    });

    //get all collection date wise for paricular user
    const collections = await reportsModel.getCollectionByReportee({
      userId: collectionUser.user_id,
      startDate,
      endDate,
      userReportees,
      clientId,
    });

    const totalCollectionAmount = collections.reduce((acc, collections) => {
      return acc + collections.collected_amount;
    }, 0);

    //find all loans with repay date in the given time span
    const repayLoans = await reportsModel.getAllLoanCollectedByUserId({
      userReportees: userReportees,
      userId: collectionUser?.user_id,
      startDate,
      endDate,
      clientId,
    });

    // Use batch processing for repayment calculation
    const collectionTargets = await processInBatch(
      repayLoans,
      calculateRepaymentForLoan,
      BATCH_SIZE,
    );

    const totalRepayAmount = collectionTargets.reduce(
      (accumulator, amount) => accumulator + amount,
      0,
    );

    return {
      name: collectionUser?.name || '',
      ['Collection Amount']: Math.round(totalCollectionAmount * 100) / 100,
      ['Collection Target']: Math.round(totalRepayAmount * 100) / 100,
    };
  });

  return Promise.all(response);
};

const getFreshReloanData = async ({
  role,
  month,
  year,
  clientId,
}: {
  role: roles;
  month: number;
  year: number;
  clientId: string;
}) => {
  let firstDateOfMonth: Date;
  let lastDateOfMonth: Date;
  //check if month if 0 or not
  //if zero then the user is asking for full year data month wise
  //if zero then return that particular month data
  if (month != 0) {
    firstDateOfMonth = startOfMonth(new Date(year, month - 1, 1));
    lastDateOfMonth = lastDayOfMonth(new Date(firstDateOfMonth));
  } else {
    firstDateOfMonth = startOfYear(new Date(year, 0, 1));
    lastDateOfMonth = lastDayOfYear(new Date(firstDateOfMonth));
  }

  const allDisbursalRole = await userAdminModel.getUsersByRole({
    userRole: role,
    clientId,
  });

  if (!allDisbursalRole) return null;
  const response = allDisbursalRole.map(async user => {
    let totalFreshDisbursalAmount = 0;
    let totalFreshCases = 0;
    let totalReloanDisbursalAmount = 0;
    let totalReloanCases = 0;

    // Find all disbursals by the user in the time range
    const disbursals = await reportsModel.getDisbursedLoansByUserId({
      userId: user.user_id,
      startDate: firstDateOfMonth,
      endDate: lastDateOfMonth,
      clientId,
    });

    await Promise.all(
      disbursals.map(async disbursal => {
        const previousLoans =
          await loanModel.getDisbursedLoansCountByCustomerId({
            customerId: disbursal.customer_id,
            clientId,
            currentLoanId: disbursal.loan_id,
          });

        if (
          disbursal.disbursal_date >= firstDateOfMonth &&
          disbursal.disbursal_date <= lastDateOfMonth
        ) {
          if (previousLoans === 0) {
            totalFreshCases++;
            totalFreshDisbursalAmount =
              totalFreshDisbursalAmount +
              (disbursal.leads.approval?.loan_amt_approved || 0);
          } else {
            totalReloanCases++;
            totalReloanDisbursalAmount =
              totalReloanDisbursalAmount +
              (disbursal.leads.approval?.loan_amt_approved || 0);
          }
        }
      }),
    );
    return {
      name: user.name,
      ['Fresh Disbursal Amount']: totalFreshDisbursalAmount,
      ['Fresh Cases']: totalFreshCases,
      ['Reloan Disbursal Amount']: totalReloanDisbursalAmount,
      ['Reloan Cases']: totalReloanCases,
    };
  });

  return Promise.all(response);
};

export const adminReportsService = {
  performanceHistoryMonthly,
  performanceHistoryDaily,
  adminStats,
  getDisbursalRoleData,
  getCollectionByRole,
  getFreshReloanData,
  collectionDailyTrack,
};
