import { Prisma, lead_status } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';
import { callHistoryModel } from '../call-history/call-history.model';
import { leadsModel, userReportees } from '../leads/leads.model';
import { userModel } from '../user/user.model';
import { parse } from 'date-fns';

//add collection
const addCollection = async ({
  customerId,
  leadId,
  loanNo,
  collectionAmount,
  penaltyAmount,
  collectedMode,
  collectedDate,
  collectionTime,
  referenceNo,
  discountAmount,
  settlementAmount,
  status,
  remarks,
  collectedBy,
  clientId,
}: {
  customerId: string;
  leadId: string;
  loanNo: string;
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
  collectedBy: string;
  clientId: string;
}) => {
  const response = await prisma.collection.create({
    data: {
      collection_id: uuid(),
      lead_id: leadId,
      customer_id: customerId,
      loan_no: loanNo,
      collected_amount: collectionAmount,
      penalty_amount: penaltyAmount,
      collected_mode: collectedMode,
      collected_date: parse(collectedDate, 'dd-MM-yyyy', new Date()),
      collection_time: collectionTime,
      reference_no: referenceNo,
      discount_amount: discountAmount,
      settlement_amount: settlementAmount,
      status: status,
      remark: remarks,
      collected_by: collectedBy,
      created_at: new Date(),
      client_id: clientId,
    },
  });
  //*when creating collection change lead status to eg. Closed or part_payment
  await prisma.leads.update({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    data: {
      status: status,
      updated_at: new Date(),
    },
  });

  const lead = await leadsModel.getLeadById({
    leadId,
    clientId,
  });

  //create call history of status change
  await callHistoryModel.createCallHistory({
    customer_id: lead?.customer_id || '',
    email: lead?.customers.email || '',
    name: lead?.customers.name || '',
    leadId,
    called_by: collectedBy,
    call_type: 'changed status to',
    status: status,
    remark: remarks,
    clientId,
  });

  return response;
};

//get collection by leadId
const getCollections = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const collections = await prisma.collection.findMany({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    orderBy: {
      collected_date: 'desc',
    },
  });
  return collections;
};

const getCollectionById = async ({
  collectionId,
  clientId,
}: {
  collectionId: string;
  clientId: string;
}) => {
  const collections = await prisma.collection.findFirst({
    where: {
      collection_id: collectionId,
      client_id: clientId,
    },
    orderBy: {
      collected_date: 'desc',
    },
  });
  return collections;
};

const getCollectionsCount = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const collections = await prisma.collection.count({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
  });
  return collections;
};

const getCollectionsCalculation = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const collections = await prisma.collection.findMany({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    orderBy: {
      collected_date: 'asc',
    },
  });
  return collections;
};

//get latest collection by leadId
const getCollectionLatest = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const collections = await prisma.collection.findMany({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    orderBy: {
      collected_date: 'desc',
    },
    take: 1,
  });
  return collections;
};

//get collection by filters
const getFilteredCollections = async ({
  limit,
  offset,
  collectionFilter,
  reporteeUserIds,
  teleCallers,
  filterBy,
  userId,
  searchparam,
  clientId,
}: {
  limit: number;
  offset: number;
  collectionFilter: lead_status;
  reporteeUserIds: userReportees[];
  teleCallers?: Prisma.PromiseReturnType<typeof userModel.getUsersByRole>;
  filterBy: string;
  userId: string;
  searchparam?: string;
  clientId: string;
}) => {
  const response = await prisma.leads.findMany({
    take: limit,
    skip: offset,
    where: {
      client_id: clientId,
      status: collectionFilter,
      OR: [
        {
          approval: {
            loan_no: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            name: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            email: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            mobile: {
              contains: searchparam,
            },
          },
        },
        {
          collection_user_id: userId,
        },
        {
          collection_user_id: {
            in: reporteeUserIds.map(reportee => reportee.user_reportee_id),
          },
        },
        {
          collection_user_id: {
            in: teleCallers?.map(teleCaller => teleCaller.user_id) || [],
          },
        },
      ],
    },
    include: {
      approval: {
        select: {
          loan_no: true,
          repay_date: true,
        },
      },
      collection: {
        select: {
          collection_id: true,
          collected_amount: true,
          collected_mode: true,
          collected_date: true,
          reference_no: true,
          discount_amount: true,
          settlement_amount: true,
          created_at: true,
        },
      },
    },
    orderBy: {
      approval: {
        repay_date: 'desc',
      },
    },
  });

  return response;
};

