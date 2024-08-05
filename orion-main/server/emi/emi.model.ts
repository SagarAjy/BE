import { prisma } from '../../prisma-client';
import { emiDataType } from '../disbursal/disbursal.service';

const createEMI = async ({ emiData }: { emiData: emiDataType[] }) => {
  const response = await prisma.emis.createMany({
    data: emiData,
  });

  return response;
};

const getEMIsForLoanNo = async ({
  loanNo,
  clientId,
}: {
  loanNo: string;
  clientId: string;
}) => {
  const response = await prisma.emis.findMany({
    where: {
      loan_no: loanNo,
      client_id: clientId,
    },
    orderBy: {
      emi_date: 'asc',
    },
  });

  return response;
};

const getEMILoansForCustomer = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const response = await prisma.loan.findMany({
    where: {
      customer_id: customerId,
      loan_type: 'emi',
      client_id: clientId,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return response;
};

export const emiModel = {
  createEMI,
  getEMIsForLoanNo,
  getEMILoansForCustomer,
};
