import { prisma } from '../../prisma-client';

const getUserIdByEmail = async ({ email }: { email: string }) => {
  const userDetails = await prisma.users.findFirst({
    where: {
      email,
      status: 'Active',
    },
    select: {
      user_id: true,
      name: true,
      otp: true,
      otp_timestamp: true,
      status: true,
      role: true,
    },
  });
  return userDetails;
};

const updateUserOTP = async ({
  user_id,
  email_otp,
}: {
  user_id: string;
  email_otp: number;
}) => {
  await prisma.users.update({
    where: {
      user_id,
    },
    data: {
      otp: email_otp,
      otp_timestamp: new Date().getTime().toString(),
    },
  });
};

export const authModel = { getUserIdByEmail, updateUserOTP };
