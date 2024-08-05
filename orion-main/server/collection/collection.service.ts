import { lead_status } from '@prisma/client';
import { userModel } from '../user/user.model';
import { collectionModel } from './collection.model';
import { collectionAdminModel } from './collection.model.admin';
import { userReporteeModel } from '../user-reportee/user-reportee.model';
import { customerModel } from '../customer/customer.model';
import { employerModel } from '../employer/employer.model';
import { leadsModel } from '../leads/leads.model';
import { differenceInCalendarDays, format, parse } from 'date-fns';
import { loanModel } from '../loan/loan.model';
import { allCollections } from './collection.routes';
import { approvalModel } from '../approval/approval.model';
//import { getCurrentRepayAmount, getSignedURLForS3 } from '../../utils';
import { getCurrentRepayAmount } from '../../utils';
import { clientModel } from '../clients/clients.model';

const getCollections = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const collections = await collectionModel.getCollections({
    leadId,
    clientId,
  });

  if (collections.length === 0) return null;

  const collectionData = collections.map(async collection => {
    const collectedBy = await userModel.getUser({
      userId: collection.collected_by,
      clientId,
    });

    return {
      id: collection.collection_id,
      loanNo: collection.loan_no,
      collectionAmount: collection.collected_amount,
      referenceNo: collection.reference_no,
      collectionMode: collection.collected_mode,
      collectionDate: collection.collected_date,
      collectionTime: collection.collection_time,
      discountAmount: collection.discount_amount,
      penaltyAmount: collection.penalty_amount || 0,
      settlementAmount: collection.settlement_amount,
      status: collection.status,
      remarks: collection.remark,
      collectedBy: collectedBy?.name || '',
      createdAt: collection.created_at,
    };
  });

  return Promise.all(collectionData);
};

const getAllCollections = async ({
  limit,
  offset,
  collectionFilter,
  userId,
  filterBy,
  searchparam,
  clientId,
}: {
  limit: number;
  offset: number;
  collectionFilter: lead_status;
  userId: string;
  filterBy: string;
  searchparam?: string;
  clientId: string;
}) => {
  const userDetails = await userModel.getUser({ userId, clientId });
  let collectedLeads;
  let collectedLeadsCount;

  // * only admin and accounts can view all collections
  if (userDetails?.role === 'Admin' || userDetails?.role === 'Accounts') {
    collectedLeads = await collectionAdminModel.getAllCollections({
      limit,
      offset,
      collectionFilter,
      filterBy,
      searchparam,
      clientId,
    });
    collectedLeadsCount = await collectionAdminModel.getAllCollectionsCount({
      collectionFilter,
      filterBy,
      searchparam,
      clientId,
    });
  } else if (userDetails?.role === 'Collection_Manager') {
    const teleCallers = await userModel.getAllUsersByRole({
      userRole: 'Tele_Caller',
      branch: userDetails?.branch,
      clientId,
    });
    const reporteeUserIds = await userReporteeModel.getUserReportees({
      userId,
      clientId,
    });
    collectedLeads = await collectionModel.getFilteredCollections({
      limit,
      offset,
      collectionFilter,
      reporteeUserIds,
      teleCallers,
      filterBy,
      userId,
      clientId,
    });
    collectedLeadsCount = await collectionModel.getFilteredCollectionsCount({
      collectionFilter,
      reporteeUserIds,
      teleCallers,
      userId,
      filterBy,
      clientId,
    });
  } else if (
    userDetails?.role === 'Tele_Caller' ||
    userDetails?.role === 'Collection_Executive'
  ) {
    collectedLeads = await collectionModel.getFilteredCollectionsAssignedToUser(
      {
        limit,
        offset,
        collectionFilter,
        userId,
        filterBy,
        clientId,
      },
    );
    collectedLeadsCount =
      await collectionModel.getFilteredCollectionsAssignedToUserCount({
        collectionFilter,
        userId,
        filterBy,
        clientId,
      });
  } else {
    const reporteeUserIds = await userReporteeModel.getUserReportees({
      userId,
      clientId,
    });
    collectedLeads = await collectionModel.getFilteredCollections({
      limit,
      offset,
      collectionFilter,
      reporteeUserIds,
      filterBy,
      userId,
      clientId,
    });
    collectedLeadsCount = await collectionModel.getFilteredCollectionsCount({
      collectionFilter,
      reporteeUserIds,
      userId,
      filterBy,
      clientId,
    });
  }

  let collections: allCollections[] = [];

  await Promise.all(
    collectedLeads.map(async collectedLead => {
      const customer = await customerModel.getCustomerById({
        customer_id: collectedLead.customer_id,
        clientId,
      });

      let employerName: string = '';
      const employerData = await employerModel.getEmployerLatest({
        customerId: collectedLead.customer_id,
        clientId,
      });

      if (employerData.length === 0) {
        employerName = '';
      } else {
        employerName = employerData[0].employer_name;
      }

      let collectionUserName = 'None';
      if (collectedLead.collection_user_id !== null) {
        const collectionUser = await userModel.getUser({
          userId: collectedLead.collection_user_id,
          clientId,
        });
        collectionUserName = collectionUser?.name || '';
      }

      const collectionInfo = collectedLead.collection.map(collectionInfo => {
        return {
          id: collectionInfo.collection_id,
          leadId: collectedLead.lead_id,
          loanNo: collectedLead.approval?.loan_no || '',
          collectionUser: collectionUserName,
          name: customer?.name || '',
          email: customer?.email || '',
          phoneNo: customer?.mobile || '',
          repayDate: collectedLead.approval?.repay_date || new Date(),
          paymentAmount: collectionInfo.collected_amount,
          paymentMode: collectionInfo.collected_mode,
          paymentDate: collectionInfo.collected_date,
          referenceNo: collectionInfo.reference_no,
          discountAmount: collectionInfo.discount_amount,
          settlementAmount: collectionInfo.settlement_amount,
          status: collectedLead.status,
          createdAt: collectionInfo.created_at,
          employerName: employerName,
        };
      });

      collections = collections.concat(collectionInfo);
    }),
  );

  const collectionData = {
    collections,
    collectedLeadsCount,
  };
  return collectionData;
};

