import express, { Router } from 'express';
import { fetchUser } from '../middleware/auth.middleware';
import { logger } from '../../logger';
import { lead_status, waiver_approval_status_type } from '@prisma/client';
import { collectionModel } from './collection.model';
import { leadsModel } from '../leads/leads.model';
import { collectionService } from './collection.service';
import { loanModel } from '../loan/loan.model';
import { novuNotification } from '../novu/novu.model';
import { format, parse } from 'date-fns';
import { userModel } from '../user/user.model';
import { approvalModel } from '../approval/approval.model';
import { auditLogModel } from '../audit-logs/audit-logs.model';
//import { collectionFileUpload } from '../middleware/fileupload.middleware';
import { documentsModel } from '../documents/documents.model';

export const collectionRouter: Router = express.Router();

type collectionDataType = {
  collectionAmount: number;
  penaltyAmount: number;
  collectedMode: string;
  collectedDate: string;
  collectionTime: string;
  referenceNo: string;
  discountAmount: number;
  settlementAmount: number;
  status: lead_status;
  remarks: string;
};

type getCollectionData = {
  id: string;
  loanNo: string;
  collectionAmount: number;
  referenceNo: string;
  collectionMode: string;
  collectionDate: Date;
  collectionTime: string;
  penaltyAmount: number;
  discountAmount: number;
  settlementAmount: number;
  status: lead_status;
  remarks: string;
  collectedBy: string;
  createdAt: Date;
};

export type allCollections = {
  id: string;
  leadId: string;
  loanNo: string;
  collectionUser: string;
  name: string;
  email: string;
  phoneNo: string;
  repayDate: Date;
  paymentAmount: number;
  paymentMode: string;
  paymentDate: Date;
  referenceNo: string;
  discountAmount: number;
  settlementAmount: number;
  status: lead_status;
  createdAt: Date;
  employerName: string;
};

type masterCollection = {
  id: string;
  collectionUser: string;
  loanNo: string;
  customerName: string;
  mobileNo: string;
  loanAmount: number;
  disbursalDate: Date;
  repayAmount: number;
  repayDate: Date;
  penalty: number;
  status: string;
  remarks: string;
};

type allWaiverRequests = {
  id: string;
  daysPastDue: number;
  loanNo: string;
  name: string;
  approvalAmount: number;
  repayAmount: number;
  repayDate: Date;
  penalty: number;
  waiverAmountType: string;
  waiverAmount: number;
  actualRepaymentAmount: number;
  status: waiver_approval_status_type;
};

type addCollectionDocumentType = {
  document: File;
};

type collectionDocumentType = {
  documentId: string;
  url: string;
};

//create collection
collectionRouter.post<
  { leadId: string },
  { message: string },
  collectionDataType
