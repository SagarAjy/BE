import { userModel } from '../user/user.model';
import { branchTargetModel } from './branch-target.model';

const getBranchTarget = async ({
  limit,
  offset,
  searchparam,
  clientId,
}: {
  limit: number;
  offset: number;
  searchparam: string;
  clientId: string;
}) => {
  const branchTargets = await branchTargetModel.getAllBranchTarget({
    limit,
    offset,
    searchparam,
  });

  const allBranchTargets = branchTargets.map(async target => {
    const approvedByDetails = await userModel.getUser({
      userId: target.approved_by,
      clientId,
    });
    return {
      id: target.bt_id,
      target: target.target,
      branchName: target.branch_name,
      approvedBy: approvedByDetails?.name || '',
      month: target.month,
      createdAt: target.created_at,
      updatedAt: target.updated_at,
    };
  });

  const count = await branchTargetModel.getAllBranchTargetCount({
    searchparam,
  });
  const result = {
    allBranchTargets: await Promise.all(allBranchTargets),
    count,
  };
  return result;
};

export const branchTargetService = { getBranchTarget };
