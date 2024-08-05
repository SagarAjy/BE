import express, { Router } from 'express';
import { customerModel } from '../../customer/customer.model';
import { leadsModel } from '../../leads/leads.model';
import { userAssignedModel } from '../../user-assigned/user-assigned.model';
import {
  Prisma,
  address_type,
  document_type,
  genders,
  lead_status,
  marital_status,
  verification_status,
} from '@prisma/client';
import { fetchCustomer } from '../../middleware/customer.auth.middleware';
import { logger } from '../../../logger';
import { customerService } from './public.customer.service';
//import { fileUpload, s3Client } from '../../middleware/fileupload.middleware';
import { documentsModel } from '../../documents/documents.model';
import jwt from 'jsonwebtoken';
import { clientModel } from '../../clients/clients.model';
import { approvalModel } from '../../approval/approval.model';
import { userModel } from '../../user/user.model';
import { userReporteeModel } from '../../user-reportee/user-reportee.model';
import { emptyUUID } from '../../../constants';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { addAddressType, getAddressType } from '../../address/address.routes';
import { addressModel } from '../../address/address.model';
import { addressService } from '../../address/address.service';
import {
  addReferenceType,
  getReferenceType,
} from '../../reference/reference.routes';
import { referenceModel } from '../../reference/reference.model';
import { referenceService } from '../../reference/reference.service';
import { employerModel } from '../../employer/employer.model';
import {
  addEmployerType,
  getEmployerType,
} from '../../employer/employer.routes';
import { employerService } from '../../employer/employer.service';
import { addMonths, differenceInCalendarDays, format } from 'date-fns';
import axios from 'axios';
import base64 from 'base-64';
import { kycModel } from '../../kyc/kyc.models';
import {
  ESignDocRequestType,
  GetESignDocsResponse,
  GetKYCDetailsResponse,
} from '../../kyc/kyc.routes';
import { formatIndianNumber } from '../../../utils';
import { kycService } from '../../kyc/kyc.service';
import { disbursalModel } from '../../disbursal/disbursal.model';

const secretKey = process.env.SECRET_KEY;

type CreateLeadsBodyType = {
  customer_id: string;
  name: string;
  gender: genders;
  dob: Date;
  phoneNo: string;
  email: string;
  pan: string;
  aadhaar: string;
  marital_status: marital_status;
  otp: string;
  purpose: string;
  loanAmountRequired: string;
  tenure: number;
  monthlyIncome: string;
  salary_mode: string;
  city: string;
  state: string;
  pincode: string;
  domain_name: string | null;
  ip: string;
  utmSource: string;
  user: string | null;
  clientId: string;
  gclid: string | null;
  conversionName: string | null;
};

type CustomerDetailsType = {
  id: string;
  customerName: string;
  customerPicture: string;
  email: string;
  phoneNo: string;
  gender: genders;
  createdAt: Date;
  pan: string;
  aadhar: string;
  city: string;
  status: lead_status;
};

type CustomerApplicationDetailsType = {
  id: string;
  status: lead_status;
  stepsCompleted: number;
  loanAmountRequired: string;
  repayDate: Date;
  repaymentAmount: number;
  repayAmountTillNow: number;
  approvalAmount: number;
  purpose: string;
};

type CustomerDocumentsType = {
  id: string;
  documentType: document_type;
  documentUrl: string;
  password: string;
  status: verification_status;
};

type UploadDocumentType = {
  documentType: document_type;
  password: string;
  document: File;
  clientId: string;
};

type ApplicationHistoryDataType = {
  id: string;
  loanNo: string;
  status: lead_status;
  loanAmountRequired: string;
  approvedAmount: number;
  repaymentAmount: number;
  repaymentDate: Date;
  collectedAmount: number;
  stepsCompleted: number;
  purpose: string;
  createdAt: Date;
};

export type ReapplyBodyType = {
  monthlyIncome: string;
  loanAmountRequired: string;
  purpose: string;
  state: string;
  city: string;
  pincode: string;
  latestLeadStatus: lead_status;
  clientId: string;
  user?: string;
};

export const customerPublicRouter: Router = express.Router();

customerPublicRouter.post<
  Record<never, never>,
  { id: string; token: string; name: string } | { message: string },
  CreateLeadsBodyType
