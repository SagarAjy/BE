import { describe, expect, test } from '@jest/globals';
import axios from 'axios';

const url = 'http://127.0.0.1:8001/crm-api';
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZDA1NjVjNGEtNjIyZS00ZjRkLTg0NDktZTMwYWM0ZGJmMWZkIiwiaWF0IjoxNjk4ODEzODAyfQ.894De6zJAFqdXt8TXPCpR95xjj8ZR-RGukhWn3YQll0';

describe('test customer api', () => {
  test('get address/getAddress/:leadId', async () => {
    try {
      const addressSchema = {
        id: expect.anything(),
        type: expect.anything(),
        address: expect.anything(),
        city: expect.anything(),
        state: expect.anything(),
        pincode: expect.anything(),
        houseType: expect.anything(),
        status: expect.anything(),
        verifiedBy: expect.anything(),
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      };

      const res = await axios.get(
        `${url}/address/getAddress/ea6abb41-bb88-4b99-9815-bffd97ca9154`,
        {
          headers: { 'auth-token': token },
        },
      );
      expect(res.status).toBe(200);
      expect(res.data).toEqual(expect.arrayContaining([addressSchema]));
    } catch (error) {
      console.log('Error: ', error);
    }
  });
});
