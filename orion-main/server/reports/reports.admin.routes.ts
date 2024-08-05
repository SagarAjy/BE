import express, { Router } from 'express';
import { adminReportsService } from './reports.admin.service';
import { logger } from '../../logger';
import { fetchUser } from '../middleware/auth.middleware';
import { userModel } from '../user/user.model';
import { roles } from '@prisma/client';
import { reportsService } from './reports.service';

export const adminReportsRouter: Router = express.Router();

export type disbursalCollectionAmountType = {
  name: string;
  ['Today']: number;
  ['Month']: number;
  ['Year']: number;
};

type collectionDailyTrackType = {
  date: string;
  dueCases: number;
  loanAmount: number;
  repayAmount: number;
  collected: number;
  collectedCases: number;
  collectionPending: number;
  partPaymentCases: number;
  partPayment: number;
};

type performanceHistoryType = {
  date: string;
  ['Disbursals']: number;
  ['Collections']: number;
  ['Leads']: number;
};

//get month wise year wise disbursal,collection,leads
adminReportsRouter.get<
  Record<never, never>,
  performanceHistoryType[] | { message: string } | null,
  Record<never, never>,
  { year: string; month?: string }
>('/performance-history', fetchUser, async (req, res) => {
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
    if (userDetails?.role !== 'Admin') {
      return res.status(500).send({ message: 'Not authorized' });
    }
    if (month === 0) {
      const response = await adminReportsService.performanceHistoryMonthly({
        year,
        clientId,
      });
      return res.status(200).send(response);
    } else {
      const response = await adminReportsService.performanceHistoryDaily({
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

//role wise dibursal report
adminReportsRouter.get<
  { role: roles },
  | {
      name: string;
      ['Disbursal Amount']: number;
      ['Disbursal Target']: number;
    }[]
  | { message: string }
  | null,
  Record<never, never>,
  { month?: string; year?: string }
>('/disbursal-role-data-report/:role', fetchUser, async (req, res) => {
  try {
    const { role } = req.params;
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const userDetails = await userModel.getUser({ userId, clientId });
    const today = new Date();
    const thisYear = today.getFullYear();
    const month = Number(req.query.month) || 0;
    const year = Number(req.query.year) || thisYear;

    if (userDetails?.role !== 'Admin') {
      return res.status(401).send({ message: 'Unauthorized!' });
    }

    const response = await adminReportsService.getDisbursalRoleData({
      month,
      year,
      role,
      clientId,
    });
    return res.status(200).send(response);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});

//role wise collection report
adminReportsRouter.get<
  { role: roles },
  | {
      name: string;
      ['Collection Amount']: number;
      ['Collection Target']: number;
    }[]
  | { message: string }
  | null,
  Record<never, never>,
  { month?: string; year?: string }
>('/collection-role-data-report/:role', fetchUser, async (req, res) => {
  try {
    const { role } = req.params;
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const userDetails = await userModel.getUser({ userId, clientId });
    const today = new Date();
    const thisYear = today.getFullYear();
    const month = Number(req.query.month) || 0;
    const year = Number(req.query.year) || thisYear;

    if (userDetails?.role !== 'Admin') {
      return res.status(401).send({ message: 'Unauthorized!' });
    }
    let response;
    if (userDetails?.role === 'Admin') {
      response = await adminReportsService.getCollectionByRole({
        month,
        year,
        role,
        clientId,
      });
    }
    return res.status(200).send(response);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});

adminReportsRouter.get<
  Record<never, never>,
  | {
      name: string;
      ['Fresh Disbursal Amount']: number;
      ['Fresh Cases']: number;
      ['Reloan Disbursal Amount']: number;
      ['Reloan Cases']: number;
    }[]
  | { message: string }
  | null,
  Record<never, never>,
  { role: roles; month?: string; year?: string }
>('/fresh-reloan-stats', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;

    const userDetails = await userModel.getUser({ userId, clientId });
    const today = new Date();
    const thisYear = today.getFullYear();
    const month = Number(req.query.month) || 0;
    const year = Number(req.query.year) || thisYear;
    const role = req.query.role;

    if (userDetails?.role === 'Admin') {
      const response = await adminReportsService.getFreshReloanData({
        clientId,
        month,
        role,
        year,
      });
      return res.status(200).send(response);
    } else {
      return res.status(403).send({ message: 'Access Denied!' });
    }
  } catch (error) {
    res.status(500).send({ message: 'Something went wrong!' });
  }
});

adminReportsRouter.get<
  Record<never, never>,
  collectionDailyTrackType[] | { message: string },
  { year: string; month?: string }
>('/collection-daily-track', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const today = new Date();
    const thisYear = today.getFullYear();
    const year = Number(req.query.year) || thisYear;
    const month = Number(req.query.month) || 0;

    const userDetails = await userModel.getUser({ userId, clientId });
    let response;

    if (
      userDetails?.role === 'Admin' ||
      userDetails?.role === 'Collection_Manager'
    ) {
      response = await adminReportsService.collectionDailyTrack({
        month,
        year,
        clientId,
      });
    } else {
      return res.status(401).send({ message: 'Access Denied!' });
    }
    // else if (userDetails?.role === 'Collection_Manager') {
    //   response = await reportsService.collectionManagerDailyTrack({
    //     month,
    //     year,
    //     userId,
    //     clientId,
    //   });
    // }
    return res.status(200).send(response);
  } catch (error) {
    res.status(500).send({ message: 'Something went wrong!' });
  }
});
