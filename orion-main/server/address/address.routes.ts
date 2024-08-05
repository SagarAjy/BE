import express, { Router } from 'express';
import { fetchUser } from '../middleware/auth.middleware';
import { addressService } from './address.service';
import { logger } from '../../logger';
import {
  Prisma,
  verification_status,
  address_type,
  house_types,
} from '@prisma/client';
import { addressModel } from './address.model';
import { leadsModel } from '../leads/leads.model';

export const addressRouter: Router = express.Router();

export type addAddressType = {
  type: address_type;
  address: string;
  city: string;
  state: string;
  pincode: string;
  houseType: house_types;
  status: verification_status;
  isChecked: string;
};

export type getAddressType = Omit<addAddressType, 'isChecked'> & {
  id: string;
  verifiedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

//create address
addressRouter.post<{ leadId: string }, Record<never, never>, addAddressType>(
  '/add/:leadId',
  fetchUser,
  async (req, res) => {
    try {
      //@ts-ignore
      const clientId = req.clientId;
      const { leadId } = req.params;
      const leadDetails = await leadsModel.getLeadById({ leadId, clientId });

      const getAddress = await addressModel.getAddressByCustomerId({
        customerId: leadDetails?.customer_id || '',
        type: req.body.type,
        clientId,
      });

      //@ts-ignore
      const userId = req.user.user;
      const { address, city, state, pincode, houseType, status } = req.body;

      //*condition if address status is verified then only userid is send otherwise null
      await addressModel.addAddress({
        customerId: leadDetails?.customer_id || '',
        userId:
          req.body.status === 'Verified' || req.body.status === 'Rejected'
            ? userId
            : null,
        ...req.body,
        clientId,
      });

      //*NOTE: if isChecked is true and address type is 'Permanent'
      //* then added another address with type 'Current address' vice versa
      if (req.body.isChecked === 'true') {
        await addressModel.addAddress({
          customerId: leadDetails?.customer_id || '',
          userId:
            req.body.status === 'Verified' || req.body.status === 'Rejected'
              ? userId
              : null,
          type:
            req.body.type === 'Permanent_Address'
              ? 'Current_Address'
              : 'Permanent_Address',
          address,
          city,
          state,
          pincode,
          houseType,
          status,
          clientId,
        });
      }
      return res.status(200).send({ message: 'Address Added!' });
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured!' });
    }
  },
);

//get address by leadId
addressRouter.get<{ leadId: string }, getAddressType[] | { message: string }>(
  '/getAddress/:leadId',
  fetchUser,
  async (req, res) => {
    try {
      //@ts-ignore
      const clientId = req.clientId;
      const { leadId } = req.params;
      const addressDetails = await addressService.getAddress({
        leadId,
        clientId,
      });
      res.status(200).send(addressDetails);
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured!' });
    }
  },
);

//update address by addressId
addressRouter.put<{ addressId: string }>(
  '/update/:addressId',
  fetchUser,
  async (req, res) => {
    try {
      const { addressId } = req.params;
      //@ts-ignore
      const userId = req.user.user;
      //@ts-ignore
      const clientId = req.clientId;
      await addressModel.updateAddress({
        addressId,
        userId:
          req.body.status === 'Verified' || req.body.status === 'Rejected'
            ? userId
            : null,
        ...req.body,
        clientId,
      });
      res.status(200).send({ message: 'Address details updated!' });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res
            .status(401)
            .send({ message: 'Address already verified!', code: 'P2025' }); // * since address is already verified
        }
      }
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured!' });
    }
  },
);

//delete address by addressId
addressRouter.delete('/delete/:addressId', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    const { addressId } = req.params;
    await addressModel.deleteAddress({ addressId, clientId });
    return res.status(200).send({ message: 'Address successfully deleted' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});