>('/create-lead', async (req, res) => {
  try {
    const {
      phoneNo,
      name,
      email,
      pan,
      aadhaar,
      monthlyIncome,
      loanAmountRequired,
      dob,
      gender,
      purpose,
      salary_mode,
      city,
      state,
      pincode,
      utmSource,
      user,
      clientId,
      gclid,
    } = req.body;

    const customerDetails = await customerModel.getCustomerByPANOrAadhaar({
      pan,
      aadhaar,
      clientId,
    });
    let response: string;
    if (customerDetails) {
      response = await customerModel.updateCustomer({
        name: name,
        aadhar_no: aadhaar,
        dob: dob,
        email: email.toLowerCase(),
        gender,
        marital_status: 'Unmarried',
        mobile: phoneNo,
        pancard: pan,
        customerId: customerDetails.customer_id,
        clientId,
      });
    } else {
      response = await customerModel.createCustomer({
        name: name,
        aadhar_no: aadhaar,
        dob: dob,
        email: email.toLowerCase(),
        gender,
        marital_status: 'Unmarried',
        mobile: phoneNo,
        pancard: pan,
        clientId,
      });
    }

    let userId: string | null = '';

    // if lead not in eligible range then assign to no one
    if (monthlyIncome === '₹0-₹35,000') {
      userId = null;
    } else {
      //* find free tele caller to assign lead to
      userId = await userAssignedModel.getNotAssignedUser({
        role: 'Tele_Caller',
        branch: 'Delhi',
        clientId,
      });

      if (userId === null) {
        userId = await userAssignedModel.getNotAssignedUser({
          role: 'Tele_Caller',
          branch: 'Delhi',
          clientId,
        });
      }
    }
    if (user !== null) {
      // to assign to specific user using user_id query param
      userId = user;
    }

    //assign credit manager
    let creditManagerId: string | null = null;

    if (userId !== null) {
      const creditManager =
        await userReporteeModel.getUserReportingByReporteeId({
          userId,
          clientId,
        });
      creditManagerId = creditManager?.user_id || null;
    }

    if (creditManagerId === null) {
      creditManagerId = await userAssignedModel.getNotAssignedUser({
        role: 'Credit_Manager',
        branch: 'Delhi',
        clientId,
      });
    }
    if (creditManagerId === null) {
      creditManagerId = await userAssignedModel.getNotAssignedUser({
        role: 'Credit_Manager',
        branch: 'Delhi',
        clientId,
      });
    }

    const clientDetails = await clientModel.getClient({ clientId });

    // customer exists
    if (customerDetails) {
      const latestLead = await leadsModel.getLatestLeadByCustomerId({
        customerId: customerDetails?.customer_id || '',
        clientId,
      });

      if (latestLead) {
        const approvalDetails = await approvalModel.getApproval({
          leadId: latestLead.lead_id || '',
          clientId,
        });
        //in case of loan officer it is directly assigned
        if (approvalDetails) {
          if (approvalDetails?.status === 'Rejected') {
            userId = latestLead.user_id;
          }
        }
      }
    }

    if (creditManagerId === null || creditManagerId.length === 0) {
      creditManagerId = emptyUUID;
    }

    const loanType = clientDetails?.loan_type || 'payday';

    await leadsModel.createLead({
      customer_id: response || '',
      user_id: userId || null,
      domain_name: clientDetails?.client_name || '',
      monthly_income: monthlyIncome,
      loan_required: loanAmountRequired,
      state,
      city,
      pincode,
      salary_mode: salary_mode ? salary_mode : 'salaried',
      purpose,
      ip: req.ip || '',
      tenure: 0,
      utmSource,
      clientId,
      status: lead_status.Fresh_Lead,
      gclid,
      creditManagerId,
      loan_type: loanType,
    });

    // if income in eligible range
    if (monthlyIncome !== '₹0-₹35,000') {
      const assignedUser = await userAssignedModel.getUserAssigned({
        userId: userId || '',
        clientId,
      });

      await userAssignedModel.updateUserAssigned({
        id: assignedUser?.id || '',
        userId: userId || '',
        clientId,
      });
    }

    // * signing jwt token
    const data = { phoneNo };
    const token = jwt.sign(data, secretKey || '', {
      expiresIn: process.env.JWT_EXPIRES_IN || '60d',
    });

    res.status(200).send({
      id: response,
      token,
      name,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Internal Server Error!' });
  }
});

customerPublicRouter.get<
  Record<never, never>,
  CustomerDetailsType | { message: string }
>('/customer-details', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;
    //@ts-ignore
    const clientId = req.clientId;

    const customer = await customerService.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });
    res.status(200).send(customer);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Internal Server Error!' });
  }
});

