import { format, sub } from 'date-fns';
import { loanModel } from '../server/loan/loan.model';
import { novuNotification } from '../server/novu/novu.model';
import { prisma } from '../prisma-client';

export const sendDailyWelcomeMailJob = async () => {
  try {
    const disbursalDate = format(
      sub(new Date(), {
        days: 1,
      }),
      'dd-MM-yyyy',
    );
    const disbursedCases = await loanModel.getDisbursedLoans({
      disbursalDate,
    });

    const clients = await prisma.client.findMany();
    clients.map(async client => {
      await novuNotification.sendWelcomeEmailToCustomer({
        disbursalDate,
        ids: disbursedCases.map(item => item.customer_id),
        clientId: client.client_id,
      });
    });
  } catch (error) {
    console.log(error);
  }
};
