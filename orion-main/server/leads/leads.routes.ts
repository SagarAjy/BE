import express, { Router } from 'express';
import {
  approval_status,
  genders,
  lead_status,
  marital_status,
  waiver_approval_status_type,
} from '@prisma/client';
import { leadsModel } from './leads.model';
import { customerModel } from '../customer/customer.model';
import { userAssignedModel } from '../user-assigned/user-assigned.model';
import { logger } from '../../logger';
import { fetchUser } from '../middleware/auth.middleware';
import { leadsService } from './leads.service';
import { parse } from 'date-fns';
import { userModel } from '../user/user.model';
import { clientModel } from '../clients/clients.model';
import { ReapplyBodyType } from '../public-routes/customer/public.customer.routes';
import { userReporteeModel } from '../user-reportee/user-reportee.model';
import { emptyUUID } from '../../constants';
import { auditLogModel } from '../audit-logs/audit-logs.model';

export const leadsRouter: Router = express.Router();

type createLeadsBodyType = {
  customer_id: string;
  name: string;
  gender: genders;
  dob: Date;
  mobile: string;
  email: string;
  pancard: string;
  aadhar_no: string;
  marital_status: marital_status;
  otp: string;
  purpose: string;
  loan_required: string;
  tenure: number;
  monthly_income: string;
  salary_mode: string;
  city: string;
  state: string;
  pincode: string;
  domain_name: string | null;
  ip: string;
};

type leadsDataType = leadDataType & {
  customerId: string;
  customerName: string;
  email: string;
  phoneNo: string;
  ip: string;
  updatedAt: Date;
  loanCount: string;
};

export type downloadLeadsDataType = {
  ['Lead Assignee']: string;
  ['Credit Manager']: string;
  ['Customer Name']: string;
  ['Customer Id']: string;
  ['Email']: string;
  ['Phone No']: string;
  ['Loan Required']: string;
  ['Purpose']: string;
  ['Tenure']: string;
  ['Monthly Income']: string;
  ['Salary Mode']: string;
  ['City']: string;
  ['State']: string;
  ['Pincode']: string;
  ['utmSource']: string;
  ['Domain']: string;
  ['Status']: string;
  ip: string;
  ['Created At']: string;
  ['Updated At']: string;
  ['Loan Count']: string;
};

type leadDataType = {
  id: string;
  leadAssignee: string;
  loanRequired: string;
  purpose: string;
  tenure: number;
  monthlyIncome: string;
  salaryMode: string;
  city: string;
  state: string;
  pincode: string;
  utmSource: string;
  domain: string;
  status: string;
  waiverApprovalStatus: waiver_approval_status_type;
  createdAt: Date;
};

type LeadHistoryType = {
  id: string;
  purpose: string;
  requiredAmount: string;
  tenure: number;
  monthlyIncome: string;
  city: string;
  state: string;
  pincode: string;
  status: string;
  source: string;
  createdAt: Date;
};

type CreditLeadsType = {
  id: string;
  loanNo: string;
  loanType: string;
  branch: string;
  name: string;
  email: string;
  phoneNo: string;
  loanAmount: number;
  tenure: number;
  roi: number;
  repayDate: Date;
  processingFee: number;
  monthlyIncome: number;
  cibil: number;
  creditedBy: string;
  status: string;
  updatedAt: Date;
  createdAt: Date;
};

type CreditLeadsResponseType = { leads: CreditLeadsType[]; leadsCount: number };

type DisbursalLeadsType = CreditLeadsType & {
  loanNo: string;
  disbursalAmount: number;
  disbursalDate: Date;
  referenceNo: string;
};

leadsRouter.get<
  Record<never, never>,
  { leads: leadsDataType[]; leadsCount: number } | { message: string },
  Record<never, never>,
  {
    limit: string;
    offset: string;
    leads?: lead_status;
    filterBy: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    assigneeId?: string;
  }
