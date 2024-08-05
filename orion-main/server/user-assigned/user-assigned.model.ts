import { roles } from '@prisma/client';
import { prisma } from '../../prisma-client';

const getNotAssignedUser = async ({
  role,
  branch,
  clientId,
}: {
  role: roles;
  branch: string;
  clientId: string;
}) => {
  const response = await prisma.userassigned.findFirst({
    where: {
      task_assigned: false,
      client_id: clientId,
      role,
      users: {
        branch,
        status: 'Active',
      },
    },
  });
  // TODO: CAN CONDITION EXIST WHERE NO TELE CALLER EXISTS?
  if (!response) {
    await prisma.userassigned.updateMany({
      where: {
        role,
        users: {
          branch,
          status: 'Active',
        },
        client_id: clientId,
      },
      data: {
        task_assigned: false,
      },
    });
    return null;
  } else {
    return response.user_assigned_id;
  }
};

const getUserAssigned = async ({
  userId,
  clientId,
}: {
  userId: string;
  clientId: string;
}) => {
  const response = await prisma.userassigned.findFirst({
    where: {
      user_assigned_id: userId,
      client_id: clientId,
    },
  });
  return response;
};

const updateUserAssigned = async ({
  id,
  userId,
  clientId,
}: {
  id: string;
  userId: string;
  clientId: string;
}) => {
  const response = await prisma.userassigned.update({
    where: {
      id,
      user_assigned_id: userId,
      client_id: clientId,
    },
    data: {
      task_assigned: true,
    },
  });
  return response;
};

export const userAssignedModel = {
  getNotAssignedUser,
  updateUserAssigned,
  getUserAssigned,
};
