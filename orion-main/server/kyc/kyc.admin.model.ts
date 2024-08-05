import { prisma } from '../../prisma-client';

const getAllKycRequests = async ({
  limit,
  offset,
  searchparam,
}: {
  limit: number;
  offset: number;
  searchparam: string;
}) => {
  const response = await prisma.kyc_requests.findMany({
    take: limit,
    skip: offset,
    where: {
      OR: [
        {
          aadhar_customer_name: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          aadhar_father_name: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          aadhar_no: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          pan_card: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
      ],
    },
  });

  return response;
};

const getAllKycRequestsCount = async ({
  searchparam,
}: {
  searchparam: string;
}) => {
  const response = await prisma.kyc_requests.count({
    where: {
      OR: [
        {
          aadhar_customer_name: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          aadhar_father_name: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          aadhar_no: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
        {
          pan_card: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
      ],
    },
  });

  return response;
};

const getAllESignRequests = async ({
  limit,
  offset,
  searchparam,
}: {
  limit: number;
  offset: number;
  searchparam: string;
}) => {
  const response = await prisma.e_sign_docs.findMany({
    where: {
      OR: [
        {
          filename: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
      ],
    },
  });

  return response;
};

const getAllESignRequestsCount = async ({
  searchparam,
}: {
  searchparam: string;
}) => {
  const response = await prisma.e_sign_docs.count({
    where: {
      OR: [
        {
          filename: {
            contains: searchparam,
            mode: 'insensitive',
          },
        },
      ],
    },
  });

  return response;
};

export const kycAdminModel = {
  getAllKycRequests,
  getAllKycRequestsCount,
  getAllESignRequests,
  getAllESignRequestsCount,
};
