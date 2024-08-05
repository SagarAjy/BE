import { roles } from '@prisma/client';
import { prisma } from '../../prisma-client';

const getUsersByRole = async ({
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

export const userAdminModel = {
  getUsersByRole,
};
