import express, { Router } from 'express';
import { logger } from '../../logger';
import { fetchUser } from '../middleware/auth.middleware';
import { disbursalModel } from './disbursal.model';
import { userModel } from '../user/user.model';
import { approvalModel } from '../approval/approval.model';
import { disbursalService } from './disbursal.service';
import { differenceInCalendarDays, format, parse } from 'date-fns';
import { auditLogModel } from '../audit-logs/audit-logs.model';
import { loanModel } from '../loan/loan.model';
import { JWT } from 'google-auth-library';
import { clientModel } from '../clients/clients.model';
//import { getSignedURLForS3 } from '../../utils';
import axios from 'axios';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { customerService } from '../customer/customer.service';
import { clientService } from '../clients/clients.service';

export const disbursalRouter: Router = express.Router();

type disbursalDataType = {
  companyAccountNo: string;
  accountNo: string;
  accountType: string;
  bankName: string;
  ifscCode: string;
  bankBranch: string;
  chequeNo: string;
  disbursalDate: string;
  pdDoneBy: string;
  pdDoneDate: string;
  finalRemark: string;
};

type updateDisbursalType = {
  companyAccountNo: string;
  accountNo: string;
  bankName: string;
  bankBranch: string;
  ifscCode: string;
  disbursalDate: string;
  accountType: string;
};

export type getDisbursalType = {
  id: string;
  disbursalAmount: number;
  companyAccountNo: string;
  accountNo: string;
  accountType: string;
  bankName: string;
  ifscCode: string | null;
  bankBranch: string;
  chequeNo: string | null;
  disbursalDate: Date;
  utrNo: string;
  finalRemark: string;
  disbursedBy: string;
  pdDoneBy: string;
  pdDate: string;
};

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

//add disbursal
disbursalRouter.post<
  { leadId: string },
  { message: string },
  disbursalDataType
>('/add/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const checkDisbursalAlreadyExist = await disbursalModel.getDisbursal({
      leadId,
      clientId,
    });
    if (checkDisbursalAlreadyExist !== null) {
      res
        .status(301)
        .send({ message: 'Loan already disbursed for this lead!' });
    } else {
      //@ts-ignore
      const userId = req.user.user;
      const userDetails = await userModel.getUser({ userId, clientId });
      const approvalData = await approvalModel.getApproval({
        leadId,
        clientId,
      });
      const approvedAmount = approvalData?.loan_amt_approved || 0;
      const pf = approvalData?.processing_fee || 0;
      const gstPercent = approvalData?.gst || 0;
      const gst = pf * gstPercent * 0.01;

      const disbursalAmount = approvedAmount - (pf + gst);

      const pdDoneBy = req.body.pdDoneBy === 'null' ? null : req.body.pdDoneBy;

      //*Note: only credit manager and admin can create disbursal
      if (
        userDetails?.role === 'Credit_Manager' ||
        userDetails?.role === 'Admin' ||
        userDetails?.role === 'Loan_Officer'
      ) {
        const approval = await approvalModel.getApproval({ leadId, clientId });

        const clientDetails = await clientModel.getClient({ clientId });

        const googleSheetKeyUrl = clientDetails?.google_sheet_key_url || '';
        if (googleSheetKeyUrl) {
          // const googleSheetKeySignedUrl = await getSignedURLForS3(
          //   clientDetails?.google_sheet_key_url || '',
          // );
          const googleSheetKeySignedUrl = ''
          const googleSheetId = clientDetails?.google_sheet_id || '';

          const creds = await axios.get(googleSheetKeySignedUrl);

          const jwt = new JWT({
            email: creds.data.client_email,
            key: creds.data.private_key,
            scopes: SCOPES,
          });

          const doc = new GoogleSpreadsheet(googleSheetId, jwt);
          await doc.loadInfo();
          const sheet = doc.sheetsByIndex[0];

          const customerName = await customerService.getCustomerByLeadId({
            leadId,
            clientId,
          });

          await sheet.addRow({
            ['Time']: format(new Date(), 'dd-MM-yy hh:mm aa'),
            ['Loan No']: approval?.loan_no || '',
            ['Customer Name']: customerName?.customerName,
            ['Approval Amount']: approval?.loan_amt_approved || 0,
            ['Bank']: req.body.bankName,
            ['Bank Branch']: req.body.bankBranch,
            ['Account Number']: req.body.accountNo,
            ['IFSC']: req.body.ifscCode,
            ['Disbursal Amount']: disbursalAmount,
            ['Disbursal Date']: req.body.disbursalDate,
            ['Disbursed By']: userDetails?.name,
            utrNo: '',
            status: 'Pending',
          });
        }

        await disbursalModel.addDisbursal({
          userId,
          leadId,
          disbursalAmount,
          customerId: approvalData?.customer_id || '',
          processingFee: approvalData?.processing_fee || 0,
          ...req.body,
          disbursalDate: parse(
            req.body.disbursalDate,
            'dd-MM-yyyy',
            new Date(),
          ),
          pdDoneBy,
          loanNo: approval?.loan_no || '',
          loanType: clientDetails?.loan_type || 'payday',
          clientId,
        });
        const approvalRepayDate = approvalData?.repay_date || new Date();
        //calculating tenure of loan
        const loanTenure = differenceInCalendarDays(
          approvalRepayDate,
          parse(req.body.disbursalDate, 'dd-MM-yyyy', new Date()),
        );
        await approvalModel.updateTenure({
          leadId,
          tenure: loanTenure,
          clientId,
        });

        await auditLogModel.createLog({
          activity: `Inititated disbursal for lead id: ${leadId}`,
          userId,
          eventType: 'Add',
          clientId,
        });

        res.status(200).send({ message: 'Disbursal added!' });
      } else {
        res.status(401).send({ message: 'Not authorized to add disbursal!' });
      }
    }
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

