import express, { Router } from 'express';
import { fetchUser } from '../middleware/auth.middleware';
import { logger } from '../../logger';
import axios from 'axios';
import { customerService } from '../customer/customer.service';
import { kycModel } from './kyc.models';
import base64 from 'base-64';
import { kycService } from './kyc.service';
import cache from 'memory-cache';
import { differenceInCalendarDays, format } from 'date-fns';
import { addressService } from '../address/address.service';
import { leadsService } from '../leads/leads.service';
import { approvalService } from '../approval/approval.service';
import { Blob } from 'node:buffer';
import { formatIndianNumber } from '../../utils';
import { auditLogModel } from '../audit-logs/audit-logs.model';
import { clientModel } from '../clients/clients.model';

export type GetKYCDetailsResponse = {
  id: string;
  uniqueIdentifier: string;
  kycRequestId: string;
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
  requestDate: Date;
  requestedBy: string;
};

export type GetESignDocsResponse = {
  id: string;
  eSignDocId: string;
  filename: string;
  status: string;
  requestDate: Date;
  uniqueIdentifier: string;
  requestedBy: string;
};

export type ESignDocRequestType = {
  data: {
    id: string;
    agreement_status: string;
    file_name: string;
    access_token: {
      id: string;
    };
  };
};

type DigioESignRequestType = {
  signers: {
    identifier: string;
    reason: string;
    signer_tag: string;
    name: string;
    sign_type: string;
  }[];
  expire_in_days: string;
  templates: {
    template_key: string;
    images: {};
    template_values: {
      date: string;
      customer_address: string;
      date_of_disbursal: string;
      loan_no: string;
      purpose: string;
      customer_phone: string;
      processing_fee: string;
      loan_amt: string;
      roi: string;
      customer_pan: string;
      total_interest: string;
      disbursal_amt: string;
      repayment_date: string;
      customer_email: string;
      customer_name: string;
      tenure: string;
      gst_amt: string;
      repayment_amt: string;
    };
  }[];
};

type AllKycRequestsResponseType = {
  id: string;
  kycRequestId: string;
  name: string;
  email: string;
  kycLocation: string;
  leadId: string;
  status: string;
  requestDate: Date;
  requestedBy: string;
};

type AllESignDocsResponseType = {
  id: string;
  name: string;
  leadId: string;
  email: string;
  requestId: string;
  fileName: string;
  status: string;
  requestedBy: string;
  requestDate: Date;
};

export const kycRouter: Router = express.Router();

kycRouter.post<{ leadId: string }, { message: string }>(
  '/request/:leadId',
  fetchUser,
  async (req, res) => {
    try {
      //@ts-ignore
      const userId = req.user.user;
      //@ts-ignore
      const clientId = req.clientId;
      const { leadId } = req.params;

      const customerDetails = await customerService.getCustomerByLeadId({
        leadId,
        clientId,
      });
      const clientDetails = await clientModel.getClient({ clientId });

      const digoUrl = `${process.env.DIGIO_BASE_URL}/client/kyc/v2/request/with_template`;
      const kycRequest = await axios.post(
        digoUrl,
        {
          customer_identifier: customerDetails.email,
          customer_name: customerDetails.customerName,
          reference_id: customerDetails?.id,
          template_name: clientDetails?.kyc_template_name,
          notify_customer: true,
          generate_access_token: true,
        },
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

      await kycModel.addKYCRequest({
        leadId,
        customerIdentifier: customerDetails.id,
        kycRequestId: kycRequest.data.id,
        requestBy: userId,
        clientId,
      });

      res.status(200).send({ message: 'KYC Request sent!' });
    } catch (error) {
      logger.error(error);
      console.log(error);
      res.status(500).send({ message: 'Some error occured' });
    }
  },
);

kycRouter.post<{ requestId: string }, { message: string }, { status: string }>(
  '/approve-kyc/:requestId',
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const digoUrl = `${process.env.DIGIO_BASE_URL}/client/kyc/v2/request/${requestId}/manage_approval`;
      await axios.post(
        digoUrl,
        {
          status: req.body.status,
        },
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

      res.status(200).send({ message: 'KYC Request approved!' });
    } catch (error) {
      logger.error(error);
      res.status(500).send({ message: 'Some error occured' });
    }
  },
);

kycRouter.get<
  { leadId: string },
  GetKYCDetailsResponse | { message: string } | null
>('/get-kyc-details/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const customerDetails = await customerService.getCustomerByLeadId({
      leadId,
      clientId,
    });

    const kycRequestDetails = await kycService.getKYCRequestDetails({
      customerId: customerDetails.id,
      clientId,
      leadId,
    });

    res.status(200).send(kycRequestDetails);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

