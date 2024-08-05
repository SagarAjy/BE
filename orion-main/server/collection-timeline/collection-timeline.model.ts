import { lead_status } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';

//create call history
const createTimeline = async ({
  customer_id,
  leadId,
  relatedTo,
  contacted_by,
  customerResponse,
  clientId,
}: {
  customer_id: string;
  leadId: string;
  relatedTo: string;
  contacted_by: string;
  customerResponse: string;
  clientId: string;
}) => {
  const response = await prisma.collection_timeline.create({
    data: {
      collection_timeline_id: uuid(),
      customer_id,
      lead_id: leadId,
      related_to: relatedTo,
      contacted_by,
      customer_response: customerResponse,
      created_at: new Date(),
      updated_at: new Date(),
      client_id: clientId,
    },
  });

  return response;
};

//get all call history of a lead by leadId
const getTimelineByLeadId = async ({ leadId }: { leadId: string }) => {
  const response = await prisma.collection_timeline.findMany({
    where: {
      lead_id: leadId,
    },
    orderBy: {
      created_at: 'desc',
    },
  });
  return response;
};

export const collectionTimelineModel = { createTimeline, getTimelineByLeadId };
