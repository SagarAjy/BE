import { document_type, verification_status } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';

//create document for a customer
const addDocument = async ({
  customerId,
  userId,
  documentType,
  documentUrl,
  password,
  status,
  leadId,
  clientId,
}: {
  customerId: string;
  userId: string | null;
  documentType: document_type;
  documentUrl: string;
  password: string;
  status: verification_status;
  leadId?: string;
  clientId: string;
}) => {
  const response = await prisma.document.create({
    data: {
      document_id: uuid(),
      customer_id: customerId,
      document_type: documentType,
      document_url: documentUrl,
      password,
      status,
      verified_by: null,
      verified_date: new Date(),
      uploaded_by: userId,
      uploaded_date: new Date(),
      lead_id: leadId,
      client_id: clientId,
    },
  });
  if (status === 'Verified' || status === 'Rejected') {
    await prisma.document.update({
      where: {
        document_id: response.document_id,
        client_id: clientId,
      },
      data: {
        verified_by: userId,
        verified_date: new Date(),
      },
    });
  }
  return response;
};

//get document  by documentId
const getDocument = async ({
  documentId,
  clientId,
  leadId,
}: {
  documentId: string;
  clientId: string;
  leadId?: string;
}) => {
  const response = await prisma.document.findFirst({
    where: {
      document_id: documentId,
      client_id: clientId,
      lead_id: leadId,
    },
  });
  return response;
};

//get documents by customerId
const getDocumentsByCustomerId = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const response = await prisma.document.findMany({
    where: {
      customer_id: customerId,
      NOT: { is_archived: true },
      document_type: { not: 'Collection_Document' },
      client_id: clientId,
    },
    orderBy: {
      uploaded_date: 'desc',
    },
  });
  return response;
};

const getDocumentByDocumentType = async ({
  documentType,
  customerId,
  clientId,
}: {
  documentType: document_type;
  customerId: string;
  clientId: string;
}) => {
  const response = await prisma.document.findFirst({
    where: {
      customer_id: customerId,
      NOT: { is_archived: true },
      document_type: documentType,
      client_id: clientId,
    },
  });
  return response;
};

//update  document by document id
const updateDocument = async ({
  documentId,
  status,
  userId,
  clientId,
}: {
  documentId: string;
  status: verification_status;
  userId: string;
  clientId: string;
}) => {
  const response = await prisma.document.update({
    where: {
      document_id: documentId,
      client_id: clientId,
    },
    data: {
      status,
      verified_by: userId,
      verified_date: new Date(),
    },
  });
  return response;
};

//delete document by document Id
const deleteDocument = async ({
  documentId,
  clientId,
}: {
  documentId: string;
  clientId: string;
}) => {
  await prisma.document.delete({
    where: { document_id: documentId, client_id: clientId },
  });
};

export const documentsModel = {
  addDocument,
  getDocument,
  getDocumentsByCustomerId,
  getDocumentByDocumentType,
  deleteDocument,
  updateDocument,
};
