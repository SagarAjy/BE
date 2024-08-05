import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';
import { ESignDocRequestType } from './kyc.routes';
import { userReportees } from '../leads/leads.model';

const addKYCRequest = async ({
  leadId,
  kycRequestId,
  customerIdentifier,
  requestBy,
  clientId,
}: {
  leadId: string;
  kycRequestId: string;
  customerIdentifier: string;
  requestBy: string | null;
  clientId: string;
}) => {
  const response = await prisma.kyc_requests.create({
    data: {
      kyc_id: uuid(),
      lead_id: leadId,
      kyc_request_id: kycRequestId,
      customer_identifier: customerIdentifier,
      status: 'Requested',
      request_by: requestBy,
      created_at: new Date(),
      client_id: clientId,
    },
  });

  return response;
};

const getKYCRequestDetails = async ({
  customerId,
  leadId,
}: {
  customerId: string;
  leadId: string;
}) => {
  const response = await prisma.kyc_requests.findFirst({
    where: {
      customer_identifier: customerId,
      lead_id: leadId,
    },
  });

  return response;
};

const updateKYCRequest = async ({
  kycId,
  videoFileId,
  frontAadharFileId,
  backAadharFileId,
  panCardFileId,
  kycLocation,
  aadharDob,
  aadharNo,
  aadharName,
  aadharFatherName,
  aadharAddress,
  idTypes,
  panDob,
  panNo,
  panName,
  panFatherName,
  status,
}: {
  kycId: string;
  videoFileId: string;
  frontAadharFileId: string;
  backAadharFileId: string;
  panCardFileId: string;
  kycLocation: string;
  aadharDob: string;
  aadharNo: string;
  aadharName: string;
  aadharFatherName: string;
  aadharAddress: string;
  idTypes: string;
  panDob: string;
  panNo: string;
  panName: string;
  panFatherName: string;
  status: string;
}) => {
  const response = await prisma.kyc_requests.update({
    where: {
      kyc_id: kycId,
    },
    data: {
      video_file_id: videoFileId,
      front_aadhar_card: frontAadharFileId,
      back_aadhar_card: backAadharFileId,
      pan_card: panCardFileId,
      kyc_location: kycLocation,
      aadhar_dob: aadharDob,
      aadhar_no: aadharNo,
      aadhar_customer_name: aadharName,
      aadhar_father_name: aadharFatherName,
      aadhar_address: aadharAddress,
      id_types: idTypes,
      pan_dob: panDob,
      pan_no: panNo,
      pan_customer_name: panName,
      pan_father_name: panFatherName,
      status: status,
    },
  });

  return response;
};

const addESignDocRequest = async ({
  eSignDocRequest,
  customerId,
  userId,
  leadId,
  clientId,
}: {
  eSignDocRequest: ESignDocRequestType;
  customerId: string;
  userId: string | null;
  leadId: string;
  clientId: string;
}) => {
  const response = await prisma.e_sign_docs.create({
    data: {
      e_sign_id: uuid(),
      customer_id: customerId,
      e_sign_doc_id: eSignDocRequest.data.id,
      filename: eSignDocRequest.data.file_name,
      customer_status: 'Active',
      e_sign_request_by: userId,
      lead_id: leadId,
      created_at: new Date(),
      status: eSignDocRequest.data.agreement_status,
      client_id: clientId,
    },
  });

  return response;
};

const getESignDocRequest = async ({ leadId }: { leadId: string }) => {
  const response = await prisma.e_sign_docs.findFirst({
    where: {
      lead_id: leadId,
    },
  });

  return response;
};

const updateESignDocRequest = async ({
  eSignId,
  status,
}: {
  eSignId: string;
  status: string;
}) => {
  const response = await prisma.e_sign_docs.update({
    where: {
      e_sign_id: eSignId,
    },
    data: {
      status,
    },
  });

  return response;
};

const getAllKycRequests = async ({
  limit,
  offset,
  userId,
  reporteeUserIds,
}: {
  limit: number;
  offset: number;
  userId: string;
  reporteeUserIds: userReportees[];
}) => {
  const response = await prisma.kyc_requests.findMany({
    take: limit,
    skip: offset,
    where: {
      OR: [
        {
          leads: {
            user_id: userId,
          },
        },
        {
          leads: {
            user_id: {
              in: reporteeUserIds.map(reportee => reportee.user_reportee_id),
            },
          },
        },
      ],
    },
  });

  return response;
};

const getAllKycRequestsCount = async ({
  userId,
  reporteeUserIds,
}: {
  userId: string;
  reporteeUserIds: userReportees[];
}) => {
  const response = await prisma.kyc_requests.count({
    where: {
      OR: [
        {
          leads: {
            user_id: userId,
          },
        },
        {
          leads: {
            user_id: {
              in: reporteeUserIds.map(reportee => reportee.user_reportee_id),
            },
          },
        },
      ],
    },
  });

  return response;
};

const getAllESignRequests = async ({
  limit,
  offset,
  userId,
  reporteeUserIds,
}: {
  limit: number;
  offset: number;
  userId: string;
  reporteeUserIds: userReportees[];
}) => {
  const response = await prisma.e_sign_docs.findMany({
    take: limit,
    skip: offset,
    where: {
      OR: [
        {
          leads: {
            user_id: userId,
          },
        },
        {
          leads: {
            user_id: {
              in: reporteeUserIds.map(reportee => reportee.user_reportee_id),
            },
          },
        },
      ],
    },
  });

  return response;
};

const getAllESignRequestsCount = async ({
  userId,
  reporteeUserIds,
}: {
  userId: string;
  reporteeUserIds: userReportees[];
}) => {
  const response = await prisma.e_sign_docs.count({
    where: {
      OR: [
        {
          leads: {
            user_id: userId,
          },
        },
        {
          leads: {
            user_id: {
              in: reporteeUserIds.map(reportee => reportee.user_reportee_id),
            },
          },
        },
      ],
    },
  });

  return response;
};

const deleteKYCRequest = async ({
  kycId,
  clientId,
}: {
  kycId: string;
  clientId: string;
}) => {
  const response = await prisma.kyc_requests.delete({
    where: {
      kyc_id: kycId,
      client_id: clientId,
    },
  });
};

const deleteESignDocRequest = async ({
  eSignId,
  clientId,
}: {
  eSignId: string;
  clientId: string;
}) => {
  const response = await prisma.e_sign_docs.delete({
    where: {
      e_sign_id: eSignId,
      client_id: clientId,
    },
  });
};

export const kycModel = {
  addKYCRequest,
  getKYCRequestDetails,
  updateKYCRequest,
  addESignDocRequest,
  getESignDocRequest,
  updateESignDocRequest,
  getAllKycRequests,
  getAllKycRequestsCount,
  getAllESignRequests,
  getAllESignRequestsCount,
  deleteKYCRequest,
  deleteESignDocRequest,
};