customerPublicRouter.get<
  Record<never, never>,
  CustomerApplicationDetailsType | { message: string } | null
>('/application-details', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;
    //@ts-ignore
    const clientId = req.clientId;

    const applicationDetails =
      await customerService.getApplicationDetailsByPhoneNo({
        phoneNo,
        clientId,
      });
    if (applicationDetails) {
      return res.status(200).send(applicationDetails);
    }
    return res.status(200).send(null);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

customerPublicRouter.get<
  Record<never, never>,
  CustomerDocumentsType[] | { message: string }
>('/get-documents', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;
    //@ts-ignore
    const clientId = req.clientId;
    const documentDetails = await customerService.getCustomerDocumentsByPhoneNo(
      {
        phoneNo,
        clientId,
      },
    );

    res.status(200).send(documentDetails);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

customerPublicRouter.get<
  { documentType: document_type },
  CustomerDocumentsType | { message: string }
>('/get-document-type/:documentType', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;
    //@ts-ignore
    const clientId = req.clientId;

    const { documentType } = req.params;
    const documentDetails =
      await customerService.getCustomerDocumentByDocumentType({
        documentType,
        phoneNo,
        clientId,
      });

    res.status(200).send(documentDetails);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

// customerPublicRouter.post<
//   Record<never, never>,
//   { message: string },
//   UploadDocumentType
// >('/upload-documents', fetchCustomer, fileUpload, async (req, res) => {
//   try {
//     //@ts-ignore
//     const phoneNo = req.phoneNo.phoneNo;

//     const customerDetails = await customerModel.getCustomerByPhoneNo({
//       phoneNo,
//       clientId: req.body.clientId,
//     });
//     await documentsModel.addDocument({
//       customerId: customerDetails?.customer_id || '',
//       userId: null,
//       //@ts-ignore
//       documentUrl: req.file?.location,
//       documentType: req.body.documentType,
//       password: req.body.password,
//       status: 'Not_Verified',
//       clientId: req.body.clientId,
//     });
//     res.status(200).send({ message: 'Succesfully uploaded!' });
//   } catch (error) {
//     logger.error(error);
//     res.status(500).send({ message: 'Some error occured' });
//   }
// });

// customerPublicRouter.post<{ documentId: string }, { message: string }>(
//   '/delete-document/:documentId',
//   fetchCustomer,
//   async (req, res) => {
//     try {
//       //@ts-ignore
//       const clientId = req.clientId;

//       const { documentId } = req.params;

//       const documentDetails = await documentsModel.getDocument({
//         documentId,
//         clientId,
//       });

//       const urlParts = documentDetails?.document_url.split('/');
//       const bucket = process.env.SPACES_BUCKET;
//       const key = urlParts?.slice(3).join('/');

//       const deleteParams = {
//         Bucket: bucket,
//         Key: key,
//       };

//       //deleting document from database
//       const deleteCommand = new DeleteObjectCommand(deleteParams);
//       await s3Client.send(deleteCommand);

//       await documentsModel.deleteDocument({
//         documentId,
//         clientId,
//       });

//       return res.status(200).send({ message: 'File Deleted Sccessfully!' });
//     } catch (error) {
//       logger.error(error);
//       res.status(500).send({ message: 'Some error occured' });
//     }
//   },
// );

//create address
customerPublicRouter.post<
  Record<never, never>,
  Record<never, never>,
  addAddressType
>('/add-address', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;

    const customerDetails = await customerModel.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });

    const { address, city, state, pincode, houseType, status } = req.body;

    //*condition if address status is verified then only userid is send otherwise null
    await addressModel.addAddress({
      customerId: customerDetails?.customer_id || '',
      userId: null,
      ...req.body,
      clientId,
    });

    //*NOTE: if isChecked is true and address type is 'Permanent'
    //* then added another address with type 'Current address' vice versa
    if (req.body.isChecked === 'true') {
      await addressModel.addAddress({
        customerId: customerDetails?.customer_id || '',
        userId: null,
        type:
          req.body.type === 'Permanent_Address'
            ? 'Current_Address'
            : 'Permanent_Address',
        address,
        city,
        state,
        pincode,
        houseType,
        status,
        clientId,
      });
    }
    res.status(200).send({ message: 'Address Added!' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

//get address by customerId
customerPublicRouter.get<
  { addressType: address_type },
  getAddressType[] | { message: string }
>('/get-address/:addressType', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;

    const { addressType } = req.params;
    const addressDetails = await addressService.getAddressByType({
      phoneNo,
      addressType,
      clientId,
    });
    res.status(200).send(addressDetails);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});

//update address by addressId
customerPublicRouter.put<{ addressId: string }>(
  '/update-address/:addressId',
  fetchCustomer,
  async (req, res) => {
    try {
      const { addressId } = req.params;
      //@ts-ignore
      const clientId = req.clientId;

      await addressModel.updateAddress({
        addressId,
        userId: null,
        ...req.body,
        clientId,
      });
      res.status(200).send({ message: 'Address details updated!' });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res
            .status(401)
            .send({ message: 'Address already verified!', code: 'P2025' }); // * since address is already verified
        }
      }
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured!' });
    }
  },
);

//create reference
customerPublicRouter.post<
  Record<never, never>,
  Record<never, never>,
  addReferenceType
>('/add-reference', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;
    //@ts-ignore
    const clientId = req.clientId;

    const customerDetails = await customerModel.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });

    await referenceModel.addReference({
      customerId: customerDetails?.customer_id || '',
      userId: null,
      ...req.body,
      clientId,
    });
    return res.status(200).send({ message: 'Reference Added' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

//get reference by leadid
customerPublicRouter.get<
  { leadId: string },
  getReferenceType[] | { message: string }
>('/get-references', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;

    const customerDetails = await customerModel.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });

    const refernceDetails = await referenceService.getReferencesByCustomerId({
      customerId: customerDetails?.customer_id || '',
      clientId,
    });

    res.status(200).send(refernceDetails);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});

