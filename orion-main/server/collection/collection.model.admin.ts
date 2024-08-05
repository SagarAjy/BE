import { lead_status } from '@prisma/client';
import { prisma } from '../../prisma-client';

//get all collections
const getAllCollections = async ({
  limit,
  offset,
  collectionFilter,
  filterBy,
  searchparam,
  clientId,
}: {
  limit: number;
  offset: number;
  collectionFilter: lead_status;
  filterBy: string;
  searchparam?: string;
  clientId: string;
}) => {
  const response = await prisma.leads.findMany({
    take: limit,
    skip: offset,
    where: {
      client_id: clientId,
      status: collectionFilter,
      OR: [
        {
          approval: {
            loan_no: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            name: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            mobile: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            email: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          collection: {
            some: {
              reference_no: {
                contains: searchparam,
                mode: 'insensitive',
              },
            },
          },
        },
      ],
    },
    include: {
      approval: {
        select: {
          loan_no: true,
          repay_date: true,
        },
      },
      collection: {
        select: {
          collection_id: true,
          collected_amount: true,
          collected_mode: true,
          collected_date: true,
          reference_no: true,
          discount_amount: true,
          settlement_amount: true,
          created_at: true,
        },
      },
    },
    orderBy: {
      approval: {
        repay_date: 'desc',
      },
    },
  });

  return response;
};

//get all collections counnt
const getAllCollectionsCount = async ({
  collectionFilter,
  filterBy,
  searchparam,
  clientId,
}: {
  collectionFilter: lead_status;
  filterBy: string;
  searchparam?: string;
  clientId: string;
}) => {
  const response = await prisma.leads.count({
    where: {
      client_id: clientId,
      status: collectionFilter,
      OR: [
        {
          approval: {
            loan_no: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            name: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            mobile: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          customers: {
            email: {
              contains: searchparam,
              mode: 'insensitive',
            },
          },
        },
        {
          collection: {
            some: {
              reference_no: {
                contains: searchparam,
                mode: 'insensitive',
              },
            },
          },
        },
      ],
    },
    orderBy: {
      approval: {
        repay_date: 'desc',
      },
    },
  });

  return response;
};

export const collectionAdminModel = {
  getAllCollections,
  getAllCollectionsCount,
};