const getWaiverRequests = async ({
  limit,
  offset,
  searchparam,
  clientId,
}: {
  limit: number;
  offset: number;
  searchparam?: string;
  clientId: string;
}) => {
  const allWaiverRequests = await leadsModel.getWaiverRequests({
    limit,
    offset,
    searchparam,
    clientId,
  });

  const waiverRequestsCount = await leadsModel.getWaiverRequestsCount({
    searchparam,
    clientId,
  });

  const waiverRequests = allWaiverRequests.map(async waiverRequest => {
    const customer = await customerModel.getCustomerById({
      customer_id: waiverRequest.customer_id,
      clientId,
    });

    const loan = await loanModel.getLoanByLeadId({
      leadId: waiverRequest.lead_id,
      clientId,
    });

    const approvalDetails = await approvalModel.getApproval({
      clientId,
      leadId: waiverRequest.lead_id,
    });

    const clientDetails = await clientModel.getClient({ clientId });

    const collections = await collectionModel.getCollections({
      leadId: waiverRequest.lead_id,
      clientId,
    });

    const principal = approvalDetails?.loan_amt_approved || 0;
    const roi = approvalDetails?.roi || 0;
    const tenure = approvalDetails?.tenure || 0;
    const repayDate = approvalDetails?.repay_date || new Date();

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
      approvalDetails?.repay_date || new Date(),
    );

    return {
      id: waiverRequest.lead_id,
      daysPastDue,
      loanNo: waiverRequest.approval?.loan_no || '',
      name: customer?.name || '',
      approvalAmount: waiverRequest.approval?.loan_amt_approved || 0,
      repayAmount: currentRepayAmount,
      repayDate: approvalDetails?.repay_date || new Date(),
      penalty: Math.round(penaltyInterest * 100) / 100 || 0,
      waiverAmountType: loan?.waiver_request_type || 'Other',
      waiverAmount: loan?.waiver_request_amount || 0,
      actualRepaymentAmount:
        currentRepayAmount - (loan?.waiver_request_amount || 0),
      status: waiverRequest.waiver_approval || 'Requested',
    };
  });

  const waiverRequestData = {
    waiverRequests: await Promise.all(waiverRequests),
    waiverRequestsCount,
  };
  return waiverRequestData;
};