//add utr by loanId
disbursalRouter.put<
  { loanId: string },
  { message: string },
  { disbursalReferenceNo: string }
>('/add-utr/:loanId', fetchUser, async (req, res) => {
  try {
    const { loanId } = req.params;

    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    await disbursalModel.updateDisbursalUTR({
      loanId,
      disbursalReferenceNo: req.body.disbursalReferenceNo,
      userId,
      clientId,
    });

    const clientDetails = await clientService.getClient({ clientId });

    if (clientDetails?.loanType === 'emi') {
      const res = await disbursalService.createEMIsForDisbursal({
        loanId,
        clientId,
      });
    }

    await auditLogModel.createLog({
      activity: `Updated UTR No. for disbursal for loan id: ${loanId}`,
      userId,
      eventType: 'Update',
      clientId,
    });

    res.status(200).send({ message: 'Disbursal updated!' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

// edit disbursal by loan id
disbursalRouter.put<
  { loanId: string },
  { message: string },
  updateDisbursalType
>('/edit-disbursal/:loanId', fetchUser, async (req, res) => {
  try {
    const { loanId } = req.params;

    const {
      accountNo,
      bankName,
      bankBranch,
      ifscCode,
      disbursalDate,
      accountType,
    } = req.body;

    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    await disbursalModel.updateDisbursal({
      loanId,
      accountNo,
      accountType,
      bankBranch,
      bankName,
      disbursalDate: parse(req.body.disbursalDate, 'dd-MM-yyyy', new Date()),
      ifscCode,
      clientId,
    });

    const loanDetails = await loanModel.getLoan({ loanId, clientId });
    const leadId = loanDetails?.lead_id || '';
    const approvalData = await approvalModel.getApproval({
      leadId,
      clientId,
    });

    const approvalRepayDate = approvalData?.repay_date || new Date();
    //calculating tenure of loan
    const loanTenure = differenceInCalendarDays(
      approvalRepayDate,
      parse(disbursalDate, 'dd-MM-yyyy', new Date()),
    );

    await approvalModel.updateTenure({
      leadId,
      tenure: loanTenure,
      clientId,
    });

    if (loanDetails?.status === 'Disbursed') {
      const disbursalData = await disbursalModel.getDisbursal({
        leadId,
        clientId,
      });
      const prevDisbursalDate = disbursalData?.disbursal_date || new Date();
      // logging disbursal date change event if disbursal is already done
      await auditLogModel.createLog({
        activity: `Updated Disbursal date from ${format(
          prevDisbursalDate,
          'dd-MM-yyyy',
        )} to ${
          req.body.disbursalDate
        } for loan no. - ${loanDetails?.loan_no} and lead id: ${leadId}`,
        userId,
        eventType: 'Update',
        clientId,
      });
    } else {
      // logging disbursal update change
      await auditLogModel.createLog({
        activity: `Updated Disbursal with loan no. - ${loanDetails?.loan_no} for lead id: ${leadId}`,
        userId,
        eventType: 'Update',
        clientId,
      });
    }

    res.status(200).send({ message: 'Disbursal updated!' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

//update disbursed by
disbursalRouter.put<
  { leadId: string },
  { message: string },
  { disbursedBy: string }
>('/update-disbursed-by/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { disbursedBy } = req.body;
    //@ts-ignore
    const clientId = req.clientId;
    //@ts-ignore
    const userId = req.user.user;

    const userDetails = await userModel.getUser({ userId, clientId });
    if (userDetails?.role === 'Admin') {
      const oldDisbursalDetails = await disbursalModel.getDisbursal({
        leadId,
        clientId,
      });
      const loanDetails = await loanModel.getLoanByLeadId({ leadId, clientId });

      await disbursalModel.updateDisbursedBy({
        loanId: loanDetails?.loan_id || '',
        clientId,
        disbursedBy,
      });

      const prevUserDetails = await userModel.getUser({
        userId: oldDisbursalDetails?.disbursed_by || '',
        clientId,
      });
      const newUserDetails = await userModel.getUser({
        userId: disbursedBy,
        clientId,
      });
      const prevUserName = prevUserDetails?.name;
      const newUserName = newUserDetails?.name;
      await auditLogModel.createLog({
        activity: `Updated disbursed by from ${prevUserName} to ${newUserName} for loan no: ${loanDetails?.loan_no} lead id: ${leadId}`,
        userId: userId,
        eventType: 'Update',
        clientId,
      });
      return res.status(200).send({ message: 'Disbursed by updated!' });
    } else {
      return res.status(401).send({ message: 'Unauthorized!' });
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});

//get disbursal by leadId
disbursalRouter.get<
  { leadId: string },
  getDisbursalType | { message: string } | null
>('/get/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const disbursalData = await disbursalService.getDisbursal({
      leadId,
      clientId,
    });
    res.status(200).send(disbursalData);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

disbursalRouter.get<
  { leadId: string },
  getDisbursalType | { message: string } | null
>('/get-existing/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const disbursalData = await disbursalService.getExisitingDisbursal({
      leadId,
      clientId,
    });
    res.status(200).send(disbursalData);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

disbursalRouter.delete<{ leadId: string }, { message: string }>(
  '/delete-disbursal/:leadId',
  fetchUser,
  async (req, res) => {
    try {
      const { leadId } = req.params;
      //@ts-ignore
      const clientId = req.clientId;
      //@ts-ignore
      const userId = req.user.user;

      const loanDetails = await loanModel.getLoanByLeadId({ leadId, clientId });
      await disbursalModel.deleteDisbursal({
        loanId: loanDetails?.loan_id || '',
        leadId,
        clientId,
      });

      await auditLogModel.createLog({
        userId,
        activity: `Deleted disbursal for loan no: ${loanDetails?.loan_no} lead id: ${leadId}`,
        eventType: 'Delete',
        clientId,
      });
      res.status(200).send({ message: 'Disbursal Deleted!' });
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured' });
    }
  },
);
