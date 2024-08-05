import express, { Router } from 'express';
import { creditReportModel } from './credit-report.model';
import { logger } from '../../logger';
import { fetchUser } from '../middleware/auth.middleware';
import { creditReportService } from './credit-report.service';
import { liabilities } from '@prisma/client';
import { leadsModel } from '../leads/leads.model';

export const creditReportRouter: Router = express.Router();

type liabilityType = {
  liabilityName: string;
  credit: number;
  debit: number;
};

type addCreditReportType = {
  grossIncome: number[];
  bandPercent: number;
  liabilities: liabilityType[];
};

type getLiabilityType = liabilityType & { id: string };

type updateCreditReportType = {
  grossIncome: number[];
  bandPercent: number;
  liabilities: getLiabilityType[];
  leadId: string;
  removeLiabilityIds: string[];
};

type getCreditReportData = {
  id: string;
  grossIncome: number[];
  bandPercent: number;
  foirScore: number;
  eligibleAmount: number;
  liabilities: getLiabilityType[];
  netIncome: number;
  obligation: number;
};

//add credit report
creditReportRouter.post<
  { leadId: string },
  { message: string },
  addCreditReportType
>('/add/:leadId', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    const { leadId } = req.params;
    const leadDetails = await leadsModel.getLeadById({ leadId, clientId });

    const credit_report = await creditReportModel.getCreditReport({
      customerId: leadDetails?.customer_id || '',
      clientId,
    });

    if (credit_report) {
      return res
        .status(409)
        .send({ message: 'Credit report already exist for this user' });
    }
    const liabilities = req.body.liabilities;
    let credit = 0;
    let debit = 0;
    liabilities.map(liability => {
      credit = credit + liability.credit;
      debit = debit + liability.debit;
    });
    const obligation = debit - credit;
    const incomes = req.body.grossIncome;
    let grossIncome = 0;
    incomes.map(income => {
      grossIncome += income;
    });
    grossIncome = grossIncome / incomes.length;

    const netIncome = grossIncome - obligation;
    const foirScore = (obligation * 100) / grossIncome;
    const eligibileAmount = netIncome * req.body.bandPercent * 0.01;
    if (foirScore >= 50) {
      await creditReportModel.postCreditReport({
        leadId,
        eligibileAmount: 0,
        foirScore,
        customerId: leadDetails?.customer_id || '',
        ...req.body,
        clientId,
      });
    } else {
      await creditReportModel.postCreditReport({
        leadId,
        eligibileAmount,
        foirScore,
        customerId: leadDetails?.customer_id || '',
        ...req.body,
        clientId,
      });
    }

    return res.status(200).send({ message: 'Credit report created' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

//get credit report by leadId
creditReportRouter.get<
  { leadId: string },
  getCreditReportData | { message: string } | null
>('/get/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const creditReport = await creditReportService.getCreditReport({
      leadId,
      clientId,
    });
    res.status(200).send(creditReport);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

//update credit report by creditreport Id
creditReportRouter.put<
  { creditReportId: string },
  { message: string },
  updateCreditReportType
>('/update/:creditReportId', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    const { creditReportId } = req.params;
    const liabilities = req.body.liabilities;
    let credit = 0;
    let debit = 0;
    liabilities.map(liability => {
      credit = credit + liability.credit;
      debit = debit + liability.debit;
    });
    const obligation = debit - credit;
    const incomes = req.body.grossIncome;
    let grossIncome = 0;
    incomes.map(income => {
      grossIncome += income;
    });
    grossIncome = grossIncome / incomes.length;

    const netIncome = grossIncome - obligation;
    const foirScore = (obligation * 100) / grossIncome;
    const eligibileAmount = netIncome * req.body.bandPercent * 0.01;

    if (foirScore >= 50) {
      await creditReportModel.updateCreditReport({
        creditReportId,
        eligibileAmount: 0,
        foirScore,
        ...req.body,
        clientId,
      });
    } else {
      await creditReportModel.updateCreditReport({
        creditReportId,
        eligibileAmount,
        foirScore,
        ...req.body,
        clientId,
      });
    }
    return res.status(200).send({ message: 'Updated successfully' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send();
  }
});
