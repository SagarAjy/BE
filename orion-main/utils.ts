import { GetObjectCommand } from '@aws-sdk/client-s3';
//import { s3Client } from './server/middleware/fileupload.middleware';
//import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { differenceInCalendarDays, parse, format } from 'date-fns';
import { collectionModel } from './server/collection/collection.model';
import { Prisma } from '@prisma/client';

// encryption of data
const secretKey = Buffer.from(process.env.AES_SECRET_KEY || '', 'hex');

type EncryptedData = {
  iv: string;
  encryptedData: string;
  authTag: string;
};

// * function to generate random otp
export const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

export const formatIndianNumber = (number: number) => {
  // Convert the number to a string for easier manipulation
  const numStr = number.toFixed(1).toString();

  // Split the number into integer and decimal parts
  const [integerPart, decimalPart] = numStr.split('.');

  // Format the integer part with commas
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Combine the formatted integer and decimal parts
  const formattedNumber = decimalPart
    ? `${formattedInteger}.${decimalPart}`
    : formattedInteger;

  return '₹' + formattedNumber + '/-';
};

export const convertToIndianWords = (number: number) => {
  const units = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
  ];

  const teens = [
    '',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];

  const tens = [
    '',
    'Ten',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const convertChunk = (num: number) => {
    let words = '';

    if (num >= 100) {
      words += units[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }

    if (num >= 11 && num <= 19) {
      words += teens[num - 10] + ' ';
    } else if (num === 10 || num >= 20) {
      words += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }

    if (num >= 1 && num <= 9) {
      words += units[num] + ' ';
    }

    return words;
  };

  if (number === 0) {
    return 'Zero';
  }

  let words = '';

  if (number >= 1e9) {
    words += convertChunk(Math.floor(number / 1e9)) + 'Billion ';
    number %= 1e9;
  }

  if (number >= 1e7) {
    words += convertChunk(Math.floor(number / 1e7)) + 'Crore ';
    number %= 1e7;
  }

  if (number >= 1e5) {
    words += convertChunk(Math.floor(number / 1e5)) + 'Lakh ';
    number %= 1e5;
  }

  if (number >= 1e3) {
    words += convertChunk(Math.floor(number / 1e3)) + 'Thousand ';
    number %= 1e3;
  }

  words += convertChunk(number);

  return words.trim();
};

// export const getSignedURLForS3 = async (documentUrl: string) => {
//   const urlParts = documentUrl.split('/');
//   const bucket = process.env.SPACES_BUCKET;
//   const key = decodeURIComponent(urlParts.slice(3).join('/'));

//   const params = {
//     Bucket: bucket,
//     Key: key,
//   };

//   const command = new GetObjectCommand(params);

//   // @ts-ignore
//   const signedUrl = await getSignedUrl(s3Client, command, {
//     expiresIn: 3600,
//   });

//   return signedUrl;
// };

export const processInBatch = async <T, R>(
  items: T[],
  processFunc: (item: T) => Promise<R>,
  BATCH_SIZE: number,
): Promise<R[]> => {
  let results: R[] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(processFunc));
    results = results.concat(batchResults);
  }
  return results;
};

export const encrypt = (text: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', secretKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: tag.toString('hex'),
  };
};

