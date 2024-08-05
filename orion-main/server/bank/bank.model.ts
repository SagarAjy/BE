import { prisma } from '../../prisma-client';

const getBankByIFSC = async ({ ifsc }: { ifsc: string }) => {
  const response = await prisma.banks.findFirst({
    where: {
      ifsc,
    },
    select: {
      bank: true,
      ifsc: true,
      branch: true,
      address: true,
      contact: true,
      city: true,
      district: true,
      state: true,
    },
  });

  return response;
};

export const bankModel = { getBankByIFSC };
