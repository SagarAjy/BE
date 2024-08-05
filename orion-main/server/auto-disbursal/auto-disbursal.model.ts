import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';

const addAutoDisbursal = async ({
  paymentId,
  accountNo,
  ifscCode,
  transferMode,
  paymentPortal,
  disbursalAmount,
  leadId,
  clientId,
}: {
  paymentId: string;
  accountNo: string;
  ifscCode: string;
  transferMode: string;
  paymentPortal: string;
  disbursalAmount: number;
  leadId: string;
  clientId: string;
}) => {
  const response = await prisma.auto_disbursal.create({
    data: {
      id: uuid(),
      payment_id: paymentId,
      acc_no: accountNo,
      ifsc: ifscCode,
      mode: transferMode,
      payment_portal: paymentPortal,
      disbursal_amt: disbursalAmount,
      lead_id: leadId,
      client_id: clientId,
    },
  });

  return response;
};

const getAutoDisbursal = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const response = await prisma.auto_disbursal.findMany({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
  });

  return response;
};

const updateAutoDisbursalModel = async ({
  disbursalId,
  status,
  utrNo,
  clientId,
}: {
  disbursalId: string;
  status: string;
  utrNo: string;
  clientId: string;
}) => {
  const response = await prisma.auto_disbursal.update({
    where: {
      id: disbursalId,
      client_id: clientId,
    },
    data: {
      status,
      utr_no: utrNo,
    },
  });

  return response;
};

export const autoDisbursalModel = {
  addAutoDisbursal,
  getAutoDisbursal,
  updateAutoDisbursalModel,
};
