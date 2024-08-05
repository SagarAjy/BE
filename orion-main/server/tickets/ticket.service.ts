import { customerModel } from '../customer/customer.model';
import { userModel } from '../user/user.model';
import { ticketModel } from './ticket.model';

const getTicketForCustomer = async ({
  customerId,
  clientId,
}: {
  customerId: string;
  clientId: string;
}) => {
  const customerTickets = await ticketModel.getTicketForCustomer({
    customerId,
    clientId,
  });

  const customerTicketData = customerTickets.map(ticket => {
    return {
      id: ticket.ticket_id,
      ticketNumber: ticket.ticket_number,
      query: ticket.ticket_query,
      category: ticket.ticket_category,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    };
  });

  return customerTicketData;
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
  const customerTickets = await ticketModel.getAllTickets({
    limit,
    offset,
    startDate,
    endDate,
    clientId,
  });

  const customerTicketsCount = await ticketModel.getAllTicketsCount({
    startDate,
    endDate,
    clientId,
  });

  const customerTicketData = customerTickets.map(async ticket => {
    const customerDetails = await customerModel.getCustomerById({
      customer_id: ticket.created_by,
      clientId,
    });

    const createdBy = customerDetails?.name || '';

    let assignedTo = 'None';

    if (ticket.assigned_to) {
      const userDetails = await userModel.getUser({
        userId: ticket.assigned_to,
        clientId,
      });

      assignedTo = userDetails?.name || '';
    }

    return {
      id: ticket.ticket_id,
      ticketNumber: ticket.ticket_number,
      query: ticket.ticket_query,
      category: ticket.ticket_category,
      createdBy,
      assignedTo,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    };
  });

  return {
    tickets: await Promise.all(customerTicketData),
    ticketCount: customerTicketsCount,
  };
};

const getTicket = async ({
  ticketId,
  clientId,
}: {
  ticketId: string;
  clientId: string;
}) => {
  const ticketInfo = await ticketModel.getTicket({ ticketId, clientId });

  const customerDetails = await customerModel.getCustomerById({
    customer_id: ticketInfo?.created_by || '',
    clientId,
  });

  const createdBy = customerDetails?.name || '';

  let assignedTo = 'None';

  if (ticketInfo?.assigned_to) {
    const userDetails = await userModel.getUser({
      userId: ticketInfo.assigned_to,
      clientId,
    });

    assignedTo = userDetails?.name || '';
  }

  return {
    id: ticketInfo?.ticket_id || '',
    ticketNumber: ticketInfo?.ticket_number || '',
    query: ticketInfo?.ticket_query || '',
    category: ticketInfo?.ticket_category || 'Account',
    createdBy,
    assignedTo,
    status: ticketInfo?.status || '',
    priority: ticketInfo?.priority || '',
    createdAt: ticketInfo?.created_at || new Date(),
    updatedAt: ticketInfo?.updated_at || new Date(),
  };
};

const getTicketChat = async ({
  ticketId,
  clientId,
}: {
  ticketId: string;
  clientId: string;
}) => {
  const ticketChats = await ticketModel.getTicketChat({ ticketId, clientId });

  const ticketChatsData = ticketChats.map(async chat => {
    const chatUser = chat.comment_by_user_type;

    let commentByUser = null;

    if (chatUser === 'customer') {
      commentByUser = await customerModel.getCustomerById({
        customer_id: chat.comment_by,
        clientId,
      });
    } else {
      commentByUser = await userModel.getUser({
        userId: chat.comment_by,
        clientId,
      });
    }

    return {
      id: chat.comment_id,
      message: chat.comment,
      createdBy: commentByUser?.name || '',
      createdAt: chat.created_at,
    };
  });

  return await Promise.all(ticketChatsData);
};

export const ticketService = {
  getTicketForCustomer,
  getAllTickets,
  getTicket,
  getTicketChat,
};
