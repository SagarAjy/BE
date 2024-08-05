import { priority_status, ticket_status, ticket_type } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';
import { generateTicketID } from '../../utils';

const createTicket = async ({
  query,
  category,
  createdBy,
  clientId,
}: {
  query: string;
  category: ticket_type;
  createdBy: string;
  clientId: string;
}) => {
  const response = await prisma.tickets.create({
    data: {
      ticket_id: uuid(),
      ticket_number: generateTicketID(''),
      ticket_query: query,
      ticket_category: category,
      status: 'Open',
      created_by: createdBy,
      priority: 'Low',
      created_at: new Date(),
      updated_at: new Date(),
      client_id: clientId,
    },
  });

  return response;
};

const getTicketForCustomer = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const response = await prisma.tickets.findMany({
    where: {
      created_by: customerId,
      client_id: clientId,
    },
    orderBy: {
      updated_at: 'desc',
    },
  });

  return response;
};

const getAllTickets = async ({
  limit,
  offset,
  startDate,
  endDate,
  clientId,
}: {
  limit: number;
  offset: number;
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.tickets.findMany({
    take: limit,
    skip: offset,
    where: {
      client_id: clientId,
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      updated_at: 'desc',
    },
  });

  return response;
};

const getAllTicketsCount = async ({
  startDate,
  endDate,
  clientId,
}: {
  startDate?: Date;
  endDate?: Date;
  clientId: string;
}) => {
  const response = await prisma.tickets.count({
    where: {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
      client_id: clientId,
    },
  });

  return response;
};

const getTicket = async ({
  ticketId,
  clientId,
}: {
  ticketId: string;
  clientId: string;
}) => {
  const response = await prisma.tickets.findFirst({
    where: {
      ticket_id: ticketId,
      client_id: clientId,
    },
  });

  return response;
};

const getTicketChat = async ({
  ticketId,
  clientId,
}: {
  ticketId: string;
  clientId: string;
}) => {
  const response = await prisma.ticket_comment.findMany({
    where: {
      ticket_id: ticketId,
      client_id: clientId,
    },
    orderBy: {
      created_at: 'asc',
    },
  });

  return response;
};

const createTicketChat = async ({
  ticketId,
  message,
  createdBy,
  clientId,
}: {
  ticketId: string;
  message: string;
  createdBy: string;
  clientId: string;
}) => {
  const response = await prisma.ticket_comment.create({
    data: {
      ticket_id: ticketId,
      comment_id: uuid(),
      comment: message,
      comment_by: createdBy,
      comment_by_user_type: 'user',
      created_at: new Date(),
      client_id: clientId,
    },
  });

  return response;
};

const updateTicket = async ({
  ticketId,
  clientId,
  status,
  priority,
  assignedTo,
}: {
  ticketId: string;
  clientId: string;
  status: ticket_status;
  priority: priority_status;
  assignedTo: string;
}) => {
  const response = await prisma.tickets.update({
    where: {
      ticket_id: ticketId,
      client_id: clientId,
    },
    data: {
      status,
      priority,
      assigned_to: assignedTo,
      updated_at: new Date(),
    },
  });

  return response;
};

export const ticketModel = {
  createTicket,
  getTicketForCustomer,
  getAllTickets,
  getAllTicketsCount,
  getTicket,
  getTicketChat,
  createTicketChat,
  updateTicket,
};
