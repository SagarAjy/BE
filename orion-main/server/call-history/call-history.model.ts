import { lead_status } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';
import { leadsModel } from '../leads/leads.model';
import { novuNotification } from '../novu/novu.model';
import { clientModel } from '../clients/clients.model';

//create call history
const createCallHistory = async ({
  customer_id,
  leadId,
  email,
  name,
  call_type,
  status,
  remark,
  called_by,
  clientId,
}: {
  customer_id: string;
  leadId: string;
  email?: string;
  name?: string;
  call_type: string;
  status: lead_status;
  remark: string;
  called_by: string;
  clientId: string;
}) => {
  const response = await prisma.call_history.create({
    data: {
      call_history_id: uuid(),
      customer_id,
      lead_id: leadId,
      called_by,
      call_type,
      status,
      remark,
      client_id: clientId,
    },
  });

  const leadStatus = await leadsModel.getLeadById({ leadId, clientId });

  await leadsModel.updateLeadStatus({
    leadId,
    status,
    clientId,
  });

  const clientDetails = await clientModel.getClient({ clientId });

  if (status === 'Interested') {
    if (email) {
      await novuNotification.sendInterestedEmailToCustomer({
        id: customer_id,
        applicationNo: leadId,
        email,
        clientId,
      });

      if (leadStatus?.gclid?.length !== 0) {
        await leadsModel.addLeadConversionName({
          clientId,
          leadId,
          conversionName: clientDetails?.eligible_leads_conversion_name || '',
        });
      }
    }
  } else if (status === 'Rejected' || status === 'Not_Eligible') {
    if (email) {
      await novuNotification.sendRejectionEmailToCustomer({
        id: customer_id,
        email,
        clientId,
      });
    }
  }

  return response;
};

//get all call history of a lead by leadId
const getCallHistoryByLeadId = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const response = await prisma.call_history.findMany({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
    orderBy: {
      created_at: 'desc',
    },
  });
  return response;
};

export const callHistoryModel = { createCallHistory, getCallHistoryByLeadId };
