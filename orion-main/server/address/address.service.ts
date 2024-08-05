import { address_type } from '@prisma/client';
import { customerModel } from '../customer/customer.model';
import { leadsModel } from '../leads/leads.model';
import { userModel } from '../user/user.model';
import { addressModel } from './address.model';

const getAddress = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const leadDetails = await leadsModel.getLeadById({ leadId, clientId });

  const addressData = await addressModel.getAddressByCustomerId({
    customerId: leadDetails?.customer_id || '',
    clientId,
  });

  const addresses = addressData.map(async address => {
    let verfiedBy = null;
    if (address.verified_by !== null) {
      verfiedBy = await userModel.getUser({
        userId: address.verified_by,
        clientId,
      });
    }
    return {
      id: address.address_id || '',
      type: address.type,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      houseType: address.house_type,
      status: address.status,
      //@ts-ignore
      verifiedBy: verfiedBy?.name || null,
      createdAt: address.created_at,
      updatedAt: address.updated_at,
    };
  });

  return Promise.all(addresses);
};

const getAddressByType = async ({
  phoneNo,
  addressType,
  clientId,
}: {
  phoneNo: string;
  addressType: address_type;
  clientId: string;
}) => {
  const customerDetails = await customerModel.getCustomerByPhoneNo({
    phoneNo,
    clientId,
  });

  const addressData = await addressModel.getAddressByCustomerId({
    customerId: customerDetails?.customer_id || '',
    type: addressType,
    clientId,
  });

  const addresses = addressData.map(address => {
    return {
      id: address.address_id || '',
      type: address.type,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      houseType: address.house_type,
      status: address.status,
      verifiedBy: null,
      createdAt: address.created_at,
      updatedAt: address.updated_at,
    };
  });

  return addresses;
};

export const addressService = { getAddress, getAddressByType };
