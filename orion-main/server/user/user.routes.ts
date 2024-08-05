import express, { Router } from 'express';
import { Prisma, roles, user_status } from '@prisma/client';
import { fetchUser } from '../middleware/auth.middleware';
import { userModel } from './user.model';
import { userService } from './user.service';
import { logger } from '../../logger';
import { novuNotification } from '../novu/novu.model';
import { auditLogModel } from '../audit-logs/audit-logs.model';

export const userRouter: Router = express.Router();

type createUserBodyType = {
  name: string;
  email: string;
  mobile: string;
  branch: string;
  role: roles;
  status: user_status;
  allowed_mac: string;
  created_by: string;
};

type usersType = {
  id: string;
  fullName: string;
  email: string;
  phoneNo: string;
  branch: string;
  role: roles;
  status: user_status;
  otp: number;
  otpExpiry: string;
  reporting: string;
  collectionUser: string;
  allowedMacAddress: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

type updateUserBodyType = createUserBodyType & {
  user_id: string;
};

type usersWithRole = {
  key: string;
  label: string;
  value: string | null;
};

//create user
userRouter.post<Record<never, never>, Record<never, never>, createUserBodyType>(
  '/add',
  fetchUser,
  async (req, res) => {
    try {
      const { name, email, mobile, branch, role, status, allowed_mac } =
        req.body;

      //@ts-ignore
      const clientId = req.clientId;

      //@ts-ignore
      const created_by = req.user.user; // * getting user_id from auth middleware
      const userDetails = await userModel.addUser({
        name,
        email,
        mobile,
        branch,
        role,
        status,
        allowed_mac,
        created_by,
        clientId,
      });
      await novuNotification.createSubscriber({
        email: userDetails.email,
        phone: userDetails.mobile,
        subscriberId: userDetails.userId,
        clientId,
      });

      await auditLogModel.createLog({
        activity: `Created user ${userDetails?.name} with id: ${userDetails.userId}`,
        userId: created_by,
        eventType: 'Add',
        clientId,
      });

      return res.status(200).send(userDetails);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return res.status(401).send({ message: 'Email already exists!' }); // * since email is unique constraint
        }
      }
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured' });
    }
  },
);

//get all user
userRouter.get<
  Record<never, never>,
  { users: usersType[]; userCount: number } | { message: string },
  Record<never, never>,
  { limit: number; offset: number; search?: string }
>('/all',fetchUser, async (req, res) => {
  try {
    const limit = Number(req.query.limit);
    const offset = Number(req.query.offset);
    const searchparam = decodeURIComponent(req.query.search || '');

    //@ts-ignore
    const clientId = req.clientId;

    const userDetails = await userService.getUsers({
      limit,
      offset,
      searchparam,
      clientId,
    });
    return res.status(200).send(userDetails);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

//get all user by user role
userRouter.get<
  { userRole: roles },
  usersWithRole[] | { message: string },
  Record<never, never>,
  { branch: string }
>('/get/role/:userRole', fetchUser, async (req, res) => {
  try {
    const { userRole } = req.params;
    const { branch } = req.query;
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;

    const pdTeam: usersWithRole[] = await userService.getUsersByRole({
      userRole,
      branch,
      userId,
      clientId,
    });
    pdTeam.push({
      key: '-1',
      label: 'None',
      value: 'null',
    });
    return res.status(200).send(pdTeam);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

userRouter.get<
  { userRole: roles },
  usersWithRole[] | { message: string },
  Record<never, never>,
  { branch: string }
>('/get/reassign/:userRole', fetchUser, async (req, res) => {
  try {
    const { userRole } = req.params;
    const { branch } = req.query;
    //@ts-ignore
    const clientId = req.clientId;

    const pdTeam: usersWithRole[] = await userService.getReassignUsersByRole({
      userRole,
      branch,
      clientId,
    });
    pdTeam.push({
      key: '-1',
      label: 'None',
      value: 'null',
    });
    return res.status(200).send(pdTeam);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

//update user
userRouter.put<Record<never, never>, Record<never, never>, updateUserBodyType>(
  '/update',
  fetchUser,
  async (req, res) => {
    try {
      //@ts-ignore
      const clientId = req.clientId;
      //@ts-ignore
      const userId = req.user.user;

      const userDetails = await userModel.getUser({ userId, clientId });
      await userModel.updateUser({ updatedUserData: req.body, clientId });
      await auditLogModel.createLog({
        activity: `Updated user ${userDetails?.name} with id: ${req.body.user_id}`,
        userId,
        eventType: 'Update',
        clientId,
      });
      return res.status(200).send({ message: 'user updated' });
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured' });
    }
  },
);
