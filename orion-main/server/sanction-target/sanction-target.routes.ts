import express, { Router } from 'express';
import { logger } from '../../logger';
import { fetchUser } from '../middleware/auth.middleware';
import { userModel } from '../user/user.model';
import { sanctionTargetModel } from './sanction-target.model';
import { sanctionTargetService } from './sanction-target.service';
import { format, parse } from 'date-fns';

export const sanctionTargetRouter: Router = express.Router();

type addSanctionTargetType = {
  sanctionUserId: string;
  target: number;
  month: string;
};
type getSanctionTargetType = {
  id: string;
  target: number;
  approvedBy: string;
  sanctionedTo: {
    id: string;
    name: string;
  };
  month: string;
  createdAt: Date;
  updatedAt: Date;
};

//create sanction
sanctionTargetRouter.post<
  Record<never, never>,
  { message: string },
  addSanctionTargetType
>('/add', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const userDetails = await userModel.getUser({ userId, clientId });
    const sanctionUserDetails = await userModel.getUser({
      userId: req.body.sanctionUserId,
      clientId,
    });

    if (
      userDetails?.role !== 'Admin' &&
      sanctionUserDetails?.role !== 'Credit_Manager'
    )
      return res.status(403).send({ message: 'Action not permitted!' });

    await sanctionTargetModel.addSanctionTarget({
      userId,
      ...req.body,
      clientId,
    });
    return res.status(200).send({ message: 'Sanction target added' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

//get all sanction targets
sanctionTargetRouter.get<
  Record<never, never>,
  | { allSanctionTargets: getSanctionTargetType[]; count: number }
  | { message: string }
  | null,
  Record<never, never>,
  {
    limit: string;
    offset: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }
>('/get', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const searchparam = decodeURIComponent(req.query.search || '');
    const startDate = decodeURIComponent(req.query.startDate || '');
    const endDate = decodeURIComponent(req.query.endDate || '');
    let startMonth, endMonth, year;

    if (startDate && endDate) {
      startMonth = format(parse(startDate, 'dd-MM-yyyy', new Date()), 'MMMM');
      endMonth = format(parse(endDate, 'dd-MM-yyyy', new Date()), 'MMMM');
      year = format(parse(endDate, 'dd-MM-yyyy', new Date()), 'yyyy');
    }

    const startString = startMonth + ' ' + year;
    const endString = endMonth + ' ' + year;

    //@ts-ignore
    const userId = req.user.user;
    const userDetails = await userModel.getUser({ userId, clientId });
    if (userDetails?.role !== 'Admin')
      return res.status(401).send({ message: 'Unauthorized!' });

    let sanctionTargets;
    if (startDate.length === 0 && endDate.length === 0) {
      sanctionTargets = await sanctionTargetService.getSanctionTarget({
        limit,
        offset,
        searchparam,
        clientId,
      });
    } else {
      sanctionTargets = await sanctionTargetService.getSanctionTarget({
        limit,
        offset,
        searchparam,
        startMonth: startString,
        endMonth: endString,
        clientId,
      });
    }
    return res.status(200).send(sanctionTargets);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

//update sanction target
sanctionTargetRouter.put<
  { sanctionTargetId: string },
  { message: string },
  { target: number; sanctionUserId: string }
>('/update/:sanctionTargetId', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const { sanctionTargetId } = req.params;
    const userDetails = await userModel.getUser({ userId, clientId });
    if (userDetails?.role !== 'Admin')
      return res.status(403).send({ message: 'Action not permitted!' });

    await sanctionTargetModel.updateSanctionTarget({
      sanctionTargetId,
      ...req.body,
      clientId,
    });
    return res.status(200).send({ message: 'Sanction target updated' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});
