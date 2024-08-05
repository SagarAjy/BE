import { userModel } from '../user/user.model';
import { pdVisitModel } from './pd-visit.model';

const getpdVisit = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const pdDetails = await pdVisitModel.getpdVisit({ leadId, clientId });
  if (pdDetails) {
    const userDetails = await userModel.getUser({
      userId: pdDetails?.pd_id || '',
      clientId,
    });

    const response = {
      id: pdDetails?.visit_id || '',
      visitTime: pdDetails?.visit_time || '',
      visitDate: pdDetails?.visit_date || new Date(),
      pdName: userDetails?.name || '',
    };
    return response;
  } else {
    return null;
  }
};

export const pdVisitService = { getpdVisit };
