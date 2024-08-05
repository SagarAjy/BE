import { prisma } from '../../../prisma-client';
import { v4 as uuid } from 'uuid';

const getCustomerByPhone = async ({
  phoneNo,
  clientId,
}: {
  phoneNo: string;
  clientId: string;
}) => {
  const response = await prisma.customer_otp.findFirst({
    where: {
      customer_mobile_no: phoneNo,
      client_id: clientId,
    },
  });

  return response;
};

const updateCustomerOTP = async ({
  phoneNo,
  otp,
  clientId,
}: {
  phoneNo: string;
  otp: number;
  clientId: string;
}) => {
  const response = await prisma.customer_otp.upsert({
    where: {
      customer_mobile_no: phoneNo,
    },
    create: {
      otp_id: uuid(),
      customer_mobile_no: phoneNo,
      otp: otp,
      otp_timestamp: new Date().getTime().toString(),
      client_id: clientId,
    },
    update: {
      otp: otp,
      otp_timestamp: new Date().getTime().toString(),
      client_id: clientId,
    },
  });

  return response;
};

export const customerOtpModel = { getCustomerByPhone, updateCustomerOTP };
