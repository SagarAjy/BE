import { differenceInCalendarDays, format, parse } from 'date-fns';
import { collectionModel } from '../../collection/collection.model';
import { customerModel } from '../../customer/customer.model';
import { documentsModel } from '../../documents/documents.model';
import { leadsModel } from '../../leads/leads.model';
import { loanModel } from '../../loan/loan.model';
// import { getCurrentRepayAmount, getSignedURLForS3 } from '../../../utils';
import { getCurrentRepayAmount} from '../../../utils';
import { approvalModel } from '../../approval/approval.model';
import { clientModel } from '../../clients/clients.model';
import { document_type } from '@prisma/client';

const getCustomerByPhoneNo = async ({
  phoneNo,
  clientId,
}: {
  phoneNo: string;
  clientId: string;
}) => {
  const customer = await customerModel.getCustomerByPhoneNo({
    phoneNo,
    clientId,
  });
  const leads = await leadsModel.getLeadsByCustomerId({
    customerId: customer?.customer_id || '',
    clientId,
  });
  const documents = await documentsModel.getDocumentsByCustomerId({
    customerId: customer?.customer_id || '',
    clientId,
  });

  let customerPictureUrl = '';
  const customerPicture = documents.filter(
    document => document.document_type === 'Selfie',
  );

  if (customerPicture.length === 0) {
    customerPictureUrl = '';
  } else {
    // const signedUrl = await getSignedURLForS3(
    //   customerPicture[0]?.document_url || '',
    // );
    const signedUrl = ''
    

    customerPictureUrl = signedUrl;
  }

  return {
    id: customer?.customer_id || '',
    customerName: customer?.name || '',
    customerPicture: customerPictureUrl || '',
    email: customer?.email || '',
    phoneNo: customer?.mobile || '',
    gender: customer?.gender || 'Male',
    createdAt: customer?.created_at || new Date(),
    pan: customer?.pancard || '',
    aadhar: customer?.aadhar_no || '',
    dob: customer?.dob || new Date(),
    city: leads.at(0)?.city || '',
    status: leads.at(0)?.status || 'Fresh_Lead',
  };
};

