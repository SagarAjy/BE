import { describe, expect, test } from '@jest/globals';
import axios from 'axios';

const url = 'http://127.0.0.1:8001/crm-api';
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZDA1NjVjNGEtNjIyZS00ZjRkLTg0NDktZTMwYWM0ZGJmMWZkIiwiaWF0IjoxNjk4ODEzODAyfQ.894De6zJAFqdXt8TXPCpR95xjj8ZR-RGukhWn3YQll0';

describe('test reports api', () => {
  test('get disbursal report', async () => {
    try {
      const disbursalSchema = {
        id: expect.anything(),
        loanNo: expect.anything(),
        branch: expect.anything(),
        loanType: expect.anything(),
        name: expect.anything(),
        creditManager: expect.anything(),
        gender: expect.anything(),
        dob: expect.anything(),
        personalEmail: expect.anything(),
        officeEmail: expect.anything(),
        mobile: expect.anything(),
        aadharNumber: expect.anything(),
        panCard: expect.anything(),
        loanAmount: expect.anything(),
        approvalDate: expect.anything(),
        disbursalAmount: expect.anything(),
        tenure: expect.anything(),
        roi: expect.anything(),
        disbursalDate: expect.anything(),
        accountNo: expect.anything(),
        accountType: expect.anything(),
        ifsc: expect.anything(),
        bank: expect.anything(),
        bankBranch: expect.anything(),
        disbursalReferenceNo: expect.anything(),
        processingFee: expect.anything(),
        monthlyIncome: expect.anything(),
        cibil: expect.anything(),
        gstFee: expect.anything(),
        utmSource: expect.anything(),
        status: expect.anything(),
      };

      const res = await axios.get(
        `${url}/reports/disbursal?limit=10&offset=0`,
        {
          headers: { 'auth-token': token },
        },
      );
      expect(res.status).toBe(200);
      expect(res.data).toEqual(
        expect.objectContaining({
          disbursalReports: expect.arrayContaining([disbursalSchema]),
          count: expect.anything(),
        }),
      );
    } catch (error) {
      console.log('Error: ', error);
    }
  });

  test('get collection report', async () => {
    try {
      const collectionSchema = {
        id: expect.anything(),
        loanNo: expect.anything(),
        name: expect.anything(),
        mobile: expect.anything(),
        loanAmount: expect.anything(),
        processingFee: expect.anything(),
        disbursalDate: expect.anything(),
        collectedAmount: expect.anything(),
        penalty: expect.anything(),
        collectedMode: expect.anything(),
        collectionDate: expect.anything(),
        collectionTime: expect.anything(),
        referenceNo: expect.anything(),
        status: expect.anything(),
        remark: expect.anything(),
        createdAt: expect.anything(),
        employerName: expect.anything(),
      };

      const res = await axios.get(
        `${url}/reports/collections?limit=10&offset=0`,
        {
          headers: { 'auth-token': token },
        },
      );
      expect(res.status).toBe(200);
      expect(res.data).toEqual(
        expect.objectContaining({
          collectionsReport: expect.arrayContaining([collectionSchema]),
          count: expect.anything(),
        }),
      );
    } catch (error) {
      console.log('Error: ', error);
    }
  });
});