const getMasterCollectionData = async ({
  searchparam,
  limit,
  offset,
  startDate,
  endDate,
  clientId,
}: {
  searchparam: string;
  limit: number;
  offset: number;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const allLoans = await loanModel.getAllDisbursedLoan({
    searchparam,
    limit,
    offset,
    startDate,
    endDate,
    clientId,
  });

  const collectionsCount = await loanModel.getAllDisbursedLoanCount({
    startDate,
    endDate,
    clientId,
  });

  const collections = allLoans.map(async loan => {
    const leadDetails = await leadsModel.getLeadById({
      leadId: loan.lead_id,
      clientId,
    });

    let collectionUserName: string;

    if (leadDetails?.collection_user_id === null) {
      collectionUserName = 'None';
    } else {
      const collectionUser = await userModel.getUser({
        userId: leadDetails?.collection_user_id || '',
        clientId,
      });
      collectionUserName = collectionUser?.name || '';
    }

    const customerDetails = await customerModel.getCustomerById({
      customer_id: loan.customer_id,
      clientId,
    });

    const approval = await approvalModel.getApproval({
      leadId: loan.lead_id,
      clientId,
    });

    const approvalAmount = approval?.loan_amt_approved || 0;
    const roi = approval?.roi || 0;
    const repayDate = approval?.repay_date || new Date();
    const repayAmount =
      approvalAmount *
      roi *
      differenceInCalendarDays(repayDate, loan.disbursal_date) *
      0.01;

    let penalty = 0;

    if (repayDate < new Date() && leadDetails?.status === 'Disbursed') {
      penalty =
        approvalAmount *
        differenceInCalendarDays(new Date(), repayDate) *
        (roi + 0.25) *
        0.01;
    }

    return {
      id: loan.lead_id,
      collectionUser: collectionUserName || '',
      loanNo: loan.loan_no || '',
      customerName: customerDetails?.name || '',
      mobileNo: customerDetails?.mobile || '',
      loanAmount: approval?.loan_amt_approved || 0,
      disbursalDate: loan.disbursal_date,
      repayAmount: Math.round(repayAmount * 100) / 100,
      repayDate,
      penalty: Math.round(penalty * 100) / 100 || 0,
      status:
        // set as Due if status disbursed and penalty < 0 else Overdue, otherwise status of lead
        leadDetails?.status === 'Disbursed'
          ? penalty > 0
            ? 'Overdue'
            : 'Due'
          : leadDetails?.status || 'Disbursed',
      remarks: loan?.remarks || '',
    };
  });

  return {
    collections: await Promise.all(collections),
    collectionsCount,
  };
};

const getExtensionAmount = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const approvalDetails = await approvalModel.getApproval({ leadId, clientId });

  const loan = await loanModel.getLoanByLeadId({
    leadId,
    clientId,
  });

  const clientDetails = await clientModel.getClient({ clientId });

  const collections = await collectionModel.getCollections({
    leadId,
    clientId,
  });

  const principal = approvalDetails?.loan_amt_approved || 0;
  const processingFees = approvalDetails?.processing_fee || 0;
  const gstFee = processingFees * 0.18;
  const roi = approvalDetails?.roi || 0;
  const tenure = approvalDetails?.tenure || 0;
  const repayDate = approvalDetails?.repay_date || new Date();
  const penaltyRoi = clientDetails?.client_penalty_roi || 1.25; // Corrected penalty rate of interest
  const currentDate =
    collections.at(0)?.status === 'Closed'
      ? parse(
          format(collections.at(0)?.collected_date || new Date(), 'dd-MM-yyyy'),
          'dd-MM-yyyy',
          new Date(),
        )
      : new Date();

  const { currentRepayAmount, penaltyInterest, totalInterest } =
    getCurrentRepayAmount({
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

  const extensionAmount =
    totalInterest + penaltyInterest + processingFees + gstFee;

  return {
    approvalAmount: principal,
    currentRepayAmount,
    totalInterest,
    penaltyInterest,
    extensionAmount,
  };
};

const getCollectionDocument = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const documents = await collectionModel.getCollectionDocument({
    leadId,
    clientId,
  });

  const collectionDocuments = documents.map(async document => {
    //const signedUrl = await getSignedURLForS3(document.document_url);
    const signedUrl = "Hello WOrld"
    return {
      documentId: document.document_id,
      url: signedUrl,
    };
  });

  return await Promise.all(collectionDocuments);
};

export const collectionService = {
  getCollections,
  getAllCollections,
  getWaiverRequests,
  getMasterCollectionData,
  getExtensionAmount,
  getCollectionDocument,
};
