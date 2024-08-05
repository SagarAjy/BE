import axios from 'axios';
import { kycModel } from './kyc.models';
import base64 from 'base-64';
import { userModel } from '../user/user.model';
import { customerService } from '../customer/customer.service';
import { customerModel } from '../customer/customer.model';
import { kycAdminModel } from './kyc.admin.model';
import { userReporteeModel } from '../user-reportee/user-reportee.model';

type DigioKycRequestDataType = {
  id: string;
  updated_at: string;
  created_at: string;
  status: string;
  customer_identifier: string;
  reference_id: string;
  actions: [
    {
      id: string;
      type: string;
      status: string;
      file_id: string;
      sub_file_id: string;
      sub_actions: {
        id: string;
        type: string;
        details: {
          address: string;
          latitude: number;
          longitude: number;
          accuracy: number;
        };
      }[];
    },
    {
      id: string;
      type: string;
      status: string;
      file_id: string;
      sub_file_id: string;
      id_card_data_response: {
        id_no: string;
        name: string;
        fathers_name: string;
        dob: string;
        address: string;
        id_type: string;
      };
    },
    {
      id: string;
      type: string;
      status: string;
      file_id: string;
      id_card_data_response: {
        id_no: string;
        name: string;
        fathers_name: string;
        dob: string;
        id_type: string;
      };
    },
  ];
};

const getKYCRequestDetails = async ({
  customerId,
  clientId,
  leadId,
}: {
  customerId: string;
  clientId: string;
  leadId: string;
}) => {
  const kycRequestDetails = await kycModel.getKYCRequestDetails({
    customerId,
    leadId,
  });

  const customerDetails = await customerModel.getCustomerById({
    customer_id: customerId,
    clientId,
  });

  const uniqueIdentifier = customerDetails?.email || '';

  if (kycRequestDetails) {
    const url = `${process.env.DIGIO_BASE_URL}/client/kyc/v2/${kycRequestDetails?.kyc_request_id}/response`;
    const requestDetails = await axios.post<DigioKycRequestDataType>(
      url,
      {},
      {
        headers: {
          Authorization:
            'Basic ' +
            base64.encode(
              process.env.DIGIO_USERNAME + ':' + process.env.DIGIO_PASSWORD,
            ),
        },
      },
    );

    let requestedBy = '';
    if (kycRequestDetails?.request_by !== null) {
      const user = await userModel.getUser({
        userId: kycRequestDetails?.request_by || '',
        clientId,
      });
      requestedBy = user?.name || '';
    }

    if (requestDetails?.data.status === kycRequestDetails?.status) {
      return {
        id: kycRequestDetails?.kyc_id || '',
        uniqueIdentifier,
        kycRequestId: kycRequestDetails?.kyc_request_id || '',
        videoFileId: kycRequestDetails?.video_file_id || '',
        frontAadharFileId: kycRequestDetails?.front_aadhar_card || '',
        backAadharFileId: kycRequestDetails?.back_aadhar_card || '',
        panCardFileId: kycRequestDetails?.pan_card || '',
        kycLocation: kycRequestDetails?.kyc_location || '',
        aadharDob: kycRequestDetails?.aadhar_dob || '',
        aadharNo: kycRequestDetails?.aadhar_no || '',
        aadharName: kycRequestDetails?.aadhar_customer_name || '',
        aadharFatherName: kycRequestDetails?.aadhar_father_name || '',
        aadharAddress: kycRequestDetails?.aadhar_address || '',
        idTypes: kycRequestDetails?.id_types || '',
        panDob: kycRequestDetails?.pan_dob || '',
        panNo: kycRequestDetails?.pan_no || '',
        panName: kycRequestDetails?.pan_customer_name || '',
        panFatherName: kycRequestDetails?.pan_father_name || '',
        status: kycRequestDetails?.status || '',
        requestDate: kycRequestDetails?.created_at || new Date(),
        requestedBy,
      };
    } else {
      const kycRequestData = await kycModel.updateKYCRequest({
        kycId: kycRequestDetails?.kyc_id || '',
        videoFileId:
          requestDetails?.data.status !== 'requested'
            ? requestDetails?.data.actions[0].file_id
            : '',
        frontAadharFileId:
          requestDetails?.data.status !== 'requested'
            ? requestDetails?.data.actions[1].file_id
            : '',
        backAadharFileId:
          requestDetails?.data.status !== 'requested'
            ? requestDetails?.data.actions[1].sub_file_id
            : '',
        panCardFileId:
          requestDetails?.data.status !== 'requested'
            ? requestDetails?.data.actions[2].file_id
            : '',
        kycLocation:
          requestDetails?.data.status !== 'requested'
            ? requestDetails?.data.actions[0]?.sub_actions[0]?.details
                ?.address || ''
            : '',
        aadharDob:
          requestDetails?.data.status !== 'requested'
            ? requestDetails?.data.actions[1]?.id_card_data_response?.dob || ''
            : '',
        aadharNo:
          requestDetails?.data.status !== 'requested'
            ? requestDetails?.data.actions[1]?.id_card_data_response?.id_no ||
              ''
            : '',
        aadharName:
          requestDetails?.data.status !== 'requested'
            ? requestDetails?.data.actions[1]?.id_card_data_response?.name || ''
            : '',
        aadharFatherName:
          requestDetails?.data.status !== 'requested'
            ? requestDetails?.data.actions[1]?.id_card_data_response
                ?.fathers_name || ''
            : '',
        aadharAddress:
          requestDetails?.data.status !== 'requested'
            ? requestDetails?.data.actions[1]?.id_card_data_response?.address ||
              ''
            : '',
        idTypes:
          requestDetails?.data.status !== 'requested'
            ? requestDetails?.data.actions[1]?.id_card_data_response?.id_type ||
              '' +
                ', ' +
                requestDetails?.data.actions[2]?.id_card_data_response
                  ?.id_type ||
              ''
            : '',
        panDob:
          requestDetails?.data.status !== 'requested'
            ? requestDetails?.data.actions[2]?.id_card_data_response?.dob || ''
            : '',
        panNo:
          requestDetails?.data.status !== 'requested'
            ? requestDetails?.data.actions[2]?.id_card_data_response?.id_no ||
              ''
            : '',
        panName:
          requestDetails?.data.status !== 'requested'
            ? requestDetails?.data.actions[2]?.id_card_data_response?.name || ''
            : '',
        panFatherName:
          requestDetails?.data.status !== 'requested'
            ? requestDetails?.data.actions[2]?.id_card_data_response
                ?.fathers_name || ''
            : '',
        status: requestDetails?.data.status,
      });

      return {
        id: kycRequestData?.kyc_id || '',
        uniqueIdentifier,
        kycRequestId: kycRequestData?.kyc_request_id || '',
        videoFileId: kycRequestData?.video_file_id || '',
        frontAadharFileId: kycRequestData?.front_aadhar_card || '',
        backAadharFileId: kycRequestData?.back_aadhar_card || '',
        panCardFileId: kycRequestData?.pan_card || '',
        kycLocation: kycRequestData?.kyc_location || '',
        aadharDob: kycRequestData?.aadhar_dob || '',
        aadharNo: kycRequestData?.aadhar_no || '',
        aadharName: kycRequestData?.aadhar_customer_name || '',
        aadharFatherName: kycRequestData?.aadhar_father_name || '',
        aadharAddress: kycRequestData?.aadhar_address || '',
        idTypes: kycRequestData?.id_types || '',
        panDob: kycRequestData?.pan_dob || '',
        panNo: kycRequestData?.pan_no || '',
        panName: kycRequestData?.pan_customer_name || '',
        panFatherName: kycRequestData?.pan_father_name || '',
        status: kycRequestData?.status || '',
        requestDate: kycRequestData?.created_at || new Date(),
        requestedBy,
      };
    }
  } else {
    return null;
  }
};

