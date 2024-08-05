import express, { Router } from 'express';
import { generateOTP } from '../../../utils';
import { customerOtpModel } from '../customer-otp/public.customer-otp.model';
import jwt from 'jsonwebtoken';
import { logger } from '../../../logger';
import { customerModel } from '../../customer/customer.model';
import { fetchCustomer } from '../../middleware/customer.auth.middleware';
import axios from 'axios';

type CustomerType = {
  id: string;
  name: string;
  token: string;
  clientId?: string;
};

const secretKey = process.env.SECRET_KEY;

export const customerAuthRouter: Router = express.Router();

customerAuthRouter.post<
  Record<never, never>,
  { message: string },
  { phoneNo: string; clientId: string }
>('/get_otp', async (req, res) => {
  try {
    const { phoneNo, clientId } = req.body;
    let phoneOtp = 0;
    // * generate otp
    if (process.env.ENVIRONMENT === 'production') {
      phoneOtp = generateOTP();
    } else {
      // FIX THE OTP TO 1234 for customer in case of dev or local environment
      phoneOtp = 1234;
    }

    // * update customer otp table with otp and time
    await customerOtpModel.updateCustomerOTP({
      otp: phoneOtp,
      phoneNo,
      clientId,
    });

    if (process.env.ENVIRONMENT === 'production') {
      // * send otp to customer
      await axios.post(
        process.env.SMS_URL || '',
        {
          // route: 'otp',
          // variables_values: phoneOtp,
          // numbers: phoneNo,
            variables_values: phoneOtp,
            route: 'dlt',
            numbers: phoneNo,
            message: "169237",
            sender_id: "GBFPL",
        },
        {
          headers: {
            authorization: process.env.SMS_AUTH_KEY,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    res.status(200).send({ message: 'OTP Sent' });
  } catch (error) {
    logger.error(error);
    res.status(400).send({ message: 'Invalid Phone Number' });
  }
});

customerAuthRouter.post<
  Record<never, never>,
  { customer: CustomerType; customerExists: boolean } | { message: string },
  { phoneNo: string; otp: string; clientId: string }
>('/validate', async (req, res) => {
  try {
    const { phoneNo, otp, clientId } = req.body;

    const customerOtp = await customerOtpModel.getCustomerByPhone({
      phoneNo,
      clientId,
    });

    if (customerOtp?.otp !== parseInt(otp)) {
      return res.status(401).send({ message: 'Invalid OTP' });
    }

    // * checking if otp is valid or not by calculating time difference
    const difference =
      new Date().getTime() - parseInt(customerOtp.otp_timestamp || '');

    if (difference > 300000) {
      return res.status(401).send({ message: 'OTP Expired' });
    }

    // * signing jwt token
    const data = { phoneNo: customerOtp.customer_mobile_no };
    const token = jwt.sign(data, secretKey || '', {
      expiresIn: process.env.JWT_EXPIRES_IN || '60d',
    });

    let customerExists = false;
    let customer = {
      id: '',
      name: '',
      token: '',
    };

    const customerDetails = await customerModel.getCustomerByPhoneNo({
      phoneNo: phoneNo.toString(),
      clientId,
    });

    if (customerDetails) {
      customerExists = true;
      customer = {
        id: customerDetails.customer_id,
        name: customerDetails.name,
        token: token,
      };
    }

    res.status(200).send({
      customer,
      customerExists,
    });
  } catch (error) {
    logger.error(error);
    res.status(400).send({ message: 'Invalid Phone Number' });
  }
});

customerAuthRouter.get<
  Record<never, never>,
  { id: string; token: string; name: string } | { message: string }
>('/revalidate', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;
    //@ts-ignore
    const clientId = req.clientId;
    const data = { phoneNo };
    // * signing jwt token
    const token = jwt.sign(data, secretKey || '', {
      expiresIn: process.env.JWT_EXPIRES_IN || '60d',
    });

    const customer = await customerModel.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });

    res.status(200).send({
      id: customer?.customer_id || '',
      token,
      name: customer?.name || '',
    });
  } catch (error) {
    res.status(500).send({ message: 'Token expired!' });
  }
});
