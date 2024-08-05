import { parse } from 'date-fns';
import { reportsDownloadService } from './report.download.service';
import { auditLogModel } from '../audit-logs/audit-logs.model';
import { logger } from '../../logger';
import { fetchUser } from '../middleware/auth.middleware';
import express, { Router } from 'express';
import { userModel } from '../user/user.model';
import { genders, house_types, lead_status } from '@prisma/client';

export type getDisbursalsReportsType = {
  ['Lead Id']: string;
  ['Loan No']: string;
  ['Branch']: string;
  ['Loan Type']: string;
  ['Name']: string;
  ['Credit Manager']: string;
  ['Gender']: genders;
  ['DOB']: string;
  ['Personal Email']: string;
  ['Office Email']: string;
  ['Mobile']: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  ['Address Category']: house_types;
  ['Aadhar Number']: string;
  ['PanCard']: string;
  ['Loan Amount']: number;
  ['Approval Date']: string;
  ['Repay Date']: string;
  ['Disbursal Amount']: number;
  ['Tenure']: number;
  ['ROI']: number;
  ['Disbursal Date']: string;
  ['Account No']: string;
  ['Account Type']: string;
  ['IFSC']: string;
  ['Bank']: string;
  ['Bank Branch']: string;
  ['Disbursal ReferenceNo']: string;
  ['Processing Fee']: number;
  ['Monthly Income']: number;
  ['Cibil']: number;
  ['GST Fee']: number;
  ['utm Source']: string;
  status: lead_status;
};

export type getCollectionsReportsType = {
  ['Lead Id']: string;
  ['Loan No']: string;
  ['Name']: string;
  ['Mobile']: string;
  ['Loan Amount']: number;
  ['Processing Fee']: number;
  ['Disbursal Date']: string;
  ['Collected Amount']: number;
  ['Penalty']: number;
  ['Collected Mode']: string;
  ['Collection Date']: string;
  ['Collection Time']: string;
  ['Reference No']: string;
  ['Total Collection']: number;
  ['Status']: lead_status;
  ['Remark']: string;
  ['Created At']: string;
  ['Employer Name']: string;
};

type cibilDataType = {
  id: string;
  ['Name']: string;
  ['DOB']: string;
  ['Gender']: string;
  ['PAN']: string;
  ['Aadhar']: string;
  ['Mobile No.']: string;
  ['Email']: string;
  ['Address']: string;
  ['City']: string;
  ['State']: string;
  ['Pincode']: string;
  ['Loan No.']: string;
  ['Loan Amount']: number;
  ['Disbursal Date']: string;
  ['Repay Date']: string;
  ['Collection Status']: string;
  ['Closure Date']: string;
  ['Current Balance']: number;
  ['Amount Overdue']: number;
  ['Over Due days']: number;
};

type downloadPendingLoans = {
  ['Loan Id']: string;
  ['Lead Id']: string;
  ['Collection User']: string;
  ['Days Past Due']: number;
  ['Loan No.']: string;
  ['Name']: string;
  ['Phone No.']: string;
  ['Email']: string;
  ['Loan Amount']: number;
  ['Tenure']: number;
  ['ROI']: number;
  ['Repayment Amount']: number;
  ['Repay Date']: string;
  ['Penalty Interest']: number;
  ['Status']: string;
  ['Credited By']: string;
  ['Remarks']: string;
};

export const reportsDownloadRouter: Router = express.Router();

// DOWNLOAD ROUTES
reportsDownloadRouter.get<
  Record<never, never>,
  getDisbursalsReportsType[] | { message: string } | null,
  Record<never, never>,
  {
    search?: string;
    startDate?: string;
    endDate?: string;
  }
>('/download-disbursal-report', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const searchparam = decodeURIComponent(req.query.search || '');
    const startDate = decodeURIComponent(req.query.startDate || '');
    const endDate = decodeURIComponent(req.query.endDate || '');

    let response;
    if (startDate.length !== 0 && endDate.length !== 0) {
      response = await reportsDownloadService.getDownloadDisbursalReports({
        userId,
        searchparam,
        startDate: parse(startDate, 'dd-MM-yyyy', new Date()),
        endDate: parse(endDate, 'dd-MM-yyyy', new Date()),
        clientId,
      });
    } else {
      response = await reportsDownloadService.getDownloadDisbursalReports({
        userId,
        searchparam,
        clientId,
      });
    }

    await auditLogModel.createLog({
      activity: `Downloaded Disbursal reports`,
      userId,
      eventType: 'Download',
      clientId,
    });

    return res.status(200).send(response);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});

