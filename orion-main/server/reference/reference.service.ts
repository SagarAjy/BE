import { leadsModel } from '../leads/leads.model';
import { userModel } from '../user/user.model';
import { referenceModel } from './reference.model';

const getReferenceByLeadId = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const leadDetails = await leadsModel.getLeadById({ leadId, clientId });

  const referenceData = await referenceModel.getReferencesByCustomerId({
    customerId: leadDetails?.customer_id || '',
  });

  const references = referenceData.map(async reference => {
    let createdByName = '';
    if (reference.created_by !== null) {
      const createdByUser = await userModel.getUser({
        userId: reference.created_by || '',
        clientId,
      });
      createdByName = createdByUser?.name || '';
    }

    return {
      id: reference.reference_id || '',
      relation: reference.relation,
      name: reference.name,
      address: reference.address || '',
      city: reference.city || '',
      state: reference.state || '',
      pincode: reference.pincode || '',
      phoneNo: reference.mobile,
      createdBy: createdByName || '',
    };
  });
  return Promise.all(references);
};

const getReferencesByCustomerId = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const referenceData = await referenceModel.getReferencesByCustomerId({
    customerId,
  });

  const references = referenceData.map(async reference => {
    let createdByName = '';
    if (reference.created_by !== null) {
      const createdByUser = await userModel.getUser({
        userId: reference.created_by || '',
        clientId,
      });
      createdByName = createdByUser?.name || '';
    }

    return {
      id: reference.reference_id || '',
      relation: reference.relation,
      name: reference.name,
      address: reference.address || '',
      city: reference.city || '',
      state: reference.state || '',
      pincode: reference.pincode || '',
      phoneNo: reference.mobile,
      createdBy: createdByName || '',
    };
  });
  return Promise.all(references);
};

export const referenceService = {
  getReferenceByLeadId,
  getReferencesByCustomerId,
};