>('/get-leads-by-filter', fetchUser, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const leadsFilter = req.query.leads as lead_status;
    const filterBy = req.query.filterBy;
    const searchparam = decodeURIComponent(req.query.search || '');
    const startDate = decodeURIComponent(req.query.startDate || '');
    const endDate = decodeURIComponent(req.query.endDate || '');
    const assigneeId = req.query.assigneeId;
    //@ts-ignore
    const userId: string = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;

    let leads;
    if (startDate.length !== 0 && endDate.length !== 0) {
      leads = await leadsService.getLeads({
        limit,
        offset,
        leadsFilter,
        userId,
        searchparam,
        filterBy,
        startDate: parse(startDate, 'dd-MM-yyyy', new Date()),
        endDate: parse(endDate, 'dd-MM-yyyy', new Date()),
        assigneeId: assigneeId ? assigneeId : undefined,
        clientId,
      });
    } else {
      leads = await leadsService.getLeads({
        limit,
        offset,
        leadsFilter,
        userId,
        searchparam,
        filterBy,
        assigneeId: assigneeId ? assigneeId : undefined,
        clientId,
      });
    }
    return res.status(200).send(leads);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Some error occured!' });
  }
});

leadsRouter.get<
  Record<never, never>,
  downloadLeadsDataType[] | { message: string },
  Record<never, never>,
  {
    leads?: lead_status;
    search?: string;
    startDate?: string;
    endDate?: string;
    assigneeId?: string;
  }
>('/download-leads-by-filter', fetchUser, async (req, res) => {
  try {
    const leadsFilter = req.query.leads as lead_status;
    const searchparam = decodeURIComponent(req.query.search || '');
    const startDate = decodeURIComponent(req.query.startDate || '');
    const endDate = decodeURIComponent(req.query.endDate || '');
    const assigneeId = req.query.assigneeId;
    //@ts-ignore
    const userId = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;

    const userDetails = await userModel.getUser({ userId, clientId });
    let leads;
    if (userDetails?.role === 'Admin') {
      if (startDate.length !== 0 && endDate.length !== 0) {
        leads = await leadsService.getDownloadLeads({
          leadsFilter,
          userId,
          searchparam,
          startDate: parse(startDate, 'dd-MM-yyyy', new Date()),
          endDate: parse(endDate, 'dd-MM-yyyy', new Date()),
          assigneeId: assigneeId ? assigneeId : undefined,
          clientId,
        });
      } else {
        leads = await leadsService.getDownloadLeads({
          leadsFilter,
          userId,
          searchparam,
          assigneeId: assigneeId ? assigneeId : undefined,
          clientId,
        });
      }

      await auditLogModel.createLog({
        activity: `Downloaded ${leadsFilter}`,
        userId,
        eventType: 'Download',
        clientId,
      });

      return res.status(200).send(leads);
    } else {
      return res.status(401).send({ message: 'Unauthorized!' });
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Some error occured!' });
  }
});

leadsRouter.get<{ leadId: string }, LeadHistoryType[] | { message: string }>(
  '/leadHistory/:leadId',
  fetchUser,
  async (req, res) => {
    try {
      const { leadId } = req.params;
      //@ts-ignore
      const clientId = req.clientId;
      const leadDetails = await leadsModel.getLeadById({ leadId, clientId });
      const leads = await leadsService.getLeadsByCustomerId({
        customerId: leadDetails?.customer_id || '',
        clientId,
      });
      return res.status(200).send(leads);
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ message: 'Some error occured' });
    }
  },
);

leadsRouter.get<
  Record<never, never>,
  CreditLeadsResponseType | { message: string },
  Record<never, never>,
  {
    limit: string;
    offset: string;
    leads?: approval_status;
    search: string;
    filterBy: string;
    startDate?: string;
    endDate?: string;
  }
