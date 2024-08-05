import { genders, house_types, lead_status } from '@prisma/client';
import express, { Router } from 'express';
import { reportsService } from './reports.service';
import { logger } from '../../logger';
import { fetchUser } from '../middleware/auth.middleware';
import { userModel } from '../user/user.model';
import { adminReportsService } from './reports.admin.service';
import { parse } from 'date-fns';

export const reportsRouter: Router = express.Router();

type getDisbursalsReportsType = {
  id: string;
  leadId: string;
  loanNo: string;
  branch: string;
  loanType: string;
  name: string;
  creditManager: string;
  gender: genders;
  dob: Date;
  personalEmail: string;
  officeEmail: string;
  mobile: string;
  aadharNumber: string;
  panCard: string;
  loanAmount: number;
  approvalDate: Date;
  disbursalAmount: number;
  tenure: number;
  roi: number;
  disbursalDate: Date;
  accountNo: string;
  accountType: string;
  ifsc: string;
  bank: string;
  bankBranch: string;
  disbursalReferenceNo: string;
  processingFee: number;
  monthlyIncome: number;
  cibil: number;
  gstFee: number;
  utmSource: string;
  status: lead_status;
  address: string;
  city: string;
  state: string;
  pincode: string;
  addressCategory: house_types;
};

type getCollectionsReportsType = {
  id: string;
  leadId: string;
  loanNo: string;
  name: string;
  mobile: string;
  loanAmount: number;
  processingFee: number;
  disbursalDate: Date;
  collectedAmount: number;
  penalty: number;
  collectedMode: string;
  collectionDate: Date;
  collectionTime: string;
  referenceNo: string;
  totalCollectionAmount: number;
  status: lead_status;
  remark: string;
  createdAt: Date;
  employerName: string;
};

type statsType = {
  title: string;
  metric: number;
  progress: number;
  target: number;
  deltaType: string;
};

type performanceHistoryType = {
  date: string;
  ['Documents Received']: number;
  ['Interested']: number;
};
type creditManagerreporteeType = {
  day: string;
  ['Disbursal']: number;
};

type ReporteeType<T extends string> = {
  ['Leads Assigned']: number;
  ['Documents Received']: number;
} & Record<T, string>;

type cibilDataType = {
  id: string;
  name: string;
  dob: Date;
  gender: string;
  pan: string;
  aadhar: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  loanNo: string;
  amount: number;
  disbursalDate: Date;
  repaymentDate: Date;
  collectionStatus: string;
  closureDate: string;
  currentBalance: number;
  amountOverdue: number;
  overDueDays: number;
};

//get disbursal report
reportsRouter.get<
  Record<never, never>,
  | { disbursalReports: getDisbursalsReportsType[]; count: number }
  | { message: string }
  | null,
  Record<never, never>,
  {
    limit?: number;
    offset?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
  }
>('/disbursal', fetchUser, async (req, res) => {
  try {
    const limit = Number(req.query.limit);
    const offset = Number(req.query.offset);
    const searchparam = decodeURIComponent(req.query.search || '');
    const startDate = decodeURIComponent(req.query.startDate || '');
    const endDate = decodeURIComponent(req.query.endDate || '');
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    let response;
    if (startDate.length !== 0 && endDate.length !== 0) {
      response = await reportsService.getDisbursalReports({
        limit,
        offset,
        userId,
        searchparam,
        startDate: parse(startDate, 'dd-MM-yyyy', new Date()),
        endDate: parse(endDate, 'dd-MM-yyyy', new Date()),
        clientId,
      });
    } else {
      response = await reportsService.getDisbursalReports({
        limit,
        offset,
        userId,
        searchparam,
        clientId,
      });
    }
    return res.status(200).send(response);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});

//get collections report
reportsRouter.get<
  Record<never, never>,
  | { collectionsReport: getCollectionsReportsType[]; count: number }
  | { message: string }
  | null,
  Record<never, never>,
  {
    limit: number;
    offset: number;
    search?: string;
    startDate?: string;
    endDate?: string;
  }
>('/collections', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    const limit = Number(req.query.limit);
    const offset = Number(req.query.offset);
    const searchparam = decodeURIComponent(req.query.search || '');
    const startDate = decodeURIComponent(req.query.startDate || '');
    const endDate = decodeURIComponent(req.query.endDate || '');
    //@ts-ignore
    const userId = req.user.user;

    let response;
    if (startDate.length !== 0 && endDate.length !== 0) {
      response = await reportsService.getCollectionsReport({
        limit,
        offset,
        userId,
        searchparam,
        startDate: parse(startDate, 'dd-MM-yyyy', new Date()),
        endDate: parse(endDate, 'dd-MM-yyyy', new Date()),
        clientId,
      });
    } else {
      response = await reportsService.getCollectionsReport({
        limit,
        offset,
        userId,
        searchparam,
        clientId,
      });
    }
    return res.status(200).send(response);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});

