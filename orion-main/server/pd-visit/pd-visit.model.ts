import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';

const addpdVisit = async ({
  pdId,
  visitDate,
  pdTime,
  leadId,
  clientId,
}: {
  pdId: string;
  visitDate: Date;
  pdTime: string;
  leadId: string;
  clientId: string;
}) => {
  const response = await prisma.pd_visit.create({
    data: {
      visit_id: uuid(),
      pd_id: pdId,
      lead_id: leadId,
      visit_date: visitDate,
      visit_time: pdTime,
      client_id: clientId,
    },
  });
  return response;
};

const getpdVisit = async ({
  leadId,
  clientId,
}: {
  leadId: string;
  clientId: string;
}) => {
  const response = await prisma.pd_visit.findFirst({
    where: {
      lead_id: leadId,
      client_id: clientId,
    },
  });
  return response;
};

const updatePdVisit = async ({
  pdId,
  visitDate,
  pdTime,
  leadId,
  visitId,
  clientId,
}: {
  pdId: string;
  visitDate: Date;
  pdTime: string;
  leadId: string;
  visitId: string;
  clientId: string;
}) => {
  const response = await prisma.pd_visit.update({
    where: {
      lead_id: leadId,
      visit_id: visitId,
      client_id: clientId,
    },
    data: {
      pd_id: pdId,
      visit_date: visitDate,
      visit_time: pdTime,
    },
  });
  return response;
};

export const pdVisitModel = { addpdVisit, getpdVisit, updatePdVisit };
