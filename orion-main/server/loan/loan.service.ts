import {
  differenceInCalendarDays,
  differenceInDays,
  format,
  isWithinInterval,
  parse,
} from 'date-fns';
import { approvalModel } from '../approval/approval.model';
import { loanModel } from './loan.model';
import { customerModel } from '../customer/customer.model';
import { leadsModel } from '../leads/leads.model';
import { collectionModel } from '../collection/collection.model';
import { Prisma, lead_status, loan_type } from '@prisma/client';
import { userModel } from '../user/user.model';
import { loanAdminModel } from './loan.model.admin';
import { userReporteeModel } from '../user-reportee/user-reportee.model';
import { getCurrentRepayAmount, processInBatch } from '../../utils';
import { clientModel } from '../clients/clients.model';

const getLoan = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const loanData = await loanModel.getLoanByLeadId({ leadId, clientId });
  if (!loanData) return null;
  const approvalData = await approvalModel.getApproval({ leadId, clientId });
  const collections = await collectionModel.getCollections({
    leadId,
    clientId,
  });

  const clientDetails = await clientModel.getClient({ clientId });

  const principal = approvalData?.loan_amt_approved || 0;
  const tenure = approvalData?.tenure || 0;
  const roi = approvalData?.roi || 0;
  const repayDate = approvalData?.repay_date || new Date();

  const penaltyRoi = clientDetails?.client_penalty_roi || 1.25; // Corrected penalty rate of interest
  const currentDate =
    collections.at(0)?.status === 'Closed'
      ? collections.at(0)?.collected_date || new Date()
      : new Date();
  const totalRepayAmount = principal + principal * roi * tenure * 0.01;

  const { totalInterest, penaltyInterest, currentRepayAmount } =
    getCurrentRepayAmount({
      principal,
      roi,
      tenure,
      amtApproved: principal,
      currentDate,
      penaltyRoi,
      collections,
      repaymentDate: repayDate,
      disbursalDate: loanData?.disbursal_date || new Date(),
    });

  const paidAmount = collections.reduce((acc, collection) => {
    return acc + collection.collected_amount;
  }, 0);

  return {
    loanNo: loanData.loan_no || '',
    branch: approvalData?.branch || '',
    loanDisbursed: loanData.disbursal_amount || 0,
    approvalAmount: approvalData?.loan_amt_approved || 0,
    roi: approvalData?.roi || 0,
    noOfDays: approvalData?.tenure || 0,
    realDays: differenceInCalendarDays(
      new Date(),
      new Date(loanData.disbursal_date),
    ),
    penaltyDays:
      new Date() > repayDate
        ? differenceInCalendarDays(new Date(), repayDate)
        : 0,
    bouncingCharges: 0,
    currentDate,
    paidAmount: paidAmount,
    repaymentAmount: Math.round(totalRepayAmount * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    penaltyInterest: Math.round(penaltyInterest * 100) / 100,
    currentRepayAmount: Math.round(currentRepayAmount * 100) / 100,
  };
};

