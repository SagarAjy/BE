import { relation_types } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';

//create reference
const addReference = async ({
  customerId,
  userId,
  relation,
  name,
  address,
  city,
  state,
  pincode,
  mobile,
  clientId,
}: {
  customerId: string;
  userId: string | null;
  relation: relation_types;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  mobile: string;
  clientId: string;
}) => {
  const response = await prisma.reference.create({
    data: {
      reference_id: uuid(),
      customer_id: customerId,
      relation,
      name,
      address,
      city,
      state,
      pincode,
      mobile,
      created_by: userId,
      client_id: clientId,
    },
  });
  return response;
};

//get all references by customerid
const getReferencesByCustomerId = async ({
  customerId,
}: {
  customerId: string;
}) => {
  const references = await prisma.reference.findMany({
    where: {
      customer_id: customerId,
    },
    orderBy: {
      updated_at: 'desc',
    },
  });
  return references;
};

//update reference
const updateReference = async ({
  referenceId,
  userId,
  relation,
  name,
  address,
  city,
  state,
  pincode,
  mobile,
}: {
  referenceId: string;
  userId: string;
  relation: relation_types;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  mobile: string;
}) => {
  const employerDetails = await prisma.reference.update({
    where: {
      reference_id: referenceId,
    },
    data: {
      relation,
      name,
      address,
      city,
      state,
      pincode,
      mobile,
      created_by: userId,
      updated_at: new Date(),
    },
  });
  return employerDetails;
};

//delete reference
const deleteReference = async ({ referenceId }: { referenceId: string }) => {
  await prisma.reference.delete({
    where: {
      reference_id: referenceId,
    },
  });
};

export const referenceModel = {
  addReference,
  getReferencesByCustomerId,
  updateReference,
  deleteReference,
};