//delete reference by referenceId
customerPublicRouter.delete(
  '/delete-reference/:referenceId',
  fetchCustomer,
  async (req, res) => {
    try {
      const { referenceId } = req.params;
      await referenceModel.deleteReference({ referenceId });
      return res
        .status(201)
        .send({ message: 'Reference successfully deleted!' });
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured!' });
    }
  },
);

customerPublicRouter.post<
  Record<never, never>,
  Record<never, never>,
  addEmployerType
>('/add-employer', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;
    //@ts-ignore
    const clientId = req.clientId;

    const customerDetails = await customerModel.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });

    await employerModel.addEmployer({
      customerId: customerDetails?.customer_id || '',
      userId: null,
      ...req.body,
      clientId,
    });
    return res.status(200).send({ message: 'Employer Added' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

//get employer
customerPublicRouter.get<
  Record<never, never>,
  getEmployerType[] | { message: string }
>('/get-employer', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;

    const customerDetails = await customerModel.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });
    const referenceDetails = await employerService.getEmployerByCustomerId({
      customerId: customerDetails?.customer_id || '',
      clientId,
    });
    res.status(200).send(referenceDetails);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

//delete employer
customerPublicRouter.delete<{ employerId: string }, { message: string }>(
  '/delete-employer/:employerId',
  fetchCustomer,
  async (req, res) => {
    try {
      const { employerId } = req.params;
      await employerModel.deleteEmployer({ employerId });
      return res
        .status(201)
        .send({ message: 'Employer successfully deleted!' });
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured' });
    }
  },
);

customerPublicRouter.get<
  Record<never, never>,
  ApplicationHistoryDataType[] | { message: string }
>('/get-application-history', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;
    //@ts-ignore
    const clientId = req.clientId;

    const applicationHistory =
      await customerService.getCustomerApplicationHistoryByPhoneNo({
        phoneNo,
        clientId,
      });
    res.status(200).send(applicationHistory);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

// TODO: type for requests
customerPublicRouter.get(
  '/get-reapply-data/:clientId',
  fetchCustomer,
  async (req, res) => {
    try {
      //@ts-ignore
      const phoneNo = req.phoneNo.phoneNo;
      const { clientId } = req.params;
      const reApplyData = await customerService.getReapplyData({
        phoneNo,
        clientId,
      });
      res.status(200).send(reApplyData);
    } catch (error) {
      logger.error(error);
      res.status(500).send({ message: 'Some error occured' });
    }
  },
);

customerPublicRouter.post<
  Record<never, never>,
  { message: string },
  ReapplyBodyType
>('/reapply', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;

    const {
      monthlyIncome,
      loanAmountRequired,
      purpose,
      state,
      city,
      pincode,
      clientId,
    } = req.body;

    const customerDetails = await customerModel.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });

    const loanCount = await leadsModel.getClosedLoanCount({
      customerId: customerDetails?.customer_id || '',
      clientId,
    });

    const customerLeads = await leadsModel.getLeadsByCustomerId({
      clientId,
      customerId: customerDetails?.customer_id || '',
    });

    //* find free loan officer to assign lead to or tele caller if loan count is less than 2
    let userId: string | null = '';

    // check if customer details exist and already applied
    if (customerDetails && customerLeads.length >= 1) {
      // find the latest lead
      const latestLead = await leadsModel.getLatestLeadByCustomerId({
        customerId: customerDetails?.customer_id || '',
        clientId,
      });
      // find the user assigned to the latest lead
      const userDetails = await userModel.getUser({
        userId: latestLead.user_id || '',
        clientId,
      });
      // if previous user assigned now not tele caller or loan officer
      if (
        userDetails?.role !== 'Tele_Caller' &&
        userDetails?.role !== 'Loan_Officer'
      ) {
        let creditManager = latestLead?.credit_manager_id || '';
        // check if none sent as value
        if (!creditManager) {
          creditManager = emptyUUID;
        } else {
          // get user lead assignee reports to
          const userReportees = await userReporteeModel.getUserReportees({
            userId: creditManager,
            clientId,
          });

          let leadAssignee = emptyUUID;
          await Promise.all(
            userReportees.map(async userReportee => {
              const userReporteeDetails = await userModel.getUser({
                userId: userReportee.user_reportee_id || '',
                clientId,
              });

              if (userReporteeDetails?.role === 'Tele_Caller') {
                leadAssignee = userReporteeDetails?.user_id || '';
              }
            }),
          );

          // in case relation to tele caller does not exist, assign the case to already assigned tele caller
          if (leadAssignee === emptyUUID) {
            leadAssignee = latestLead?.user_id || '';
          }

          //TODO: WHAT IF ALREADY ASSIGNED TELE CALLER IS NOT TELE CALLER ANYMORE
          userId = leadAssignee;
        }
      } else {
        // set the same user for the latest lead
        userId = userDetails?.user_id || '';
      }

      // if loan count greater than 2 and user is not loan officer then find a loan officer
      if (loanCount >= 2 && userDetails?.role !== 'Loan_Officer') {
        userId = await userAssignedModel.getNotAssignedUser({
          role: 'Loan_Officer',
          branch: 'Delhi',
          clientId,
        });
      }
    }

    if (userId === null) {
      if (loanCount >= 2) {
        userId = await userAssignedModel.getNotAssignedUser({
          role: 'Loan_Officer',
          branch: 'Delhi',
          clientId,
        });
      } else {
        userId = await userAssignedModel.getNotAssignedUser({
          role: 'Tele_Caller',
          branch: 'Delhi',
          clientId,
        });
      }
    }

    const clientDetails = await clientModel.getClient({ clientId });

    let leadsCount = 0;
    if (customerDetails && loanCount !== -1) {
      const leads = await leadsModel.getLeadsByCustomerId({
        customerId: customerDetails?.customer_id || '',
        clientId,
      });
      leadsCount = leads.length;
    }

    let creditManagerId: string = emptyUUID;
    const userReporteeDetails =
      await userReporteeModel.getUserReportingByReporteeId({
        userId: userId || emptyUUID,
        clientId,
      });

    creditManagerId = userReporteeDetails?.user_id || '';

    if (creditManagerId === null || creditManagerId.length === 0) {
      creditManagerId = emptyUUID;
    }

    const loanType = clientDetails?.loan_type || 'payday';

    await leadsModel.createLead({
      customer_id: customerDetails?.customer_id || '',
      user_id: userId || null,
      creditManagerId,
      domain_name: clientDetails?.client_name || '',
      monthly_income: monthlyIncome,
      loan_required: loanAmountRequired,
      state,
      city,
      pincode,
      salary_mode: 'salaried',
      purpose,
      ip: req.ip || '',
      tenure: 0,
      utmSource: 'reloan',
      status: leadsCount > 0 ? lead_status.Interested : lead_status.Fresh_Lead,
      clientId,
      gclid: null,
      loan_type: loanType,
    });
    if (userId !== null) {
      try {
        const assignedUser = await userAssignedModel.getUserAssigned({
          userId: userId || '',
          clientId,
        });

        await userAssignedModel.updateUserAssigned({
          id: assignedUser?.id || '',
          userId: userId || '',
          clientId,
        });
      } catch (error) {}
    }

    res.status(200).send({
      message: 'Lead Created Successfully',
    });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

//get latest lead status
customerPublicRouter.get<
  Record<never, never>,
  { status: lead_status } | { message: string }
>('/get-latest-lead-status', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;

    const customerDetails = await customerModel.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });

    const latestLead = await leadsModel.getLatestLeadByCustomerId({
      customerId: customerDetails?.customer_id || '',
      clientId,
    });
    const leadStatus = latestLead?.status || lead_status.Fresh_Lead;

    res.status(200).send({ status: leadStatus });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

