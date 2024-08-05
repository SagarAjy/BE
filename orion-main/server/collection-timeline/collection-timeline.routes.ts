import { waiver_approval_status_type } from '@prisma/client';
import express, { Router } from 'express';
import { leadsModel } from '../leads/leads.model';
import { fetchUser } from '../middleware/auth.middleware';
import { logger } from '../../logger';
import { collectionTimelineService } from './collection-timeline.service';
import { collectionTimelineModel } from './collection-timeline.model';
import { loanModel } from '../loan/loan.model';

export const collectionTimelineRouter: Router = express.Router();

type getCollectionTimelineDataType = {
  id: string;
  leadId: string;
  relatedTo: string;
  customerResponse: string;
  contactedBy: string;
  createdAt: Date;
};

type postCollectionTimelineDataType = {
  relatedTo: string;
  customerResponse: string;
};

//create call history
collectionTimelineRouter.post<
  { leadId: string },
  Record<never, never>,
  postCollectionTimelineDataType
>('/create/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { relatedTo, customerResponse } = req.body;
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;

    const lead = await leadsModel.getLeadById({
      leadId,
      clientId,
    });

    await collectionTimelineModel.createTimeline({
      customer_id: lead?.customer_id || '',
      leadId,
      relatedTo,
      contacted_by: userId,
      customerResponse,
      clientId,
    });
    res.status(200).send({ message: 'Collection timeline created' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

//get call history
collectionTimelineRouter.get<
  { leadId: string },
  getCollectionTimelineDataType[] | { message: string }
>('/get/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const collectionTimeLineForLead =
      await collectionTimelineService.getCallHistory({
        leadId,
        clientId,
      });
    res.status(200).send(collectionTimeLineForLead);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

collectionTimelineRouter.post<
  { leadId: string },
  { message: string },
  {
    waiverRequest: waiver_approval_status_type;
    waiverAmount: number;
    waiverAmountType: string;
  }
>('/raise-waiver-request/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { waiverRequest, waiverAmount, waiverAmountType } = req.body;
    //@ts-ignore
    const clientId = req.clientId;
    await leadsModel.updateLeadWaiverRequest({
      leadId,
      waiverRequest,
      clientId,
    });

    const loan = await loanModel.getLoanByLeadId({ leadId, clientId });

    await loanModel.updateLoanWaiverAmount({
      loanNo: loan?.loan_no || '',
      waiverAmountType: waiverAmountType,
      waiverAmount: waiverAmount,
      clientId,
    });

    return res.status(200).send({ message: 'Waiver request raised' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});