const eSignDocRequestDetails = async ({
  customerId,
  leadId,
  clientId,
}: {
  customerId: string;
  leadId: string;
  clientId: string;
}) => {
  const eSignDocRequest = await kycModel.getESignDocRequest({ leadId });

  const customerDetails = await customerModel.getCustomerById({
    customer_id: customerId,
    clientId,
  });

  const uniqueIdentifier = customerDetails?.email || '';

  if (eSignDocRequest) {
    const url = `${process.env.DIGIO_BASE_URL}/v2/client/document/${eSignDocRequest?.e_sign_doc_id}?name_validation=true`;
    const requestDetails = await axios.get(url, {
      headers: {
        Authorization:
          'Basic ' +
          base64.encode(
            process.env.DIGIO_USERNAME + ':' + process.env.DIGIO_PASSWORD,
          ),
      },
    });

    let requestedBy = '';
    if (eSignDocRequest?.e_sign_request_by !== null) {
      const user = await userModel.getUser({
        userId: eSignDocRequest?.e_sign_request_by || '',
        clientId,
      });
      requestedBy = user?.name || '';
    }

    if (eSignDocRequest?.status === requestDetails?.data.agreement_status) {
      return {
        id: eSignDocRequest?.e_sign_id || '',
        eSignDocId: eSignDocRequest?.e_sign_doc_id || '',
        filename: eSignDocRequest?.filename || '',
        status: eSignDocRequest?.status || '',
        requestDate: eSignDocRequest?.created_at || new Date(),
        uniqueIdentifier,
        requestedBy: requestedBy,
      };
    } else {
      const eSignDocRequestData = await kycModel.updateESignDocRequest({
        eSignId: eSignDocRequest?.e_sign_id || '',
        status: requestDetails?.data.agreement_status,
      });

      return {
        id: eSignDocRequestData?.e_sign_id || '',
        eSignDocId: eSignDocRequestData?.e_sign_doc_id || '',
        filename: eSignDocRequestData?.filename || '',
        status: eSignDocRequestData?.status || '',
        requestDate: eSignDocRequestData?.created_at || new Date(),
        uniqueIdentifier,
        requestedBy: requestedBy,
      };
    }
  } else {
    return null;
  }
};

