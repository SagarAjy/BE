import { describe, expect, test } from '@jest/globals';
import axios from 'axios';

const url = 'http://127.0.0.1:8001/crm-api';
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZDA1NjVjNGEtNjIyZS00ZjRkLTg0NDktZTMwYWM0ZGJmMWZkIiwiaWF0IjoxNjk4ODEzODAyfQ.894De6zJAFqdXt8TXPCpR95xjj8ZR-RGukhWn3YQll0';

describe('test loan api', () => {
  test('get loan/get/:leadId', async () => {
    try {
      const loansSchema = {
        branch: expect.anything(),
        loanNo: expect.anything(),
        loanDisbursed: expect.anything(),
        roi: expect.anything(),
        noOfDays: expect.anything(),
        realDays: expect.anything(),
        penaltyDays: expect.anything(),
        realInterest: expect.anything(),
        penaltyInterest: expect.anything(),
        bouncingCharges: expect.anything(),
        paidAmount: expect.anything(),
        repaymentAmount: expect.anything(),
        approvalAmount: expect.anything(),
        amountLeft: expect.anything(),
      };

      const res = await axios.get(
        `${url}/loan/get/d18fc4d5-f339-4157-b016-6f26f5d5d498`,
        {
          headers: { 'auth-token': token },
        },
      );
      expect(res.status).toBe(200);
      expect(res.data).toEqual(loansSchema);
    } catch (error) {
      console.log('Error: ', error);
    }
  });

  test('get loan/get-bank-update', async () => {
    try {
      const loansSchema = {
        id: expect.anything(),
        leadId: expect.anything(),
        name: expect.anything(),
        bankName: expect.anything(),
        ifscCode: expect.anything(),
        accountNumber: expect.anything(),
        approvalAmount: expect.anything(),
        disbursalAmount: expect.anything(),
        approvalDate: expect.anything(),
        disbursalDate: expect.anything(),
      };

      const res = await axios.get(`${url}/loan/get-bank-update`, {
        headers: { 'auth-token': token },
      });
      expect(res.status).toBe(200);
      expect(res.data).toEqual(
        expect.objectContaining({
          bankUpdateData: expect.arrayContaining([loansSchema]),
          bankUpdateCount: expect.anything(),
        }),
      );
    } catch (error) {
      console.log('Error: ', error);
    }
  });

  test('get loan/get-pending-loans', async () => {
    try {
      const loansSchema = {
        id: expect.anything(),
        loanNo: expect.anything(),
        branch: expect.anything(),
        loanType: expect.anything(),
        customerStatus: expect.anything(),
        name: expect.anything(),
        email: expect.anything(),
        phoneNo: expect.anything(),
        loanAmount: expect.anything(),
        tenure: expect.anything(),
        roi: expect.anything(),
        repaymentAmount: expect.anything(),
        repayDate: expect.anything(),
        penalty: expect.anything(),
        creditedBy: expect.anything(),
        pdDoneBy: expect.anything(),
        createdAt: expect.anything(),
        collections: expect.anything(),
      };

      const res = await axios.get(
        `${url}/loan/get-pending-loans?limit=10&offset=0&loanFilter=payday`,
        {
          headers: { 'auth-token': token },
        },
      );
      expect(res.status).toBe(200);
      expect(res.data).toEqual(
        expect.objectContaining({
          loans: expect.arrayContaining([loansSchema]),
          loansCount: expect.anything(),
        }),
      );
    } catch (error) {
      console.log('Error: ', error);
    }
  });

  test('get loan/loan-history', async () => {
    try {
      const loansSchema = {
        loanNo: expect.anything(),
        loanAmount: expect.anything(),
        roi: expect.anything(),
        days: expect.anything(),
        repayDate: expect.anything(),
        credit: expect.anything(),
        status: expect.anything(),
        collectionRemark: expect.anything(),
      };
      const res = await axios.get(
        `${url}/loan/loan-history/d18fc4d5-f339-4157-b016-6f26f5d5d498`,
        {
          headers: { 'auth-token': token },
        },
      );
      expect(res.status).toBe(200);
      expect(res.data).toEqual([loansSchema]);
    } catch (error) {
      console.log('Error: ', error);
    }
  });
});
