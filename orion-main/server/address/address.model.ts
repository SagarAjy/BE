import { address_type, house_types, verification_status } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';

//add address
const addAddress = async ({
  customerId,
  userId,
  type,
  address,
  city,
  state,
  pincode,
  houseType,
  status,
  clientId,
}: {
  customerId: string;
  userId: string | null;
  type: address_type;
  address: string;
  city: string;
  state: string;
  pincode: string;
  houseType: house_types;
  status: verification_status;
  clientId: string;
}) => {
  const response = await prisma.address.create({
    data: {
      address_id: uuid(),
      customer_id: customerId,
      type,
      address,
      city,
      state,
      pincode,
      house_type: houseType,
      status,
      verified_by: userId,
      client_id: clientId,
    },
  });
  return response;
};

//get all address for particular customer using customer id
const getAddressByCustomerId = async ({
  customerId,
  type,
  clientId,
}: {
  customerId: string;
  type?: address_type;
  clientId: string;
}) => {
  const addresses = await prisma.address.findMany({
    where: {
      client_id: clientId,
      customer_id: customerId,
      type,
    },
  });
  return addresses;
};

//update address by address_id
const updateAddress = async ({
  addressId,
  userId,
  address,
  city,
  state,
  pincode,
  houseType,
  status,
  clientId,
}: {
  addressId: string;
  userId: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  houseType?: house_types;
  status: verification_status;
  clientId: string;
}) => {
  const addressDetails = await prisma.address.update({
    where: {
      address_id: addressId,
      status: 'Not_Verified',
      client_id: clientId,
    },
    data: {
      address,
      city,
      state,
      pincode,
      status,
      house_type: houseType,
      verified_by: userId,
      updated_at: new Date(),
    },
  });
  return addressDetails;
};

//delete an address by address_id
const deleteAddress = async ({
  addressId,
  clientId,
}: {
  addressId: string;
  clientId: string;
}) => {
  await prisma.address.delete({
    where: {
      address_id: addressId,
      client_id: clientId,
    },
  });
};

export const addressModel = {
  addAddress,
  getAddressByCustomerId,
  updateAddress,
  deleteAddress,
};
