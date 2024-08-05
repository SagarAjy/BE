import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';

//create sanction target
const addSanctionTarget = async ({
  target,
  sanctionUserId,
  month,
  userId,
  clientId,
}: {
  target: number;
  sanctionUserId: string;
  month: string;
  userId: string;
  clientId: string;
}) => {
  await prisma.sanction_target.create({
    data: {
      st_id: uuid(),
      target,
      sanction_user_id: sanctionUserId,
      month,
      approved_by: userId,
      client_id: clientId,
    },
  });
};

//get all sanction targets
const getAllSanctionTarget = async ({
  limit,
  offset,
  searchparam,
  startDate,
  endDate,
  startMonth,
  endMonth,
  clientId,
}: {
  limit?: number;
  offset?: number;
  searchparam?: string;
  startDate?: Date;
  endDate?: Date;
  startMonth?: string;
  endMonth?: string;
  clientId: string;
}) => {
  const response = await prisma.sanction_target.findMany({
    take: limit,
    skip: offset,
    where: {
      client_id: clientId,
      updated_at: {
        gte: startDate,
        lte: endDate,
      },
      AND: {
        OR: [
          {
            month: {
              equals: startMonth,
            },
          },
          {
            month: {
              equals: endMonth,
            },
          },
        ],
      },
      OR: [
        {
          month: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          users: {
            name: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
      ],
    },
    orderBy: {
      updated_at: 'desc',
    },
  });
  return response;
};

const getAllSanctionTargetCount = async ({
  searchparam,
  clientId,
}: {
  searchparam?: string;
  clientId: string;
}) => {
  const response = await prisma.sanction_target.count({
    where: {
      client_id: clientId,
      OR: [
        {
          month: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          users: {
            name: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
      ],
    },
    orderBy: {
      updated_at: 'desc',
    },
  });

  return response;
};

//update sanction target
const updateSanctionTarget = async ({
  sanctionTargetId,
  target,
  sanctionUserId,
  clientId,
}: {
  sanctionTargetId: string;
  target: number;
  sanctionUserId: string;
  clientId: string;
}) => {
  await prisma.sanction_target.update({
    where: {
      client_id: clientId,
      st_id: sanctionTargetId,
    },
    data: {
      target,
      sanction_user_id: sanctionUserId,
    },
  });
};

const getSanctionTargetByUserId = async ({
  userId,
  monthAndYear,
  clientId,
}: {
  userId: string;
  monthAndYear: string;
  clientId: string;
}) => {
  const response = await prisma.sanction_target.findFirst({
    where: {
      client_id: clientId,
      sanction_user_id: userId,
      month: {
        equals: monthAndYear,
      },
    },
  });
  return response;
};

export const sanctionTargetModel = {
  addSanctionTarget,
  getAllSanctionTarget,
  getAllSanctionTargetCount,
  updateSanctionTarget,
  getSanctionTargetByUserId,
};
