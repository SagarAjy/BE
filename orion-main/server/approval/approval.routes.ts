import express, { Router } from 'express';
import { logger } from '../../logger';
import { fetchUser } from '../middleware/auth.middleware';
import { approval_status, loan_type } from '@prisma/client';
import { leadsModel } from '../leads/leads.model';
import { approvalModel } from './approval.model';
import { userModel } from '../user/user.model';
import { approvalService } from './approval.service';
import { novuNotification } from '../novu/novu.model';
import { sanctionLetterHTMLContent } from '../../templates';
import html_to_pdf from 'html-pdf-node';
import { differenceInCalendarDays, format, parse } from 'date-fns';
import { clientModel } from '../clients/clients.model';
import { auditLogModel } from '../audit-logs/audit-logs.model';
import { loanModel } from '../loan/loan.model';

export const approvalRouter: Router = express.Router();

type approvalDataType = {
  branch: string;
  approvalAmount: number;
  roi: number;
  monthlyIncome: number;
  salaryDate: string;
  repayDate: string;
  processingFeePercent: number;
  processingFee: number;
  conversionFeesPercent?: number;
  conversionFees?: number;
  gst: number;
  email: string;
  alternateNumber: string;
  cibilScore: number;
  loanPurpose: string;
  status: approval_status;
  remark: string;
};

type updateApprovalDataType = {
  branch: string;
  approvalAmount: number;
  roi: number;
  repayDate: string;
  processingFeePercent: number;
  processingFee: number;
  conversionFeesPercent?: number;
  conversionFees?: number;
  officialEmail: string;
  status: approval_status;
  remark: string;
  creditedAt: Date;
  editRepayDate: boolean;
};

type GetSanctionLetterType = {
  customerName: string;
  applicationId: string;
  approvalDate: Date;
  approvalAmount: number;
  roi: number;
  processingFeesPercent: number;
  processingFees: number;
  gstAmount: number;
  totalDeductions: number;
  disbursalAmount: number;
  repayDate: Date;
  repayAmount: number;
};

type getApprovalType = {
  id: string;
  loanType: loan_type;
  branch: string;
  approvalAmount: number;
  loanTenure: number;
  roi: number;
  salaryDate: string;
  repayDate: Date;
  processingFeePercent: number;
  processingFee: number;
  conversionFeesPercent: number;
  conversionFees: number;
  gst: number;
  alternateNumber: string;
  email: string;
  cibilScore: number;
  monthlyIncome: number;
  status: approval_status;
  creditedBy: string;
  approvalDate: Date;
  remark: string;
  additionalRemark: string;
  loanPurpose: string;
};

type getExistingApprovalType = {
  id: string;
  branch: string;
  alternateNumber: string;
  email: string;
  cibilScore: number;
  roi: number;
  monthlyIncome: number;
};

//add approval for a lead
approvalRouter.post<{ leadId: string }, { message: string }, approvalDataType>(
  '/add/:leadId',
  fetchUser,
  async (req, res) => {
    try {
      const { leadId } = req.params;
      //@ts-ignore
      const clientId = req.clientId;
      const checkApprovalExist = await approvalModel.getApproval({
        leadId,
        clientId,
      });
      if (checkApprovalExist !== null) {
        res
          .status(500)
          .send({ message: 'Approval for this user is already exisiting' });
      } else {
        //@ts-ignore
        const userId = req.user.user;
        const userDetails = await userModel.getUser({ userId, clientId });
        const clientDetails = await clientModel.getClient({ clientId });
        //*only credit manager and admin are allowed to add approval
        if (
          userDetails?.role === 'Credit_Manager' ||
          userDetails?.role === 'Admin' ||
          userDetails?.role === 'Loan_Officer'
        ) {
          const lead = await leadsModel.getLeadById({ leadId, clientId });
          await approvalModel.addApproval({
            customerId: lead?.customer_id || '',
            userId,
            leadId,
            ...req.body,
            conversionFeesPercent: req.body.conversionFeesPercent || 0,
            conversionFees: req.body.conversionFees || 0,
            loanType: clientDetails?.loan_type || 'payday',
            clientId,
          });

          await auditLogModel.createLog({
            activity: `Added approval for ${leadId}`,
            userId,
            eventType: 'Add',
            clientId,
          });

          res.status(200).send({ message: 'Approval added' });
        } else {
          res.status(401).send({ message: 'Not authorized to add approval' });
        }
      }
    } catch (error) {
      logger.error(error);
      res.status(500).send({ message: 'Some error occured!' });
    }
  },
);

//update approval
approvalRouter.put<
  { leadId: string },
  { message: string },
  updateApprovalDataType