kycRouter.get<{ fileId: string }, BinaryData | { message: string }>(
  '/get-kyc-files/:fileId',
  fetchUser,
  async (req, res) => {
    try {
      const { fileId } = req.params;
      const fileType = decodeURIComponent(req.query.fileType as string);

      const fileResponse = await getKYCVideo({ fileId, fileType });

      const fileBlob = new Blob([fileResponse.data], {
        type: fileType === 'VIDEO' ? 'video/mp4' : 'image/png',
      });

      // Convert Blob to Buffer
      const buffer = Buffer.from(await fileBlob.arrayBuffer());

      // Set headers to indicate that the server accepts range requests
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader(
        'Content-Type',
        fileType === 'VIDEO' ? 'video/mp4' : 'image/png',
      );

      // Send the entire video content
      res.status(200).end(buffer, 'binary');
    } catch (error) {
      logger.error(error);
      res.status(500).send({ message: 'Some error occured' });
    }
  },
);

const getKYCVideo = async ({
  fileId,
  fileType,
}: {
  fileId: string;
  fileType: string;
}) => {
  const cachedData = cache.get(fileId);

  if (cachedData) {
    // If cached data exists, return it
    return cachedData;
  } else {
    const digoUrl = `${process.env.DIGIO_BASE_URL}/client/kyc/v2/media/${fileId}?doc_type=${fileType}`;
    const videoFileResponse = await axios.get<BinaryType>(digoUrl, {
      headers: {
        Authorization:
          'Basic ' +
          base64.encode(
            process.env.DIGIO_USERNAME + ':' + process.env.DIGIO_PASSWORD,
          ),
      },
      responseType: 'arraybuffer', // Set responseType to 'arraybuffer'
    });

    if (fileType === 'VIDEO') {
      // Cache the API response for 10 minutes (adjust as needed)
      cache.put(fileId, videoFileResponse, 10 * 60 * 1000);
    }

    return videoFileResponse;
  }
};

