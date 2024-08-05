import express, { Router } from 'express';
import { fetchUser } from '../middleware/auth.middleware';
import { logger } from '../../logger';
import { leadsModel } from '../leads/leads.model';
import { relation_types } from '@prisma/client';
import { referenceModel } from './reference.model';
import { referenceService } from './reference.service';

export const referenceRouter: Router = express.Router();

export type addReferenceType = {
  relation: relation_types;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  mobile: string;
};

export type getReferenceType = Omit<addReferenceType, 'mobile'> & {
  id: string;
  createdBy: string;
  phoneNo: string;
};

//create reference
referenceRouter.post<
  { leadId: string },
  Record<never, never>,
  addReferenceType
>('/add/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const leadDetails = await leadsModel.getLeadById({ leadId, clientId });
    await referenceModel.addReference({
      customerId: leadDetails?.customer_id || '',
      userId,
      ...req.body,
      clientId,
    });
    return res.status(200).send({ message: 'Reference Added' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

//get reference by leadid
referenceRouter.get<
  { leadId: string },
  getReferenceType[] | { message: string }
>('/get/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const refernceDetails = await referenceService.getReferenceByLeadId({
      leadId,
      clientId,
    });
    res.status(200).send(refernceDetails);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});

//update reference
referenceRouter.put<
  { referenceId: string },
  getReferenceType[] | { message: string },
  addReferenceType
>('/update/:referenceId', fetchUser, async (req, res) => {
  try {
    const { referenceId } = req.params;

    //@ts-ignore
    const userId = req.user.user;
    await referenceModel.updateReference({
      referenceId,
      userId,
      ...req.body,
    });
    res.status(200).send({ message: 'Reference details updated!' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});

//delete reference by referenceId
referenceRouter.delete('/delete/:referenceId', fetchUser, async (req, res) => {
  try {
    const { referenceId } = req.params;
    await referenceModel.deleteReference({ referenceId });
    return res.status(201).send({ message: 'Reference successfully deleted!' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});
