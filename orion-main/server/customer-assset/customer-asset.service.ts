import { leadsModel } from '../leads/leads.model';
import { customerAssetModel } from './customer-asset.model';

type getCustomerAssetType = {
  asset_id: string;
  asset_name: string;
  asset_value: string;
  updated_at: Date;
  customer_id: string;
  created_at: Date;
};

const getAsset = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const leadDetails = await leadsModel.getLeadById({ leadId, clientId });

  const customerAssets: getCustomerAssetType[] =
    await customerAssetModel.getAssets({
      customerId: leadDetails?.customer_id || '',
    });

  const assets = customerAssets.map(asset => {
    return {
      id: asset.asset_id,
      assetName: asset.asset_name,
      assetValue: asset.asset_value,
      updatedAt: asset.updated_at,
      createdAt: asset.created_at,
    };
  });

  return assets;
};

export const customerAssetService = { getAsset };
