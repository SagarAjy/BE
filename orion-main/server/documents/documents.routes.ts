import { fetchUser } from '../middleware/auth.middleware';
import { leadsModel } from '../leads/leads.model';
import express from 'express';
import { documentService } from './documents.service';
import { logger } from '../../logger';
import { document_type, verification_status } from '@prisma/client';
//import { fileUpload, s3Client } from '../middleware/fileupload.middleware';
//import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { documentsModel } from './documents.model';
//import { getSignedURLForS3 } from '../../utils';
import { auditLogModel } from '../audit-logs/audit-logs.model';

export const documentsRouter = express.Router();

type addDocumentType = {
  documentType: document_type;
  password: string;
  status: verification_status;
  document: File;
};

type getDocumentType = {
  id: string;
  documentType: document_type;
  documentUrl: string;
  password: string;
  status: verification_status;
  verifiedBy: string;
  verifiedDate: Date;
  uploadedBy: string;
  uploadDate: Date;
  isArchived: boolean;
};

//create document
// documentsRouter.post<
//   { leadId: string },
//   | { message: string }
//   | {
//       success: boolean;
//       errors: { title: string; detail: string; error: string };
//     },
//   addDocumentType
// >('/upload/:leadId', fetchUser, fileUpload, async (req, res) => {
//   try {
//     const { leadId } = req.params;
//     //@ts-ignore
//     const userId = req.user.user;
//     //@ts-ignore
//     const clientId = req.clientId;
//     const leadDetails = await leadsModel.getLeadById({ leadId, clientId });

//     await documentsModel.addDocument({
//       customerId: leadDetails?.customer_id || '',
//       userId,
//       //@ts-ignore
//       documentUrl: req.file?.location,
//       documentType: req.body.documentType,
//       password: req.body.password,
//       status: req.body.status,
//       clientId,
//     });
//     res.status(200).send({ message: 'Succesfully uploaded!' });
//   } catch (error) {
//     logger.error(error);
//     res.status(500).send({ message: 'Some error occured!' });
//   }
// });

//get documents by leadId
documentsRouter.get<
  { leadId: string },
  getDocumentType[] | { message: string }
>('/get/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const response = await documentService.getDocument({ leadId, clientId });
    res.status(200).send(response);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});
//update document by document Id
documentsRouter.put('/update/:documentId', fetchUser, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status } = req.body;

    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    await documentsModel.updateDocument({
      documentId,
      status,
      userId,
      clientId,
    });

    res.status(200).send({ message: 'Document updated successfully!' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

//delete document by document Id
// documentsRouter.post<{ documentId: string }, { message: string }>(
//   '/delete/:documentId',
//   fetchUser,
//   async (req, res) => {
//     try {
//       //@ts-ignore
//       const clientId = req.clientId;
//       const { documentId } = req.params;
//       const documentDetails = await documentsModel.getDocument({
//         documentId,
//         clientId,
//       });

//       const urlParts = documentDetails?.document_url.split('/');
//       const bucket = process.env.SPACES_BUCKET;
//       const key = urlParts?.slice(3).join('/');

//       const deleteParams = {
//         Bucket: bucket,
//         Key: key,
//       };

//       //deleting document from database
//       const deleteCommand = new DeleteObjectCommand(deleteParams);
//       await s3Client.send(deleteCommand);

//       await documentsModel.deleteDocument({
//         documentId,
//         clientId,
//       });

//       return res.status(200).send({ message: 'File Deleted Sccessfully!' });
//     } catch (error) {
//       logger.error(error);
//       res.status(500).send({ message: 'Some error occured' });
//     }
//   },
// );

// documentsRouter.get('/download/:documentId', fetchUser, async (req, res) => {
//   try {
//     const { documentId } = req.params;
//     //@ts-ignore
//     const clientId = req.clientId;

//     //@ts-ignore
//     const userId = req.user.user;
//     const documentDetails = await documentsModel.getDocument({
//       documentId,
//       clientId,
//     });

//     const signedUrl = await getSignedURLForS3(
//       documentDetails?.document_url || '',
//     );

//     await auditLogModel.createLog({
//       activity: `Downloaded document ${documentDetails?.document_url}`,
//       userId: userId,
//       eventType: 'Download',
//       clientId,
//     });

//     res.status(200).send({ url: signedUrl });
//   } catch (error) {
//     logger.error(error);
//     res.status(500).send('Some error occured');
//   }
// });
