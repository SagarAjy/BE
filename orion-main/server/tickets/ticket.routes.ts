import express, { Router } from 'express';
import { fetchUser } from '../middleware/auth.middleware';
import { ticketService } from './ticket.service';
import { ticket_type } from '@prisma/client';
import { logger } from '../../logger';
import { ticketModel } from './ticket.model';
import { emptyUUID } from '../../constants';
import { parse } from 'date-fns';

export const customerSupportRouter: Router = express.Router();

type TicketType = {
  id: string;
  ticketNumber: string;
  query: string;
  category: ticket_type;
  createdBy: string;
  assignedTo: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
};

type TicketChatType = {
  id: string;
  message: string;
  createdBy: string;
  createdAt: Date;
};

customerSupportRouter.get<
  Record<never, never>,
  { tickets: TicketType[]; ticketCount: number } | { message: string },
  Record<never, never>,
  {
    limit: string;
    offset: string;
    filterBy: string;
    startDate?: string;
    endDate?: string;
  }
>('/get-all-tickets', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;

    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const filterBy = req.query.filterBy;
    const startDate = decodeURIComponent(req.query.startDate || '');
    const endDate = decodeURIComponent(req.query.endDate || '');

    let tickets;
    if (startDate.length !== 0 && endDate.length !== 0) {
      tickets = await ticketService.getAllTickets({
        limit,
        offset,
        startDate: parse(startDate, 'dd-MM-yyyy', new Date()),
        endDate: parse(endDate, 'dd-MM-yyyy', new Date()),
        clientId,
      });
    } else {
      tickets = await ticketService.getAllTickets({
        limit,
        offset,
        clientId,
      });
    }

    res.status(200).send(tickets);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});

customerSupportRouter.get<
  { ticketId: string },
  { message: string } | TicketType
>('/get-ticket/:ticketId', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;

    const ticketId = req.params.ticketId;

    const ticketInfo = await ticketService.getTicket({
      ticketId,
      clientId,
    });

    res.status(200).send(ticketInfo);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});

customerSupportRouter.get<
  { ticketId: string },
  { message: string } | TicketChatType[]
>('/get-ticket-chat/:ticketId', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;

    const ticketId = req.params.ticketId;

    const ticketChat = await ticketService.getTicketChat({
      ticketId,
      clientId,
    });

    res.status(200).send(ticketChat);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});

customerSupportRouter.post<{ ticketId: string }, { message: string }>(
  '/create-chat/:ticketId',
  fetchUser,
  async (req, res) => {
    try {
      //@ts-ignore
      const clientId = req.clientId;
      //@ts-ignore
      const userId = req.user.user;

      const ticketId = req.params.ticketId;
      const { message } = req.body;

      await ticketModel.createTicketChat({
        ticketId,
        createdBy: userId,
        clientId,
        message,
      });

      res.status(200).send({ message: 'Chat created!' });
    } catch (error) {
      logger.error(error);
      res.status(500).send({ message: 'Something went wrong!' });
    }
  },
);

customerSupportRouter.put<{ ticketId: string }, { message: string }>(
  '/update-ticket/:ticketId',
  fetchUser,
  async (req, res) => {
    try {
      //@ts-ignore
      const clientId = req.clientId;

      const ticketId = req.params.ticketId;
      const { status, priority, assignedTo } = req.body;

      let assignedToId;
      if (assignedTo === 'null') {
        assignedToId = emptyUUID;
      } else {
        assignedToId = assignedTo;
      }

      await ticketModel.updateTicket({
        ticketId,
        clientId,
        status,
        priority,
        assignedTo: assignedToId,
      });

      res.status(200).send({ message: 'Ticket updated!' });
    } catch (error) {
      logger.error(error);
      res.status(500).send({ message: 'Something went wrong!' });
    }
  },
);
