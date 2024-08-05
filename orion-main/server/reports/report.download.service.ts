import { Prisma, house_types, genders, lead_status } from '@prisma/client';
import { differenceInCalendarDays, format, parse } from 'date-fns';
import { getCurrentRepayAmount, processInBatch } from '../../utils';
import { addressModel } from '../address/address.model';
import { approvalModel } from '../approval/approval.model';
import { customerModel } from '../customer/customer.model';
import { disbursalModel } from '../disbursal/disbursal.model';
import { employerModel } from '../employer/employer.model';
import { leadsModel } from '../leads/leads.model';
import { userModel } from '../user/user.model';
import { reportsDownloadModel } from './reports.download.model';
import { collectionModel } from '../collection/collection.model';
import { clientModel } from '../clients/clients.model';

//get disbursal report
const getDownloadDisbursalReports = async ({
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
  const userDetails = await userModel.getUser({ userId, clientId });
  const BATCH_SIZE = 100;

  let disbursalData = [];
  if (
    userDetails?.role === 'Admin' ||
    userDetails?.role === 'Accounts' ||
    userDetails?.role === 'Service'
  ) {
    disbursalData = await reportsDownloadModel.getDisbursalsForDownload({
      searchparam,
      startDate,
      endDate,
      clientId,
    });
  } else {
    disbursalData = await reportsDownloadModel.getDisbursalsByUserIdForDownload(
      {
        userId,
        searchparam,
        startDate,
        endDate,
        clientId,
      },
    );
  }

  async function processDisbursedData(
    disbursal: Prisma.PromiseReturnType<
      typeof reportsDownloadModel.getDisbursalsForDownload
    >[0],
  ) {
    const approvalData = await approvalModel.getApprovalByLeadId({
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

    if (addressDetails.length === 0) {
      addressDetails = [
        {
          address: 'No Address found',
          city: 'N/A',
          state: 'N/A',
          pincode: 'N/A',
          house_type: house_types?.Owned,
        },
      ];
    }

    return {
      ['Lead Id']: disbursal?.lead_id || '',
      ['Loan No']: disbursal.loan_no || '',
      ['Branch']: approvalData?.branch || '',
      ['Loan Type']: disbursal.loan_type,
      ['Name']: customerDetails?.name || '',
      ['Credit Manager']: creditedByDetails?.name || '',
      ['Gender']: customerDetails?.gender || genders.Male,
      ['DOB']: format(customerDetails?.dob || new Date(), 'dd-MM-yyyy'),
      ['Personal Email']: customerDetails?.email || '',
      ['Office Email']: approvalData?.official_email || '',
      ['Mobile']: customerDetails?.mobile || '',
      address: addressDetails[0]?.address,
      city: addressDetails[0]?.city,
      state: addressDetails[0]?.state,
      pincode: addressDetails[0]?.pincode,
      ['Address Category']: addressDetails[0]?.house_type || house_types?.Owned,
      ['Aadhar Number']: customerDetails?.aadhar_no || '',
      ['PanCard']: customerDetails?.pancard || '',
      ['Loan Amount']: approvalData?.loan_amt_approved || 0,
      ['Approval Date']: format(
        approvalData?.updated_at || new Date(),
        'dd-MM-yyyy',
      ),
      ['Repay Date']: format(
        approvalData?.repay_date || new Date(),
        'dd-MM-yyyy',
      ),
      ['Disbursal Amount']: disbursal.disbursal_amount || 0,
      ['Tenure']: approvalData?.tenure || 0,
      ['ROI']: approvalData?.roi || 0,
      ['Disbursal Date']: format(disbursal.disbursal_date, 'dd-MM-yyyy'),
      ['Account No']: disbursal.account_no || '',
      ['Account Type']: disbursal.account_type || '',
      ['IFSC']: disbursal.bank_ifsc || '',
      ['Bank']: disbursal.bank || '',
      ['Bank Branch']: disbursal.bank_branch || '',
      ['Disbursal ReferenceNo']: disbursal.disbursal_reference_no || '',
      ['Processing Fee']: approvalData?.processing_fee || 0,
      ['Monthly Income']: approvalData?.monthly_income || 0,
      ['Cibil']: approvalData?.cibil || 0,
      ['GST Fee']:
        (approvalData?.processing_fee || 0) * 0.01 * (approvalData?.gst || 0),
      ['utm Source']: leadDetails?.utm_source || '',
      status: leadDetails?.status || lead_status.Disbursed,
    };
  }

  const processedLoans = await processInBatch(
    disbursalData,
    processDisbursedData,
    BATCH_SIZE,
  );

  return processedLoans;
};

//get collection report
const getDownloadCollectionsReport = async ({
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
  const userDetails = await userModel.getUser({ userId, clientId });
  const BATCH_SIZE = 100;

  let collections = [];
  if (
    userDetails?.role === 'Admin' ||
    userDetails?.role === 'Accounts' ||
    userDetails?.role === 'Service'
  ) {
    collections = await reportsDownloadModel.getCollectionsForDownload({
      searchparam,
      startDate,
      endDate,
      clientId,
    });
  } else {
    collections = await reportsDownloadModel.getCollectionsByUserIdForDownload({
      userId,
      searchparam,
      startDate,
      endDate,
      clientId,
    });
  }

  async function processCollectionData(
    collection: Prisma.PromiseReturnType<
      typeof reportsDownloadModel.getCollectionsForDownload
    >[0],
  ) {
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
      ['Lead Id']: leadDetails?.lead_id || '',
      ['Loan No']: disbursalData?.loan_no || '',
      ['Name']: customerDetails?.name || '',
      ['Mobile']: customerDetails?.mobile || '',
      ['Loan Amount']: approvalData?.loan_amt_approved || 0,
      ['Processing Fee']: approvalData?.processing_fee || 0,
      ['Disbursal Date']: format(
        disbursalData?.disbursal_date || new Date(),
        'dd-MM-yyyy',
      ),
      ['Repay Date']: format(
        approvalData?.repay_date || new Date(),
        'dd-MM-yyyy',
      ),
      ['Collected Amount']: collection.collected_amount || 0,
      ['Penalty']: collection.penalty_amount || 0,
      ['Collected Mode']: collection.collected_mode,
      ['Collection Date']: format(
        collection.collected_date || new Date(),
        'dd-MM-yyyy',
      ),
      ['Collection Time']: collection.collection_time || '',
      ['Reference No']: collection.reference_no || '',
      ['Total Collection']: totalCollectionAmount,
      ['Status']: leadDetails?.status || lead_status.Other,
      ['Remark']: collection.remark || '',
      ['Created At']: format(collection.created_at, 'dd-MM-yyyy  hh:mm:ss'),
      ['Employer Name']: employerName,
    };
  }

  const totalCollections = await processInBatch(
    collections,
    processCollectionData,
    BATCH_SIZE,
  );

  return totalCollections;
};

const getDownloadCibilData = async ({
  startDate,
  endDate,
  searchparam,
  clientId,
}: {
  startDate?: Date;
  endDate?: Date;
  searchparam: string;
  clientId: string;
}) => {
  const BATCH_SIZE = 100;
  const disbursedLoans =
    await reportsDownloadModel.getAllDisbursedLoanForDownload({
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

  async function processLoans(
    loan: Prisma.PromiseReturnType<
      typeof reportsDownloadModel.getAllDisbursedLoanForDownload
    >[0],
  ) {
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
      collectionsOnLead.length !== 0
        ? collectionsOnLead.at(0)?.collected_date || new Date()
        : new Date(),
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
      ['Name']: customerDetails?.name || '',
      ['DOB']: format(customerDetails?.dob || new Date(), 'dd-MM-yyyy'),
      ['Gender']: customerDetails?.gender || '',
      ['PAN']: customerDetails?.pancard || '',
      ['Aadhar']: customerDetails?.aadhar_no || '',
      ['Mobile No.']: customerDetails?.mobile || '',
      ['Email']: customerDetails?.email || '',
      ['Address']: address,
      ['City']: city,
      ['State']: state,
      ['Pincode']: pincode,
      ['Loan No.']: loan?.loan_no || '',
      ['Loan Amount']: approvalData?.loan_amt_approved || 0,
      ['Disbursal Date']: format(
        loan?.disbursal_date || new Date(),
        'dd-MM-yyyy',
      ),
      ['Repay Date']: format(
        approvalData?.repay_date || new Date(),
        'dd-MM-yyyy',
      ),
      ['Collection Status']:
        getCollectionStatus(leadDetails?.status || '') || '',
      ['Closure Date']: closureDate,
      ['Current Balance']: approvalData?.loan_amt_approved || 0,
      ['Amount Overdue']: currentRepayAmount,
      ['Over Due days']: daysPastDue,
    };
  }

  const cibilData = await processInBatch(
    disbursedLoans,
    processLoans,
    BATCH_SIZE,
  );

  return await Promise.all(cibilData);
};

const downloadAllPendingLoans = async ({
  searchparam,
  filterBy,
  startDate,
  endDate,
  clientId,
  assigneeId,
}: {
  searchparam?: string;
  filterBy?: string;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
  assigneeId?: string;
}) => {
  let allLoans;
  const BATCH_SIZE = 100;

  // * only Admin and Accounts can see all pending loans
  allLoans = await reportsDownloadModel.getAllLoanPendingForDownload({
    searchparam,
    filterBy,
    startDate,
    endDate,
    clientId,
    assigneeId: assigneeId?.length ? assigneeId : undefined,
  });

  async function processLoan(
    loan: Prisma.PromiseReturnType<
      typeof reportsDownloadModel.getAllLoanPendingForDownload
    >[0],
  ) {
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

    const customerInfo = await customerModel.getCustomerById({
      customer_id: loanApproval?.customer_id || '',
      clientId,
    });

    // calculations for interest amount, repay amount, penalty interest
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
      ['Loan Id']: loan.loan_id,
      ['Lead Id']: loan.lead_id,
      ['Collection User']: collectionUserName || '',
      ['Days Past Due']: daysPastDue,
      ['Loan No.']: loan.loan_no || '',
      ['Name']: customerInfo?.name || '',
      ['Phone No.']: customerInfo?.mobile || '',
      ['Email']: customerInfo?.email || '',
      ['Loan Amount']: loanApproval?.loan_amt_approved || 0,
      ['Tenure']: loanApproval?.tenure || 0,
      ['ROI']: loanApproval?.roi || 0,
      ['Repayment Amount']: Math.round(repayAmount * 100) / 100 || 0,
      ['Current Repayment Amount']:
        Math.round(currentRepayAmount * 100) / 100 || 0,
      ['Repay Date']: format(
        loanApproval?.repay_date || new Date(),
        'dd-MM-yyyy',
      ),
      ['Penalty Interest']: Math.round(penaltyInterest * 100) / 100 || 0,
      ['Status']:
        loan?.status === 'Disbursed'
          ? penaltyInterest > 0
            ? 'Overdue'
            : 'Due'
          : loan?.status || 'Disbursed',
      ['Credited By']: disbursedBy?.name || '',
      ['Remarks']: loan.remarks || '',
    };
  }

  const processedLoans = await processInBatch(
    allLoans,
    processLoan,
    BATCH_SIZE,
  );

  return processedLoans;
};

export const reportsDownloadService = {
  getDownloadDisbursalReports,
  getDownloadCollectionsReport,
  getDownloadCibilData,
  downloadAllPendingLoans,
};
