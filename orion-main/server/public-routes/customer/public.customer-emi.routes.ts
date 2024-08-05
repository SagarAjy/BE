import express, { Router } from 'express';
import { logger } from '../../../logger';
import { emiService } from '../../emi/emi.service';
import { fetchCustomer } from '../../middleware/customer.auth.middleware';
import { customerModel } from '../../customer/customer.model';
import { customerService } from './public.customer.service';

export type EMILoanType = {
  emiId: string;
  emiLoanNo: string;
  emiDate: Date;
  emiAmount: number;
  emiStatus: string;
  emiCreatedAt: Date;
  emiUpdatedAt: Date;
};

type EMILoanHistoryType = {
  loanId: string;
  loanNo: string;
  leadId: string;
  loanAmount: number;
  disbursalDate: Date;
  referenceNo: string;
  emis: EMILoanType[];
};

export const customerEMIRouter: Router = express.Router();

// get current application details
customerEMIRouter.get<
  Record<never, never>,
  | { loanNo: string; approvalAmount: number; tenure: number; status: string }
  | { message: string }
>('/get-emi-loan-details', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;
    //@ts-ignore
    const clientId = req.clientId;

    const customerDetails = await customerModel.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });

    const applicationDetails = await customerService.getEmiLoanDetails({
      customerId: customerDetails?.customer_id || '',
      clientId,
    });

    res.status(200).send(applicationDetails);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

customerEMIRouter.get<{ loanNo: string }, EMILoanType[] | { message: string }>(
  '/get-emi/:loanNo',
  fetchCustomer,
  async (req, res) => {
    try {
      //@ts-ignore
      const clientId = req.clientId;

      const { loanNo } = req.params;
      const emis = await emiService.getEMISForLoanNo({
        loanNo,
        clientId,
      });

      res.status(200).send(emis);
    } catch (error) {
      logger.error(error);
      res.status(500).send({ message: 'Some error occured!' });
    }
  },
);

customerEMIRouter.get<
  Record<never, never>,
  EMILoanHistoryType[] | { message: string }
>('/get-emi-loan-history', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;

    const customerDetails = await customerModel.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });

    const loanHistory = await emiService.getEMILoanHistory({
      customerId: customerDetails?.customer_id || '',
      clientId,
    });

    res.status(200).send(loanHistory);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});
