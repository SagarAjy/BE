import { Novu } from '@novu/node';
import { logger } from '../../logger';
import { format } from 'date-fns';
import { convertToIndianWords, formatIndianNumber } from '../../utils';
import { clientModel } from '../clients/clients.model';

const createSubscriber = async ({
  email,
  phone,
  subscriberId,
  clientId,
}: {
  email: string;
  phone: string;
  subscriberId: string;
  clientId: string;
}) => {
  try {
    const novuKey = await clientModel.getClientNovuKey({ clientId });
    const novu = new Novu(novuKey?.novu_key || '');

    await novu.subscribers.identify(subscriberId, {
      email,
      phone,
    });
  } catch (error) {
    logger.error(error);
  }
};

const updateSubscriber = async ({
  email,
  phone,
  subscriberId,
  clientId,
}: {
  email: string;
  phone: string;
  subscriberId: string;
  clientId: string;
}) => {
  try {
    const novuKey = await clientModel.getClientNovuKey({ clientId });
    const novu = new Novu(novuKey?.novu_key || '');

    await novu.subscribers.update(subscriberId, {
      email,
      phone,
    });
  } catch (error) {
    logger.error(error);
  }
};

const sendUserOTP = async ({
  email,
  otp,
  id,
  clientId,
}: {
  email: string;
  otp: string;
  id: string;
  clientId: string;
}) => {
  try {
    const novuKey = await clientModel.getClientNovuKey({ clientId });
    const novu = new Novu(novuKey?.novu_key || '');

    await novu.trigger('user-login-otp', {
      to: {
        subscriberId: id,
        email: email,
      },
      payload: {
        otp,
      },
    });
  } catch (error) {
    logger.error(error);
  }
};

const sendInterestedEmailToCustomer = async ({
  id,
  email,
  applicationNo,
  clientId,
}: {
  id: string;
  email: string;
  applicationNo: string;
  clientId: string;
}) => {
  try {
    const novuKey = await clientModel.getClientNovuKey({ clientId });
    const novu = new Novu(novuKey?.novu_key || '');

    await novu.trigger('interested-auto-email', {
      to: {
        subscriberId: id,
        email,
      },
      payload: {
        applicationNo,
      },
    });
  } catch (error) {
    logger.error(error);
  }
};

type ReminderMailType = {
  name: string;
  to: {
    subscriberId: string;
    email: string;
  };
  payload: {
    customerName: string;
    loanNo: string;
    repaymentAmount: string;
    repaymentDate: string;
  };
};

const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

const sendReminderEmailToCustomer = async ({
  data,
  clientId,
}: {
  data: ReminderMailType[];
  clientId: string;
}) => {
  const chunkSize = 100;
  const arrayOfChunks = chunkArray(data, chunkSize);

  for (const chunk of arrayOfChunks) {
    try {
      const novuKey = await clientModel.getClientNovuKey({ clientId });
      const novu = new Novu(novuKey?.novu_key || '');

      await novu.events.bulkTrigger(chunk);
    } catch (error) {
      logger.error(error);
    }
  }
};

const sendVisitAlignEmailToCustomer = async ({
  pdName,
  customerName,
  pdTime,
  pdDate,
  id,
  email,
  clientId,
}: {
  id: string;
  pdName: string;
  customerName: string;
  pdTime: string;
  pdDate: string;
  email: string;
  clientId: string;
}) => {
  try {
    const novuKey = await clientModel.getClientNovuKey({ clientId });
    const novu = new Novu(novuKey?.novu_key || '');

    await novu.trigger('visit-align-mail', {
      to: {
        subscriberId: id,
        email,
      },
      payload: {
        pdName,
        customerName,
        pdDate,
        pdTime,
      },
    });
  } catch (error) {
    logger.error(error);
  }
};

