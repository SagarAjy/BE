import { string } from 'yup';
import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';

type liabilityType = {
  liabilityName: string;
  credit: number;
  debit: number;
};

type liabilityUpdateType = liabilityType & { id: string };

//add credit report by leadId
const postCreditReport = async ({
  leadId,
  grossIncome,
  bandPercent,
  eligibileAmount,
  liabilities,
  foirScore,
  customerId,
  clientId,
}: {
  leadId: string;
  grossIncome: number[];
  bandPercent: number;
  eligibileAmount: number;
  liabilities: liabilityType[];
  foirScore: number;
  customerId: string;
  clientId: string;
}) => {
  liabilities.map(async liability => {
    await prisma.liabilities.create({
      data: {
        liabilities_id: uuid(),
        lead_id: leadId,
        liability_name: liability.liabilityName,
        credit: liability.credit,
        debit: liability.debit,
        customer_id: customerId,
        client_id: clientId,
      },
    });
  });

  await prisma.credit_report.create({
    data: {
      credit_report_id: uuid(),
      lead_id: leadId,
      gross_income: grossIncome,
      eligibile_amount: eligibileAmount,
      band_percent: bandPercent,
      foir_score: foirScore,
      customer_id: customerId,
      client_id: clientId,
    },
  });
};

//get credit report by leadId
const getCreditReport = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const reponse = await prisma.credit_report.findFirst({
    where: {
      customer_id: customerId,
      client_id: clientId,
    },
  });
  return reponse;
};

//get liabilities by leadId
const getLiabilities = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const response = await prisma.liabilities.findMany({
    where: {
      customer_id: customerId,
      client_id: clientId,
    },
  });
  return response;
};

//update credit report
const updateCreditReport = async ({
  leadId,
  creditReportId,
  grossIncome,
  bandPercent,
  eligibileAmount,
  liabilities,
  foirScore,
  removeLiabilityIds,
  clientId,
}: {
  leadId: string;
  creditReportId: string;
  grossIncome: number[];
  bandPercent: number;
  eligibileAmount: number;
  liabilities: liabilityUpdateType[];
  foirScore: number;
  removeLiabilityIds: string[];
  clientId: string;
}) => {
  await prisma.credit_report.update({
    where: {
      credit_report_id: creditReportId,
      client_id: clientId,
    },
    data: {
      gross_income: grossIncome,
      eligibile_amount: eligibileAmount,
      band_percent: bandPercent,
      foir_score: foirScore,
    },
  });
  //*Note:if liabilty is received then update or not
  liabilities.map(async liability => {
    if (liability.id) {
      await prisma.liabilities.update({
        where: {
          liabilities_id: liability.id,
          client_id: clientId,
        },
        data: {
          liability_name: liability.liabilityName,
          credit: liability.credit,
          debit: liability.debit,
        },
      });
    } else {
      await prisma.liabilities.create({
        data: {
          liabilities_id: uuid(),
          lead_id: leadId,
          liability_name: liability.liabilityName,
          credit: liability.credit,
          debit: liability.debit,
          client_id: clientId,
        },
      });
    }
  });
  //*Note : delete the liabilites which are removed from frontend
  await prisma.liabilities.deleteMany({
    where: {
      client_id: clientId,
      liabilities_id: {
        in: removeLiabilityIds,
      },
    },
  });
};

export const creditReportModel = {
  updateCreditReport,
  postCreditReport,
  getCreditReport,
  getLiabilities,
};
