import { prisma } from '../../prisma-client';

const getUserByUserIdWithoutClientId = async ({
  userId,
}: {
  userId: string;
}) => {
  const user = await prisma.users.findUnique({
    where: {
      user_id: userId,
    },
    select: {
      client_ids: true,
    },
  });
  return user;
};

const getClientsByUserId = async ({ clientIds }: { clientIds: string[] }) => {
  const clients = await prisma.client.findMany({
    where: {
      client_id: {
        in: clientIds,
      },
      client_status: 'Active',
    },
  });

  return clients;
};

const getClient = async ({ clientId }: { clientId: string }) => {
  const client = await prisma.client.findUnique({
    where: {
      client_id: clientId,
    },
  });

  return client;
};

const getClientNovuKey = async ({ clientId }: { clientId: string }) => {
  const client = await prisma.client.findUnique({
    where: {
      client_id: clientId,
    },
    select: {
      novu_key: true,
    },
  });

  return client;
};

export const clientModel = {
  getUserByUserIdWithoutClientId,
  getClientsByUserId,
  getClient,
  getClientNovuKey,
};