const getBankUpdate = async ({
  limit,
  offset,
  filterBy,
  searchparam,
  userId,
  clientId,
}: {
  limit: number;
  offset: number;
  filterBy: string;
  searchparam: string;
  userId: string;
  clientId: string;
}) => {
  const userDetails = await userModel.getUser({ userId, clientId });
  let allBankUpdateLoans;
  let bankUpdateLoansCount: number;

  // * only admin and accounts can see all data in bank update
  if (userDetails?.role === 'Admin' || userDetails?.role === 'Accounts') {
    allBankUpdateLoans = await loanAdminModel.getAllBankUpdateLoans({
      limit,
      offset,
      searchparam,
      filterBy,
      clientId,
    });
    bankUpdateLoansCount = await loanAdminModel.getAllBankUpdateLoansCount({
      filterBy,
      searchparam,
      clientId,
    });
  } else {
    const reporteeUserIds = await userReporteeModel.getUserReportees({
      userId,
      clientId,
    });
    allBankUpdateLoans = await loanModel.getAllBankUpdateLoans({
      limit,
      offset,
      reporteeUserIds: reporteeUserIds,
      filterBy,
      searchparam,
      userId,
      clientId,
    });
    bankUpdateLoansCount = await loanModel.getAllBankUpdateLoansCount({
      reporteeUserIds: reporteeUserIds,
      userId,
      searchparam,
      filterBy,
      clientId,
    });
  }

  if (allBankUpdateLoans.length === 0) return null;

  const bankUpdateData = allBankUpdateLoans.map(async bankUpdateLeads => {
    const leadDetails = await leadsModel.getLeadById({
      leadId: bankUpdateLeads.lead_id,
      clientId,
    });
    const loanApprovalData = await approvalModel.getApproval({
      leadId: bankUpdateLeads.lead_id,
      clientId,
    });
    const customerDetails = await customerModel.getCustomerById({
      customer_id: leadDetails?.customer_id || '',
      clientId,
    });

    let approvedBy = 'N/A';
    if (loanApprovalData?.credited_by !== null) {
      const userDetails = await userModel.getUser({
        userId: loanApprovalData?.credited_by || '',
        clientId,
      });
      approvedBy = userDetails?.name || '';
    }

    return {
      id: bankUpdateLeads.loan_id,
      leadId: bankUpdateLeads.lead_id,
      loanNo: bankUpdateLeads.loan_no || '',
      name: customerDetails?.name || '',
      branch: loanApprovalData?.branch || '',
      loanType: loanApprovalData?.loan_type || '',
      phoneNo: customerDetails?.mobile || '',
      email: customerDetails?.email || '',
      approvalAmount: loanApprovalData?.loan_amt_approved || 0,
      disbursalAmount: bankUpdateLeads.disbursal_amount,
      approvalDate: loanApprovalData?.updated_at || new Date(),
      disbursalDate: bankUpdateLeads.disbursal_date || '',
      roi: loanApprovalData?.roi || 0,
      tenure: loanApprovalData?.tenure || 0,
      processingFeePercent: loanApprovalData?.processing_fee_percent || 0,
      processingFee: loanApprovalData?.processing_fee || 0,
      conversionFeesPercent: loanApprovalData?.conversion_fee_percent || 0,
      conversionFees: loanApprovalData?.conversion_fees || 0,
      accountNumber: bankUpdateLeads.account_no,
      bankName: bankUpdateLeads.bank,
      bankBranch: bankUpdateLeads.bank_branch,
      ifscCode: bankUpdateLeads.bank_ifsc,
      cibil: loanApprovalData?.cibil || 0,
      approvedBy,
    };
  });
  const bankDataResponse = {
    bankUpdateData: await Promise.all(bankUpdateData),
    bankUpdateCount: bankUpdateLoansCount,
  };
  return bankDataResponse;
};

