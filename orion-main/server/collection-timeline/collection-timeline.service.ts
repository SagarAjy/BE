import { userModel } from '../user/user.model';
import { collectionTimelineModel } from './collection-timeline.model';

const getCallHistory = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const callHistoryByLeadId = await collectionTimelineModel.getTimelineByLeadId(
    {
      leadId,
    },
  );

  const timeline = callHistoryByLeadId.map(async timeline => {
    const calledByUser = await userModel.getUser({
      userId: timeline.contacted_by,
      clientId,
    });
    return {
      id: timeline.collection_timeline_id,
      leadId: timeline.lead_id,
      relatedTo: timeline.related_to,
      customerResponse: timeline.customer_response,
      contactedBy: calledByUser?.name || '',
      createdAt: timeline.created_at,
    };
  });

  return Promise.all(timeline);
};

export const collectionTimelineService = { getCallHistory };
