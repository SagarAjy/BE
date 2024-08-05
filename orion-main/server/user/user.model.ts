import { roles, user_status } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';
import { novuNotification } from '../novu/novu.model';
import { userReporteeModel } from '../user-reportee/user-reportee.model';

type updatedUserDataType = {
  user_id: string;
  name: string;
  email: string;
  mobile: string;
  branch: string;
  role: roles;
  status: user_status;
  allowed_mac: string;
};

//create user
const addUser = async ({
  name,
  email,
  mobile,
  branch,
  role,
  status,
  allowed_mac,
  created_by,
  clientId,
}: {
  name: string;
  email: string;
  mobile: string;
  branch: string;
  role: roles;
  status: user_status;
  allowed_mac: string;
  created_by: string;
  clientId: string;
}) => {
  const createdUser = await prisma.users.create({
    data: {
      user_id: uuid(),
      name,
      email,
      mobile,
      branch,
      role,
      status,
      allowed_mac,
      created_by,
      created_at: new Date(),
      updated_at: new Date(),
      client_ids: [clientId],
    },
  });
  //assign credit manager  to telecaller
  if (role === 'Tele_Caller') {
    await prisma.userassigned.create({
      data: {
        user_assigned_id: createdUser.user_id,
        role,
        task_assigned: false,
        client_id: clientId,
      },
    });
  } else if (role === 'Loan_Officer') {
    await prisma.userassigned.create({
      data: {
        user_assigned_id: createdUser.user_id,
        role,
        task_assigned: false,
        client_id: clientId,
      },
    });
  }
  return {
    response: 'user created',
    email,
    mobile,
    name,
    userId: createdUser.user_id,
  };
};

//get all users
const getAllUsers = async ({
  limit,
  offset,
  searchparam,
  clientId,
}: {
  limit: number;
  offset: number;
  searchparam?: string;
  clientId: string;
}) => {
  const users = await prisma.users.findMany({
    take: limit,
    skip: offset,
    where: {
      OR: [
        {
          name: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          mobile: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          branch: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
      ],
      client_ids: {
        has: clientId,
      },
    },
    orderBy: {
      updated_at: 'desc',
    },
  });
  return users;
};

const getAllUsersCount = async ({
  searchparam,
  clientId,
}: {
  searchparam?: string;
  clientId: string;
}) => {
  const usersCount = await prisma.users.count({
    where: {
      OR: [
        {
          name: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          mobile: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          branch: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
      ],
      client_ids: {
        has: clientId,
      },
    },
  });
  return usersCount;
};

//get user by userId
const getUser = async ({
  userId,
  clientId,
}: {
  userId: string;
  clientId: string;
}) => {
  const user = await prisma.users.findFirst({
    where: {
      user_id: userId,
      client_ids: {
        has: clientId,
      },
    },
  });
  return user;
};

const getUserWithoutClientId = async ({ userId }: { userId: string }) => {
  const user = await prisma.users.findFirst({
    where: {
      user_id: userId,
    },
  });
  return user;
};

//update user
const updateUser = async ({
  updatedUserData,
  clientId,
}: {
  updatedUserData: updatedUserDataType;
  clientId: string;
}) => {
  await prisma.users.update({
    where: {
      user_id: updatedUserData.user_id,
    },
    data: {
      ...updatedUserData,
      updated_at: new Date(),
    },
  });
  await novuNotification.updateSubscriber({
    email: updatedUserData.email,
    phone: updatedUserData.mobile,
    subscriberId: updatedUserData.user_id,
    clientId,
  });
  return { message: 'user updated' };
};

//get user by user role
const getUsersByRole = async ({
  userRole,
  branch,
  userId,
  clientId,
}: {
  userRole: roles;
  branch?: string;
  userId: string;
  clientId: string;
}) => {
  const userReportees = await userReporteeModel.getUserReportees({
    userId,
    clientId,
  });
  const usersByRole = await prisma.users.findMany({
    where: {
      role: userRole,
      branch,
      status: 'Active',
      user_id: {
        in: userReportees.map(reportee => reportee.user_reportee_id),
      },
      client_ids: {
        has: clientId,
      },
    },
    orderBy: {
      updated_at: 'desc',
    },
  });
  return usersByRole;
};

const getAllUsersByRole = async ({
  userRole,
  branch,
  clientId,
}: {
  userRole: roles;
  branch?: string;
  clientId: string;
}) => {
  const usersByRole = await prisma.users.findMany({
    where: {
      role: userRole,
      branch,
      status: 'Active',
      client_ids: {
        has: clientId,
      },
    },
    orderBy: {
      updated_at: 'desc',
    },
  });
  return usersByRole;
};

export const userModel = {
  addUser,
  getAllUsers,
  getAllUsersCount,
  getUser,
  getUserWithoutClientId,
  updateUser,
  getUsersByRole,
  getAllUsersByRole,
};