const getApplicationDetailsByPhoneNo = async ({
  phoneNo,
  clientId,
}: {
  phoneNo: string;
  clientId: string;
}) => {
  const customer = await customerModel.getCustomerByPhoneNo({
    phoneNo,
    clientId,
  });

  const leads = await leadsModel.getLeadsByCustomerId({
    customerId: customer?.customer_id || '',
    clientId,
  });

  if (leads.length === 0) {
    return null;
  }
  const latestLead = leads.at(0);
  let stepsCompleted = 0;

  const loanData = await loanModel.getLoanByLeadId({
    leadId: latestLead?.lead_id || '',
    clientId,
  });

  switch (latestLead?.status) {
    case 'Approved':
      stepsCompleted = 1;
      break;
    case 'Bank_Update':
      stepsCompleted = 1;
      break;
    case 'Disbursed':
      stepsCompleted = 2;
      break;
    case 'Closed':
      stepsCompleted = 3;
      break;
    case 'Rejected':
      stepsCompleted = -1;
      break;
  }

  const approvalData = await approvalModel.getApproval({
    leadId: latestLead?.lead_id || '',
    clientId,
  });
  const collections = await collectionModel.getCollections({
    leadId: latestLead?.lead_id || '',
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
      ? parse(
          format(collections.at(0)?.collected_date || new Date(), 'dd-MM-yyyy'),
          'dd-MM-yyyy',
          new Date(),
        )
      : new Date();
  const totalRepayAmount = principal + principal * roi * tenure * 0.01;

  const { currentRepayAmount } = getCurrentRepayAmount({
    principal,
    roi,
    tenure,
    penaltyRoi,
    amtApproved: principal,
    currentDate,
    collections,
    repaymentDate: repayDate,
    disbursalDate: loanData?.disbursal_date || new Date(),
  });

  return {
    id: latestLead?.approval?.loan_no || 'N/A',
    status: latestLead?.status || 'Fresh_Lead',
    stepsCompleted,
    loanAmountRequired: latestLead?.loan_required || '',
    repayDate: latestLead?.approval?.repay_date || new Date(),
    repaymentAmount: totalRepayAmount || 0,
    repayAmountTillNow: currentRepayAmount || 0,
    approvalAmount: principal || 0,
    purpose: latestLead?.purpose || '',
  };
};

const getCustomerDocumentsByPhoneNo = async ({
  phoneNo,
  clientId,
}: {
  phoneNo: string;
  clientId: string;
}) => {
  const customer = await customerModel.getCustomerByPhoneNo({
    phoneNo,
    clientId,
  });
  const documentResponse = await documentsModel.getDocumentsByCustomerId({
    customerId: customer?.customer_id || '',
    clientId,
  });

  const documentsData = documentResponse.map(documents => {
    return {
      id: documents.document_id || '',
      documentType: documents.document_type,
      documentUrl: documents.document_url || '',
      password: documents.password || '',
      status: documents.status,
    };
  });

  return documentsData;
};

const getCustomerDocumentByDocumentType = async ({
  documentType,
  phoneNo,
  clientId,
}: {
  documentType: document_type;
  phoneNo: string;
  clientId: string;
}) => {
  const customer = await customerModel.getCustomerByPhoneNo({
    phoneNo,
    clientId,
  });
  const documentResponse = await documentsModel.getDocumentByDocumentType({
    documentType,
    customerId: customer?.customer_id || '',
    clientId,
  });

  return {
    id: documentResponse?.document_id || '',
    documentType: documentResponse?.document_type || 'Aadhar_Card',
    documentUrl: documentResponse?.document_url || '',
    password: documentResponse?.password || '',
    status: documentResponse?.status || 'Not_Verified',
  };
};

const getCustomerApplicationHistoryByPhoneNo = async ({
  phoneNo,
  clientId,
}: {
  phoneNo: string;
  clientId: string;
}) => {
  const customer = await customerModel.getCustomerByPhoneNo({
    phoneNo,
    clientId,
  });

  const applicationHistory = await leadsModel.getLeadsByCustomerId({
    customerId: customer?.customer_id || '',
    clientId,
  });

  const applicationHistoryData = applicationHistory.map(async application => {
    let approvalAmount = 0;
    if (application.approval?.status === 'Approved') {
      approvalAmount = application.approval.loan_amt_approved || 0;
    }

    let repaymentAmount = 0;
    if (
      application.status === 'Closed' ||
      application.status === 'Settlement' ||
      application.status === 'Part_Payment' ||
      application.status === 'Disbursed'
    ) {
      const interestAmount =
        (application.approval?.loan_amt_approved || 0) *
        (application.approval?.tenure || 0) *
        0.01 *
        (application.approval?.roi || 0);
      repaymentAmount =
        (application.approval?.loan_amt_approved || 0) + interestAmount;
    }

    let collectionAmount = 0;
    let loanNo = 'N/A';
    if (
      application.status === 'Disbursed' ||
      application.status === 'Closed' ||
      application.status === 'Settlement' ||
      application.status === 'Part_Payment'
    ) {
      const loan = await loanModel.getLoanByLeadId({
        leadId: application.lead_id,
        clientId,
      });
      const collection = await collectionModel.getCollections({
        leadId: application.lead_id,
        clientId,
      });
      loanNo = loan?.loan_no || '';
      collectionAmount = collection.reduce((accumulator, collection) => {
        return accumulator + collection.collected_amount;
      }, 0);
    }

    let stepsCompleted = 0;

    switch (application.status) {
      case 'Approved':
        stepsCompleted = 1;
        break;
      case 'Bank_Update':
        stepsCompleted = 1;
        break;
      case 'Disbursed':
        stepsCompleted = 2;
        break;
      case 'Closed':
        stepsCompleted = 3;
        break;
      case 'Rejected':
        stepsCompleted = -1;
        break;
    }

    return {
      id: application.lead_id || '',
      loanNo: loanNo,
      status: application.status,
      loanAmountRequired: application.loan_required || '',
      approvedAmount: approvalAmount,
      repaymentAmount,
      repaymentDate: application.approval?.repay_date || new Date(),
      collectedAmount: collectionAmount,
      purpose: application.purpose || '',
      stepsCompleted,
      createdAt: application.created_at,
    };
  });

  return Promise.all(applicationHistoryData);
};

const getReapplyData = async ({
  phoneNo,
  clientId,
}: {
  phoneNo: string;
  clientId: string;
}) => {
  const customer = await customerModel.getCustomerByPhoneNo({
    phoneNo,
    clientId,
  });

  const leads = await leadsModel.getLeadsByCustomerId({
    customerId: customer?.customer_id || '',
    clientId,
  });

  const latestLead = leads.at(0);

  let leadStatus = '';
  switch (latestLead?.status) {
    case 'Rejected':
      leadStatus = 'Closed';
      break;
    case 'Closed':
      leadStatus = 'Closed';
      break;
    case 'Settlement':
      leadStatus = 'Closed';
      break;
    case 'Part_Payment':
      leadStatus = 'Closed';
      break;
    default:
      leadStatus = 'Open';
      break;
  }

  return {
    monthlyIncome: latestLead?.monthly_income || 0,
    loanAmountRequired: latestLead?.loan_required || 0,
    purpose: latestLead?.purpose || '',
    state: latestLead?.state || '',
    city: latestLead?.city || '',
    pincode: latestLead?.pincode || '',
    latestLeadStatus: leadStatus,
  };
};

const getEmiLoanDetails = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const latestLead = await leadsModel.getLatestLeadByCustomerId({
    customerId,
    clientId,
  });

  const leadId = latestLead?.lead_id || '';

  const approvalForLead = await approvalModel.getApproval({ leadId, clientId });

  if (approvalForLead) {
    return {
      loanNo: approvalForLead?.loan_no || '',
      approvalAmount: approvalForLead?.loan_amt_approved || 0,
      tenure: approvalForLead?.tenure || 0,
      status: latestLead?.status || 'Fresh_Lead',
    };
  } else {
    return {
      loanNo: 'N/A',
      approvalAmount: 0,
      tenure: 0,
      status: 'Pending Approval',
    };
  }
};

export const customerService = {
  getCustomerByPhoneNo,
  getApplicationDetailsByPhoneNo,
  getCustomerDocumentsByPhoneNo,
  getCustomerDocumentByDocumentType,
  getCustomerApplicationHistoryByPhoneNo,
  getReapplyData,
  getEmiLoanDetails,
};
