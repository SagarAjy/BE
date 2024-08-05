import express, { Router, response } from 'express';
import { logger } from '../../logger';
import { bankModel } from './bank.model';

export const bankRouter: Router = express.Router();

type bankGetType = {
  bank: string;
  ifsc: string;
  branch: string;
  address: string;
  contact: string;
  city: string;
  district: string;
  state: string;
};

bankRouter.get<{ ifsc: string }, bankGetType | { message: string } | null>(
  '/get/:ifsc',
  async (req, res) => {
    try {
      let { ifsc } = req.params;
      ifsc = decodeURIComponent(ifsc);
      const response = await bankModel.getBankByIFSC({ ifsc });

      res.status(200).send(response);
    } catch (error) {
      logger.error(error);
      res.status(500).send({ message: 'Some error occured!' });
    }
  },
);