>('/update/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    const userDetails = await userModel.getUser({ userId, clientId });
    const approvalDetails = await approvalModel.getApproval({
      leadId,
      clientId,
    });
    const prevRepayDate = approvalDetails?.repay_date || new Date();

    if (
      userDetails?.role === 'Credit_Manager' ||
      userDetails?.role === 'Admin' ||
      userDetails?.role === 'Loan_Officer'
    ) {
      await approvalModel.updateApproval({
        userId,
        leadId,
        ...req.body,
        remark: !req.body.remark ? '' : req.body.remark,
        clientId,
        editRepayDate: req.body.editRepayDate,
      });

      const loanDetails = await loanModel.getLoanByLeadId({ leadId, clientId });

      if (loanDetails) {
        const approvalRepayDate = req.body.repayDate;
        const disbursalDate = loanDetails?.disbursal_date;
        //calculating tenure of loan
        const loanTenure = differenceInCalendarDays(
          parse(approvalRepayDate, 'dd-MM-yyyy', new Date()),
          disbursalDate,
        );

        await approvalModel.updateTenure({
          leadId,
          tenure: loanTenure,
          clientId,
        });

        await auditLogModel.createLog({
          activity: `Updated repay date from ${format(
            prevRepayDate,
            'dd-MM-yyyy',
          )} to ${approvalRepayDate} for ${leadId}`,
          userId,
          eventType: 'Update',
          clientId,
        });
      } else {
        await auditLogModel.createLog({
          activity: `Updated approval for ${leadId}`,
          userId,
          eventType: 'Update',
          clientId,
        });
      }

      res.status(200).send({ message: 'Approval updated' });
    } else {
      res.status(401).send({ message: 'Not authorized to update approval' });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

//update approval credited by
approvalRouter.put<
  { leadId: string },
  { message: string },
  { creditedBy: string }
>('/update-credited-by/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;

    const userDetails = await userModel.getUser({ userId, clientId });

    const approvalDetails = await approvalModel.getApproval({
      leadId,
      clientId,
    });

    const prevCreditedBy = approvalDetails?.credited_by || '';

    const prevUserDetails = await userModel.getUser({
      userId: prevCreditedBy,
      clientId,
    });

    const newUserDetails = await userModel.getUser({
      userId: req.body.creditedBy,
      clientId,
    });

    if (userDetails?.role === 'Admin') {
      await approvalModel.updateCreditedBy({
        leadId,
        creditedBy: req.body.creditedBy,
        clientId,
      });

      await auditLogModel.createLog({
        activity: `Updated credited by from ${prevUserDetails?.name} to ${newUserDetails?.name} for ${leadId}`,
        userId,
        eventType: 'Update',
        clientId,
      });

      return res.status(200).send({ message: 'Credited by updated' });
    } else {
      return res
        .status(401)
        .send({ message: 'Not authorized to update credited by' });
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Something went wrong!' });
  }
});

//get approval
approvalRouter.get<
  { leadId: string },
  getApprovalType | { message: string } | null
>('/get/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const approvalData = await approvalService.getapproval({
      leadId,
      clientId,
    });
    res.status(200).send(approvalData);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

approvalRouter.get<
  { leadId: string },
  GetSanctionLetterType | { message: string }
>('/get-sanction-letter/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const approvalLetterDetails = await approvalService.getApprovalLetter({
      leadId,
      clientId,
    });

    return res.status(200).send(approvalLetterDetails);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

approvalRouter.post<
  { leadId: string },
  { message: string },
  { officialEmail: string }
>('/send-approval-email/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { officialEmail } = req.body;
    //@ts-ignore
    const clientId = req.clientId;
    const lead = await leadsModel.getLeadById({ leadId, clientId });
    const approvalDetails = await approvalModel.getApproval({
      leadId,
      clientId,
    });

    const processingFees = approvalDetails?.processing_fee || 0;
    const gstPercent = approvalDetails?.gst || 0;
    const approvalAmount = approvalDetails?.loan_amt_approved || 0;
    const roi = approvalDetails?.roi || 0;
    const gstAmount = processingFees * gstPercent * 0.01;
    const totalDeductions = processingFees + gstAmount;
    const disbursalAmount = approvalAmount - totalDeductions;

    const tempTenure = differenceInCalendarDays(
      approvalDetails?.repay_date || new Date(),
      approvalDetails?.created_at || new Date(),
    );
    const interestAmount = approvalAmount * tempTenure * 0.01 * roi;

    const repaymentAmount = approvalAmount + interestAmount;

    const clientDetails = await clientModel.getClient({ clientId });

    const sanctionLetter = sanctionLetterHTMLContent({
      logoUrl: clientDetails?.client_logo || '',
      customerName: lead?.customers.name || '',
      applicationId: approvalDetails?.loan_no || '',
      approvalDate: approvalDetails?.created_at || new Date(),
      approvalAmount,
      roi,
      processingFees,
      gstAmount,
      totalDeductions,
      disbursalAmount,
      repayDate: approvalDetails?.repay_date || new Date(),
      repayAmount: repaymentAmount,
      clientName: clientDetails?.client_name || '',
      clientNbfc: clientDetails?.client_nbfc || '',
    });

    var callback = async function (pdf: Buffer) {
      await novuNotification.sendApprovalEmailToCustomer({
        email: lead?.customers.email || '',
        officialEmail: officialEmail,
        name: lead?.customers.name || '',
        applicationId: approvalDetails?.loan_no || '',
        approvalDate: approvalDetails?.created_at || new Date(),
        approvalAmount,
        roi,
        disbursalAmount: disbursalAmount,
        repayDate: approvalDetails?.repay_date || new Date(),
        repayAmount: repaymentAmount,
        gstAmount,
        processingFees,
        totalDeductions,
        id: lead?.customer_id || '',
        sanctionLetter: pdf,
        clientId,
      });
    };

    html_to_pdf.generatePdf(
      { content: sanctionLetter },
      {
        format: 'A4',
        margin: { top: '10px', left: '25px', right: '25px' },
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      (err: Error | null, pdf: Buffer | null) => {
        if (err) {
          logger.error(err);
          return res.status(500).send({ message: 'Some error occurred!' });
        }

        callback(pdf!);
      },
    );

    return res.status(200).send({ message: 'Sanction letter sent!' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});

approvalRouter.get<
  { leadId: string },
  getExistingApprovalType | { message: string } | null
>('/get-existing-approval/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const response = await approvalService.getApprovalIfExist({
      leadId,
      clientId,
    });

    res.status(200).send(response);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});

approvalRouter.get<
  { leadId: string },
  getApprovalType | { message: string } | null
>('/get-existing/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const approvalData = await approvalService.getExisitiingApproval({
      leadId,
      clientId,
    });
    res.status(200).send(approvalData);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});
