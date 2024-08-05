import { roles, user_status } from '@prisma/client';
import { userModel } from './user.model';
import { userReporteeModel } from '../user-reportee/user-reportee.model';
import { userAdminModel } from './user.admin.model';

const getUsers = async ({
  limit,
  offset,
  searchparam,
  clientId,
}: {
  limit: number;
  offset: number;
  searchparam?: string;
  clientId: string;
}) => {
  const allUsers = await userModel.getAllUsers({
    limit,
    offset,
    searchparam,
    clientId,
  });
  const allUsersCount = await userModel.getAllUsersCount({
    searchparam,
    clientId,
  });

  const users = allUsers.map(async user => {
    const createdByUserName = await userModel.getUser({
      userId: user.created_by,
      clientId,
    });

    const userReporting = await userReporteeModel.getUserReportingByReporteeId({
      userId: user.user_id,
      clientId,
    });

    let userReportingName;
    if (userReporting) {
      userReportingName = await userModel.getUser({
        userId: userReporting.user_id || '',
        clientId,
      });
    }

    return {
      id: user.user_id || '',
      fullName: user.name || '',
      email: user.email || '',
      phoneNo: user.mobile || '',
      branch: user.branch || '',
      role: user.role,
      status: user.status,
      otp: user.otp || 1234,
      otpExpiry: user.otp_timestamp || '',
      reporting:
        user.role === 'Collection_Manager'
          ? 'None'
          : userReportingName?.name || 'None',
      collectionUser:
        user.role === 'Collection_Manager'
          ? userReportingName?.name || 'None'
          : 'None',
      allowedMacAddress: user.allowed_mac || '',
      createdBy: createdByUserName?.name || '',
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  });

  return {
    users: await Promise.all(users),
    userCount: allUsersCount,
  };
};

const getUsersByRole = async ({
  userRole,
  branch,
  userId,
  clientId,
}: {
  userRole: roles;
  branch: string;
  userId: string;
  clientId: string;
}) => {
  let usersByRole;
  const currentUserDetails = await userModel.getUser({ userId, clientId });
  if (
    currentUserDetails?.role !== 'Admin' &&
    userRole !== 'PD_Team' &&
    currentUserDetails?.role !== 'Collection_Manager'
  ) {
    usersByRole = await userModel.getUsersByRole({
      userRole,
      branch,
      userId,
      clientId,
    });
  } else {
    usersByRole = await userAdminModel.getUsersByRole({
      userRole,
      branch,
      clientId,
    });
  }

  const users = usersByRole.map(user => {
    return {
      key: user.user_id,
      value: user.user_id,
      label: !branch ? user.name + ` (${user.branch})` : user.name,
    };
  });

  return users;
};

const getReassignUsersByRole = async ({
  userRole,
  branch,
  clientId,
}: {
  userRole: roles;
  branch: string;
  clientId: string;
}) => {
  let usersByRole;

  usersByRole = await userAdminModel.getUsersByRole({
    userRole,
    branch,
    clientId,
  });

  const users = usersByRole.map(user => {
    return {
      key: user.user_id,
      value: user.user_id,
      label: !branch ? user.name + ` (${user.branch})` : user.name,
    };
  });

  return users;
};

export const userService = { getUsers, getUsersByRole, getReassignUsersByRole };
