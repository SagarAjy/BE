import { userModel } from '../user/user.model';
import { sanctionTargetModel } from './sanction-target.model';

const getSanctionTarget = async ({
  limit,
  offset,
  searchparam,
  startMonth,
  endMonth,
  clientId,
}: {
  limit: number;
  offset: number;
  searchparam: string;
  startMonth?: string;
  endMonth?: string;
  clientId: string;
}) => {
  const sanctionTargets = await sanctionTargetModel.getAllSanctionTarget({
    limit,
    offset,
    searchparam,
    startMonth,
    endMonth,
    clientId,
  });

  const allSanctionTargets = sanctionTargets.map(async target => {
    const approvedByDetails = await userModel.getUser({
      userId: target.approved_by,
      clientId,
    });
    const sanctionByDetails = await userModel.getUser({
      userId: target.sanction_user_id,
      clientId,
    });
    return {
      id: target.st_id,
      target: target.target,
      approvedBy: approvedByDetails?.name || '',
      sanctionedTo: {
        id: sanctionByDetails?.user_id || '',
        name: sanctionByDetails?.name || '',
      },
      month: target.month,
      createdAt: target.created_at,
      updatedAt: target.updated_at,
    };
  });

  const count = await sanctionTargetModel.getAllSanctionTargetCount({
    searchparam,
    clientId,
  });
  const result = {
    allSanctionTargets: await Promise.all(allSanctionTargets),
    count,
  };
  return result;
};

export const sanctionTargetService = { getSanctionTarget };