>('/get/credit-leads-by-filter', fetchUser, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const leadsFilter = req.query.leads as approval_status;
    const filterBy = req.query.filterBy;
    const searchparam = req.query.search;
    const startDate = decodeURIComponent(req.query.startDate || '');
    const endDate = decodeURIComponent(req.query.endDate || '');
    //@ts-ignore
    const userId: string = req.user.user;
    //@ts-ignore
    const clientId = req.clientId;
    let leadInfo;
    if (startDate.length !== 0 && endDate.length !== 0) {
      leadInfo = await leadsService.getCreditLeads({
        limit,
        offset,
        leadsFilter,
        userId,
        searchparam,
        filterBy,
        startDate: parse(startDate, 'dd-MM-yyyy', new Date()),
        endDate: parse(endDate, 'dd-MM-yyyy', new Date()),
        clientId,
      });
    } else {
      leadInfo = await leadsService.getCreditLeads({
        limit,
        offset,
        leadsFilter,
        userId,
        searchparam,
        filterBy,
        clientId,
      });
    }

    return res.status(200).send(leadInfo);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

leadsRouter.get<
  Record<never, never>,
  { leads: DisbursalLeadsType[]; leadsCount: number } | { message: string },
  Record<never, never>,
  {
    limit: string;
    offset: string;
    leads?: lead_status;
    search: string;
    filterBy: string;
    startDate?: string;
    endDate?: string;
  }
>('/get/disbursal-leads-by-filter', fetchUser, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const leadsFilter = req.query.leads as lead_status;
    const filterBy = req.query.filterBy;
    const searchparam = req.query.search;
    const startDate = decodeURIComponent(req.query.startDate || '');
    const endDate = decodeURIComponent(req.query.endDate || '');
    //@ts-ignore
    const userId: string = req.user.user;

    //@ts-ignore
    const clientId = req.clientId;
    let leadInfo;
    if (startDate.length !== 0 && endDate.length !== 0) {
      leadInfo = await leadsService.getDisbursalLeads({
        limit,
        offset,
        leadsFilter,
        userId,
        searchparam,
        filterBy,
        startDate: parse(startDate, 'dd-MM-yyyy', new Date()),
        endDate: parse(endDate, 'dd-MM-yyyy', new Date()),
        clientId,
      });
    } else {
      leadInfo = await leadsService.getDisbursalLeads({
        limit,
        offset,
        leadsFilter,
        userId,
        searchparam,
        filterBy,
        clientId,
      });
    }

    return res.status(200).send(leadInfo);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

leadsRouter.put<
  { leadId: string },
  { message: string },
  { leadAssignee: string }
>('/update/lead_assignee/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    let { leadAssignee } = req.body;
    //@ts-ignore
    const clientId = req.clientId;

    const leadDetails = await leadsModel.getLeadById({ leadId, clientId });
    // check if none sent as value
    if (leadAssignee === 'null') {
      leadAssignee = emptyUUID;
    }

    // get user lead assignee reports to
    const leadAssigneeReporting =
      await userReporteeModel.getUserReportingByReporteeId({
        userId: leadAssignee,
        clientId,
      });

    let userReporting = leadAssigneeReporting?.user_id || '';

    // if no reporting, then check for already assigned credit manager and not change the value
    if (!userReporting) {
      userReporting = leadDetails?.credit_manager_id || '';
      if (!userReporting) {
        userReporting = emptyUUID;
      }
    }

    await leadsModel.updateLeadAssignee({
      leadId,
      leadAssignee,
      userReporting,
      clientId,
    });
    return res.status(200).send({ message: 'Lead Updated!' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});

leadsRouter.put<
  { leadId: string },
  { message: string },
  { creditManager: string }
>('/update/credit_manager/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    let { creditManager } = req.body;
    //@ts-ignore
    const clientId = req.clientId;

    const leadDetails = await leadsModel.getLeadById({ leadId, clientId });

    // check if none sent as value
    if (creditManager === 'null') {
      creditManager = emptyUUID;
    }

    // get user lead assignee reports to
    const userReportees = await userReporteeModel.getUserReportees({
      userId: creditManager,
      clientId,
    });

    let leadAssignee = emptyUUID;
    await Promise.all(
      userReportees.map(async userReportee => {
        const userDetails = await userModel.getUser({
          userId: userReportee.user_reportee_id || '',
          clientId,
        });

        if (userDetails?.role === 'Tele_Caller') {
          leadAssignee = userDetails?.user_id || '';
        }
      }),
    );

    // in case relation to tele caller does not exist, assign the case to already assigned tele caller
    if (leadAssignee === emptyUUID) {
      leadAssignee = leadDetails?.user_id || '';
    }

    // PROBLEM: WHAT IF ALREADY ASSIGNED TELE CALLER IS NOT TELE CALLER ANYMORE
    // SOLUTION: Let old user exist, create new user with the new permissions

    await leadsModel.updateLeadAssignee({
      leadId,
      leadAssignee,
      userReporting: creditManager,
      clientId,
    });
    return res.status(200).send({ message: 'Lead Updated!' });
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured!' });
  }
});

leadsRouter.post<
  Record<never, never>,
  { leadId: string } | { message: string },
  ReapplyBodyType & {
    phoneNo: string;
  }
>('/reapply', fetchUser, async (req, res) => {
  try {
    const {
      phoneNo,
      monthlyIncome,
      loanAmountRequired,
      purpose,
      state,
      city,
      pincode,
      clientId,
      user,
    } = req.body;

    const customerDetails = await customerModel.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });

    const loanCount = await leadsModel.getClosedLoanCount({
      customerId: customerDetails?.customer_id || '',
      clientId,
    });
    //* find free loan officer to assign lead to or tele caller if loan count is less than 2
    let userId: string | null = '';

    // check if customer details exist
    if (customerDetails) {
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
      // set the same user for the latest lead
      userId = userDetails?.user_id || '';
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
    if (customerDetails) {
      const leads = await leadsModel.getLeadsByCustomerId({
        customerId: customerDetails?.customer_id || '',
        clientId,
      });
      leadsCount = leads.length;
    }

    const loanType = clientDetails?.loan_type || 'payday';
    const response = await leadsModel.createLead({
      customer_id: customerDetails?.customer_id || '',
      user_id: user ? user : userId || '',
      domain_name: clientDetails?.client_name || '',
      monthly_income: monthlyIncome,
      loan_required: loanAmountRequired,
      state,
      city,
      pincode,
      salary_mode: '',
      purpose,
      ip: req.ip || '',
      tenure: 0,
      utmSource: 'reloan',
      status: leadsCount > 0 ? lead_status.Interested : lead_status.Fresh_Lead,
      clientId,
      gclid: '',
      loan_type: loanType,
    });

    const assignedUser = await userAssignedModel.getUserAssigned({
      userId: userId || '',
      clientId,
    });

    await userAssignedModel.updateUserAssigned({
      id: assignedUser?.id || '',
      userId: userId || '',
      clientId,
    });

    res.status(200).send({
      leadId: response.lead_id,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured' });
  }
});

leadsRouter.get<
  { leadId: string },
  leadDataType | { message: string },
  Record<never, never>
>('/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const leadInfo = await leadsService.getLead({ leadId, clientId });
    return res.status(200).send(leadInfo);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({ message: 'Some error occured' });
  }
});

