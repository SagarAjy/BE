import { genders, marital_status } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';
import { novuNotification } from '../novu/novu.model';

//update customer by pancard
const updateCustomer = async ({
  name,
  gender,
  dob,
  mobile,
  email,
  pancard,
  aadhar_no,
  marital_status,
  customerId,
  clientId,
}: {
  name: string;
  gender: genders;
  dob: Date;
  mobile: string;
  email: string;
  pancard: string;
  aadhar_no: string;
  marital_status: marital_status;
  customerId: string;
  clientId: string;
}) => {
  const response = await prisma.customers.update({
    where: { customer_id: customerId, client_id: clientId },
    data: {
      name,
      gender,
      dob,
      mobile,
      email,
      aadhar_no,
      pancard,
      marital_status,
      updated_at: new Date(),
    },
  });
  await novuNotification.updateSubscriber({
    email: email,
    phone: mobile,
    subscriberId: response.customer_id,
    clientId,
  });
  return response.customer_id;
};

const updateCustomerPhoneNo = async ({
  mobile,
  customerId,
  clientId,
}: {
  mobile: string;
  customerId: string;
  clientId: string;
}) => {
  const response = await prisma.customers.update({
    where: { customer_id: customerId, client_id: clientId },
    data: {
      mobile,
      updated_at: new Date(),
    },
  });
  await novuNotification.updateSubscriber({
    email: response.email,
    phone: mobile,
    subscriberId: response.customer_id,
    clientId,
  });
  return response.customer_id;
};

//create customer
const createCustomer = async ({
  name,
  gender,
  dob,
  mobile,
  email,
  pancard,
  aadhar_no,
  marital_status,
  clientId,
}: {
  name: string;
  gender: genders;
  dob: Date;
  mobile: string;
  email: string;
  pancard: string;
  aadhar_no: string;
  marital_status: marital_status;
  clientId: string;
}) => {
  const createdCustomer = await prisma.customers.create({
    data: {
      customer_id: uuid(),
      name,
      gender,
      dob,
      mobile,
      email,
      pancard,
      aadhar_no,
      marital_status,
      client_id: clientId,
    },
  });
  //creating novu subscribers for email services
  await novuNotification.createSubscriber({
    email: createdCustomer.email,
    phone: createdCustomer.mobile,
    subscriberId: createdCustomer.customer_id,
    clientId,
  });
  return createdCustomer.customer_id;
};

//gte customer details by customerId
const getCustomerById = async ({
  customer_id,
  clientId,
}: {
  customer_id: string;
  clientId: string;
}) => {
  const response = await prisma.customers.findFirst({
    where: {
      customer_id,
      client_id: clientId,
    },
  });
  return response;
};

const getCustomerByPhoneNo = async ({
  phoneNo,
  clientId,
}: {
  phoneNo: string;
  clientId: string;
}) => {
  const response = await prisma.customers.findFirst({
    where: {
      mobile: phoneNo,
      client_id: clientId,
    },
  });

  return response;
};

const getCustomerByPANOrAadhaar = async ({
  pan,
  aadhaar,
  clientId,
}: {
  pan: string;
  aadhaar: string;
  clientId: string;
}) => {
  const response = await prisma.customers.findFirst({
    where: {
      OR: [
        {
          pancard: pan,
        },
        {
          aadhar_no: aadhaar,
        },
      ],
      client_id: clientId,
    },
  });

  return response;
};

export const customerModel = {
  createCustomer,
  updateCustomer,
  updateCustomerPhoneNo,
  getCustomerById,
  getCustomerByPhoneNo,
  getCustomerByPANOrAadhaar,
};