//get count of collection
const getFilteredCollectionsCount = async ({
  collectionFilter,
  reporteeUserIds,
  teleCallers,
  filterBy,
  userId,
  searchparam,
  clientId,
}: {
  collectionFilter: lead_status;
  reporteeUserIds: userReportees[];
  teleCallers?: Prisma.PromiseReturnType<typeof userModel.getUsersByRole>;
  filterBy: string;
  userId: string;
  searchparam?: string;
  clientId: string;
}) => {
  const response = await prisma.leads.count({
    where: {
      client_id: clientId,
      status: collectionFilter,
      OR: [
        {
          approval: {
            loan_no: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            name: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            email: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            mobile: {
              contains: searchparam,
            },
          },
        },
        {
          collection_user_id: userId,
        },
        {
          collection_user_id: {
            in: reporteeUserIds.map(reportee => reportee.user_reportee_id),
          },
        },
        {
          collection_user_id: {
            in: teleCallers?.map(teleCaller => teleCaller.user_id) || [],
          },
        },
      ],
    },
  });

  return response;
};

// find leads that have been assigned to collect to the user
const getFilteredCollectionsAssignedToUser = async ({
  limit,
  offset,
  collectionFilter,
  filterBy,
  userId,
  searchparam,
  clientId,
}: {
  limit: number;
  offset: number;
  collectionFilter: lead_status;
  filterBy: string;
  userId: string;
  searchparam?: string;
  clientId: string;
}) => {
  const response = await prisma.leads.findMany({
    take: limit,
    skip: offset,
    where: {
      client_id: clientId,
      status: collectionFilter,
      collection_user_id: userId,
      OR: [
        {
          approval: {
            loan_no: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            name: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            email: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            mobile: {
              contains: searchparam,
            },
          },
        },
      ],
    },
    include: {
      approval: {
        select: {
          loan_no: true,
          repay_date: true,
        },
      },
      collection: {
        select: {
          collection_id: true,
          collected_amount: true,
          collected_mode: true,
          collected_date: true,
          reference_no: true,
          discount_amount: true,
          settlement_amount: true,
          created_at: true,
        },
      },
    },
    orderBy: {
      approval: {
        repay_date: 'desc',
      },
    },
  });

  return response;
};

// get count of leads assigned to collect to the user
const getFilteredCollectionsAssignedToUserCount = async ({
  collectionFilter,
  filterBy,
  userId,
  searchparam,
  clientId,
}: {
  collectionFilter: lead_status;
  filterBy: string;
  userId: string;
  searchparam?: string;
  clientId: string;
}) => {
  const response = await prisma.leads.count({
    where: {
      client_id: clientId,
      status: collectionFilter,
      collection_user_id: userId,
      OR: [
        {
          approval: {
            loan_no: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            name: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            email: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            mobile: {
              contains: searchparam,
            },
          },
        },
        {
          collection_user_id: userId,
        },
      ],
    },
  });

  return response;
};

const deleteCollection = async ({
  clientId,
  collectionId,
  leadId,
  collectedBy,
}: {
  clientId: string;
  collectionId: string;
  leadId: string;
  collectedBy: string;
}) => {
  await prisma.collection.delete({
    where: {
      client_id: clientId,
      collection_id: collectionId,
    },
  });
  const lead = await leadsModel.getLeadById({
    leadId,
    clientId,
  });
  await callHistoryModel.createCallHistory({
    customer_id: lead?.customer_id || '',
    email: lead?.customers.email || '',
    name: lead?.customers.name || '',
    leadId,
    called_by: collectedBy,
    call_type: 'deleted collection and changed status to ',
    status: lead?.status || 'Approved',
    remark: 'Collection deleted!',
    clientId,
  });
};

const getCollectionDocument = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const response = await prisma.document.findMany({
    where: {
      lead_id: leadId,
      document_type: 'Collection_Document',
    },
  });

  return response;
};

const deleteCollectionDocument = async ({
  documentId,
  clientId,
}: {
  documentId: string;
  clientId: string;
}) => {
  const response = await prisma.document.delete({
    where: {
      document_id: documentId,
      client_id: clientId,
    },
  });

  return response;
};

export const collectionModel = {
  addCollection,
  getCollections,
  getFilteredCollections,
  getFilteredCollectionsCount,
  getFilteredCollectionsAssignedToUser,
  getFilteredCollectionsAssignedToUserCount,
  getCollectionLatest,
  getCollectionsCalculation,
  deleteCollection,
  getCollectionById,
  getCollectionsCount,
  getCollectionDocument,
  deleteCollectionDocument,
};
