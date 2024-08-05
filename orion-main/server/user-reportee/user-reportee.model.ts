import { prisma } from '../../prisma-client';

const createReportee = async ({
  reporteeId,
  userId,
  clientId,
}: {
  reporteeId: string;
  userId: string;
  clientId: string;
}) => {
  const response = await prisma.userreportees.create({
    data: {
      user_reportee_id: reporteeId,
      user_id: userId,
      client_id: clientId,
    },
  });

  return response;
};

const deleteReportee = async ({
  id,
  reporteeId,
  clientId,
}: {
  id: string;
  reporteeId: string;
  clientId: string;
}) => {
  await prisma.userreportees.delete({
    where: {
      id,
      user_reportee_id: reporteeId,
      client_id: clientId,
    },
  });
};

const getUserReportees = async ({
  userId,
  clientId,
}: {
  userId: string;
  clientId: string;
}) => {
  const reporteeIds = await prisma.userreportees.findMany({
    where: {
      user_id: userId,
      client_id: clientId,
    },
  });
  return reporteeIds;
};

const getUserReportingByReporteeId = async ({
  userId,
  clientId,
}: {
  userId: string;
  clientId: string;
}) => {
  const reportingId = await prisma.userreportees.findFirst({
    where: {
      user_reportee_id: userId,
      client_id: clientId,
    },
  });

  return reportingId;
};

const updateReportingByReporteeId = async ({
  id,
  reporteeId,
  reportingId,
  clientId,
}: {
  id: string;
  reporteeId: string;
  reportingId: string;
  clientId: string;
}) => {
  const response = await prisma.userreportees.update({
    where: {
      id,
      user_reportee_id: reporteeId,
      client_id: clientId,
    },
    data: {
      user_id: reportingId,
    },
  });

  return response;
};

export const userReporteeModel = {
  createReportee,
  deleteReportee,
  getUserReportees,
  getUserReportingByReporteeId,
  updateReportingByReporteeId,
};
