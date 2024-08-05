import express, { Router } from 'express';
import { fetchUser } from '../middleware/auth.middleware';
import { auditLogService } from './audit-logs.service';
import { logger } from '../../logger';

export const auditLogRouter: Router = express.Router();

type auditLogs = {
  id: string;
  activity: string;
  userName: string;
  userRole: string;
  eventType: string;
  createdAt: Date;
};

auditLogRouter.get<
  Record<never, never>,
  { auditLogs: auditLogs[]; auditLogsCount: number } | { message: string },
  Record<never, never>,
  {
    limit: string;
    offset: string;
  }
>('/get-logs', fetchUser, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;

    //@ts-ignore
    const clientId = req.clientId;

    const auditLogs = await auditLogService.getAllLogs({
      limit,
      offset,
      clientId,
    });

    res.status(200).send(auditLogs);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Something went wrong!' });
  }
});
