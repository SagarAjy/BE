import { userModel } from '../user/user.model';
import { auditLogModel } from './audit-logs.model';

const getAllLogs = async ({
  limit,
  offset,
  clientId,
}: {
  limit: number;
  offset: number;
  clientId: string;
}) => {
  const allLogs = await auditLogModel.getLogs({
    limit,
    offset,
    clientId,
  });

  const allLogsCount = await auditLogModel.getLogsCount({
    clientId,
  });

  const logData = allLogs.map(async log => {
    const userDetails = await userModel.getUser({
      userId: log.user_id,
      clientId,
    });

    return {
      id: log.log_id || '',
      activity: log.activity || '',
      userName: userDetails?.name || '',
      userRole: userDetails?.role || '',
      eventType: log.event_type || 'Audit_Access',
      createdAt: log.created_at || new Date(),
    };
  });

  return {
    auditLogs: await Promise.all(logData),
    auditLogsCount: allLogsCount,
  };
};

export const auditLogService = { getAllLogs };
