import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';

//add branch target
const addBranchTarget = async ({
  target,
  branchName,
  month,
  userId,
  clientId,
}: {
  target: number;
  branchName: string;
  month: string;
  userId: string;
  clientId: string;
}) => {
  await prisma.branch_target.create({
    data: {
      bt_id: uuid(),
      target,
      branch_name: branchName,
      month,
      approved_by: userId,
      client_id: clientId,
    },
  });
};

//get all branch targets
const getAllBranchTarget = async ({
  limit,
  offset,
  searchparam,
}: {
  limit: number;
  offset: number;
  searchparam: string;
}) => {
  const response = await prisma.branch_target.findMany({
    take: limit,
    skip: offset,
    where: {
      OR: [
        {
          month: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          branch_name: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
      ],
    },
  });
  return response;
};

//get count of all branch targets
const getAllBranchTargetCount = async ({
  searchparam,
}: {
  searchparam?: string;
}) => {
  const response = await prisma.branch_target.count({
    where: {
      OR: [
        {
          month: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          branch_name: {
            contains: searchparam,
            mode: 'insensitive',
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

//update branch target
const updateBranchTarget = async ({
  branchTargetId,
  target,
}: {
  branchTargetId: string;
  target: number;
}) => {
  await prisma.branch_target.update({
    where: {
      bt_id: branchTargetId,
    },
    data: {
      target,
    },
  });
};

export const branchTargetModel = {
  addBranchTarget,
  getAllBranchTarget,
  getAllBranchTargetCount,
  updateBranchTarget,
};
