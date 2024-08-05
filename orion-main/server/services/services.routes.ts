import express, { Router } from 'express';
import { fetchUser } from '../middleware/auth.middleware';
import axios from 'axios';

export const servicesRouter: Router = express.Router();

servicesRouter.get('/sms-balance', fetchUser, async (req, res) => {
  try {
    const fast2SMSUrl = `https://www.fast2sms.com/dev/wallet?authorization=${process.env.SMS_AUTH_KEY}`;

    const response = await axios.get(fast2SMSUrl);

    res.status(200).send({
      balance: response.data.wallet,
    });
  } catch (error) {
    res.status(500).send({ message: 'Something went wrong!' });
  }
});
