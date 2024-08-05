import express, { Router } from 'express';
import { customerService } from './customer.service';
import { genders, lead_status, marital_status } from '@prisma/client';
import { logger } from '../../logger';
import { customerModel } from './customer.model';
import { fetchUser } from '../middleware/auth.middleware';
import { auditLogModel } from '../audit-logs/audit-logs.model';

type customerDataType =
  | {
      id: string;
      customerName: string;
      customerPicture: string;
      email: string;
      phoneNo: string;
      gender: genders;
      createdAt: Date;
      pan: string;
      aadhar: string;
      city: string;
      status: lead_status;
    }
  | {
      message: string;
    };

type customerBodyType = {
  name: string;
  gender: genders;
  pancard: string;
  dob: Date;
  mobile: string;
  email: string;
  marital_status: marital_status;
  aadhar_no: string;
  employeeType: string;
  otp: string;
};

export const customerRouter: Router = express.Router();

//get customer by leadId
customerRouter.get<{ leadId: string }, customerDataType>(
  '/lead/:leadId',
  fetchUser,
  async (req, res) => {
    try {
      //@ts-ignore
      const clientId = req.clientId;
      const { leadId } = req.params;
      const customerInfo = await customerService.getCustomerByLeadId({
        leadId,
        clientId,
      });
      res.status(200).send(customerInfo);
    } catch (error) {
      logger.error(error);
      res.status(500).send({ message: 'Some error occured!' });
    }
  },
);

//update customer by leadId
customerRouter.put<{ leadId: string }, Record<never, never>, customerBodyType>(
  '/update',
  fetchUser,
  async (req, res) => {
    try {
      //@ts-ignore
      const clientId = req.clientId;
      //@ts-ignore
      const userId = req.user.user;

      const customer = await customerModel.getCustomerByPhoneNo({
        phoneNo: req.body.mobile,
        clientId,
      });

      await customerModel.updateCustomer({
        ...req.body,
        customerId: customer?.customer_id || '',
        clientId,
      });

      const customerInfo = await customerModel.getCustomerByPhoneNo({
        phoneNo: req.body.mobile,
        clientId,
      });
      await auditLogModel.createLog({
        activity: `Updated customer info for customer ${customerInfo?.customer_id}`,
        userId,
        eventType: 'Update',
        clientId,
      });
      res.status(200).send({ message: 'Customer updated successfully!' });
    } catch (error) {
      logger.error(error);
      res.status(500).send({ message: 'Some error occured!' });
    }
  },
);

customerRouter.put<
  Record<never, never>,
  Record<never, never>,
  { customerId: string; oldPhoneNo: string; newPhoneNo: string }
>('/update-phone', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    //@ts-ignore
    const userId = req.user.user;

    const { customerId, oldPhoneNo, newPhoneNo } = req.body;

    await customerModel.updateCustomerPhoneNo({
      mobile: newPhoneNo,
      customerId,
      clientId,
    });
    await auditLogModel.createLog({
      activity: `Updated customer phone number for customer ${customerId} from ${oldPhoneNo} to ${newPhoneNo}`,
      userId,
      eventType: 'Update',
      clientId,
    });

    res.status(200).send({ message: 'Customer updated successfully!' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occurred!' });
  }
});