reportsDownloadRouter.get<
  Record<never, never>,
  getCollectionsReportsType[] | { message: string } | null,
  Record<never, never>,
  {
    search?: string;
    startDate?: string;
    endDate?: string;
  }
>('/download-collection-report', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const searchparam = decodeURIComponent(req.query.search || '');
    const startDate = decodeURIComponent(req.query.startDate || '');
    const endDate = decodeURIComponent(req.query.endDate || '');

    let response;
    if (startDate.length !== 0 && endDate.length !== 0) {
      response = await reportsDownloadService.getDownloadCollectionsReport({
        userId,
        searchparam,
        startDate: parse(startDate, 'dd-MM-yyyy', new Date()),
        endDate: parse(endDate, 'dd-MM-yyyy', new Date()),
        clientId,
      });
    } else {
      response = await reportsDownloadService.getDownloadCollectionsReport({
        userId,
        searchparam,
        clientId,
      });
    }
    await auditLogModel.createLog({
      activity: `Downloaded Collection reports`,
      userId,
      eventType: 'Download',
      clientId,
    });
    return res.status(200).send(response);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});

reportsDownloadRouter.get<
  Record<never, never>,
  cibilDataType[] | { message: string } | null,
  Record<never, never>,
  {
    searchparam: string;
    startDate: string;
    endDate: string;
  }
>('/download-cibil-data', fetchUser, async (req, res) => {
  try {
    const searchparam = decodeURIComponent(req.query.searchparam || '');
    const startDate = decodeURIComponent(req.query.startDate || '');
    const endDate = decodeURIComponent(req.query.endDate || '');

    //@ts-ignore
    const clientId = req.clientId;
    //@ts-ignore
    const userId = req.user.user;

    let cibilData;
    if (startDate.length !== 0 && endDate.length !== 0) {
      cibilData = await reportsDownloadService.getDownloadCibilData({
        startDate: parse(startDate, 'dd-MM-yyyy', new Date()),
        endDate: parse(endDate, 'dd-MM-yyyy', new Date()),
        searchparam,
        clientId,
      });
    } else {
      cibilData = await reportsDownloadService.getDownloadCibilData({
        searchparam,
        clientId,
      });
    }
    await auditLogModel.createLog({
      activity: `Downloaded CIBIL reports`,
      userId,
      eventType: 'Download',
      clientId,
    });
    return res.status(200).send(cibilData);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});

reportsDownloadRouter.get<
  Record<never, never>,
  downloadPendingLoans[] | { message: string },
  Record<never, never>,
  {
    search?: string;
    startDate?: string;
    endDate?: string;
  }
>('/download-paydaypending', fetchUser, async (req, res) => {
  try {
    const searchparam = decodeURIComponent(req.query.search || '');
    const startDate = decodeURIComponent(req.query.startDate || '');
    const endDate = decodeURIComponent(req.query.endDate || '');
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    let paydayPending;

    const userDetails = await userModel.getUser({ userId, clientId });

    if (
      userDetails?.role === 'Admin' ||
      userDetails?.role === 'Accounts' ||
      userDetails?.role === 'Service'
    ) {
      if (startDate.length !== 0 && endDate.length !== 0) {
        paydayPending = await reportsDownloadService.downloadAllPendingLoans({
          searchparam,
          startDate: parse(startDate, 'dd-MM-yyyy', new Date()),
          endDate: parse(endDate, 'dd-MM-yyyy', new Date()),
          clientId,
        });
        const response = paydayPending.filter(loan => {
          if (loan !== null) return loan;
        });
        paydayPending = response;
      } else {
        paydayPending = await reportsDownloadService.downloadAllPendingLoans({
          searchparam,
          clientId,
        });
        const response = paydayPending.filter(loan => {
          if (loan !== null) return loan;
        });
        paydayPending = response;

        await auditLogModel.createLog({
          activity: `Downloaded Payday pending loans`,
          userId,
          eventType: 'Download',
          clientId,
        });
      }
      return res.status(200).send(paydayPending);
    } else {
      return res.status(401).send({ message: 'Unauthorized!' });
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});
