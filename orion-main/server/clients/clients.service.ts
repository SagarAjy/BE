import { clientModel } from './clients.model';

const getClientsByUserId = async ({ clientIds }: { clientIds: string[] }) => {
  const clientsData = await clientModel.getClientsByUserId({ clientIds });

  const clients = clientsData.map(client => {
    return {
      clientId: client.client_id,
      logo: client.client_logo,
      name: client.client_name,
    };
  });

  return clients;
};

const getClient = async ({ clientId }: { clientId: string }) => {
  const clientData = await clientModel.getClient({ clientId });

  return {
    clientId: clientData?.client_id || '',
    logo: clientData?.client_logo || '',
    name: clientData?.client_name || '',
    loanType: clientData?.loan_type || '',
  };
};

const getClientThemeByClientId = async ({ clientId }: { clientId: string }) => {
  const clientData = await clientModel.getClient({ clientId });

  return {
    logoUrl: clientData?.client_logo || '',
  };
};

const getClientBankAccounts = async ({ clientId }: { clientId: string }) => {
  const clientData = await clientModel.getClient({ clientId });

  return {
    clientBankAccounts: clientData?.client_bank_accounts || [],
  };
};

export const clientService = {
  getClientsByUserId,
  getClient,
  getClientThemeByClientId,
  getClientBankAccounts,
};
