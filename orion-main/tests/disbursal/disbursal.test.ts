import { describe, expect, test } from '@jest/globals';
import axios from 'axios';

const url = 'http://127.0.0.1:8001/crm-api';
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZDA1NjVjNGEtNjIyZS00ZjRkLTg0NDktZTMwYWM0ZGJmMWZkIiwiaWF0IjoxNjk4ODEzODAyfQ.894De6zJAFqdXt8TXPCpR95xjj8ZR-RGukhWn3YQll0';

describe('test disbursal api', () => {
  test('get disbursal/get/:leadId', async () => {
    try {
      const disbursalSchema = {
        id: expect.anything(),
        disbursalAmount: expect.anything(),
        companyAccountNo: expect.anything(),
        accountNo: expect.anything(),
        accountType: expect.anything(),
        bankName: expect.anything(),
        ifscCode: expect.anything(),
        bankBranch: expect.anything(),
        chequeNo: expect.anything(),
        disbursalDate: expect.anything(),
        finalRemark: expect.anything(),
        disbursedBy: expect.anything(),
        pdDoneBy: expect.anything(),
        pdDate: expect.anything(),
      };

      const res = await axios.get(
        `${url}/disbursal/get/d18fc4d5-f339-4157-b016-6f26f5d5d498`,
        {
          headers: { 'auth-token': token },
        },
      );
      expect(res.status).toBe(200);
      expect(res.data).toEqual(disbursalSchema);
    } catch (error) {
      console.log('Error: ', error);
    }
  });
});
