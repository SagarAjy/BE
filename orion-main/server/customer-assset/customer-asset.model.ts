import { string } from 'yup';
import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';

//create asset
const addAsset = async ({
  customerId,
  assetName,
  assetValue,
  clientId,
}: {
  customerId: string;
  assetName: string;
  assetValue: string;
  clientId: string;
}) => {
  await prisma.customer_assets.create({
    data: {
      asset_id: uuid(),
      customer_id: customerId,
      asset_name: assetName,
      asset_value: assetValue,
      client_id: clientId,
    },
  });
};

//get asset by customer Id
const getAssets = async ({ customerId }: { customerId: string }) => {
  const response = await prisma.customer_assets.findMany({
    where: {
      customer_id: customerId,
    },
  });
  return response;
};

//update asset by assetId
const updateAsset = async ({
  assetId,
  assetName,
  assetValue,
}: {
  assetId: string;
  assetName: string;
  assetValue: string;
}) => {
  await prisma.customer_assets.update({
    where: {
      asset_id: assetId,
    },
    data: {
      asset_name: assetName,
      asset_value: assetValue,
      updated_at: new Date(),
    },
  });
};

//delete asset by assetId
const deleteAsset = async ({ assetId }: { assetId: string }) => {
  await prisma.customer_assets.delete({
    where: {
      asset_id: assetId,
    },
  });
};

export const customerAssetModel = {
  addAsset,
  getAssets,
  updateAsset,
  deleteAsset,
};
