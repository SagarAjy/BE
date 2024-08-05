import { userModel } from '../user/user.model';
import { callHistoryModel } from './call-history.model';

const getCallHistory = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const callHistoryByLeadId = await callHistoryModel.getCallHistoryByLeadId({
    leadId,
    clientId,
  });

  const callHistory = callHistoryByLeadId.map(async callHistory => {
    const calledByUser = await userModel.getUser({
      userId: callHistory.called_by,
      clientId,
    });
    return {
      id: callHistory.call_history_id,
      leadId: callHistory.lead_id,
      callType: callHistory.call_type,
      status: callHistory.status,
      remark: callHistory.remark,
      calledBy: calledByUser?.name || '',
      createdAt: callHistory.created_at,
    };
  });

  return Promise.all(callHistory);
};

export const callHistoryService = { getCallHistory };
