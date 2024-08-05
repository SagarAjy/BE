import {
  Prisma,
  genders,
  house_types,
  lead_status,
  roles,
} from '@prisma/client';
import { approvalModel } from '../approval/approval.model';
import { customerModel } from '../customer/customer.model';
import { leadsModel } from '../leads/leads.model';
import { userModel } from '../user/user.model';
import { reportsModel } from './reports.model';
import { disbursalModel } from '../disbursal/disbursal.model';
import { employerModel } from '../employer/employer.model';
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  format,
  lastDayOfMonth,
  lastDayOfYear,
  parse,
  startOfDay,
  startOfMonth,
  startOfYear,
} from 'date-fns';
import { sanctionTargetModel } from '../sanction-target/sanction-target.model';
import { userReporteeModel } from '../user-reportee/user-reportee.model';
import { loanModel } from '../loan/loan.model';
import { addressModel } from '../address/address.model';
import { getCurrentRepayAmount, processInBatch } from '../../utils';
import { reportsModelAdmin } from './reports.admin.model';
import { collectionModel } from '../collection/collection.model';
import { clientModel } from '../clients/clients.model';

//get disbursal report
const getDisbursalReports = async ({
  limit,
  offset,
  userId,
  searchparam,
  startDate,
  endDate,
  clientId,
}: {
  limit: number;
  offset: number;
  userId: string;
  searchparam?: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  let disbursalData;
  let count: number;
  const userDetails = await userModel.getUser({ userId, clientId });
  if (
    userDetails?.role === 'Admin' ||
    userDetails?.role === 'Accounts' ||
    userDetails?.role === 'Service'
  ) {
    disbursalData = await reportsModelAdmin.getDisbursalsReport({
      limit,
      offset,
      searchparam,
      startDate,
      endDate,
      clientId,
    });
    count = await reportsModelAdmin.getDisbursalsReportCount({
      searchparam,
      startDate,
      endDate,
      clientId,
    });
  } else {
    disbursalData = await reportsModelAdmin.getDisbursalsReport({
      limit,
      offset,
      userId,
      searchparam,
      startDate,
      endDate,
      clientId,
    });
    count = await reportsModelAdmin.getDisbursalsReportCount({
      userId,
      searchparam,
      startDate,
      endDate,
      clientId,
    });
  }

  if (disbursalData.length === 0) return null;

  const response = disbursalData.map(async disbursal => {
    const approvalData = await approvalModel.getApproval({
      leadId: disbursal.lead_id,
      clientId,
    });
    const leadDetails = await leadsModel.getLeadById({
      leadId: disbursal.lead_id,
      clientId,
    });
    const customerDetails = await customerModel.getCustomerById({
      customer_id: leadDetails?.customer_id || '',
      clientId,
    });
    const creditedByDetails = await userModel.getUser({
      userId: approvalData?.credited_by || '',
      clientId,
    });
    let addressDetails;
    addressDetails = await addressModel.getAddressByCustomerId({
      customerId: leadDetails?.customer_id || '',
      clientId,
    });

    if (!addressDetails) {
      addressDetails = [
        {
          address: '',
          city: '',
          state: '',
          pincode: '',
          house_types: house_types?.Owned,
        },
      ];
    }

    return {
      id: disbursal.loan_id || '',
      leadId: disbursal?.lead_id || '',
      loanNo: disbursal.loan_no || '',
      branch: approvalData?.branch || '',
      loanType: disbursal.loan_type,
      name: customerDetails?.name || '',
      creditManager: creditedByDetails?.name || '',
      gender: customerDetails?.gender || genders.Male,
      dob: customerDetails?.dob || new Date(),
      personalEmail: customerDetails?.email || '',
      officeEmail: approvalData?.official_email || '',
      mobile: customerDetails?.mobile || '',
      address: addressDetails[0]?.address,
      city: addressDetails[0]?.city,
      state: addressDetails[0]?.state,
      pincode: addressDetails[0]?.pincode,
      addressCategory: addressDetails[0]?.house_type || house_types?.Owned,
      aadharNumber: customerDetails?.aadhar_no || '',
      panCard: customerDetails?.pancard || '',
      loanAmount: approvalData?.loan_amt_approved || 0,
      approvalDate: approvalData?.updated_at || new Date(),
      disbursalAmount: disbursal.disbursal_amount || 0,
      tenure: approvalData?.tenure || 0,
      roi: approvalData?.roi || 0,
      disbursalDate: disbursal.disbursal_date,
      accountNo: disbursal.account_no || '',
      accountType: disbursal.account_type || '',
      ifsc: disbursal.bank_ifsc || '',
      bank: disbursal.bank || '',
      bankBranch: disbursal.bank_branch || '',
      disbursalReferenceNo: disbursal.disbursal_reference_no || '',
      processingFee: approvalData?.processing_fee || 0,
      monthlyIncome: approvalData?.monthly_income || 0,
      cibil: approvalData?.cibil || 0,
      gstFee:
        (approvalData?.processing_fee || 0) * 0.01 * (approvalData?.gst || 0),
      utmSource: leadDetails?.utm_source || '',
      status: leadDetails?.status || lead_status.Disbursed,
    };
  });
  const allDisbursalData = {
    disbursalReports: await Promise.all(response),
    count,
  };
  return allDisbursalData;
};

//get collection report
const getCollectionsReport = async ({
  userId,
  limit,
  offset,
  searchparam,
  startDate,
  endDate,
  clientId,
}: {
  userId: string;
  limit: number;
  offset: number;
  searchparam?: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const userDetails = await userModel.getUser({ userId, clientId });
  let allCollections;
  let count: number;

  if (
    userDetails?.role === 'Admin' ||
    userDetails?.role === 'Accounts' ||
    userDetails?.role === 'Service'
  ) {
    allCollections = await reportsModelAdmin.getCollectionsReport({
      limit,
      offset,
      searchparam,
      startDate,
      endDate,
      clientId,
    });
    count = await reportsModelAdmin.getCollectionsReportCount({
      searchparam,
      startDate,
      endDate,
      clientId,
    });
  } else {
    allCollections = await reportsModel.getCollectionsReport({
      limit,
      offset,
      userId,
      searchparam,
      startDate,
      endDate,
      clientId,
    });
    count = await reportsModel.getCollectionsReportCount({
      userId,
      searchparam,
      startDate,
      endDate,
      clientId,
    });
  }
  if (allCollections.length === 0) return null;

  const collectionsReport = allCollections.map(async collection => {
    const disbursalData = await disbursalModel.getDisbursal({
      leadId: collection.lead_id,
      clientId,
    });
    const leadDetails = await leadsModel.getLeadById({
      leadId: disbursalData?.lead_id || '',
      clientId,
    });
    const customerDetails = await customerModel.getCustomerById({
      customer_id: leadDetails?.customer_id || '',
      clientId,
    });
    const approvalData = await approvalModel.getApproval({
      leadId: disbursalData?.lead_id || '',
      clientId,
    });
    let employerName;
    const employerData = await employerModel.getEmployerLatest({
      customerId: collection.customer_id,
      clientId,
    });

    const allCollections = await collectionModel.getCollections({
      leadId: collection.lead_id,
      clientId,
    });

    const totalCollectionAmount = allCollections.reduce((acc, collection) => {
      return acc + collection.collected_amount;
    }, 0);

    if (employerData.length === 0) {
      employerName = '';
    } else {
      employerName = employerData[0].employer_name;
    }

    return {
      id: collection?.collection_id || '',
      leadId: leadDetails?.lead_id || '',
      loanNo: disbursalData?.loan_no || '',
      name: customerDetails?.name || '',
      mobile: customerDetails?.mobile || '',
      loanAmount: approvalData?.loan_amt_approved || 0,
      processingFee: approvalData?.processing_fee || 0,
      disbursalDate: disbursalData?.disbursal_date || new Date(),
      collectedAmount: collection.collected_amount || 0,
      penalty: collection.penalty_amount || 0,
      collectedMode: collection.collected_mode,
      collectionDate: collection.collected_date || new Date(),
      collectionTime: collection.collection_time || '',
      referenceNo: collection.reference_no || '',
      totalCollectionAmount,
      status: leadDetails?.status || lead_status.Other,
      remark: collection.remark || '',
      createdAt: collection.created_at,
      employerName: employerName,
    };
  });

  const collectionsReportData = {
    collectionsReport: await Promise.all(collectionsReport),
    count,
  };
  return collectionsReportData;
};

//all credit manager stats
const creditManagerStats = async ({
  userId,
  year,
  month,
  day,
  clientId,
}: {
  userId: string;
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

  // get stats for monthly data
  if (month !== 0) {
    startDate = startOfMonth(new Date(year, month - 1, 1));
    endDate = lastDayOfMonth(new Date(startDate));
    // for daily stats
  } else if (day != 0) {
    const today = new Date();
    startDate = startOfDay(today);
    endDate = endOfDay(today);
    // for yearly stats
  } else {
    startDate = startOfYear(new Date(year, 1, 1));
    endDate = lastDayOfYear(new Date(startDate));
  }

  const BATCH_SIZE = 1000; // Adjust this batch size as needed

  // FUNCTIONS TO BATCH PROCESS START

  async function processDisbursal(
    loan: Prisma.PromiseReturnType<typeof loanModel.getAllLoanByCredited>[0],
  ) {
    const prevLoan = await loanModel.getDisbursedLoansCountByCustomerId({
      customerId: loan.customer_id,
      clientId,
      currentLoanId: loan.loan_id,
    });

    return {
      type: prevLoan === 0 ? 'fresh' : 'reloan',
      amount: loan.leads.approval?.loan_amt_approved || 0,
    };
  }

  async function processRepay(
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

  // FUNCTIONS TO BATCH PROCESS END

  // find disbursals
  const disbursals = await loanModel.getAllLoanByCredited({
    userId,
    startDate,
    endDate,
    clientId,
  });

  // fresh vs reloan disbursal
  const disbursalResults = await processInBatch(
    disbursals,
    loan => processDisbursal(loan),
    BATCH_SIZE,
  );
  const totalDisbursalMonth = disbursalResults.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );
  const freshLoanDisbursal = disbursalResults
    .filter(r => r.type === 'fresh')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const reloanDisbursal = disbursalResults
    .filter(r => r.type === 'reloan')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // get target for the timeframe
  const targetMonthAndYear =
    format(startDate, 'MMMM') + ' ' + startDate.getFullYear();
  const sanctionTarget = await sanctionTargetModel.getSanctionTargetByUserId({
    userId,
    monthAndYear: targetMonthAndYear,
    clientId,
  });
  let delta = 0;
  if (sanctionTarget) {
    delta = Math.floor((totalDisbursalMonth / sanctionTarget.target) * 100);
  }

  // find all collections that have been made in the time period for the cases approved by the user
  const collections = await reportsModel.getCollectionsByApprovedBy({
    startDate,
    endDate,
    userId,
    clientId,
  });

  const totalcollectionMonth = collections.reduce((accumulator, collection) => {
    return accumulator + collection.collected_amount;
  }, 0);

  //find loans with repay date in given time interval
  const repayLoans = await reportsModel.getAllLoanCollectedApprovedByUserId({
    userId: userId,
    startDate,
    endDate,
    clientId,
  });

  //calculate total amount to repay
  const repayResults = await processInBatch(
    repayLoans,
    processRepay,
    BATCH_SIZE,
  );
  const totalTarget = repayResults.reduce((acc, amount) => acc + amount, 0);

  let delta2 = 0;
  if (repayResults) {
    delta2 = Math.floor((totalcollectionMonth / totalTarget) * 100);
  }
  const response = [
    {
      title: 'Total Disbursal',
      metric: totalDisbursalMonth,
      progress: delta,
      target: sanctionTarget?.target || 0,
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
      metric: totalcollectionMonth,
      progress: delta2,
      target: totalTarget || 0,
      deltaType: 'moderateIncrease',
    },
  ];
  return response;
};

//all collection Manager stats
const collectionManagerStats = async ({
  userId,
  year,
  month,
  day,
  clientId,
}: {
  userId: string;
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
  // Monthly stats
  if (month !== 0) {
    startDate = startOfMonth(new Date(year, month - 1, 1));
    endDate = lastDayOfMonth(new Date(startDate));
    // Daily stats
  } else if (day != 0) {
    const today = new Date();
    startDate = startOfDay(today);
    endDate = endOfDay(today);
    // yearly
  } else {
    startDate = startOfYear(new Date(year, 1, 1));
    endDate = lastDayOfYear(new Date(startDate));
  }

  // BATCH PROCESSING UNTIL FUNCTIONS START
  const BATCH_SIZE = 1000; // You can adjust this based on performance

  const userDetails = await userModel.getUser({ userId, clientId });

  const allReportess = await userReporteeModel.getUserReportees({
    userId,
    clientId,
  });

  const allTeleCallers = await userModel.getAllUsersByRole({
    userRole: 'Tele_Caller',
    branch: userDetails?.branch || '',
    clientId,
  });

  allTeleCallers.map(teleCaller => {
    allReportess.push({
      id: teleCaller.user_id,
      user_reportee_id: teleCaller.user_id,
      user_id: userId,
      client_id: clientId,
    });
  });

  //collection for cases to be repaid in this month
  const collections = await reportsModelAdmin.getCollectionsForRepay({
    startDate,
    endDate,
    clientId,
  });

  //calculate total collection
  const totalCollectedAmount = collections.reduce((accumulator, collection) => {
    return accumulator + collection.collected_amount;
  }, 0);

  //find all loans with repay date in the given time span
  const repayLoans = await reportsModelAdmin.getAllRepayLoan({
    startDate,
    endDate,
    clientId,
  });

  //Process in batch function start

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

  const targetTotal = await processInBatch(
    repayLoans,
    calculateRepaymentForLoan,
    BATCH_SIZE,
  );

  const target = targetTotal.reduce((acc, amount) => acc + amount, 0);
  let delta = 0;
  if (target) {
    delta = Math.floor((totalCollectedAmount / target) * 100);
  }

  const assignedLeads = await reportsModel.getLeadByCollectionUserIdCount({
    userId,
    reporteeUserIds: allReportess,
    status: lead_status.Disbursed,
    startDate,
    endDate,
    clientId,
  });
  const closedLeads = await reportsModel.getLeadByCollectionUserIdCount({
    userId,
    reporteeUserIds: allReportess,
    status: lead_status.Closed,
    startDate,
    endDate,
    clientId,
  });
  let delta2 = 0;
  if (closedLeads) {
    delta2 = Math.floor((closedLeads / assignedLeads) * 100);
  }

  const response = [
    {
      title: 'Collection',
      metric: totalCollectedAmount,
      progress: delta,
      target,
      deltaType: 'moderateIncrease',
    },
    {
      title: 'Collection Leads',
      metric: closedLeads,
      progress: delta2,
      target: assignedLeads,
      deltaType: 'moderateIncrease',
    },
  ];
  return response;
};

//Telecaller stats
const teleCallerStats = async ({
  userId,
  year,
  month,
  day,
  clientId,
}: {
  userId: string;
  year: number;
  month: number;
  day: number;
  clientId: string;
}) => {
  //check if month if 0 or not
  //if zero then the user is asking for full year data month wise
  //if zero then return that particular month data
  const userDetails = await userModel.getUser({ userId, clientId });

  const BATCH_SIZE = 1000;

  let startDate: Date;
  let endDate: Date;
  // monthly stats
  if (month !== 0) {
    startDate = startOfMonth(new Date(year, month - 1, 1));
    endDate = lastDayOfMonth(new Date(startDate));

    // daily stats
  } else if (day != 0) {
    const today = new Date();
    startDate = startOfDay(today);
    endDate = endOfDay(today);
  } else {
    startDate = startOfYear(new Date(year, 1, 1));
    endDate = lastDayOfYear(new Date(startDate));
  }

  async function calculateRepaymentForLoan(
    loan: Prisma.PromiseReturnType<
      typeof reportsModel.getClosedLoanCollectionByUser
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

  const collections = await reportsModel.getCollectionsReport({
    userId,
    startDate,
    endDate,
    clientId,
  });
  const totalCollectionMonth = collections.reduce((accumulator, collection) => {
    return accumulator + collection.collected_amount;
  }, 0);
  const repayLoans = await reportsModel.getClosedLoanCollectionByUser({
    userId,
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

  let delta = 0;
  if (totalRepayAmount) {
    delta = Math.floor((totalCollectionMonth / totalRepayAmount) * 100);
  }

  const leadAssigned = await leadsModel.getLeadByCollectionUserIdCount({
    userId,
    startDate,
    endDate,
    clientId,
  });
  const closedLeads = await leadsModel.getLeadByCollectionUserIdCountClosed({
    userId,
    startDate,
    endDate,
    clientId,
  });
  let delta2 = 0;
  if (closedLeads) {
    delta2 = Math.floor((closedLeads / leadAssigned) * 100);
  }

  let response = [
    {
      title: 'Collection',
      metric: totalCollectionMonth,
      progress: delta,
      target: totalRepayAmount,
      deltaType: 'moderateIncrease',
    },
    {
      title: 'Collection Leads',
      metric: closedLeads,
      progress: delta2,
      target: leadAssigned,
      deltaType: 'moderateIncrease',
    },
  ];
  if (userDetails?.role === roles.Collection_Executive) {
    return response;
  } else if (userDetails?.role === roles.Tele_Caller) {
    let newObj;
    const leadsWorkedOn = await leadsModel.leadAssignedCountByUserId({
      userId,
      startDate,
      endDate,
      clientId,
    });
    const leadAssigned = await leadsModel.getLeadCountByUserId({
      userId,
      startDate,
      endDate,
      clientId,
    });
    const docsReceived = await leadsModel.getLeadsCountByStatus({
      userId,
      startDate,
      endDate,
      clientId,
      status: lead_status.Documents_Received,
    });
    const interested = await leadsModel.getLeadsCountByStatus({
      userId,
      startDate,
      endDate,
      clientId,
      status: lead_status.Interested,
    });
    //@ts-ignore
    const totalWorkedOn = parseInt(leadsWorkedOn[0].count, 10);
    let delta3 = 0;
    if (leadsWorkedOn) {
      delta3 = Math.floor((totalWorkedOn / leadAssigned) * 100);
    }
    let docsDelta = 0;
    if (docsReceived) {
      docsDelta = Math.floor((docsReceived / leadAssigned) * 100);
    }
    let interestedDelta = 0;
    if (interested) {
      docsDelta = Math.floor((interested / leadAssigned) * 100);
    }
    newObj = [
      {
        title: 'Leads',
        metric: totalWorkedOn,
        progress: delta3,
        target: leadAssigned,
        deltaType: 'moderateIncrease',
      },
      {
        title: 'Documents Received',
        metric: docsReceived,
        progress: docsReceived,
        target: leadAssigned,
        deltaType: 'moderateIncrease',
      },
      {
        title: 'Interested leads',
        metric: interested,
        progress: interestedDelta,
        target: leadAssigned,
        deltaType: 'moderateIncrease',
      },
    ];
    newObj = newObj.concat(response);
    return newObj;
  }
};

// daily stats of collection manager
const collectionManagerDailyTrack = async ({
  month,
  year,
  userId,
  clientId,
}: {
  month: number;
  year: number;
  userId: string;
  clientId: string;
}) => {
  // initialize first and last date of month
  const firstDateOfMonth = startOfMonth(new Date(year, month - 1, 1));
  const lastDateOfMonth = lastDayOfMonth(new Date(firstDateOfMonth));
  //get all the days of a month array
  const allDaysOfMonth = eachDayOfInterval({
    start: firstDateOfMonth,
    end: lastDateOfMonth,
  });

  // get all collection users
  const collectionUsers = await userReporteeModel.getUserReportees({
    userId,
    clientId,
  });

  const userDetails = await userModel.getUser({ userId, clientId });

  // get all tele callers since they do collection as well
  const allTeleCallers = await userModel.getAllUsersByRole({
    userRole: 'Tele_Caller',
    branch: userDetails?.branch || '',
    clientId,
  });

  allTeleCallers.map(teleCaller => {
    collectionUsers.push({
      id: teleCaller.user_id,
      user_reportee_id: teleCaller.user_id,
      user_id: userId,
      client_id: clientId,
    });
  });

  const response = allDaysOfMonth.map(async day => {
    // find all due loans on that date
    const loanCount = await reportsModel.getLoanCountByRepayDate({
      reportees: collectionUsers,
      startDate: startOfDay(day),
      endDate: endOfDay(day),
      clientId,
    });

    // find all loans with repay date on the given day
    const loans = await reportsModel.getLoanByRepayDateAndReportees({
      reportees: collectionUsers,
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

    const collectedCases = new Set(
      collections.map(collection => collection.leads.lead_id),
    );

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
      collectedCases: collectedCases.size,
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

// get all collections of a user
const getCollectionByUsers = async ({
  month,
  year,
  clientId,
  userId,
}: {
  month: number;
  year: number;
  clientId: string;
  userId: string;
}) => {
  let startDate: Date;
  let endDate: Date;
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
  const BATCH_SIZE = 1000;
  // get all collection users
  const collectionUsers = await userReporteeModel.getUserReportees({
    userId,
    clientId,
  });

  const userDetails = await userModel.getUser({ userId, clientId });

  // get all tele callers since they do collection as well
  const allTeleCallers = await userModel.getAllUsersByRole({
    userRole: 'Tele_Caller',
    branch: userDetails?.branch || '',
    clientId,
  });

  allTeleCallers.map(teleCaller => {
    collectionUsers.push({
      id: teleCaller.user_id,
      user_reportee_id: teleCaller.user_id,
      user_id: userId,
      client_id: clientId,
    });
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

  // map all collection users and find their collection amount and target
  const response = collectionUsers.map(async collectionUser => {
    const collectionUserDetails = await userModel.getUser({
      userId: collectionUser.user_reportee_id,
      clientId,
    });

    // get all collections made by the collectionUser
    const collections = await reportsModel.getCollectionByReportee({
      userId: collectionUserDetails?.user_id || '',
      userReportees: [],
      clientId,
      startDate,
      endDate,
    });

    const totalCollectionAmount = collections.reduce((acc, collection) => {
      return acc + collection.collected_amount;
    }, 0);

    //find all loans with repay date in the given time span
    const repayLoans = await reportsModel.getAllLoanCollectedByUserId({
      userReportees: [],
      userId: collectionUserDetails?.user_id || '',
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
      name: collectionUserDetails?.name,
      ['Collection Amount']: Math.round(totalCollectionAmount * 100) / 100,
      ['Collection Target']: Math.round(totalRepayAmount * 100) / 100,
    };
  });
  return Promise.all(response);
};

// TODO: FIX THIS PERFORMANCE STATS
const teleCallerPerformanceDaily = async ({
  userId,
  year,
  month,
  clientId,
}: {
  userId: string;
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
    const docsReceived = await leadsModel.getLeadsCountByStatus({
      userId,
      startDate: startOfDay(date),
      endDate: endOfDay(date),
      clientId,
      status: lead_status.Documents_Received,
    });
    const interested = await leadsModel.getLeadsCountByStatus({
      userId,
      startDate: startOfDay(date),
      endDate: endOfDay(date),
      clientId,
      status: lead_status.Interested,
    });
    return {
      date: format(date, 'dd-MM-yyyy'),
      ['Documents Received']: docsReceived,
      ['Interested']: interested,
    };
  });

  return Promise.all(response);
};

//performance history monthly
const teleCallerPerformanceMonthly = async ({
  userId,
  year,
  clientId,
}: {
  userId: string;
  year: number;
  clientId: string;
}) => {
  var month: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const response = month.map(async (month: number) => {
    const firstDateOfMonth = startOfMonth(new Date(year, month - 1, 1));
    const lastDateOfMonth = lastDayOfMonth(new Date(firstDateOfMonth));

    const docsReceived = await leadsModel.getLeadsCountByStatus({
      userId,
      startDate: firstDateOfMonth,
      endDate: lastDateOfMonth,
      clientId,
      status: lead_status.Documents_Received,
    });
    const interested = await leadsModel.getLeadsCountByStatus({
      userId,
      startDate: firstDateOfMonth,
      endDate: lastDateOfMonth,
      clientId,
      status: lead_status.Interested,
    });
    return {
      date: `${format(firstDateOfMonth, 'MMM')}`,
      ['Documents Received']: docsReceived,
      ['Interested']: interested,
    };
  });
  return Promise.all(response);
};

// credit manager reportee daily stats
const creditManagerReporteePerformanceDaily = async ({
  userId,
  year,
  month,
  clientId,
}: {
  userId: string;
  year: number;
  month: number;
  clientId: string;
}) => {
  //check if month if 0 or not
  //if zero then the user is asking for full year data month wise
  //if zero then return that particular month data

  const firstDateOfMonth = startOfMonth(new Date(year, month - 1, 1));
  const lastDateOfMonth = lastDayOfMonth(new Date(firstDateOfMonth));

  //get all the days of a month array
  const allDaysOfMonth = eachDayOfInterval({
    start: firstDateOfMonth,
    end: lastDateOfMonth,
  });

  const response = allDaysOfMonth.map(async day => {
    const dailyDisbursal = await reportsModel.getDisbursedLoansByUserId({
      userId,
      clientId,
      startDate: startOfDay(day),
      endDate: endOfDay(day),
    });
    const totalDisbursalDay = dailyDisbursal.reduce(
      (acc, curr) => acc + (curr.leads.approval?.loan_amt_approved || 0),
      0,
    );
    return {
      day: format(day, 'dd-MM-yyyy'),
      ['Disbursal']: totalDisbursalDay,
    };
  });

  return Promise.all(response);
};

// credit manager reportee monthly stats
const creditManagerReporteePerformanceMonthly = async ({
  year,
  clientId,
  userId,
}: {
  year: number;
  clientId: string;
  userId: string;
}) => {
  var month: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const response = month.map(async (month: number) => {
    const firstDateOfMonth = startOfMonth(new Date(year, month - 1, 1));
    const lastDateOfMonth = lastDayOfMonth(new Date(firstDateOfMonth));

    const dailyDisbursal = await reportsModel.getDisbursedLoansByUserId({
      userId,
      clientId,
      startDate: firstDateOfMonth,
      endDate: lastDateOfMonth,
    });
    const totalDisbursalDay = dailyDisbursal.reduce(
      (acc, curr) => acc + (curr.leads.approval?.loan_amt_approved || 0),
      0,
    );
    return {
      day: format(firstDateOfMonth, 'MMM'),
      ['Disbursal']: totalDisbursalDay,
    };
  });
  return Promise.all(response);
};

const getCibilData = async ({
  limit,
  offset,
  startDate,
  endDate,
  searchparam,
  clientId,
}: {
  limit: number;
  offset: number;
  startDate?: Date;
  endDate?: Date;
  searchparam: string;
  clientId: string;
}) => {
  const disbursedLoans = await loanModel.getAllDisbursedLoan({
    limit,
    offset,
    startDate,
    endDate,
    searchparam,
    clientId,
  });

  const disbursedLoansCount = await loanModel.getAllDisbursedLoanCount({
    startDate,
    endDate,
    searchparam,
    clientId,
  });

  if (disbursedLoans.length === 0) {
    return null;
  }

  function getCollectionStatus(leadStatus: string) {
    if (leadStatus === lead_status.Disbursed) {
      return 'Pending';
    } else if (leadStatus === lead_status.Part_Payment) {
      return 'Partially Paid';
    } else if (leadStatus === lead_status.Closed) {
      return 'Closed';
    }
  }

  const cibilData = disbursedLoans.map(async loan => {
    const customerDetails = await customerModel.getCustomerById({
      customer_id: loan.customer_id,
      clientId,
    });

    let address, state, pincode, city;
    const customerAddress = await addressModel.getAddressByCustomerId({
      customerId: loan.customer_id,
      clientId,
    });

    const approvalData = await approvalModel.getApprovalByLeadId({
      leadId: loan.lead_id,
      clientId: loan.client_id,
    });

    const leadDetails = await leadsModel.getLeadById({
      leadId: loan?.lead_id,
      clientId,
    });

    const collectionsOnLead = await collectionModel.getCollections({
      leadId: loan?.lead_id || '',
      clientId,
    });

    const closureDate =
      collectionsOnLead.length !== 0 && leadDetails?.status === 'Closed'
        ? format(
            collectionsOnLead.at(0)?.collected_date || new Date(),
            'dd-MM-yyyy',
          )
        : '';

    const daysPastDue = differenceInCalendarDays(
      new Date(),
      approvalData?.repay_date || new Date(),
    );

    if (customerAddress?.length === 0) {
      address = '';
      city = '';
      state = '';
      pincode = '';
    } else {
      address = customerAddress[0]?.address;
      city = customerAddress[0]?.city;
      state = customerAddress[0]?.state;
      pincode = customerAddress[0]?.pincode;
    }

    const principal = approvalData?.loan_amt_approved || 0;
    const roi = approvalData?.roi || 0;
    const tenure = approvalData?.tenure || 0;
    const repayDate = approvalData?.repay_date || new Date();

    const clientDetails = await clientModel.getClient({ clientId });

    const collections = await collectionModel.getCollections({
      leadId: loan?.lead_id || '',
      clientId,
    });

    const penaltyRoi = clientDetails?.client_penalty_roi || 1.25; // Corrected penalty rate of interest
    const currentDate =
      collections.at(0)?.status === 'Closed'
        ? parse(
            format(
              collections.at(0)?.collected_date || new Date(),
              'dd-MM-yyyy',
            ),
            'dd-MM-yyyy',
            new Date(),
          )
        : new Date();

    const { currentRepayAmount } = getCurrentRepayAmount({
      amtApproved: principal,
      roi,
      tenure,
      penaltyRoi,
      currentDate,
      disbursalDate: loan?.disbursal_date || new Date(),
      principal,
      repaymentDate: repayDate,
      collections,
    });

    return {
      id: loan?.lead_id || '',
      name: customerDetails?.name || '',
      dob: customerDetails?.dob || new Date(),
      gender: customerDetails?.gender || '',
      pan: customerDetails?.pancard || '',
      aadhar: customerDetails?.aadhar_no || '',
      mobile: customerDetails?.mobile || '',
      email: customerDetails?.email || '',
      address,
      city,
      state,
      pincode,
      loanNo: loan?.loan_no || '',
      amount: approvalData?.loan_amt_approved || 0,
      disbursalDate: loan?.disbursal_date || new Date(),
      repaymentDate: approvalData?.repay_date || new Date(),
      collectionStatus: getCollectionStatus(leadDetails?.status || '') || '',
      closureDate: closureDate,
      currentBalance: approvalData?.loan_amt_approved || 0,
      amountOverdue: currentRepayAmount,
      overDueDays: daysPastDue,
    };
  });

  return {
    cibilData: await Promise.all(cibilData),
    count: disbursedLoansCount,
  };
};

export const reportsService = {
  getDisbursalReports,
  getCollectionsReport,
  creditManagerStats,
  collectionManagerStats,
  teleCallerStats,
  collectionManagerDailyTrack,
  getCollectionByUsers,
  teleCallerPerformanceDaily,
  teleCallerPerformanceMonthly,
  creditManagerReporteePerformanceDaily,
  creditManagerReporteePerformanceMonthly,
  getCibilData,
};
