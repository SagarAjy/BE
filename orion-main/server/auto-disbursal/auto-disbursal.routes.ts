import { parse, differenceInCalendarDays } from 'date-fns';
import express, { Router } from 'express';
import { logger } from '../../logger';
import { approvalModel } from '../approval/approval.model';
import { disbursalModel } from '../disbursal/disbursal.model';
import { fetchUser } from '../middleware/auth.middleware';
import { userModel } from '../user/user.model';
import crypto from 'crypto';
import axios from 'axios';
import { customerModel } from '../customer/customer.model';
import { autoDisbursalModel } from './auto-disbursal.model';
import { auditLogModel } from '../audit-logs/audit-logs.model';
//import { decrypt, getSignedURLForS3 } from '../../utils';
import { decrypt } from '../../utils';
import { clientModel } from '../clients/clients.model';
import { loanModel } from '../loan/loan.model';

export const autoDisbursalRouter: Router = express.Router();

type disbursalDataType = {
  companyAccountNo: string;
  accountNo: string;
  accountType: string;
  bankName: string;
  ifscCode: string;
  bankBranch: string;
  disbursalDate: string;
  pdDoneBy: string;
  pdDoneDate: string;
  finalRemark: string;
  paymentProvider: string;
  paymentMode: string;
};

type autoDisbursalDataType = {
  status: string;
  utr: string;
};

//add auto disbursal
autoDisbursalRouter.post<
  { leadId: string },
  { message: string },
  disbursalDataType
