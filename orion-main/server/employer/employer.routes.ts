import express, { Router } from 'express';
import { fetchUser } from '../middleware/auth.middleware';
import { Prisma, verification_status } from '@prisma/client';
import { leadsModel } from '../leads/leads.model';
import { employerModel } from './employer.model';
import { logger } from '../../logger';
import { employerService } from './employer.service';

export const employerRouter: Router = express.Router();

export type addEmployerType = {
  employerName: string;
  totalExperience: string;
  currentCompanyExperience: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  status: verification_status;
  verified_by?: string;
};

export type getEmployerType = {
  id: string;
  name: string;
  totalExperience: string;
  currentCompanyExperience: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  status: verification_status;
  verifiedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

//create employers
employerRouter.post<{ leadId: string }, Record<never, never>, addEmployerType>(
  '/add/:leadId',
  fetchUser,
  async (req, res) => {
    try {
      const { leadId } = req.params;
      //@ts-ignore
      const userId = req.user.user;
      //@ts-ignore
      const clientId = req.clientId;
      const leadDetails = await leadsModel.getLeadById({ leadId, clientId });
      await employerModel.addEmployer({
        customerId: leadDetails?.customer_id || '',
        userId:
          req.body.status === 'Verified' || req.body.status === 'Rejected'
            ? userId
            : null,
        ...req.body,
        clientId,
      });
      return res.status(200).send({ message: 'Employer Added' });
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured' });
    }
  },
);

//get employer
employerRouter.get<{ leadId: string }, getEmployerType[] | { message: string }>(
  '/get/:leadId',
  fetchUser,
  async (req, res) => {
    try {
      const { leadId } = req.params;
      //@ts-ignore
      const clientId = req.clientId;
      const referenceDetails = await employerService.getEmployer({
        leadId,
        clientId,
      });
      res.status(200).send(referenceDetails);
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured' });
    }
  },
);

//update employer by employerId
employerRouter.put<
  { employerId: string },
  getEmployerType[] | { message: string; code?: string },
  addEmployerType
>('/update/:employerId', fetchUser, async (req, res) => {
  try {
    const { employerId } = req.params;
    //@ts-ignore
    const userId = req.user.user;
    await employerModel.updateEmployer({
      employerId,
      userId:
        req.body.status === 'Verified' || req.body.status === 'Rejected'
          ? userId
          : null,
      ...req.body,
    });
    res.status(200).send({ message: 'Employer details updated!' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res
          .status(401)
          .send({ message: 'Employer already verified!', code: 'P2025' }); // * since user is already verified
      }
    }
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

//delete employer
employerRouter.delete('/delete/:employerId', fetchUser, async (req, res) => {
  try {
    const { employerId } = req.params;
    await employerModel.deleteEmployer({ employerId });
    return res.status(201).send('Employer successfully deleted!');
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});
