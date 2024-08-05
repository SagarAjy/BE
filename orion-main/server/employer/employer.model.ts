import { verification_status } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';

//create employer
const addEmployer = async ({
  customerId,
  userId,
  employerName,
  totalExperience,
  currentCompanyExperience,
  address,
  city,
  state,
  pincode,
  status,
  clientId,
}: {
  customerId: string;
  userId: string | null;
  employerName: string;
  totalExperience: string;
  currentCompanyExperience: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  status: verification_status;
  clientId: string;
}) => {
  const response = await prisma.employer.create({
    data: {
      employer_id: uuid(),
      verified_by: userId,
      customer_id: customerId,
      employer_name: employerName,
      total_experience: totalExperience,
      current_company_experience: currentCompanyExperience,
      address,
      city,
      state,
      pincode,
      status,
      client_id: clientId,
    },
  });
  return response;
};

//get employers by customerId
const getEmployer = async ({ customerId }: { customerId: string }) => {
  const employerDetails = await prisma.employer.findMany({
    where: {
      customer_id: customerId,
    },
    orderBy: {
      updated_at: 'desc',
    },
  });
  return employerDetails;
};

//get latest employer by customerId
const getEmployerLatest = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const employerDetails = await prisma.employer.findMany({
    where: {
      client_id: clientId,
      customer_id: customerId,
    },
    orderBy: {
      updated_at: 'desc',
    },
    take: 1,
  });
  return employerDetails;
};

//update employer by employerId
const updateEmployer = async ({
  employerId,
  employerName,
  totalExperience,
  currentCompanyExperience,
  userId,
  address,
  city,
  state,
  pincode,
  status,
}: {
  employerId: string;
  employerName: string;
  totalExperience: string;
  currentCompanyExperience: string;
  userId: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  status: verification_status;
}) => {
  const employerDetails = await prisma.employer.update({
    where: {
      employer_id: employerId,
      status: 'Not_Verified',
    },
    data: {
      employer_name: employerName,
      total_experience: totalExperience,
      current_company_experience: currentCompanyExperience,
      address,
      city,
      state,
      pincode,
      status,
      verified_by: userId,
      updated_at: new Date(),
    },
  });
  return employerDetails;
};

//delete employer by employerId
const deleteEmployer = async ({ employerId }: { employerId: string }) => {
  await prisma.employer.delete({
    where: {
      employer_id: employerId,
    },
  });
};

export const employerModel = {
  addEmployer,
  getEmployer,
  updateEmployer,
  deleteEmployer,
  getEmployerLatest,
};
