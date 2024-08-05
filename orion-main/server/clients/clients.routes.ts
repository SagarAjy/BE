import express, { Router } from 'express';
import { fetchUser } from '../middleware/auth.middleware';
import { clientService } from './clients.service';
import { clientModel } from './clients.model';
import { JsonValue } from '@prisma/client/runtime/library';
import { logger } from '../../logger';

type getClientsResponseType = {
  clientId: string;
  logo: string;
  name: string;
};

type getClientResponseType = getClientsResponseType & {
  loanType: string;
};

export const clientsRouter: Router = express.Router();

clientsRouter.get<
  Record<never, never>,
  getClientsResponseType[] | { message: string }
>('/get-clients', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId: string = req.user.user;

    const userDetails = await clientModel.getUserByUserIdWithoutClientId({
      userId,
    });
    const clients = await clientService.getClientsByUserId({
      clientIds: userDetails?.client_ids || [],
    });

    res.status(200).send(clients);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

clientsRouter.get<
  Record<never, never>,
  getClientResponseType | { message: string }
>('/get-client-details', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const userId: string = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;

    const client = await clientService.getClient({ clientId });

    res.status(200).send(client);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

clientsRouter.get('/get-client-theme', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;

    const clientTheme = await clientService.getClientThemeByClientId({
      clientId,
    });

    res.status(200).send(clientTheme);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

clientsRouter.get('/get-client-bank-accounts', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;

    const clientBankAccounts = await clientService.getClientBankAccounts({
      clientId,
    });

    res.status(200).send(clientBankAccounts);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

clientsRouter.get<
  Record<never, never>,
  { status: boolean; accounts: JsonValue[] | null } | { message: string }
>('/auto-disbursal-enabled', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;

    const clientDetails = await clientModel.getClient({ clientId });
    if (clientDetails?.cashfree_integration) {
      res.status(200).send({
        status: true,
        accounts: clientDetails.client_auto_disbursal_accounts,
      });
    } else {
      res.status(200).send({ status: false, accounts: null });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Internal Server Error!' });
  }
});