>('/add/:leadId', fetchUser, async (req, res) => {
  try {
    const { leadId } = req.params;
    //@ts-ignore
    const clientId = req.clientId;
    const checkDisbursalAlreadyExist = await disbursalModel.getDisbursal({
      leadId,
      clientId,
    });
    if (checkDisbursalAlreadyExist !== null) {
      res
        .status(301)
        .send({ message: 'Loan already disbursed for this lead!' });
    } else {
      //@ts-ignore
      const userId = req.user.user;
      const userDetails = await userModel.getUser({ userId, clientId });
      const approvalData = await approvalModel.getApproval({
        leadId,
        clientId,
      });
      const approvedAmount = approvalData?.loan_amt_approved || 0;
      const pf = approvalData?.processing_fee || 0;
      const gst = pf * 0.01 * (approvalData?.gst || 0);

      const disbursalAmount = approvedAmount - (pf + gst);

      const pdDoneBy = req.body.pdDoneBy === 'null' ? null : req.body.pdDoneBy;

      const customerDetails = await customerModel.getCustomerById({
        clientId,
        customer_id: approvalData?.customer_id || '',
      });

      //*Note: only credit manager, loan officer and admin can create disbursal
      if (
        userDetails?.role === 'Credit_Manager' ||
        userDetails?.role === 'Admin' ||
        userDetails?.role === 'Loan_Officer'
      ) {
        if (req.body.paymentProvider === 'CASHFREE') {
          const clientInfo = await clientModel.getClient({ clientId });

          const cashFreeClientId = clientInfo?.cashfree_client_id || '';
          const cashFreeSecretEncrypted = clientInfo?.cashfree_secret_key;
          const publicKeyUrl = clientInfo?.cashfree_public_key_url || '';

          //@ts-ignore
          const cashFreeSecret = decrypt(cashFreeSecretEncrypted);

          //const getPublicKeySignedUrl = await getSignedURLForS3(publicKeyUrl);
          const getPublicKeySignedUrl = 'HELLOWORLD'
          const publicKeyApiReponse = await axios.get(getPublicKeySignedUrl);

          const publicKey = publicKeyApiReponse.data;

          // get UNIX timestamp
          const timestamp = Math.floor(Date.now() / 1000);

          // encrypt using RSA
          const signatureStart = `${cashFreeClientId}.${timestamp}`;
          const encryptedData = crypto.publicEncrypt(
            publicKey,
            Buffer.from(signatureStart),
          );

          // The encrypted data is in the form of a Buffer, convert it to a base64 string
          const signature = encryptedData.toString('base64');

          const cashFreeToken = await axios.post(
            process.env.CASHFREE_BASE_URL + 'payout/v1/authorize',
            {},
            {
              headers: {
                accept: 'application/json',
                'x-client-id': cashFreeClientId,
                'x-client-secret': cashFreeSecret,
                'x-cf-signature': signature,
              },
            },
          );

          if (cashFreeToken.data.status === 'SUCCESS') {
            try {
              const payment = await axios.post(
                `${process.env.CASHFREE_BASE_URL}payout/v1.2/directTransfer`,
                {
                  amount: Math.round(disbursalAmount * 100) / 100,
                  transferId: `txn_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2, 15)}`,
                  transferMode: req.body.paymentMode,
                  remarks: req.body.finalRemark,
                  beneDetails: {
                    bankAccount: req.body.accountNo,
                    ifsc: req.body.ifscCode,
                    name: customerDetails?.name,
                    email: customerDetails?.email,
                    phone: customerDetails?.mobile,
                    address1: 'any_dummy_value',
                  },
                  // get this via frontend and change if payment to be done via icic instead of wallet
                  paymentInstrumentId: req.body.companyAccountNo,
                },
                {
                  headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    Authorization: `Bearer ${cashFreeToken.data.data.token}`,
                  },
                },
              );

              const approval = await approvalModel.getApproval({
                leadId,
                clientId,
              });

              // add disbursal
              await disbursalModel.addDisbursal({
                userId,
                leadId,
                disbursalAmount,
                customerId: approvalData?.customer_id || '',
                processingFee: approvalData?.processing_fee || 0,
                ...req.body,
                disbursalDate: parse(
                  req.body.disbursalDate,
                  'dd-MM-yyyy',
                  new Date(),
                ),
                pdDoneBy,
                loanType: approval?.loan_type || 'payday',
                loanNo: approval?.loan_no || '',
                chequeNo: '0',
                clientId,
              });
              const approvalRepayDate = approvalData?.repay_date || new Date();
              //calculating tenure of loan
              const loanTenure = differenceInCalendarDays(
                approvalRepayDate,
                parse(req.body.disbursalDate, 'dd-MM-yyyy', new Date()),
              );
              await approvalModel.updateTenure({
                leadId,
                tenure: loanTenure,
                clientId,
              });

              // store payment info in table
              await autoDisbursalModel.addAutoDisbursal({
                paymentId: payment.data.data.referenceId,
                accountNo: req.body.accountNo,
                ifscCode: req.body.ifscCode,
                transferMode: req.body.paymentMode,
                paymentPortal: req.body.paymentProvider,
                disbursalAmount,
                leadId,
                clientId,
              });

              await auditLogModel.createLog({
                activity: `Inititated disbursal for ${leadId}`,
                userId,
                eventType: 'Add',
                clientId,
              });

              res.status(200).send({ message: 'Disbursal added!' });
            } catch (error) {
              logger.error(error);
            }
          } else {
            res
              .status(401)
              .send({ message: 'Cashfree failed to verify token!' });
          }
        } else {
          res.status(401).send({ message: 'Not authorized to add disbursal!' });
        }
      }
    }
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

autoDisbursalRouter.get<
  { leadId: string },
  autoDisbursalDataType | { message: string }
>('/get-transfer-info/:leadId', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;

    const { leadId } = req.params;

    const autoDisbursalDetails = await autoDisbursalModel.getAutoDisbursal({
      leadId,
      clientId,
    });

    res.status(200).send({
      status: autoDisbursalDetails.at(0)?.status || '',
      utr: autoDisbursalDetails.at(0)?.utr_no || '',
    });
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});

autoDisbursalRouter.put<
  { leadId: string },
  autoDisbursalDataType | { message: string }
>('/update-transfer-info/:leadId', fetchUser, async (req, res) => {
  try {
    //@ts-ignore
    const clientId = req.clientId;
    //@ts-ignore
    const userId = req.user.user;

    const { leadId } = req.params;

    const clientInfo = await clientModel.getClient({ clientId });

    const loanDetails = await loanModel.getLoanByLeadId({ leadId, clientId });

    const cashFreeClientId = clientInfo?.cashfree_client_id || '';
    const cashFreeSecretEncrypted = clientInfo?.cashfree_secret_key;
    const publicKeyUrl = clientInfo?.cashfree_public_key_url || '';

    //@ts-ignore
    const cashFreeSecret = decrypt(cashFreeSecretEncrypted);

    // get public key for cashfree
    //const getPublicKeySignedUrl = await getSignedURLForS3(publicKeyUrl);
    const getPublicKeySignedUrl = "HELLOWORLD";
    const publicKeyApiReponse = await axios.get(getPublicKeySignedUrl);

    const publicKey = publicKeyApiReponse.data;

    // get UNIX timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // encrypt using RSA
    const signatureStart = `${cashFreeClientId}.${timestamp}`;
    const encryptedData = crypto.publicEncrypt(
      publicKey,
      Buffer.from(signatureStart),
    );

    // The encrypted data is in the form of a Buffer, convert it to a base64 string
    const signature = encryptedData.toString('base64');

    const autoDisbursalDetails = await autoDisbursalModel.getAutoDisbursal({
      leadId,
      clientId,
    });

    const cashFreeToken = await axios.post(
      process.env.CASHFREE_BASE_URL + 'payout/v1/authorize',
      {},
      {
        headers: {
          accept: 'application/json',
          'x-client-id': cashFreeClientId,
          'x-client-secret': cashFreeSecret,
          'x-cf-signature': signature,
        },
      },
    );

    if (cashFreeToken.data.status === 'SUCCESS') {
      if (autoDisbursalDetails.length !== 0) {
        const referenceId = autoDisbursalDetails.at(0)?.payment_id;
        const paymentStatus = await axios.get(
          `${process.env.CASHFREE_BASE_URL}payout/v1.2/getTransferStatus?referenceId=${referenceId}`,
          {
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              Authorization: `Bearer ${cashFreeToken.data.data.token}`,
            },
          },
        );

        const updatedAutoDisbursalData =
          await autoDisbursalModel.updateAutoDisbursalModel({
            disbursalId: autoDisbursalDetails.at(0)?.id || '',
            clientId,
            status: paymentStatus.data.data.transfer.status || '',
            utrNo: paymentStatus.data.data.transfer.utr || '',
          });

        if (paymentStatus.data.data.transfer.status === 'SUCCESS') {
          await disbursalModel.updateDisbursalUTR({
            loanId: loanDetails?.loan_id || '',
            disbursalReferenceNo: paymentStatus.data.data.transfer.utr || '',
            userId,
            clientId,
          });

          await auditLogModel.createLog({
            activity: `Updated UTR No. for disbursal for loan id: ${
              loanDetails?.loan_id || ''
            }`,
            userId,
            eventType: 'Update',
            clientId,
          });
        }

        res.status(200).send({
          status: updatedAutoDisbursalData?.status || '',
          utr: updatedAutoDisbursalData?.utr_no || '',
        });
      } else {
        res.status(200).send({ message: 'Not disbursed yet!' });
      }
    } else {
      res.status(401).send({ message: 'Cashfree failed to verify token!' });
    }
  } catch (error) {
    logger.error(error);
    res.status(500).send({ message: 'Some error occured!' });
  }
});
