import express, { Router } from 'express';
import { userReporteeModel } from './user-reportee.model';
import { logger } from '../../logger';
import { fetchUser } from '../middleware/auth.middleware';

export const userReporteeRouter: Router = express.Router();

type userReporteeRequestType = {
  reporteeId: string;
  userId: string;
  clientId: string;
};

userReporteeRouter.post<
  Record<never, never>,
  { message: string },
  userReporteeRequestType
>('/assign', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    const { reporteeId, userId } = req.body;
    await userReporteeModel.createReportee({ reporteeId, userId, clientId });
    res.status(200).send({ message: 'User Reportee created' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

userReporteeRouter.put<
  Record<never, never>,
  { message: string },
  userReporteeRequestType
>('/update-assign', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    const { reporteeId, userId } = req.body;
    const userReportee = await userReporteeModel.getUserReportingByReporteeId({
      userId,
      clientId,
    });
    await userReporteeModel.updateReportingByReporteeId({
      id: userReportee?.id || '',
      reporteeId,
      reportingId: userId,
      clientId,
    });
    res.status(200).send({ message: 'User Reportee created' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

userReporteeRouter.delete<{ reporteeId: string }>(
  '/delete',
  fetchUser,
  async (req, res) => {
    try {
      //@ts-ignore
      const clientId = req.clientId;
      const { reporteeId } = req.params;
      const userReportee = await userReporteeModel.getUserReportingByReporteeId(
        {
          userId: reporteeId,
          clientId,
        },
      );
      await userReporteeModel.deleteReportee({
        id: userReportee?.id || '',
        reporteeId,
        clientId,
      });
      res.status(200).send({ message: 'User Reportee Successfully deleted' });
    } catch (error) {
      logger.error(error);
      res.status(500).send({ message: 'Internal Server Error' });
    }
  },
);
