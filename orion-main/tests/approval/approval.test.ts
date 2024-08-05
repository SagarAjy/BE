import { describe, expect, test } from '@jest/globals';
import axios from 'axios';

const url = 'http://127.0.0.1:8001/crm-api';
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZDA1NjVjNGEtNjIyZS00ZjRkLTg0NDktZTMwYWM0ZGJmMWZkIiwiaWF0IjoxNjk4ODEzODAyfQ.894De6zJAFqdXt8TXPCpR95xjj8ZR-RGukhWn3YQll0';

describe('test approval api', () => {
  test('get approval/get/:leadId', async () => {
    try {
      const approvalSchema = {
        id: expect.anything(),
        loanType: expect.anything(),
        branch: expect.anything(),
        approvalAmount: expect.anything(),
        loanTenure: expect.anything(),
        roi: expect.anything(),
        salaryDate: expect.anything(),
        repayDate: expect.anything(),
        processingFee: expect.anything(),
        gst: expect.anything(),
        alternateNumber: expect.anything(),
        email: expect.anything(),
        cibilScore: expect.anything(),
        monthlyIncome: expect.anything(),
        status: expect.anything(),
        creditedBy: expect.anything(),
        creditDate: expect.anything(),
        remark: expect.anything(),
        additionalRemark: expect.anything(),
        loanPurpose: expect.anything(),
      };

      const res = await axios.get(
        `${url}/approval/get/f7af1267-ab37-4e65-a3ae-2864965656df`,
        {
          headers: { 'auth-token': token },
        },
      );
      expect(res.status).toBe(200);
      expect(res.data).toEqual(approvalSchema);
    } catch (error) {
      console.log('Error: ', error);
    }
  });

  test('get /get-existing-approval/:leadId', async () => {
    try {
      const res = await axios.get(
        `${url}/approval/get-existing-approval/f7af1267-ab37-4e65-a3ae-2864965656df`,
        {
          headers: { 'auth-token': token },
        },
      );
      expect(res.status).toBe(200);
    } catch (error) {
      console.log(error);
    }
  });
});
