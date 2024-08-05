import { lead_status } from '@prisma/client';
import express, { Router } from 'express';
import { leadsModel } from '../leads/leads.model';
import { fetchUser } from '../middleware/auth.middleware';
import { callHistoryModel } from './call-history.model';
import { logger } from '../../logger';
import { callHistoryService } from './call-history.service';

export const callHistoryRouter: Router = express.Router();

type callHistoryDataType = {
  id: string;
  leadId: string;
  callType: string;
  status: lead_status;
  remark: string;
  calledBy: string;
  createdAt: Date;
};

//create call history
callHistoryRouter.post<
  { leadId: string },
  Record<never, never>,
  callHistoryDataType
>('/create/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { callType, status, remark } = req.body;
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;

    const lead = await leadsModel.getLeadById({
      leadId,
      clientId,
    });

    await callHistoryModel.createCallHistory({
      customer_id: lead?.customer_id || '',
      leadId,
      email: lead?.customers.email || '',
      name: lead?.customers.name || '',
      called_by: userId,
      call_type: callType,
      status,
      remark,
      clientId,
    });
    res.status(200).send({ message: 'Call history created' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

//get call history
callHistoryRouter.get<
  { leadId: string },
  callHistoryDataType[] | { message: string }
>('/get/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const callHistoryForLead = await callHistoryService.getCallHistory({
      leadId,
      clientId,
    });
    res.status(200).send(callHistoryForLead);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});
