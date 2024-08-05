import { customerModel } from '../customer/customer.model';
import { leadsModel } from '../leads/leads.model';
import { userModel } from '../user/user.model';
import { employerModel } from './employer.model';

const getEmployer = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const leadDetails = await leadsModel.getLeadById({ leadId, clientId });

  const employerData = await employerModel.getEmployer({
    customerId: leadDetails?.customer_id || '',
  });

  const employers = employerData.map(async employer => {
    let createdBy = null;
    if (employer.verified_by !== null) {
      createdBy = await userModel.getUser({
        userId: employer.verified_by,
        clientId,
      });
    }

    return {
      id: employer.employer_id || '',
      name: employer.employer_name,
      totalExperience: employer.total_experience,
      currentCompanyExperience: employer.current_company_experience,
      address: employer.address,
      city: employer.city,
      state: employer.state,
      pincode: employer.pincode,
      status: employer.status,
      verifiedBy: createdBy?.name || null,
      createdAt: employer.created_at,
      updatedAt: employer.updated_at,
    };
  });
  return Promise.all(employers);
};

const getEmployerByCustomerId = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const employerData = await employerModel.getEmployer({
    customerId,
  });

  const employers = employerData.map(async employer => {
    let createdBy = null;
    if (employer.verified_by !== null) {
      createdBy = await userModel.getUser({
        userId: employer.verified_by,
        clientId,
      });
    }

    return {
      id: employer.employer_id || '',
      name: employer.employer_name,
      totalExperience: employer.total_experience,
      currentCompanyExperience: employer.current_company_experience,
      address: employer.address,
      city: employer.city,
      state: employer.state,
      pincode: employer.pincode,
      status: employer.status,
      verifiedBy: createdBy?.name || null,
      createdAt: employer.created_at,
      updatedAt: employer.updated_at,
    };
  });
  return Promise.all(employers);
};

export const employerService = { getEmployer, getEmployerByCustomerId };
