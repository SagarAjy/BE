import express, { Router } from 'express';
import { logger } from '../../logger';
import { fetchUser } from '../middleware/auth.middleware';
import { branchTargetModel } from './branch-target.model';
import { userModel } from '../user/user.model';
import { branchTargetService } from './branch-target.service';

export const branchTargetRouter: Router = express.Router();

type addBranchTargetType = {
  target: number;
  branchName: string;
  month: string;
};
type getBranchTargetType = {
  id: string;
  target: number;
  branchName: string;
  approvedBy: string;
  month: string;
  createdAt: Date;
  updatedAt: Date;
};

//add branch target
branchTargetRouter.post<
  Record<never, never>,
  { message: string },
  addBranchTargetType
>('/add', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const userDetails = await userModel.getUser({ userId, clientId });
    if (userDetails?.role !== 'Admin')
      return res.status(403).send({ message: 'Action not permitted!' });

    await branchTargetModel.addBranchTarget({ userId, ...req.body, clientId });
    return res.status(200).send({ message: 'Branch target added' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

//get all branch targets
branchTargetRouter.get<
  Record<never, never>,
  | { allBranchTargets: getBranchTargetType[]; count: number }
  | { message: string }
  | null,
  Record<never, never>,
  {
    limit: string;
    offset: string;
    search?: string;
  }
>('/get', fetchUser, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const searchparam = decodeURIComponent(req.query.search || '');
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const userDetails = await userModel.getUser({ userId, clientId });
    //only admin can access branch targets
    if (userDetails?.role !== 'Admin')
      return res.status(403).send({ message: 'Action not permitted!' });
    const branchTargets = await branchTargetService.getBranchTarget({
      limit,
      offset,
      searchparam,
      clientId,
    });
    return res.status(200).send(branchTargets);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

//update branch target
branchTargetRouter.put<
  { branchTargetId: string },
  { message: string },
  { target: number }
>('/update/:branchTargetId', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const { branchTargetId } = req.params;
    const target = req.body.target;
    const userDetails = await userModel.getUser({ userId, clientId });
    if (userDetails?.role !== 'Admin')
      return res.status(403).send({ message: 'Action not permitted!' });

    await branchTargetModel.updateBranchTarget({ branchTargetId, target });
    return res.status(200).send({ message: 'Branch target updated' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});