export const decrypt = (hash: EncryptedData) => {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    secretKey,
    Buffer.from(hash.iv, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(hash.authTag, 'hex'));
  let decrypted = decipher.update(hash.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const getCurrentRepayAmount = ({
  principal,
  tenure,
  roi,
  penaltyRoi,
  amtApproved,
  disbursalDate,
  repaymentDate,
  currentDate,
  collections,
}: {
  principal: number;
  tenure: number;
  roi: number;
  penaltyRoi: number;
  amtApproved: number;
  disbursalDate: Date;
  repaymentDate: Date;
  currentDate: Date;
  collections: Prisma.PromiseReturnType<typeof collectionModel.getCollections>;
}) => {
  let currentRepayAmount = 0;

  let newPrincipal = amtApproved;
  let prevInterestDate = disbursalDate; // start from the disbursal date
  let repayDate = repaymentDate;

  //total values
  let totalInterest = 0;
  let penaltyInterest = 0;
  let penaltyDays = 0;

  if (collections.length === 0) {
    // if today date less than equal to repay date then no penalty etc
    if (currentDate <= repayDate) {
      const tempTenure = differenceInCalendarDays(new Date(), prevInterestDate);
      totalInterest = principal * roi * tempTenure * 0.01;
    }
    // if today date greater than repay date then normal interest till repay date then penalty interest
    // till today date
    else if (currentDate > repayDate) {
      const tempTenure = differenceInCalendarDays(repayDate, prevInterestDate);
      totalInterest = principal * roi * tempTenure * 0.01;
      penaltyDays = differenceInCalendarDays(currentDate, repayDate);
      penaltyInterest = principal * penaltyRoi * penaltyDays * 0.01;
    }
    currentRepayAmount = principal + totalInterest + penaltyInterest;
  } else if (collections.length > 0) {
    // today date less than or equal to repay date then
    // we map all collections and calculate interest till collection date
    // then add this interest to total interest and subtract collected amount from principal + interest

    // check if first collection date is before repay date
    const firstCollection = collections[collections.length - 1];

    // format date to dd-MM-yyyy then back to collected date to fix timezone issue
    const firstCollectionDate = firstCollection.collected_date;

    // if first collection date is after repay date then everything before
    // is just total interest over the tenure
    if (firstCollectionDate > repayDate) {
      totalInterest = newPrincipal * roi * tenure * 0.01;
      prevInterestDate = repayDate;

      for (let i = collections.length - 1; i >= 0; i--) {
        const collection = collections[i];

        const collectionDate = collection.collected_date;

        //no. of days till this collection made
        let penaltyDaysTillCollection = differenceInCalendarDays(
          collectionDate,
          prevInterestDate,
        );

        //calculate penalty interest till this collection made
        let penaltyInterestTillCollection =
          newPrincipal * penaltyRoi * penaltyDaysTillCollection * 0.01;

        let amountToDistribute = collection.collected_amount;

        // First, reduce penalty interest
        if (amountToDistribute > penaltyInterestTillCollection) {
          amountToDistribute -= penaltyInterestTillCollection;
          penaltyInterestTillCollection = 0;
        } else {
          penaltyInterestTillCollection -= amountToDistribute;
          amountToDistribute = 0;
        }

        // Next, reduce regular interest
        if (amountToDistribute > totalInterest) {
          amountToDistribute -= totalInterest;
          totalInterest = 0;
        } else {
          totalInterest -= amountToDistribute;
          amountToDistribute = 0;
        }

        // Finally, reduce principal with any remaining amount
        newPrincipal -= amountToDistribute;
        penaltyDays = penaltyDays + penaltyDaysTillCollection;
        penaltyInterest = penaltyInterest + penaltyInterestTillCollection;

        prevInterestDate = collectionDate;
      }
    } else if (firstCollectionDate <= repayDate) {
      for (let i = collections.length - 1; i >= 0; i--) {
        const collection = collections[i];

        const collectionDate = collection.collected_date;

        let penaltyDaysTillCollection = 0;
        let penaltyInterestTillCollection = 0;

        // if collection date is before repay date then calculate interest
        if (collectionDate <= repayDate) {
          let daysTillCollection = differenceInCalendarDays(
            collectionDate,
            prevInterestDate,
          );

          // calculate interest till collection date
          let interestTillCollection =
            newPrincipal * roi * daysTillCollection * 0.01;

          totalInterest += interestTillCollection;
        }
        // if collection date is after repay date then we calculate penalty interest
        else if (collectionDate > repayDate) {
          // if last repayment date was before repay date then we need to find interest
          // till repay date
          if (prevInterestDate <= repayDate) {
            // no. of days till repay date
            let daysLeftTillRepay = differenceInCalendarDays(
              repayDate,
              prevInterestDate,
            );

            // calculate interest till repay date
            let interestTillRepay =
              newPrincipal * roi * daysLeftTillRepay * 0.01;

            totalInterest += interestTillRepay;
          }
          //no. of days till this collection made
          penaltyDaysTillCollection = differenceInCalendarDays(
            collectionDate,
            prevInterestDate,
          );

          //calculate penalty interest till this collection made
          penaltyInterestTillCollection =
            newPrincipal * penaltyRoi * penaltyDaysTillCollection * 0.01;

          penaltyInterest += penaltyInterestTillCollection;

          penaltyDays += penaltyDaysTillCollection;
        }

        let amountToDistribute = collection.collected_amount;

        // First, reduce penalty interest
        if (amountToDistribute > penaltyInterestTillCollection) {
          amountToDistribute -= penaltyInterestTillCollection;
          penaltyInterestTillCollection = 0;
        } else {
          penaltyInterestTillCollection -= amountToDistribute;
          amountToDistribute = 0;
        }

        // Next, reduce regular interest
        if (amountToDistribute > totalInterest) {
          amountToDistribute -= totalInterest;
          totalInterest = 0;
        } else {
          totalInterest -= amountToDistribute;
          amountToDistribute = 0;
        }

        // Finally, reduce principal with any remaining amount
        newPrincipal -= amountToDistribute;

        prevInterestDate = collection.collected_date;
      }
    }

    // finally after iterating over all collections, check with current date
    const tempTenure = differenceInCalendarDays(currentDate, prevInterestDate);
    if (currentDate > repayDate) {
      let currentPenaltyInterest =
        newPrincipal * penaltyRoi * tempTenure * 0.01;
      penaltyInterest += currentPenaltyInterest;
      currentRepayAmount =
        newPrincipal + currentPenaltyInterest + totalInterest;
    } else if (currentDate <= repayDate) {
      let currentInterest = newPrincipal * roi * tempTenure * 0.01;
      totalInterest += currentInterest;
      currentRepayAmount = newPrincipal + currentInterest + totalInterest;
    }
  }

  return {
    currentRepayAmount,
    totalInterest,
    penaltyInterest,
  };
};

export function generateTicketID(prefix: string) {
  // Get current date and time in 'YYYYMMDDHHmmss' format
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:.]/g, '').slice(0, 14);

  // Generate a random alphanumeric string of length 6
  const randomPart = generateRandomString(6);

  // Combine prefix, timestamp, and random part to form the ticket ID
  const ticketID = `${prefix}-${timestamp}-${randomPart}`;

  return ticketID;
}

// Function to generate a random alphanumeric string of a given length
export function generateRandomString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}