// update latest lead status
customerPublicRouter.put<
  { leadId: string },
  { message: string },
  { status: lead_status }
>('/update-lead-status', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;

    const customerDetails = await customerModel.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });
    const { status } = req.body;

    const getLatestLead = await leadsModel.getLatestLeadByCustomerId({
      customerId: customerDetails?.customer_id || '',
      clientId,
    });

    const leadId = getLatestLead?.lead_id || '';

    await leadsModel.updateLeadStatus({ leadId, status, clientId });
    res.status(200).send({ message: 'Lead Status Updated!' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

//update approval with user given details
customerPublicRouter.put<Record<never, never>, { message: string }>(
  '/update-approval',
  fetchCustomer,
  async (req, res) => {
    try {
      //@ts-ignore
      const clientId = req.clientId;

      const { approvalAmount, processingFees, conversionFees, tenure, loanNo } =
        req.body;
      const approvalDetails = await approvalModel.getApprovalByLoanNo({
        loanNo,
        clientId,
      });
      const lastEmiRepayDate = format(
        addMonths(new Date(), tenure),
        'dd-MM-yyyy',
      );
      await approvalModel.updateApproval({
        leadId: approvalDetails?.lead_id || '',
        approvalAmount,
        repayDate: lastEmiRepayDate,
        branch: approvalDetails?.branch || '',
        creditedAt: approvalDetails?.created_at || new Date(),
        processingFeePercent: 5,
        processingFee: processingFees,
        conversionFeesPercent: 5,
        conversionFees: conversionFees,
        officialEmail: approvalDetails?.official_email || '',
        remark: approvalDetails?.remark || '',
        roi: approvalDetails?.roi || 0,
        status: approvalDetails?.status || lead_status.Approved,
        userId: approvalDetails?.credited_by || '',
        editRepayDate: false,
        clientId,
      });

      await approvalModel.updateTenure({
        leadId: approvalDetails?.lead_id || '',
        tenure,
        clientId,
      });

      await leadsModel.updateLeadLoanRequired({
        leadId: approvalDetails?.lead_id || '',
        loanRequired: approvalAmount,
        clientId,
      });

      const customerDetails = await customerModel.getCustomerById({
        customer_id: approvalDetails?.customer_id || '',
        clientId,
      });

      const clientDetails = await clientModel.getClient({ clientId });

      const kycURL = `${process.env.DIGIO_BASE_URL}/client/kyc/v2/request/with_template`;
      const kycRequest = await axios.post(
        kycURL,
        {
          customer_identifier: customerDetails?.email,
          customer_name: customerDetails?.name,
          reference_id: customerDetails?.customer_id,
          template_name: clientDetails?.kyc_template_name,
          notify_customer: false,
          generate_access_token: true,
        },
        {
          headers: {
            Authorization:
              'Basic ' +
              base64.encode(
                process.env.DIGIO_USERNAME + ':' + process.env.DIGIO_PASSWORD,
              ),
          },
        },
      );

      await kycModel.addKYCRequest({
        leadId: approvalDetails?.lead_id || '',
        customerIdentifier: customerDetails?.customer_id || '',
        kycRequestId: kycRequest.data.id,
        requestBy: null,
        clientId,
      });

      const addressDetails = await addressService.getAddress({
        leadId: approvalDetails?.lead_id || '',
        clientId,
      });

      const NBFCName = clientDetails?.client_nbfc || 'NBFC';

      const gstAmount =
        (approvalDetails?.processing_fee || 0) *
        0.01 *
        (approvalDetails?.gst || 0);

      const tempTenure = differenceInCalendarDays(
        approvalDetails?.repay_date || new Date(),
        new Date(),
      );
      const interestAmount =
        approvalAmount * tempTenure * 0.01 * (approvalDetails?.roi || 0);

      const disbursalAmount =
        approvalAmount - ((approvalDetails?.processing_fee || 0) + gstAmount);

      const repaymentAmount = approvalAmount + interestAmount;

      const eSignURL = `${process.env.DIGIO_BASE_URL}/v2/client/template/multi_templates/create_sign_request`;
      const eSignDocRequest: ESignDocRequestType = await axios.post(
        eSignURL,
        {
          signers: [
            {
              identifier: customerDetails?.email,
              reason: `Loan Agreement by ${NBFCName}`,
              signer_tag: 'Signer 1',
              name: customerDetails?.name,
              sign_type: 'aadhaar',
            },
          ],
          expire_in_days: '10',
          send_sign_link: 'true',
          // notify_signers: 'true',
          display_on_page: 'all',
          templates: [
            {
              template_key: clientDetails?.e_sign_id,
              images: {},
              template_values: {
                date: format(new Date(), 'dd-MM-yyyy'),
                customer_address:
                  addressDetails.at(0)?.address +
                    ', ' +
                    addressDetails?.at(0)?.city +
                    ', ' +
                    addressDetails?.at(0)?.state || '',
                date_of_disbursal: format(new Date(), 'dd-MM-yyyy') || '',
                loan_no: approvalDetails?.loan_no || '',
                purpose: approvalDetails?.loan_purpose,
                customer_phone: customerDetails?.mobile,
                processing_fee: formatIndianNumber(
                  approvalDetails?.processing_fee || 0,
                ),
                loan_amt: formatIndianNumber(
                  approvalDetails?.loan_amt_approved || 0,
                ),
                roi: (approvalDetails?.roi || 1) * tempTenure + '%',
                customer_pan: customerDetails?.pancard,
                total_interest: formatIndianNumber(interestAmount),
                disbursal_amt: formatIndianNumber(disbursalAmount),
                total_deductions: formatIndianNumber(
                  (approvalDetails?.loan_amt_approved || 0) - disbursalAmount,
                ),
                repayment_date: format(
                  approvalDetails?.repay_date || new Date(),
                  'dd-MM-yyyy',
                ),
                customer_email: customerDetails?.email,
                customer_name: customerDetails?.name,
                tenure: tempTenure + ' days' || '0 days',
                gst_amt: formatIndianNumber(gstAmount),
                repayment_amt: formatIndianNumber(repaymentAmount),
                apr: (approvalDetails?.roi || 1) * tempTenure,
              },
            },
          ],
        },
        {
          headers: {
            Authorization:
              'Basic ' +
              base64.encode(
                process.env.DIGIO_USERNAME + ':' + process.env.DIGIO_PASSWORD,
              ),
          },
        },
      );

      await kycModel.addESignDocRequest({
        eSignDocRequest,
        customerId: customerDetails?.customer_id || '',
        userId: null,
        leadId: approvalDetails?.lead_id || '',
        clientId,
      });

      res.status(200).send({ message: 'Approval Updated!' });
    } catch (error) {
      logger.error(error);
      console.log(error);
      res.status(500).send({ message: 'Some error occured' });
    }
  },
);

customerPublicRouter.get<
  { loanNo: string },
  GetKYCDetailsResponse | { message: string } | null
>('/get-kyc-details/:loanNo', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;

    const { loanNo } = req.params;

    const customerDetails = await customerService.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });

    const approvalDetails = await approvalModel.getApprovalByLoanNo({
      loanNo,
      clientId,
    });

    const kycRequestDetails = await kycService.getKYCRequestDetails({
      customerId: customerDetails.id,
      leadId: approvalDetails?.lead_id || '',
      clientId,
    });

    res.status(200).send(kycRequestDetails);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

customerPublicRouter.get<
  { loanNo: string },
  GetESignDocsResponse | { message: string } | null
>('/get-e-sign-details/:loanNo', fetchCustomer, async (req, res) => {
  try {
    const { loanNo } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;

    const customerDetails = await customerService.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });

    const approvalDetails = await approvalModel.getApprovalByLoanNo({
      loanNo,
      clientId,
    });

    const eSignDocsRequest = await kycService.eSignDocRequestDetails({
      customerId: customerDetails.id,
      leadId: approvalDetails?.lead_id || '',
      clientId,
    });
    res.status(200).send(eSignDocsRequest);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

//regenerate access token
customerPublicRouter.get(
  '/regenerate-digio-token/:docId',
  fetchCustomer,
  async (req, res) => {
    try {
      //@ts-ignore
      const clientId = req.clientId;
      //@ts-ignore
      const phoneNo = req.phoneNo.phoneNo;

      const customerDetails = await customerService.getCustomerByPhoneNo({
        phoneNo,
        clientId,
      });

      const { docId } = req.params;

      const regenerateTokenUrl = `${process.env.DIGIO_BASE_URL}/user/auth/generate_token`;
      const response = await axios.post(
        regenerateTokenUrl,
        {
          entity_id: docId,
          identifier: customerDetails?.email,
        },
        {
          headers: {
            Authorization:
              'Basic ' +
              base64.encode(
                process.env.DIGIO_USERNAME + ':' + process.env.DIGIO_PASSWORD,
              ),
          },
        },
      );

      res.status(200).send({ token: response.data.response.id });
    } catch (error) {
      logger.error(error);
      res.status(500).send({ message: 'Some error occured!' });
    }
  },
);

customerPublicRouter.post(
  '/create-customer-disbursal',
  fetchCustomer,
  async (req, res) => {
    try {
      //@ts-ignore
      const clientId = req.clientId;
      //@ts-ignore
      const phoneNo = req.phoneNo.phoneNo;

      const customerDetails = await customerService.getCustomerByPhoneNo({
        phoneNo,
        clientId,
      });

      const {
        customerAccNo,
        customerAccountType,
        customerIfsc,
        bank,
        bankBranch,
        loanNo,
      } = req.body;

      const clientDetails = await clientModel.getClient({ clientId });

      const clientBankAccounts =
        //@ts-ignore
        clientDetails?.client_bank_accounts.at(0).value;

      const approvalData = await approvalModel.getApprovalByLoanNo({
        loanNo,
        clientId,
      });

      const approvedAmount = approvalData?.loan_amt_approved || 0;
      const pf = approvalData?.processing_fee || 0;
      const cf = approvalData?.conversion_fees || 0;
      const gst = pf * 0.01 * (approvalData?.gst || 0);

      const disbursalAmount = approvedAmount - (pf + cf + gst);

      await disbursalModel.addDisbursal({
        accountNo: customerAccNo,
        ifscCode: customerIfsc,
        accountType: customerAccountType,
        bankBranch: bankBranch,
        bankName: bank,
        customerId: customerDetails?.id || '',
        //@ts-ignore
        companyAccountNo: clientBankAccounts,
        leadId: approvalData?.lead_id || '',
        chequeNo: '0',
        loanNo: loanNo,
        loanType: clientDetails?.loan_type || 'payday',
        disbursalAmount: disbursalAmount,
        disbursalDate: new Date(),
        pdDoneBy: null,
        pdDoneDate: format(new Date(), 'dd-MM-yyyy'),
        finalRemark: 'Customer initiated disbursal',
        processingFee: pf,
        conversionFee: cf,
        userId: approvalData?.credited_by || '',
        clientId,
      });
      res.status(200).send({ message: 'Disbursal Initiated!' });
    } catch (e) {
      logger.error(e);
      res.status(500).send({ message: 'Some error occured!' });
    }
  },
);
