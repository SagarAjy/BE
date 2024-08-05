//import { getSignedURLForS3 } from '../../utils';
import { customerModel } from '../customer/customer.model';
import { documentsModel } from '../documents/documents.model';
import { leadsModel } from '../leads/leads.model';

const getCustomerByLeadId = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const lead = await leadsModel.getLeadById({ leadId, clientId });
  const customer = await customerModel.getCustomerById({
    customer_id: lead?.customer_id || '',
    clientId,
  });

  const documents = await documentsModel.getDocumentsByCustomerId({
    customerId: customer?.customer_id || '',
    clientId,
  });

  let customerPictureUrl = '';
  const customerPicture = documents.filter(
    document => document.document_type === 'Selfie',
  );

  if (customerPicture.length === 0) {
    customerPictureUrl = '';
  } else {
    // const signedUrl = await getSignedURLForS3(
    //   customerPicture[0]?.document_url || '',
    // );
    const signedUrl = ''

    customerPictureUrl = signedUrl;
  }

  return {
    id: customer?.customer_id || '',
    customerName: customer?.name || '',
    customerPicture: customerPictureUrl || '',
    email: customer?.email || '',
    phoneNo: customer?.mobile || '',
    gender: customer?.gender || 'Male',
    createdAt: customer?.created_at || new Date(),
    pan: customer?.pancard || '',
    aadhar: customer?.aadhar_no || '',
    dob: customer?.dob || '',
    city: lead?.city || '',
    status: lead?.status || 'Fresh_Lead',
  };
};

export const customerService = { getCustomerByLeadId };