kycRouter.post<{ leadId: string }, { message: string }>(
  '/request-e-sign/:leadId',
  fetchUser,
  async (req, res) => {
    try {
      const { leadId } = req.params;

      //@ts-ignore
      const userId = req.user.user;
      //@ts-ignore
      const clientId = req.clientId;

      const leadDetails = await leadsService.getLead({ leadId, clientId });
      const customerDetails = await customerService.getCustomerByLeadId({
        leadId,
        clientId,
      });
      const addressDetails = await addressService.getAddress({
        leadId,
        clientId,
      });
      const approvalDetails = await approvalService.getapproval({
        leadId,
        clientId,
      });

      const clientDetails = await clientModel.getClient({
        clientId,
      });

      const NBFCName = clientDetails?.client_nbfc || 'NBFC';

      const approvalAmount = approvalDetails?.approvalAmount || 0;

      const processingFees = approvalDetails?.processingFee || 0;

      const gstAmount = processingFees * 0.01 * (approvalDetails?.gst || 0);

      const tempTenure = differenceInCalendarDays(
        approvalDetails?.repayDate || new Date(),
        new Date(),
      );
      const interestAmount =
        approvalAmount * tempTenure * 0.01 * (approvalDetails?.roi || 0);

      const disbursalAmount = approvalAmount - (processingFees + gstAmount);

      const repaymentAmount = approvalAmount + interestAmount;

      const digoUrl = `${process.env.DIGIO_BASE_URL}/v2/client/template/multi_templates/create_sign_request`;
      const eSignDocRequest: ESignDocRequestType = await axios.post(
        digoUrl,
        {
          signers: [
            {
              identifier: customerDetails.email,
              reason: `Loan Agreement by ${NBFCName}`,
              signer_tag: 'Signer 1',
              name: customerDetails.customerName,
              sign_type: 'aadhaar',
            },
          ],
          expire_in_days: '10',
          send_sign_link: 'true',
          notify_signers: 'true',
          display_on_page: 'all',
          templates: [
            {
              template_key: clientDetails?.e_sign_id,
              images: {},
              template_values: {
                date: format(new Date(), 'dd-MM-yyyy'),
                customer_address:
                  addressDetails.at(0)?.address +
                    ', ' +
                    addressDetails?.at(0)?.city +
                    ', ' +
                    addressDetails?.at(0)?.state || '',
                date_of_disbursal: format(new Date(), 'dd-MM-yyyy') || '',
                loan_no: approvalDetails?.loanNo || '',
                purpose: leadDetails.purpose,
                customer_phone: customerDetails.phoneNo,
                processing_fee: formatIndianNumber(processingFees),
                loan_amt: formatIndianNumber(
                  approvalDetails?.approvalAmount || 0,
                ),
                roi: (approvalDetails?.roi || 1) * tempTenure + '%',
                customer_pan: customerDetails.pan,
                total_interest: formatIndianNumber(interestAmount),
                disbursal_amt: formatIndianNumber(disbursalAmount),
                total_deductions: formatIndianNumber(
                  (approvalDetails?.approvalAmount || 0) - disbursalAmount,
                ),
                repayment_date: format(
                  approvalDetails?.repayDate || new Date(),
                  'dd-MM-yyyy',
                ),
                customer_email: customerDetails.email,
                customer_name: customerDetails.customerName,
                tenure: tempTenure + ' days' || '0 days',
                gst_amt: formatIndianNumber(gstAmount),
                repayment_amt: formatIndianNumber(repaymentAmount),
                apr: (approvalDetails?.roi || 1) * tempTenure,
              },
            },
          ],
        },
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

      await kycModel.addESignDocRequest({
        eSignDocRequest,
        customerId: customerDetails.id,
        userId,
        leadId,
        clientId,
      });

      res.status(200).send({ message: 'E-Sign Request sent!' });
    } catch (error) {
      logger.error(error);
      res.status(500).send({ message: 'Some error occured' });
    }
  },
);

kycRouter.get<
  { leadId: string },
  GetESignDocsResponse | { message: string } | null
>('/get-e-sign-docs/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;

    const customerDetails = await customerService.getCustomerByLeadId({
      leadId,
      clientId,
    });

    const eSignDocsRequest = await kycService.eSignDocRequestDetails({
      customerId: customerDetails.id,
      leadId,
      clientId,
    });
    res.status(200).send(eSignDocsRequest);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

kycRouter.get<{ leadId: string }, BinaryData | { message: string }>(
  '/download-e-sign-doc/:leadId',
  fetchUser,
  async (req, res) => {
    try {
      const { leadId } = req.params;
      //@ts-ignore
      const userId = req.user.user;
      //@ts-ignore
      const clientId = req.clientId;

      const eSignDocRequest = await kycModel.getESignDocRequest({ leadId });
      const fileResponse = await axios.get(
        `${process.env.DIGIO_BASE_URL}/v2/client/document/download?document_id=${eSignDocRequest?.e_sign_doc_id}`,
        {
          headers: {
            Authorization:
              'Basic ' +
              base64.encode(
                process.env.DIGIO_USERNAME + ':' + process.env.DIGIO_PASSWORD,
              ),
          },
          responseType: 'arraybuffer',
        },
      );

      const fileBlob = new Blob([fileResponse.data], {
        type: 'application/pdf',
      });

      // Convert Blob to Buffer
      const buffer = Buffer.from(await fileBlob.arrayBuffer());

      // Set headers to indicate that the server accepts range requests
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', 'application/pdf');

      await auditLogModel.createLog({
        activity: `Downloaded E-Sign doc for lead ${leadId}`,
        userId,
        eventType: 'Download',
        clientId,
      });

      // Send the entire video content
      res.status(200).end(buffer, 'binary');
    } catch (error) {
      logger.error(error);
      res.status(500).send({ message: 'Some error occured' });
    }
  },
);

kycRouter.get<
  Record<never, never>,
  | { kycData: AllKycRequestsResponseType[]; count: number }
  | { message: string },
  Record<never, never>,
  { limit: string; offset: string; search: string }
>('/get-all-kyc', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const searchparam = req.query.search || '';
    const kycRequestDetails = await kycService.getAllKYCRequestDetails({
      limit,
      offset,
      userId,
      searchparam,
      clientId,
    });
    res.status(200).send(kycRequestDetails);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

kycRouter.get<
  Record<never, never>,
  | { eSignDocs: AllESignDocsResponseType[]; count: number }
  | { message: string },
  Record<never, never>,
  { limit: string; offset: string; search: string }
>('/get-all-e-sign-docs', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;

    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const searchparam = req.query.search || '';
    const eSignDocRequestDetails = await kycService.getAllESignRequests({
      limit,
      offset,
      userId,
      searchparam,
      clientId,
    });
    res.status(200).send(eSignDocRequestDetails);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

kycRouter.delete('/delete-kyc/:kycId', fetchUser, async (req, res) => {
  try {
    const { kycId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    await kycModel.deleteKYCRequest({ kycId, clientId });
    res.status(200).send({ message: 'KYC Request deleted!' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

kycRouter.delete('/delete-e-sign/:eSignId', fetchUser, async (req, res) => {
  try {
    const { eSignId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    await kycModel.deleteESignDocRequest({ eSignId, clientId });
    res.status(200).send({ message: 'E-Sign Request deleted!' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});