// * DEPREACATED
// leadsRouter.post<
//   Record<never, never>,
//   Record<never, never>,
//   createLeadsBodyType
// >('/create-lead', async (req, res) => {
//   try {
//     const {
//       name,
//       gender,
//       dob,
//       mobile,
//       email,
//       pancard,
//       aadhar_no,
//       marital_status,
//       purpose,
//       loan_required,
//       tenure,
//       monthly_income,
//       salary_mode,
//       city,
//       state,
//       pincode,
//       domain_name,
//       ip,
//     } = req.body;
//     const findCustomerByPAN = await customerModel.foundCustomer({ pancard });
//     let userId: string | null = '';
//     userId = await userAssignedModel.getNotAssignedUser({
//       role: 'Tele_Caller',
//       branch: 'Delhi',
//     });

//     if (userId === null) {
//       userId = await userAssignedModel.getNotAssignedUser({
//         role: 'Tele_Caller',
//         branch: 'Delhi',
//       });
//     }

//     if (!findCustomerByPAN) {
//       const customerID = await customerModel.createCustomer({
//         name,
//         gender,
//         dob,
//         mobile,
//         email,
//         pancard,
//         aadhar_no,
//         marital_status,
//       });
//       await leadsModel.createLead({
//         customer_id: customerID,
//         // * If no tele caller exits, can hard code to a default admin user
//         user_id: userId || '',
//         purpose,
//         loan_required,
//         tenure,
//         monthly_income,
//         salary_mode,
//         city,
//         state,
//         pincode,
//         domain_name: domain_name || '',
//         ip,
//         utmSource: 'manual',
//       });
//     } else {
//       await customerModel.updateCustomer({
//         name,
//         gender,
//         dob,
//         mobile,
//         email,
//         pancard,
//         aadhar_no,
//         marital_status,
//       });
//       await leadsModel.createLead({
//         customer_id: findCustomerByPAN.customer_id,
//         user_id: userId || '',
//         purpose,
//         loan_required,
//         tenure,
//         monthly_income,
//         salary_mode,
//         city,
//         state,
//         pincode,
//         domain_name: domain_name || '',
//         ip,
//         utmSource: 'manual',
//         clientId,
//       });
//     }
//     // TODO: chance of backend crash, handle this error
//     await userAssignedModel.updateUserAssigned({ user_id: userId || '' });

//     return res
//       .status(200)
//       .send(
//         findCustomerByPAN
//           ? { message: 'Customer Updated' }
//           : { message: 'Customer Created' },
//       );
//   } catch (error) {
//     logger.error(error);
//     return res.status(500).send({ message: 'Some error occured' });
//   }
// });
