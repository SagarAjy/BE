import { prisma } from '../../prisma-client';
import { userReporteeModel } from '../user-reportee/user-reportee.model';

//relating collectionmanager to creditmanager to access credit managers leads to collection manager
const collectionManagerToCreditManager = async ({
  creditManagerId,
  collectionManagerId,
  clientId,
}: {
  creditManagerId: string;
  collectionManagerId: string;
  clientId: string;
}) => {
  await prisma.userreportees.create({
    data: {
      user_reportee_id: collectionManagerId,
      user_id: creditManagerId,
      client_id: clientId,
    },
  });
};

//assigning collection executives to collection manager
const assignCollectionExecutive = ({
  collectionManagerId,
  collectionExecutivesId,
  clientId,
}: {
  collectionManagerId: string;
  collectionExecutivesId: string[];
  clientId: string;
}) => {
  collectionExecutivesId.map(async userReportee => {
    await prisma.userreportees.create({
      data: {
        user_reportee_id: userReportee,
        user_id: collectionManagerId,
        client_id: clientId,
      },
    });
  });
};

export const loanCollectionModel = {
  collectionManagerToCreditManager,
  assignCollectionExecutive,
};