const sendApprovalEmailToCustomer = async ({
  email,
  name,
  applicationId,
  approvalDate,
  approvalAmount,
  roi,
  processingFees,
  gstAmount,
  totalDeductions,
  disbursalAmount,
  repayDate,
  repayAmount,
  id,
  sanctionLetter,
  officialEmail,
  clientId,
}: {
  email: string;
  name: string;
  applicationId: string;
  approvalDate: Date;
  approvalAmount: number;
  roi: number;
  processingFees: number;
  gstAmount: number;
  totalDeductions: number;
  disbursalAmount: number;
  repayDate: Date;
  repayAmount: number;
  id: string;
  sanctionLetter: Buffer;
  officialEmail: string;
  clientId: string;
}) => {
  try {
    const client = await clientModel.getClient({ clientId });
    const novu = new Novu(client?.novu_key || '');

    await novu.trigger('loan-approval', {
      to: {
        subscriberId: id,
        email: officialEmail,
      },
      overrides: {
        email: {
          from: client?.client_sanction_email || '',
          replyTo: client?.client_sanction_email || '',
          cc: [email],
        },
      },
      payload: {
        customerName: name,
        applicationId,
        approvalDate: format(approvalDate, 'dd-MM-yyyy'),
        approvalAmount,
        roi,
        processingFees,
        gstAmount,
        totalDeductions,
        disbursalAmount,
        repayDate: format(repayDate, 'dd-MM-yyyy'),
        repayAmount,
        attachments: [
          {
            file: sanctionLetter,
            mime: 'application/pdf',
            name: 'Sanction-Letter.pdf',
          },
        ],
      },
    });
  } catch (error) {
    logger.error(error);
  }
};

const sendDisbursalEmailToCustomer = async ({
  email,
  name,
  loanAccountNo,
  loanAmount,
  tenure,
  repaymentDate,
  repaymentAmount,
  id,
  clientId,
}: {
  email: string;
  name: string;
  loanAccountNo: string;
  loanAmount: number;
  tenure: number;
  repaymentDate: Date;
  repaymentAmount: number;
  id: string;
  clientId: string;
}) => {
  try {
    const novuKey = await clientModel.getClientNovuKey({ clientId });
    const novu = new Novu(novuKey?.novu_key || '');
    await novu.trigger('disbursal-auto-email', {
      to: {
        subscriberId: id,
        email,
      },
      payload: {
        customerName: name,
        loanAccountNo,
        loanAmount: formatIndianNumber(loanAmount),
        tenure,
        repaymentDate: format(repaymentDate, 'dd-MM-yyyy'),
        repaymentAmount: formatIndianNumber(repaymentAmount),
      },
    });
  } catch (error) {
    logger.error(error);
  }
};

const sendSettlementEmailToCustomer = async ({
  name,
  email,
  loanNo,
  loanAmount,
  collectionAmount,
  disbursalDate,
  collectionDate,
  id,
  clientId,
}: {
  name: string;
  email: string;
  loanNo: string;
  loanAmount: number;
  collectionAmount: number;
  disbursalDate: string;
  collectionDate: string;
  id: string;
  clientId: string;
}) => {
  try {
    const client = await clientModel.getClient({ clientId });
    const novu = new Novu(client?.novu_key || '');

    await novu.trigger('settlement-email', {
      to: {
        subscriberId: id,
        email,
      },
      overrides: {
        email: {
          from: client?.client_collection_email || '',
          replyTo: client?.client_collection_email || '',
        },
      },
      payload: {
        customerName: name,
        loanNo,
        date: format(new Date(), 'dd-MM-yyyy'),
        loanAmount: formatIndianNumber(loanAmount),
        loanAmountInWords: convertToIndianWords(loanAmount),
        collectionAmount: formatIndianNumber(collectionAmount),
        disbursalDate,
        collectionDate,
      },
    });
  } catch (error) {
    logger.error(error);
  }
};

