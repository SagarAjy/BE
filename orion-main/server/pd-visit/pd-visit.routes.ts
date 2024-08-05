import express, { Router } from 'express';
import { fetchUser } from '../middleware/auth.middleware';
import { pdVisitModel } from './pd-visit.model';
import { logger } from '../../logger';
import { novuNotification } from '../novu/novu.model';
import { leadsModel } from '../leads/leads.model';
import { userModel } from '../user/user.model';
import { customerModel } from '../customer/customer.model';
import { format, parseISO } from 'date-fns';
import { pdVisitService } from './pd-visit.service';

export const pdVisitRouter: Router = express.Router();

type createpdVisitBodyType = {
  pdId: string;
  pdDate: string;
  pdTime: string;
};

type getPdVisitType = {
  id: string;
  visitDate: Date;
  visitTime: string;
  pdName: string;
};

pdVisitRouter.post<
  { leadId: string },
  Record<never, never>,
  createpdVisitBodyType
>('/add/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const visitDate = parseISO(req.body.pdDate);
    const leadDetails = await leadsModel.getLeadById({ leadId, clientId });
    const customerDetails = await customerModel.getCustomerById({
      customer_id: leadDetails?.customer_id || '',
      clientId,
    });

    const userDetails = await userModel.getUser({
      userId: req.body.pdId,
      clientId,
    });
    await pdVisitModel.addpdVisit({ ...req.body, visitDate, leadId, clientId });

    novuNotification.sendVisitAlignEmailToCustomer({
      id: leadId,
      pdName: userDetails?.name || '',
      customerName: customerDetails?.name || '',
      pdTime: req.body.pdTime,
      pdDate: format(visitDate, 'dd-MM-yyyy'),
      email: customerDetails?.email || '',
      clientId,
    });
    return res.status(200).send({ message: 'pd-Visit Added' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

pdVisitRouter.get<
  { leadId: string },
  getPdVisitType | null | { message: string }
>('/get/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const pdVisitDetails = await pdVisitService.getpdVisit({
      leadId,
      clientId,
    });
    res.status(200).send(pdVisitDetails);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

pdVisitRouter.put<
  { leadId: string },
  Record<never, never>,
  createpdVisitBodyType
>('/update/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const visitDate = parseISO(req.body.pdDate);
    const leadDetails = await leadsModel.getLeadById({ leadId, clientId });
    const customerDetails = await customerModel.getCustomerById({
      customer_id: leadDetails?.customer_id || '',
      clientId,
    });
    const pdDetails = await pdVisitModel.getpdVisit({ leadId, clientId });
    const userDetails = await userModel.getUser({
      userId: req.body.pdId,
      clientId,
    });
    await pdVisitModel.updatePdVisit({
      ...req.body,
      visitDate,
      leadId,
      visitId: pdDetails?.visit_id || '',
      clientId,
    });

    novuNotification.sendVisitAlignEmailToCustomer({
      id: leadId,
      pdName: userDetails?.name || '',
      customerName: customerDetails?.name || '',
      pdTime: req.body.pdTime,
      pdDate: format(visitDate, 'dd-MM-yyyy'),
      email: customerDetails?.email || '',
      clientId,
    });
    return res.status(200).send({ message: 'pd-Visit Added' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});