const getAllPendingLoans = async ({
  limit,
  offset,
  loanFilter,
  userId,
  searchparam,
  filterBy,
  startDate,
  endDate,
  clientId,
  assigneeId,
}: {
  limit?: number;
  offset?: number;
  loanFilter?: loan_type;
  userId: string;
  searchparam?: string;
  filterBy?: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
  assigneeId?: string;
}) => {
  const userDetails = await userModel.getUser({ userId, clientId });
  let allLoans;
  let loansCount: number;
  const BATCH_SIZE = 100;

  // * only Admin and Accounts can see all pending loans
  if (userDetails?.role === 'Admin' || userDetails?.role === 'Accounts') {
    allLoans = await loanAdminModel.getAllLoanPending({
      limit,
      offset,
      searchparam,
      loanFilter,
      filterBy,
      startDate,
      endDate,
      clientId,
      assigneeId: assigneeId?.length ? assigneeId : undefined,
    });
    loansCount = await loanAdminModel.getAllLoanPendingCount({
      loanFilter,
      filterBy,
      searchparam,
      startDate,
      endDate,
      clientId,
      assigneeId: assigneeId?.length ? assigneeId : undefined,
    });
  } else if (
    userDetails?.role === 'Collection_Executive' ||
    userDetails?.role === 'Tele_Caller'
  ) {
    allLoans = await loanModel.getAllCollectionExecutiveLoanPending({
      limit,
      offset,
      loanFilter,
      filterBy,
      searchparam,
      startDate,
      endDate,
      clientId,
      assigneeId: assigneeId?.length ? assigneeId : undefined,
      userId,
    });
    loansCount = await loanModel.getAllCollectionExecutiveLoanPendingCount({
      loanFilter,
      filterBy,
      searchparam,
      startDate,
      endDate,
      clientId,
      assigneeId: assigneeId?.length ? assigneeId : undefined,
      userId,
    });
  } else {
    //If COLLECTION MANAGER, GET USER ID (of mapped Loan Officer), and use that to get cases under loan officer to collect
    // if (userDetails?.role === 'Collection_Manager') {
    //   const reportingUser =
    //     await userReporteeModel.getUserReporteesByReporteeId({
    //       userId,
    //       clientId,
    //     });
    //   if (reportingUser !== null) {
    //     collectionUserId = reportingUser?.user_id || '';
    //   }
    // }
    const reporteeUserIds = await userReporteeModel.getUserReportees({
      userId: userId,
      clientId,
    });

    const teleCallers = await userModel.getAllUsersByRole({
      userRole: 'Tele_Caller',
      branch: userDetails?.branch,
      clientId,
    });

    allLoans = await loanModel.getAllLoanPending({
      limit,
      offset,
      loanFilter,
      reporteeUserIds: reporteeUserIds,
      teleCallers,
      filterBy,
      searchparam,
      userId,
      startDate,
      endDate,
      clientId,
      assigneeId: assigneeId?.length ? assigneeId : undefined,
    });
    loansCount = await loanModel.getAllLoanPendingCount({
      loanFilter,
      reporteeUserIds: reporteeUserIds,
      teleCallers,
      searchparam,
      userId,
      filterBy,
      startDate,
      endDate,
      clientId,
      assigneeId: assigneeId?.length ? assigneeId : undefined,
    });
  }

  // BATCH PROCESS FUNCTION TO MASSAGE LOAN OBJECT FOR PAYDAY PENDING

  async function processLoan(
    loan: Prisma.PromiseReturnType<typeof loanAdminModel.getAllLoanPending>[0],
  ) {
    const loanApproval = await approvalModel.getApproval({
      leadId: loan.lead_id,
      clientId,
    });
    const disbursedBy = await userModel.getUser({
      userId: loan.disbursed_by,
      clientId,
    });

    let collectionUserName = 'None';
    if (loanApproval?.leads.collection_user_id) {
      const collectionUser = await userModel.getUser({
        userId: loanApproval.leads.collection_user_id,
        clientId,
      });
      collectionUserName = collectionUser?.name || 'None';
    }

    const customerInfo = await customerModel.getCustomerById({
      customer_id: loanApproval?.customer_id || '',
      clientId,
    });

    const clientDetails = await clientModel.getClient({ clientId });

    // Calculations for interest amount, repay amount, penalty interest
    const principal = loanApproval?.loan_amt_approved || 0;
    const roi = loanApproval?.roi || 0;
    const tenure = loanApproval?.tenure || 0;
    const repayDate = loanApproval?.repay_date || new Date();
    const collections = await collectionModel.getCollections({
      leadId: loan.lead_id,
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
    const { currentRepayAmount, penaltyInterest } = getCurrentRepayAmount({
      principal,
      roi,
      tenure,
      currentDate,
      amtApproved: principal,
      collections,
      penaltyRoi,
      disbursalDate: loan?.disbursal_date || new Date(),
      repaymentDate: repayDate,
    });

    const daysPastDue = differenceInCalendarDays(
      new Date(),
      loanApproval?.repay_date || new Date(),
    );

    const repayAmount = principal + principal * roi * tenure * 0.01;

    return {
      id: loan.lead_id,
      leadId: loan.lead_id,
      collectionUser: collectionUserName,
      daysPastDue,
      loanNo: loan.loan_no || '',
      name: customerInfo?.name || '',
      phoneNo: customerInfo?.mobile || '',
      email: customerInfo?.email || '',
      loanAmount: loanApproval?.loan_amt_approved || 0,
      tenure: loanApproval?.tenure || 0,
      roi: loanApproval?.roi || 0,
      repaymentAmount: repayAmount,
      currentRepaymentAmount: Math.round(currentRepayAmount * 100) / 100,
      repayDate: loanApproval?.repay_date || new Date(),
      penalty: Math.round(penaltyInterest * 100) / 100 || 0,
      status:
        loan?.status === 'Disbursed'
          ? penaltyInterest > 0
            ? 'Overdue'
            : 'Due'
          : loan?.status || 'Disbursed',
      creditedBy: disbursedBy?.name || '',
      remarks: loan.remarks || '',
    };
  }

  // map all pending loans

  const processedLoans = await processInBatch(
    allLoans,
    processLoan,
    BATCH_SIZE,
  );

  const loanData = {
    loans: processedLoans,
    loansCount,
  };
  return loanData;
};

//reminder email
const allPendingLoansRemnderEmail = async ({
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
  const userDetails = await userModel.getUser({ userId, clientId });
  let allLoans;
  let loansCount: number;

  // * only Admin and Accounts can see all pending loans
  if (userDetails?.role === 'Admin' || userDetails?.role === 'Accounts') {
    allLoans = await loanAdminModel.getAllLoanPendingForReminderEmail({
      clientId,
    });
  } else {
    let collectionUserId = userId;
    //If COLLECTION MANAGER, GET USER ID (of mapped Loan Officer), and use that to get cases under loan officer to collect
    if (userDetails?.role === 'Collection_Manager') {
      const reportingUser =
        await userReporteeModel.getUserReportingByReporteeId({
          userId,
          clientId,
        });
      collectionUserId = reportingUser?.user_id || '';
    }
    const reporteeUserIds = await userReporteeModel.getUserReportees({
      userId: collectionUserId,
      clientId,
    });

    allLoans = await loanModel.getAllLoanPendingReminderMail({
      reporteeUserIds: reporteeUserIds,
      userId: collectionUserId,
      clientId,
    });
  }

  const loans = allLoans.map(async loan => {
    const collections = await collectionModel.getCollections({
      leadId: loan.lead_id,
      clientId,
    });

    const loanApproval = await approvalModel.getApproval({
      leadId: loan.lead_id,
      clientId,
    });
    const disbursedBy = await userModel.getUser({
      userId: loan.disbursed_by,
      clientId,
    });

    let collectionUserName: string;

    if (loanApproval?.leads.collection_user_id === null) {
      collectionUserName = 'None';
    } else {
      const collectionUser = await userModel.getUser({
        userId: loanApproval?.leads.collection_user_id || '',
        clientId,
      });
      collectionUserName = collectionUser?.name || '';
    }

    let pdDoneBy: string;
    if (loan.pd_done_by === null) {
      pdDoneBy = 'None';
    } else {
      const pdUser = await userModel.getUser({
        userId: loan.pd_done_by,
        clientId,
      });
      pdDoneBy = pdUser?.name || '';
    }
    const customerInfo = await customerModel.getCustomerById({
      customer_id: loanApproval?.customer_id || '',
      clientId,
    });

    // calculations for interest amount, repay amount, penalty interest
    const interestAmount =
      (loanApproval?.loan_amt_approved || 0) *
      (loanApproval?.tenure || 0) *
      0.01 *
      (loanApproval?.roi || 0);
    const repayAmount = (loanApproval?.loan_amt_approved || 0) + interestAmount;

    const currentDate = new Date();
    let penaltyDay = 0;
    const repayDate = loanApproval?.repay_date || new Date();
    if (repayDate < currentDate) {
      penaltyDay = differenceInDays(currentDate, repayDate);
    }
    const penaltyInterest =
      (loanApproval?.loan_amt_approved || 0) * 0.005 * penaltyDay;

    if (collections.length > 0) {
      loansCount = loansCount - 1;
    }

    const loanCount = await leadsModel.getClosedLoanCount({
      customerId: loanApproval?.customer_id || '',
      clientId,
    });
    if (
      collections.length > 0 ||
      isWithinInterval(loanApproval?.repay_date || new Date(), {
        start: startDate || new Date(),
        end: endDate || new Date(),
      }) === false
    ) {
      return null;
    }
    return {
      id: loan.loan_id,
      leadId: loan.lead_id,
      collectionUser: collectionUserName || '',
      loanNo: loan.loan_no || '',
      branch: loanApproval?.branch || '',
      loanType: loan.loan_type,
      customerStatus: loanCount > 0 ? 'Existing_Customer' : 'Fresh_Customer',
      name: customerInfo?.name || '',
      email: customerInfo?.email || '',
      phoneNo: customerInfo?.mobile || '',
      loanAmount: loan.disbursal_amount || 0,
      tenure: loanApproval?.tenure || 0,
      roi: loanApproval?.roi || 0,
      repaymentAmount: repayAmount || 0,
      repayDate: loanApproval?.repay_date || new Date(),
      penalty: penaltyInterest || 0,
      creditedBy: disbursedBy?.name || '',
      pdDoneBy: pdDoneBy || '',
      createdAt: loan.created_at,
      collections: collections.length,
    };
  });

  const loanData = {
    pendingLoans: await Promise.all(loans),
  };
  return loanData;
};

const getLoanHistory = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const leadDetails = await leadsModel.getLeadById({ leadId, clientId });
  const loanHistory = await loanModel.getAllLoansByCustomerId({
    customerId: leadDetails?.customer_id || '',
    clientId,
  });

  if (loanHistory.length === 0) return null;

  const loans = loanHistory.map(async loan => {
    const approvalData = await approvalModel.getApproval({
      leadId: loan.lead_id,
      clientId,
    });
    const leadData = await leadsModel.getLeadById({
      leadId: loan.lead_id,
      clientId,
    });
    const creditName = await userModel.getUser({
      userId: loan.disbursed_by,
      clientId,
    });
    const collectionData = await collectionModel.getCollectionLatest({
      leadId: leadData?.lead_id || '',
      clientId,
    });

    const collectedDate = parse(
      format(collectionData?.at(0)?.collected_date || new Date(), 'dd-MM-yyyy'),
      'dd-MM-yyyy',
      new Date(),
    );

    return {
      leadId: loan.lead_id,
      loanNo: loan.loan_no || '',
      loanAmount: approvalData?.loan_amt_approved || 0,
      roi: approvalData?.roi || 0,
      days: approvalData?.tenure || 0,
      repayDate: approvalData?.repay_date || new Date(),
      collectionDate: collectedDate,
      credit: creditName?.name || '',
      status: leadData?.status || lead_status.No_Answer,
      collectionRemark:
        collectionData.length !== 0 ? collectionData[0].remark : '',
    };
  });
  return Promise.all(loans);
};

export const loanService = {
  getLoan,
  getBankUpdate,
  getAllPendingLoans,
  getLoanHistory,
  allPendingLoansRemnderEmail,
};
