import express, { Router } from 'express';
import { fetchUser } from '../middleware/auth.middleware';
import { userModel } from '../user/user.model';
import { logger } from '../../logger';
import { loanCollectionModel } from './loan-collection.model';
import { leadsModel } from '../leads/leads.model';
import { loanCollectionService } from './loan-collection.service';

export const loanCollectionRouter: Router = express.Router();

type loanCollectionExecutiveDataType = {
  collectionManagerId: string;
  collectionExecutivesId: string[];
};

type loanCollectionExecutiveLeadDataType = {
  userId: string;
  leadsId: string[];
};

loanCollectionRouter.post<
  Record<never, never>,
  { message: string },
  loanCollectionExecutiveDataType
>('/assign-executive', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const userDetails = await userModel.getUser({ userId, clientId });
    if (userDetails?.role !== 'Admin') {
      return res.status(403).send({ message: 'Not authorized' });
    }
    await loanCollectionModel.assignCollectionExecutive({
      ...req.body,
      clientId,
    });
    return res.status(200).send({
      message: 'Collection executives assigned to collection manager',
    });
  } catch (error) {
    logger.error(error);
    res.status(403).send({ message: 'Not authorized' });
  }
});

loanCollectionRouter.post<
  Record<never, never>,
  { message: string },
  loanCollectionExecutiveLeadDataType
>('/assign-leads', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const userDetails = await userModel.getUser({ userId, clientId });
    if (
      userDetails?.role !== 'Admin' &&
      userDetails?.role !== 'Collection_Manager' &&
      userDetails?.role !== 'Credit_Manager'
    ) {
      return res.status(403).send({ message: 'Not authorized' });
    }
    leadsModel.assignCollectionExecutiveLeads({ ...req.body, clientId });
    return res.status(200).send({
      message: 'Leads assigned',
    });
  } catch (error) {
    logger.error(error);
    res.status(403).send({ message: 'Not authorized' });
  }
});

//*NOTE:userId is collection manager or credit manager id
loanCollectionRouter.get<
  { userId: string },
  { message: string } | ({ id: string } | undefined)[]
>('/get/:userId', fetchUser, async (req, res) => {
  try {
    let { userId } = req.params; //*NOTE:userId is collection manager or credit manager id
    //@ts-ignore
    const clientId = req.clientId;

    const userDetails = await userModel.getUser({ userId, clientId });
    if (
      userDetails?.role === 'Credit_Manager' ||
      userDetails?.role === 'Collection_Manager'
    ) {
      const response = await loanCollectionService.getAllCollectionManagerLeads(
        {
          userId,
          clientId,
        },
      );

      return res.status(200).send(
        response.filter(res => {
          return res !== undefined;
        }),
      );
    } else {
      return res.status(403).send({ message: 'Not authorized' });
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

//*get collection lead for tele calller or collection executive
loanCollectionRouter.get<
  { userId: string },
  { message: string } | ({ id: string } | undefined)[]
>('/get', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const userDetails = await userModel.getUser({ userId, clientId });
    if (
      userDetails?.role === 'Tele_Caller' ||
      userDetails?.role === 'Collection_Executive'
    ) {
      const response = await loanCollectionService.getCollectionLeads({
        userId,
        clientId,
      });

      return res.status(200).send();
    } else {
      return res.status(403).send({ message: 'Not authorized' });
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});
