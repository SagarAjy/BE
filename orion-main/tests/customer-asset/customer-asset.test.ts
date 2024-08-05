import { describe, expect, test } from '@jest/globals';
import axios from 'axios';

const url = 'http://127.0.0.1:8001/crm-api';
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZDA1NjVjNGEtNjIyZS00ZjRkLTg0NDktZTMwYWM0ZGJmMWZkIiwiaWF0IjoxNjk4ODEzODAyfQ.894De6zJAFqdXt8TXPCpR95xjj8ZR-RGukhWn3YQll0';

describe('test customer-asset api', () => {
  test('get customer-asset/get/:leadId', async () => {
    try {
      const assetsSchema = {
        id: expect.anything(),
        assetName: expect.anything(),
        assetValue: expect.anything(),
        updatedAt: expect.anything(),
        createdAt: expect.anything(),
      };

      const res = await axios.get(
        `${url}/customer-asset/get/f7af1267-ab37-4e65-a3ae-2864965656df`,
        {
          headers: { 'auth-token': token },
        },
      );
      expect(res.status).toBe(200);
      expect(res.data).toEqual([assetsSchema]);
    } catch (error) {
      console.log('Error: ', error);
    }
  });
});
