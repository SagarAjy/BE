import express, { Router } from 'express';
import { logger } from '../../logger';
import { fetchUser } from '../middleware/auth.middleware';
import { leadsModel } from '../leads/leads.model';
import { customerAssetModel } from './customer-asset.model';
import { customerAssetService } from './customer-asset.service';

export const customerAssetRouter: Router = express.Router();

type addCustomerAssetType = {
  assetName: string;
  assetValue: string;
};

type updateCustomerAssetType = addCustomerAssetType & { assetId: string };

type getCustomerAssetType = {
  id: string;
  assetName: string;
  assetValue: string;
  updatedAt: Date;
  createdAt: Date;
};

//create customer asset
customerAssetRouter.post<
  { leadId: string },
  { message: string },
  addCustomerAssetType
>('/add/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const leadDetails = await leadsModel.getLeadById({ leadId, clientId });

    await customerAssetModel.addAsset({
      customerId: leadDetails?.customer_id || '',
      ...req.body,
      clientId,
    });
    return res.status(200).send({ message: 'Asset added !' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

//get customer asset by leadId
customerAssetRouter.get<
  { leadId: string },
  getCustomerAssetType[] | { message: string } | null
>('/get/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const assets = await customerAssetService.getAsset({ leadId, clientId });
    return res.status(200).send(assets);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

//update customer asset by assetId
customerAssetRouter.put<
  Record<never, never>,
  { message: string },
  updateCustomerAssetType
>('/update', fetchUser, async (req, res) => {
  try {
    await customerAssetModel.updateAsset({
      ...req.body,
    });
    return res.status(200).send({ message: 'Asset updated !' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

//delete assset by asset Id
customerAssetRouter.delete<{ assetId: string }, { message: string }>(
  '/delete/:assetId',
  fetchUser,
  async (req, res) => {
    try {
      await customerAssetModel.deleteAsset({ assetId: req.params.assetId });
      return res.status(200).send({ message: 'Asset deleted!' });
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured' });
    }
  },
);
