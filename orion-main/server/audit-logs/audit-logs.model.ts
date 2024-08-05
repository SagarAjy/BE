import { event_type } from '@prisma/client';
import { prisma } from '../../prisma-client';
import { v4 as uuid } from 'uuid';

const createLog = async ({
  activity,
  userId,
  eventType,
  clientId,
}: {
  activity: string;
  userId: string;
  eventType: event_type;
  clientId: string;
}) => {
  if (process.env.ENVIRONMENT !== 'local') {
    const response = await prisma.audit_logs.create({
      data: {
        log_id: uuid(),
        activity,
        user_id: userId,
        event_type: eventType,
        client_id: clientId,
        created_at: new Date(),
      },
    });

    return response;
  }
  return;
};

const getLogs = async ({
  limit,
  offset,
  clientId,
}: {
  limit: number;
  offset: number;
  clientId: string;
}) => {
  const response = await prisma.audit_logs.findMany({
    take: limit,
    skip: offset,
    where: {
      client_id: clientId,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return response;
};

const getLogsCount = async ({ clientId }: { clientId: string }) => {
  const response = await prisma.audit_logs.count({
    where: {
      client_id: clientId,
    },
  });

  return response;
};

export const auditLogModel = { createLog, getLogs, getLogsCount };