>('/add/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const leadDetails = await leadsModel.getLeadById({ leadId, clientId });
    const loanData = await loanModel.getLoanByLeadId({ leadId, clientId });
    await collectionModel.addCollection({
      leadId,
      customerId: leadDetails?.customer_id || '',
      collectedBy: userId,
      loanNo: loanData?.loan_no || '',
      ...req.body,
      clientId,
    });

    await auditLogModel.createLog({
      activity: `Added collection for lead ${leadId}`,
      userId,
      eventType: 'Add',
      clientId,
    });

    res.status(200).send({ message: 'Collection added!' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

//get collections by leadId
collectionRouter.get<
  { leadId: string },
  getCollectionData[] | { message: string } | null
>('/get/:leadId', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    const { leadId } = req.params;
    const collection = await collectionService.getCollections({
      leadId,
      clientId,
    });
    res.status(200).send(collection);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

collectionRouter.post<
  { leadId: string },
  { message: string },
  { amount: number }
>('/send-noc/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const { amount } = req.body;
    const leadDetails = await leadsModel.getLeadById({ leadId, clientId });
    const loanDetails = await loanModel.getLoanByLeadId({ leadId, clientId });
    const approvalDetails = await approvalModel.getApproval({
      leadId,
      clientId,
    });
    const collectionDetails = await collectionModel.getCollectionLatest({
      leadId,
      clientId,
    });

    await novuNotification.sendNOCEmailToCustomer({
      id: leadDetails?.customers?.customer_id || '',
      name: leadDetails?.customers?.name || '',
      email: leadDetails?.customers?.email || '',
      collectionDate: format(
        collectionDetails?.at(0)?.collected_date || new Date(),
        'dd-MM-yyyy',
      ),
      disbursalDate:
        format(loanDetails?.disbursal_date || new Date(), 'dd-MM-yyyy') || '',
      loanAmount: approvalDetails?.loan_amt_approved || 0,
      nocAmount: amount || 0,
      loanNo: loanDetails?.loan_no || '',
      clientId,
    });

    res.status(200).send({ message: 'Email sent!' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

collectionRouter.post<
  { leadId: string },
  { message: string },
  { amount: number }
>('/send-settlement-email/:leadId', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    const { leadId } = req.params;
    const { amount } = req.body;
    const leadDetails = await leadsModel.getLeadById({ leadId, clientId });
    const loanDetails = await loanModel.getLoanByLeadId({ leadId, clientId });
    const collectionDetails = await collectionModel.getCollectionLatest({
      leadId,
      clientId,
    });
    const approvalDetails = await approvalModel.getApproval({
      leadId,
      clientId,
    });

    await novuNotification.sendSettlementEmailToCustomer({
      id: leadDetails?.customers?.customer_id || '',
      name: leadDetails?.customers?.name || '',
      email: leadDetails?.customers?.email || '',
      collectionDate: format(
        collectionDetails?.at(0)?.collected_date || new Date(),
        'dd-MM-yyyy',
      ),
      disbursalDate:
        format(loanDetails?.disbursal_date || new Date(), 'dd-MM-yyyy') || '',
      loanAmount: approvalDetails?.loan_amt_approved || 0,
      collectionAmount: amount || 0,
      loanNo: loanDetails?.loan_no || '',
      clientId,
    });

    res.status(200).send({ message: 'Email sent!' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

collectionRouter.post<
  { leadId: string },
  { message: string },
  { amount: number }
>('/send-loan-closed-email/:leadId', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    const { leadId } = req.params;
    const { amount } = req.body;
    const leadDetails = await leadsModel.getLeadById({ leadId, clientId });
    const loanDetails = await loanModel.getLoanByLeadId({ leadId, clientId });
    const collectionDetails = await collectionModel.getCollectionLatest({
      leadId,
      clientId,
    });
    const approvalDetails = await approvalModel.getApproval({
      leadId,
      clientId,
    });
    await novuNotification.sendLoanClosedEmailToCustomer({
      id: leadDetails?.customers?.customer_id || '',
      name: leadDetails?.customers?.name || '',
      email: leadDetails?.customers?.email || '',
      collectionDate: format(
        collectionDetails?.at(0)?.collected_date || new Date(),
        'dd-MM-yyyy',
      ),
      disbursalDate:
        format(loanDetails?.disbursal_date || new Date(), 'dd-MM-yyyy') || '',
      loanAmount: approvalDetails?.loan_amt_approved || 0,
      collectionAmount: amount || 0,
      loanNo: loanDetails?.loan_no || '',
      clientId,
    });

    res.status(200).send({ message: 'Email sent!' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

//get all collections
collectionRouter.get<
  Record<never, never>,
  | { collections: allCollections[]; collectedLeadsCount: number }
  | { message: string },
  Record<never, never>,
  {
    limit: string;
    offset: string;
    collectionStatus?: lead_status;
    filterBy: string;
    search?: string;
  }
>('/get-all', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const collectionFilter = req.query.collectionStatus as lead_status;
    const filterBy = req.query.filterBy;
    const searchparam = decodeURIComponent(req.query.search || '');
    //@ts-ignore
    const userId: string = req.user.user;
    const collections = await collectionService.getAllCollections({
      limit,
      offset,
      collectionFilter,
      userId,
      filterBy,
      searchparam,
      clientId,
    });
    return res.status(200).send(collections);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});

collectionRouter.get<
  Record<never, never>,
  | { waiverRequests: allWaiverRequests[]; waiverRequestsCount: number }
  | { message: string },
  Record<never, never>,
  {
    limit: string;
    offset: string;
    search?: string;
  }
>('/get-waiver-requests', fetchUser, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const searchparam = decodeURIComponent(req.query.search || '');
    //@ts-ignore
    const userId: string = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;

    const userInfo = await userModel.getUser({ userId, clientId });

    if (userInfo?.role !== 'Admin') {
      return res
        .status(403)
        .send({ message: 'You are not authorized to view this page' });
    }

    const waiverRequests = await collectionService.getWaiverRequests({
      limit,
      offset,
      searchparam,
      clientId,
    });
    return res.status(200).send(waiverRequests);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

collectionRouter.put<
  { leadId: string },
  { message: string },
  { status: waiver_approval_status_type }
>('/update-waiver-request/:leadId', async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    const { leadId } = req.params;
    const { status } = req.body;
    await leadsModel.updateLeadWaiverRequest({
      leadId,
      waiverRequest: status,
      clientId,
    });
    return res.status(200).send({ message: 'Waiver request status updated!' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

collectionRouter.delete<{ collectionId: string }, { message: string }>(
  '/delete/:collectionId',
  fetchUser,
  async (req, res) => {
    try {
      //@ts-ignore
      const clientId = req.clientId;
      //@ts-ignore
      const userId = req.user.user;
      const { collectionId } = req.params;
      const collectionData = await collectionModel.getCollectionById({
        collectionId,
        clientId,
      });
      const collectionsCount = await collectionModel.getCollectionsCount({
        leadId: collectionData?.lead_id || '',
        clientId,
      });
      if (collectionsCount === 1) {
        await leadsModel.updateLeadStatus({
          leadId: collectionData?.lead_id || '',
          clientId,
          status: lead_status.Disbursed,
        });
      } else {
        await leadsModel.updateLeadStatus({
          leadId: collectionData?.lead_id || '',
          clientId,
          status: lead_status.Part_Payment,
        });
      }
      await collectionModel.deleteCollection({
        collectionId,
        clientId,
        leadId: collectionData?.lead_id || '',
        collectedBy: userId,
      });

      await auditLogModel.createLog({
        activity: `Deleted collection for lead ${collectionData?.lead_id}`,
        userId,
        eventType: 'Delete',
        clientId,
      });

      return res
        .status(200)
        .send({ message: 'Collection successfully deleted' });
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured!' });
    }
  },
);

collectionRouter.get<
  Record<never, never>,
  | { collections: masterCollection[]; collectionsCount: number }
  | { message: string },
  Record<never, never>,
  {
    limit: string;
    offset: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }
>('/get-master-collection', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;

    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const searchparam = decodeURIComponent(req.query.search || '');
    const startDate = decodeURIComponent(req.query.startDate || '');
    const endDate = decodeURIComponent(req.query.endDate || '');

    let collections;
    if (startDate.length !== 0 && endDate.length !== 0) {
      collections = await collectionService.getMasterCollectionData({
        searchparam,
        startDate: parse(startDate, 'dd-MM-yyyy', new Date()),
        endDate: parse(endDate, 'dd-MM-yyyy', new Date()),
        limit,
        offset,
        clientId,
      });
    } else {
      collections = await collectionService.getMasterCollectionData({
        searchparam,
        limit,
        offset,
        clientId,
      });
    }

    return res.status(200).send(collections);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});

collectionRouter.get<
  { leadId: string },
  | {
      approvalAmount: number;
      currentRepayAmount: number;
      totalInterest: number;
      penaltyInterest: number;
      extensionAmount: number;
    }
  | { message: string }
>('/get-extension-amount/:leadId', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    const { leadId } = req.params;

    const extensionAmount = await collectionService.getExtensionAmount({
      leadId,
      clientId,
    });

    return res.status(200).send(extensionAmount);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});

// collectionRouter.post<
//   { leadId: string },
//   | { message: string }
//   | {
//       success: boolean;
//       errors: { title: string; detail: string; error: string };
//     },
//   addCollectionDocumentType
// >(
//   '/upload-collection-document/:leadId',
//   fetchUser,
//   collectionFileUpload,
//   async (req, res) => {
//     try {
//       const { leadId } = req.params;
//       //@ts-ignore
//       const userId = req.user.user;
//       //@ts-ignore
//       const clientId = req.clientId;
//       const leadDetails = await leadsModel.getLeadById({ leadId, clientId });

//       await documentsModel.addDocument({
//         customerId: leadDetails?.customer_id || '',
//         userId,
//         //@ts-ignore
//         documentUrl: req.file?.location,
//         documentType: 'Collection_Document',
//         password: '',
//         status: 'Verified',
//         leadId: leadId,
//         clientId,
//       });

//       await auditLogModel.createLog({
//         activity: 'Uploaded Collection Document',
//         eventType: 'Add',
//         userId,
//         clientId,
//       });
//       res.status(200).send({ message: 'Succesfully uploaded!' });
//     } catch (error) {
//       logger.error(error);
//       res.status(500).send({ message: 'Some error occured!' });
//     }
//   },
// );

collectionRouter.get<
  { leadId: string },
  collectionDocumentType[] | { message: string }
>('/get-collection-document/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const response = await collectionService.getCollectionDocument({
      leadId,
      clientId,
    });

    res.status(200).send(response);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

collectionRouter.delete<{ documentId: string }, { message: string }>(
  '/delete-collection-document/:documentId',
  fetchUser,
  async (req, res) => {
    try {
      const { documentId } = req.params;
      //@ts-ignore
      const clientId = req.clientId;
      //@ts-ignore
      const userId = req.user.user;

      await collectionModel.deleteCollectionDocument({
        documentId,
        clientId,
      });

      await auditLogModel.createLog({
        activity: 'Deleted Collection Document',
        eventType: 'Delete',
        userId,
        clientId,
      });

      res.status(200).send({ message: 'Document deleted!' });
    } catch (error) {
      logger.error(error);
      res.status(500).send({ message: 'Some error occured!' });
    }
  },
);