const getAllKYCRequestDetails = async ({
  limit,
  offset,
  userId,
  searchparam,
  clientId,
}: {
  limit: number;
  offset: number;
  userId: string;
  searchparam: string;
  clientId: string;
}) => {
  const userDetails = await userModel.getUser({ userId, clientId });
  let kycRequestDetails;
  let kycRequestsCount: number;

  if (userDetails?.role === 'Admin') {
    kycRequestDetails = await kycAdminModel.getAllKycRequests({
      limit,
      offset,
      searchparam,
    });
    kycRequestsCount = await kycAdminModel.getAllKycRequestsCount({
      searchparam,
    });
  } else {
    const reporteeUserIds = await userReporteeModel.getUserReportees({
      userId,
      clientId,
    });
    kycRequestDetails = await kycModel.getAllKycRequests({
      limit,
      offset,
      userId,
      reporteeUserIds,
    });
    kycRequestsCount = await kycModel.getAllKycRequestsCount({
      userId,
      reporteeUserIds,
    });
  }

  const kycRequestData = kycRequestDetails.map(async kyc => {
    const customerDetails = await customerModel.getCustomerById({
      customer_id: kyc.customer_identifier,
      clientId,
    });
    const requestedBy = await userModel.getUser({
      userId: kyc.request_by || '',
      clientId,
    });
    return {
      id: kyc.kyc_id,
      kycRequestId: kyc.kyc_request_id,
      name: customerDetails?.name || '',
      email: customerDetails?.email || '',
      leadId: kyc.lead_id,
      kycLocation: kyc.kyc_location || '',
      status: kyc.status || '',
      requestDate: kyc.created_at || new Date(),
      requestedBy: requestedBy?.name || '',
    };
  });

  return {
    kycData: await Promise.all(kycRequestData),
    count: kycRequestsCount,
  };
};

const getAllESignRequests = async ({
  limit,
  offset,
  userId,
  searchparam,
  clientId,
}: {
  limit: number;
  offset: number;
  userId: string;
  searchparam: string;
  clientId: string;
}) => {
  const userDetails = await userModel.getUser({ userId, clientId });
  let eSignDocRequestDetails;
  let eSignDocRequestsCount: number;

  if (userDetails?.role === 'Admin') {
    eSignDocRequestDetails = await kycAdminModel.getAllESignRequests({
      limit,
      offset,
      searchparam,
    });
    eSignDocRequestsCount = await kycAdminModel.getAllESignRequestsCount({
      searchparam,
    });
  } else {
    const reporteeUserIds = await userReporteeModel.getUserReportees({
      userId,
      clientId,
    });
    eSignDocRequestDetails = await kycModel.getAllESignRequests({
      limit,
      offset,
      userId,
      reporteeUserIds,
    });
    eSignDocRequestsCount = await kycModel.getAllESignRequestsCount({
      userId,
      reporteeUserIds,
    });
  }

  const eSignData = eSignDocRequestDetails.map(async eSign => {
    const requestedBy = await userModel.getUser({
      userId: eSign.e_sign_request_by || '',
      clientId,
    });
    const customerDetails = await customerService.getCustomerByLeadId({
      leadId: eSign.lead_id || '',
      clientId,
    });
    return {
      id: eSign.e_sign_id,
      name: customerDetails?.customerName || '',
      leadId: eSign.lead_id,
      email: customerDetails?.email || '',
      requestId: eSign.e_sign_doc_id || '',
      fileName: eSign.filename || '',
      status: eSign.status || '',
      requestedBy: requestedBy?.name || '',
      requestDate: eSign.created_at || new Date(),
    };
  });

  return {
    eSignDocs: await Promise.all(eSignData),
    count: eSignDocRequestsCount,
  };
};

export const kycService = {
  getKYCRequestDetails,
  eSignDocRequestDetails,
  getAllKYCRequestDetails,
  getAllESignRequests,
};
