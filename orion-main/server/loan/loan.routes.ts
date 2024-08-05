import express, { Router } from 'express';
import { loanService } from './loan.service';
import { logger } from '../../logger';
import { lead_status, loan_type } from '@prisma/client';
import { fetchUser } from '../middleware/auth.middleware';
import { leadsModel } from '../leads/leads.model';
import { disbursalModel } from '../disbursal/disbursal.model';
import { loanModel } from './loan.model';
import { userModel } from '../user/user.model';
import { parse, add, format, startOfDay } from 'date-fns';
import { customerModel } from '../customer/customer.model';
import { novuNotification } from '../novu/novu.model';
import { formatIndianNumber } from '../../utils';
import { auditLogModel } from '../audit-logs/audit-logs.model';
import { approvalService } from '../approval/approval.service';
import { emiService } from '../emi/emi.service';
import { EMILoanType } from '../public-routes/customer/public.customer-emi.routes';

export const loanRouter: Router = express.Router();

type getLoanType = {
  loanNo: string;
  branch: string;
  loanDisbursed: number;
  roi: number;
  noOfDays: number;
  realDays: number;
  penaltyDays: number;
  bouncingCharges: number;
  currentDate: Date;
  paidAmount: number;
  repaymentAmount: number;
  totalInterest: number;
  penaltyInterest: number;
  currentRepayAmount: number;
};

type getBankUpdateType = {
  id: string;
  leadId: string;
  loanNo: string;
  name: string;
  branch: string;
  loanType: string;
  phoneNo: string;
  email: string;
  approvalAmount: number;
  disbursalAmount: number;
  approvalDate: Date;
  disbursalDate: Date;
  roi: number;
  tenure: number;
  processingFeePercent: number;
  processingFee: number;
  conversionFeesPercent: number;
  conversionFees: number;
  accountNumber: string;
  bankName: string;
  bankBranch: string;
  ifscCode: string;
  cibil: number;
  approvedBy: string;
};

type getPendingLoans = {
  id?: string;
  leadId?: string;
  collectionUser?: string;
  daysPastDue?: number;
  loanNo?: string;
  name?: string;
  phoneNo?: string;
  email?: string;
  loanAmount?: number;
  tenure?: number;
  roi?: number;
  repaymentAmount?: number;
  currentRepaymentAmount?: number;
  repayDate?: Date;
  penalty?: number;
  status?: string;
  creditedBy?: string;
  remarks?: string;
} | null;

type loanHistory = {
  leadId: string;
  loanNo: string;
  loanAmount: number;
  roi: number;
  days: number;
  repayDate: Date;
  collectionDate: Date;
  credit: string;
  status: lead_status;
  collectionRemark: string;
};

//get loan
loanRouter.get<{ leadId: string }, getLoanType | { message: string } | null>(
  '/get/:leadId',
  fetchUser,
  async (req, res) => {
    try {
      const { leadId } = req.params;
      //@ts-ignore
      const clientId = req.clientId;

      const loanData = await loanService.getLoan({ leadId, clientId });

      res.status(200).send(loanData);
    } catch (error) {
      logger.error(error);
      res.status(500).send({ message: 'Some error occured' });
    }
  },
);

//get all loans with status bank_update
loanRouter.get<
  { leadId: string },
  | { bankUpdateData: getBankUpdateType[]; bankUpdateCount: number }
  | { message: string }
  | null,
  Record<never, never>,
  {
    limit: string;
    offset: string;
    filterBy: string;
    search?: string;
  }