//get stats for all users
reportsRouter.get<
  Record<never, never>,
  statsType | statsType[] | { message: string } | null,
  Record<never, never>,
  { year: string; month?: string; day?: string }
>('/stats', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const userDetails = await userModel.getUser({ userId, clientId });
    const today = new Date();
    const thisYear = today.getFullYear();
    const year = Number(req.query.year) || thisYear;
    const month = Number(req.query.month) || 0;
    const day = Number(req.query.day) || 0;

    let response;
    if (
      userDetails?.role === 'Admin' ||
      userDetails?.role === 'Accounts' ||
      userDetails?.role === 'Service'
    ) {
      response = await adminReportsService.adminStats({
        year,
        month,
        day,
        clientId,
      });
    } else if (
      userDetails?.role === 'Credit_Manager' ||
      userDetails?.role === 'Loan_Officer'
    ) {
      response = await reportsService.creditManagerStats({
        userId,
        year,
        month,
        day,
        clientId,
      });
    } else if (userDetails?.role === 'Collection_Manager') {
      response = await reportsService.collectionManagerStats({
        userId,
        year,
        month,
        day,
        clientId,
      });
    } else if (
      userDetails?.role === 'Tele_Caller' ||
      userDetails?.role === 'Collection_Executive'
    ) {
      response = await reportsService.teleCallerStats({
        userId,
        year,
        month,
        day,
        clientId,
      });
    }
    return res.status(200).send(response);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});

reportsRouter.get<
  Record<never, never>,
  performanceHistoryType[] | { message: string } | null,
  Record<never, never>,
  { year: string; month?: string }
>('/telecaller-performance', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const today = new Date();
    const thisYear = today.getFullYear();
    const year = Number(req.query.year) || thisYear;
    const month = Number(req.query.month) || 0;
    if (month === 0) {
      const response = await reportsService.teleCallerPerformanceMonthly({
        userId,
        year,
        clientId,
      });
      return res.status(200).send(response);
    } else {
      const response = await reportsService.teleCallerPerformanceDaily({
        userId,
        year,
        month,
        clientId,
      });
      return res.status(200).send(response);
    }
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});

reportsRouter.get<
  Record<never, never>,
  creditManagerreporteeType[] | { message: string } | null,
  Record<never, never>,
  { year: string; month?: string }
>('/credit-manager-disbursal-performance', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const today = new Date();
    const thisYear = today.getFullYear();
    const year = Number(req.query.year) || thisYear;
    const month = Number(req.query.month) || 0;
    let response;
    if (month === 0) {
      response = await reportsService.creditManagerReporteePerformanceMonthly({
        userId,
        year,
        clientId,
      });
    } else {
      response = await reportsService.creditManagerReporteePerformanceDaily({
        userId,
        year,
        month,
        clientId,
      });
    }

    return res.status(200).send(response);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});

reportsRouter.get<
  | {
      name: string;
      ['Collection Amount']: number;
      ['Collection Target']: number;
    }[]
  | { message: string }
  | null,
  Record<never, never>,
  { month?: string; year?: string }
>('/collection-executive-data-report', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignores
    const clientId = req.clientId;
    const userDetails = await userModel.getUser({ userId, clientId });
    const today = new Date();
    const thisYear = today.getFullYear();
    const month = Number(req.query.month) || 0;
    const year = Number(req.query.year) || thisYear;

    let response;
    if (userDetails?.role === 'Collection_Manager') {
      response = await reportsService.getCollectionByUsers({
        month,
        year,
        clientId,
        userId,
      });
      return res.status(200).send(response);
    } else {
      return res.status(401).send({ message: 'Unauthorized' });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});

reportsRouter.get<
  Record<never, never>,
  { cibilData: cibilDataType[]; count: number } | { message: string } | null,
  Record<never, never>,
  {
    limit: number;
    offset: number;
    searchparam: string;
    startDate: string;
    endDate: string;
  }
>('/cibil-data', fetchUser, async (req, res) => {
  try {
    const limit = Number(req.query.limit);
    const offset = Number(req.query.offset);
    const searchparam = decodeURIComponent(req.query.searchparam || '');
    const startDate = decodeURIComponent(req.query.startDate || '');
    const endDate = decodeURIComponent(req.query.endDate || '');

    //@ts-ignore
    const clientId = req.clientId;
    //@ts-ignore
    const userId = req.user.user;

    let cibilData;
    if (startDate.length !== 0 && endDate.length !== 0) {
      cibilData = await reportsService.getCibilData({
        limit,
        offset,
        searchparam,
        startDate: parse(startDate, 'dd-MM-yyyy', new Date()),
        endDate: parse(endDate, 'dd-MM-yyyy', new Date()),
        clientId,
      });
    } else {
      cibilData = await reportsService.getCibilData({
        limit,
        offset,
        searchparam,
        clientId,
      });
    }
    return res.status(200).send(cibilData);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});
