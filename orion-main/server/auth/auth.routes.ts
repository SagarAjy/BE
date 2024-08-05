import express, { Router } from 'express';
import { authModel } from './auth.model';
import jwt from 'jsonwebtoken';
import { fetchUser } from '../middleware/auth.middleware';
import { logger } from '../../logger';
import { tabsByRole } from '../../constants';
import { userModel } from '../user/user.model';
import { generateOTP } from '../../utils';
import { sendEmail } from '../../otp-email';
import { auditLogModel } from '../audit-logs/audit-logs.model';
export const authRouter: Router = express.Router();

const secretKey = process.env.SECRET_KEY;

type tabsToRenderType = {
  id: number;
  menu: string;
  subMenu?: {
    label: string;
    path: string;
  }[];
};

type getOTPBodyType = {
  email: string;
};

type getOTPResponseType =
  | {
      token: string;
    }
  | { message: string };

type validateBodyType = {
  email: string;
  otp: string;
};

type validateResponseType =
  | {
      token: string;
      id: string;
      tabsToRender?: tabsToRenderType[];
      name: string;
      role: string;
      clientIds?: string[];
    }
  | { message: string };

authRouter.post<Record<never, never>, getOTPResponseType, getOTPBodyType>(
  '/get_otp',
  async (req, res) => {
    try {
      const { email } = req.body;
      const userDetails = await authModel.getUserIdByEmail({ email });
      // * generate otp
      let email_otp = 0;
      if (process.env.ENVIRONMENT === 'production') {
        email_otp = generateOTP();
      } else {
        email_otp = 1234;
      }

      // * update user table with otp and time
      await authModel.updateUserOTP({
        email_otp,
        user_id: userDetails?.user_id || '',
      });
      await sendEmail({ otp: email_otp.toString(), to: email });

      res.status(200).send({ message: 'OTP Sent' });
    } catch (error) {
      logger.error(error);
      res.status(400).send({ message: 'Invalid Email' });
    }
  },
);

authRouter.post<
  Record<never, never>,
  validateResponseType | { message: string },
  validateBodyType
>('/validate', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // * getting user_id using email
    const userDetails = await authModel.getUserIdByEmail({ email });

    if (parseInt(otp) !== userDetails?.otp) {
      return res.status(401).send({ message: 'Invalid OTP' });
    }

    // * checking if otp is valid or not by calculating time difference
    const difference =
      new Date().getTime() - parseInt(userDetails.otp_timestamp || '');

    if (difference > 300000) {
      return res.status(401).send({ message: 'OTP Expired' });
    }

    const data = { user: userDetails.user_id };
    // * signing jwt token
    const token = jwt.sign(data, secretKey || '', {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });

    let tabsToRender;
    if (userDetails.role === 'Admin') {
      tabsToRender = tabsByRole.Admin;
    } else if (userDetails.role === 'Tele_Caller') {
      tabsToRender = tabsByRole.Tele_Caller;
    } else if (
      userDetails.role === 'Credit_Manager' ||
      userDetails.role === 'Loan_Officer'
    ) {
      tabsToRender = tabsByRole.Credit_Manager;
    } else if (
      userDetails.role === 'Collection_Manager' ||
      userDetails.role === 'Collection_Executive'
    ) {
      tabsToRender = tabsByRole.Collection_Manager;
    } else if (userDetails.role === 'Accounts') {
      tabsToRender = tabsByRole.Accounts;
    } else if (userDetails.role === 'Service') {
      tabsToRender = tabsByRole.Service;
    }

    res.status(200).send({
      token,
      id: userDetails.user_id,
      tabsToRender,
      name: userDetails.name,
      role: userDetails.role,
    });
  } catch (error) {
    // logger.error(error);
    res.status(500).send({ message: 'token expired' });
  }
});

authRouter.get<Record<never, never>, validateResponseType>(
  '/revalidate',
  fetchUser,
  async (req, res) => {
    try {
      //@ts-ignore
      const userId = req.user.user;

      const data = { user: userId };
      // * signing jwt token
      const token = jwt.sign(data, secretKey || '', {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
      });

      const user = await userModel.getUserWithoutClientId({ userId });

      let tabsToRender;
      if (user?.role === 'Admin') {
        tabsToRender = tabsByRole.Admin;
      } else if (user?.role === 'Tele_Caller')
        tabsToRender = tabsByRole.Tele_Caller;
      else if (user?.role === 'Credit_Manager' || user?.role === 'Loan_Officer')
        tabsToRender = tabsByRole.Credit_Manager;
      else if (
        user?.role === 'Collection_Manager' ||
        user?.role === 'Collection_Executive'
      ) {
        tabsToRender = tabsByRole.Collection_Manager;
      } else if (user?.role === 'Accounts') {
        tabsToRender = tabsByRole.Accounts;
      } else if (user?.role === 'Service') {
        tabsToRender = tabsByRole.Service;
      }

      res.status(200).send({
        token,
        id: data.user,
        tabsToRender,
        name: user?.name || '',
        role: user?.role || '',
      });
    } catch (error) {
      res.status(500).send({ message: 'token expired' });
    }
  },
);

authRouter.post<
  Record<never, never>,
  { message: string },
  { latitude: number; longitude: number; ipAddress: string }
>('/login-event', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    //@ts-ignore
    const userId = req.user.user;

    const { ipAddress, latitude, longitude } = req.body;

    await auditLogModel.createLog({
      userId,
      clientId,
      activity: `Logged in using IP Address ${ipAddress} from Latitude: ${latitude} & Longitude: ${longitude}`,
      eventType: 'Login',
    });
    res.status(200).send({ message: 'Login event logged!' });
  } catch (error) {
    res.status(500).send({ message: 'token expired' });
  }
});
