import { leadsModel } from '../leads/leads.model';
import { userReporteeModel } from '../user-reportee/user-reportee.model';
import { userModel } from '../user/user.model';

//get all leads of collection manager
const getAllCollectionManagerLeads = async ({
  userId,
  clientId,
}: {
  userId: string;
  clientId: string;
}) => {
  const userDetails = await userModel.getUser({ userId, clientId });

  let creditManagerId;

  if (userDetails?.role === 'Collection_Manager') {
    creditManagerId = await userReporteeModel.getUserReportingByReporteeId({
      userId,
      clientId,
    });
  }

  const allreportee = await userReporteeModel.getUserReportees({
    userId: creditManagerId ? creditManagerId?.user_id : userId || '',
    clientId,
  });
  const allLeads = await leadsModel.getLeadsCreditManager({
    reporteeUserIds: allreportee,
    clientId,
  });

  // Find how many loans are closed for each lead so that if 2nd time application can go to Loan officer
  // instead of Credit manager
  const response = allLeads.map(async lead => {
    const loanCount = await leadsModel.getClosedLoanCount({
      customerId: lead.customer_id,
      clientId,
    });
    if (userDetails?.role === 'Collection_Manager' && loanCount >= 1) {
      return {
        id: lead.lead_id,
      };
    } else if (userDetails?.role === 'Credit_Manager' && loanCount < 1) {
      return { id: lead.lead_id };
    } else if (
      userDetails?.role === 'Admin' ||
      userDetails?.role === 'Accounts'
    ) {
      return { id: lead.lead_id };
    }
  });

  return await Promise.all(response);
};

//get collection lead for tele calller or collection executive
const getCollectionLeads = async ({
  userId,
  clientId,
}: {
  userId: string;
  clientId: string;
}) => {
  const userDetails = await userModel.getUser({ userId, clientId });
  let allLeads;
  if (userDetails?.role === 'Collection_Executive') {
    allLeads = await leadsModel.getLeadByCollectionUserId({ userId, clientId });
  } else {
    allLeads = await leadsModel.getLeadByUserId({ userId, clientId });
  }

  const response = allLeads.map(async lead => {
    const loanCount = await leadsModel.getClosedLoanCount({
      customerId: lead.customer_id,
      clientId,
    });
    if (userDetails?.role === 'Tele_Caller' && loanCount < 1) {
      return {
        id: lead.lead_id,
      };
    } else if (userDetails?.role === 'Collection_Manager' && loanCount < 1) {
      return { id: lead.lead_id };
    }
  });
};

export const loanCollectionService = {
  getAllCollectionManagerLeads,
  getCollectionLeads,
};
