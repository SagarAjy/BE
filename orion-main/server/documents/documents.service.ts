import { leadsModel } from '../leads/leads.model';
import { userModel } from '../user/user.model';
import { documentsModel } from './documents.model';

const getDocument = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const leadDetails = await leadsModel.getLeadById({ leadId, clientId });

  const documentResponse = await documentsModel.getDocumentsByCustomerId({
    customerId: leadDetails?.customer_id || '',
    clientId,
  });

  const documentsData = documentResponse.map(async documents => {
    let verfiedBy = null;
    if (documents.verified_by) {
      verfiedBy = await userModel.getUser({
        userId: documents.verified_by,
        clientId,
      });
    }

    let uploadedBy;

    if (documents.uploaded_by) {
      const uploadedByUser = await userModel.getUser({
        userId: documents.uploaded_by,
        clientId,
      });
      uploadedBy = uploadedByUser?.name;
    }
    return {
      id: documents.document_id || '',
      documentType: documents.document_type,
      documentUrl: documents.document_url || '',
      password: documents.password || '',
      status: documents.status,
      verifiedBy: verfiedBy?.name || '',
      verifiedDate: documents.verified_date || new Date(),
      uploadedBy: uploadedBy || '',
      uploadDate: documents.uploaded_date,
      isArchived: documents.is_archived,
    };
  });

  return Promise.all(documentsData);
};

export const documentService = { getDocument };