>('/get-bank-update', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const filterBy = req.query.filterBy;
    const searchparam = decodeURIComponent(req.query.search || '');

    //@ts-ignore
    const userId = req.user.user;
    const bankDetails = await loanService.getBankUpdate({
      filterBy,
      limit,
      offset,
      searchparam,
      userId,
      clientId,
    });

    return res.status(200).send(bankDetails);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

//get all loans with status disbursed
loanRouter.get<
  Record<never, never>,
  { loans: getPendingLoans[]; loansCount: number } | { message: string },
  Record<never, never>,
  {
    limit: string;
    offset: string;
    filterBy: string;
    loanFilter: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    assigneeId?: string;
  }
>('/get-payday-pending-loans', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const filterBy = req.query.filterBy;
    const searchparam = decodeURIComponent(req.query.search || '');
    const loanFilter = req.query.loanFilter as loan_type;
    const startDate = decodeURIComponent(req.query.startDate || '');
    const endDate = decodeURIComponent(req.query.endDate || '');
    const assigneeId = req.query.assigneeId;
    //@ts-ignore
    const userId: string = req.user.user;
    let paydayPending;
    if (startDate.length !== 0 && endDate.length !== 0) {
      paydayPending = await loanService.getAllPendingLoans({
        limit,
        offset,
        loanFilter,
        filterBy,
        searchparam,
        userId,
        startDate: parse(startDate, 'dd-MM-yyyy', new Date()),
        endDate: parse(endDate, 'dd-MM-yyyy', new Date()),
        clientId,
        assigneeId,
      });
      return res.status(200).send(paydayPending);
    } else {
      paydayPending = await loanService.getAllPendingLoans({
        limit,
        offset,
        loanFilter,
        filterBy,
        searchparam,
        userId,
        clientId,
        assigneeId,
      });
      return res.status(200).send(paydayPending);
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});

//send reminder email
loanRouter.post<
  Record<never, never>,
  { message: string },
  Record<never, never>,
  {
    days: string;
  }
>('/send-reminder-email', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    const days = parseInt(req.query.days);
    const currentDate = new Date();
    let startDate = startOfDay(currentDate);
    let endDate;
    endDate = add(startDate, { days: days });
    if (days === 8) {
      endDate = add(startDate, { days: 8 });
      startDate = add(startDate, { days: 6 });
    } else if (days === 6) {
      endDate = add(startDate, { days: 6 });
      startDate = add(startDate, { days: 3 });
    } else if (days === 4) {
      endDate = add(startDate, { days: 3 });
      startDate = add(startDate, { days: 2 });
    } else if (days === 2) {
      endDate = add(startDate, { days: 2 });
    }
    //@ts-ignore
    const userId: string = req.user.user;
    let paydayPending;

    paydayPending = await loanService.allPendingLoansRemnderEmail({
      userId,
      startDate,
      endDate,
      clientId,
    });
    //removing null values from paydaypending array
    const response = paydayPending.pendingLoans.filter(loan => {
      if (loan !== null) return loan;
    });

    //making array of objects for mail
    const data = response.map(async loan => {
      const leadDetails = await leadsModel.getLeadById({
        leadId: loan?.leadId || '',
        clientId,
      });
      const customerDetails = await customerModel.getCustomerById({
        customer_id: leadDetails?.customer_id || '',
        clientId,
      });
      return {
        name: 'reminder-mail',
        to: {
          subscriberId: loan?.leadId || '',
          email: customerDetails?.email || '',
        },
        payload: {
          customerName: customerDetails?.name || '',
          loanNo: loan?.loanNo || '',
          repaymentAmount: formatIndianNumber(loan?.repaymentAmount || 0),
          repaymentDate:
            format(loan?.repayDate || new Date(), 'dd-MM-yyyy') || '',
        },
      };
    });
    await novuNotification.sendReminderEmailToCustomer({
      data: await Promise.all(data),
      clientId,
    });
    return res.status(200).send({ message: 'Reminder email send' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});

//get all loans of a customer
loanRouter.get<{ leadId: string }, loanHistory[] | { message: string } | null>(
  '/loan-history/:leadId',
  fetchUser,
  async (req, res) => {
    try {
      //@ts-ignore
      const clientId = req.clientId;
      const { leadId } = req.params;
      const loanHistory = await loanService.getLoanHistory({
        leadId,
        clientId,
      });
      return res.status(200).send(loanHistory);
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured' });
    }
  },
);

loanRouter.delete<{ loanId: string }, { message: string } | null>(
  '/delete-bank-update/:loanId',
  fetchUser,
  async (req, res) => {
    try {
      const { loanId } = req.params;
      //@ts-ignore
      const userId = req.user.user;
      //@ts-ignore
      const clientId = req.clientId;
      const userDetails = await userModel.getUser({ userId, clientId });
      const loanDetails = await loanModel.getLoan({ loanId, clientId });
      if (
        userDetails?.role === 'Admin' ||
        userDetails?.role === 'Credit_Manager' ||
        userDetails?.role === 'Accounts'
      ) {
        const leadDetails = await leadsModel.getLeadById({
          leadId: loanDetails?.lead_id || '',
          clientId,
        });

        const disbursalDetails = await disbursalModel.getDisbursal({
          leadId: loanDetails?.lead_id || '',
          clientId,
        });
        if (!disbursalDetails)
          return res
            .status(200)
            .send({ message: 'No Disbursal Details found' });
        await loanModel.deleteBankUpdate({
          userId,
          customerId: leadDetails?.customer_id || '',
          leadId: loanDetails?.lead_id || '',
          loanId: disbursalDetails.loan_id || '',
          clientId,
        });

        await auditLogModel.createLog({
          activity: `Deleted disbursal of loan no ${loanDetails?.loan_no} and lead id ${loanDetails?.lead_id}`,
          userId,
          eventType: 'Delete',
          clientId,
        });

        return res.status(200).send({ message: 'Bank update deleted' });
      }
      return res.status(401).send({ message: 'Not authorized' });
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured' });
    }
  },
);

loanRouter.get<{ leadId: string }, EMILoanType[] | { message: string }>(
  '/get-emi-loan/:leadId',
  fetchUser,
  async (req, res) => {
    try {
      //@ts-ignore
      const clientId = req.clientId;

      const { leadId } = req.params;

      const approvalDetails = await approvalService.getapproval({
        leadId,
        clientId,
      });

      const emis = await emiService.getEMISForLoanNo({
        loanNo: approvalDetails?.loanNo || '',
        clientId,
      });

      res.status(200).send(emis);
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured' });
    }
  },
);
