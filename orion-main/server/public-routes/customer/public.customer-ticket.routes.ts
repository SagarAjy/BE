import express, { Router } from 'express';
import { fetchCustomer } from '../../middleware/customer.auth.middleware';
import { customerModel } from '../../customer/customer.model';
import { ticketModel } from '../../tickets/ticket.model';
import { logger } from '../../../logger';
import { ticketService } from '../../tickets/ticket.service';
import { ticket_type } from '@prisma/client';
import { novuNotification } from '../../novu/novu.model';

type CustomerTicketType = {
  id: string;
  ticketNumber: string;
  query: string;
  category: ticket_type;
  createdAt: Date;
  updatedAt: Date;
};

export const customerSupportRouter: Router = express.Router();

customerSupportRouter.post<
  Record<never, never>,
  { message: string },
  { query: string; category: ticket_type }
>('/create-ticket', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;
    //@ts-ignore
    const clientId = req.clientId;

    const cutomerDetails = await customerModel.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });

    const { query, category } = req.body;

    const response = await ticketModel.createTicket({
      query,
      category,
      createdBy: cutomerDetails?.customer_id || '',
      clientId,
    });

    await novuNotification.sendSupportRequestRaisedToCustomer({
      id: cutomerDetails?.customer_id || '',
      customerName: cutomerDetails?.name || '',
      email: cutomerDetails?.email || '',
      query: response?.ticket_query || '',
      ticketNo: response?.ticket_number || '',
      clientId,
    });

    res.status(200).send({ message: 'Ticket created successfully!' });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});

customerSupportRouter.get<
  Record<never, never>,
  CustomerTicketType[] | { message: string }
>('/get-my-tickets', fetchCustomer, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    //@ts-ignore
    const phoneNo = req.phoneNo.phoneNo;

    const customerDetails = await customerModel.getCustomerByPhoneNo({
      phoneNo,
      clientId,
    });

    const tickets = await ticketService.getTicketForCustomer({
      customerId: customerDetails?.customer_id || '',
      clientId,
    });

    res.status(200).send(tickets);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});