const sendLoanClosedEmailToCustomer = async ({
  name,
  email,
  loanNo,
  loanAmount,
  collectionAmount,
  disbursalDate,
  collectionDate,
  id,
  clientId,
}: {
  name: string;
  email: string;
  loanNo: string;
  loanAmount: number;
  collectionAmount: number;
  disbursalDate: string;
  collectionDate: string;
  id: string;
  clientId: string;
}) => {
  try {
    const client = await clientModel.getClient({ clientId });
    const novu = new Novu(client?.novu_key || '');

    await novu.trigger('loan-closed-email', {
      to: {
        subscriberId: id,
        email,
      },
      overrides: {
        email: {
          from: client?.client_collection_email || '',
          replyTo: client?.client_collection_email || '',
        },
      },
      payload: {
        customerName: name,
        loanNo,
        date: format(new Date(), 'dd-MM-yyyy'),
        loanAmount: formatIndianNumber(loanAmount),
        loanAmountInWords: convertToIndianWords(loanAmount),
        collectionAmount: formatIndianNumber(collectionAmount),
        disbursalDate,
        collectionDate,
      },
    });
  } catch (error) {
    logger.error(error);
  }
};

const sendNOCEmailToCustomer = async ({
  name,
  email,
  loanNo,
  loanAmount,
  disbursalDate,
  collectionDate,
  id,
  clientId,
  nocAmount,
}: {
  name: string;
  email: string;
  loanNo: string;
  loanAmount: number;
  disbursalDate: string;
  collectionDate: string;
  id: string;
  clientId: string;
  nocAmount: number;
}) => {
  try {
    const client = await clientModel.getClient({ clientId });
    const novu = new Novu(client?.novu_key || '');

    await novu.trigger('noc-email', {
      to: {
        subscriberId: id,
        email,
      },
      overrides: {
        email: {
          from: client?.client_collection_email || '',
          replyTo: client?.client_collection_email || '',
        },
      },
      payload: {
        customerName: name,
        loanNo,
        date: format(new Date(), 'dd-MM-yyyy'),
        loanAmount: formatIndianNumber(loanAmount),
        loanAmountInWords: convertToIndianWords(loanAmount),
        disbursalDate,
        collectionDate,
        nocAmount: formatIndianNumber(nocAmount),
      },
    });
  } catch (error) {
    logger.error(error);
  }
};

const sendRejectionEmailToCustomer = async ({
  id,
  email,
  clientId,
}: {
  id: string;
  email: string;
  clientId: string;
}) => {
  try {
    const novuKey = await clientModel.getClientNovuKey({ clientId });
    const novu = new Novu(novuKey?.novu_key || '');
    await novu.trigger('rejection-email', {
      to: {
        subscriberId: id,
        email,
      },
      payload: {},
    });
  } catch (error) {
    logger.error(error);
  }
};

const sendWelcomeEmailToCustomer = async ({
  ids,
  disbursalDate,
  clientId,
}: {
  ids: string[];
  disbursalDate: string;
  clientId: string;
}) => {
  try {
    const novuKey = await clientModel.getClientNovuKey({ clientId });
    const novu = new Novu(novuKey?.novu_key || '');

    const senderList = ids.map(id => {
      return {
        name: 'welcome-email',
        to: id,
        payload: {
          disbursalDate,
        },
      };
    });
    await novu.bulkTrigger(senderList);
  } catch (error) {
    logger.error(error);
  }
};

const sendSupportRequestRaisedToCustomer = async ({
  id,
  email,
  customerName,
  ticketNo,
  query,
  clientId,
}: {
  id: string;
  email: string;
  customerName: string;
  ticketNo: string;
  query: string;
  clientId: string;
}) => {
  const client = await clientModel.getClient({ clientId });
  const novu = new Novu(client?.novu_key || '');

  await novu.trigger('support-ticket-raised', {
    to: {
      subscriberId: id,
      email,
    },
    payload: {
      customerName,
      ticketNumber: ticketNo,
      query,
    },
  });
};

export const novuNotification = {
  createSubscriber,
  sendUserOTP,
  updateSubscriber,
  sendInterestedEmailToCustomer,
  sendApprovalEmailToCustomer,
  sendDisbursalEmailToCustomer,
  sendSettlementEmailToCustomer,
  sendLoanClosedEmailToCustomer,
  sendNOCEmailToCustomer,
  sendRejectionEmailToCustomer,
  sendWelcomeEmailToCustomer,
  sendReminderEmailToCustomer,
  sendVisitAlignEmailToCustomer,
  sendSupportRequestRaisedToCustomer,
};
