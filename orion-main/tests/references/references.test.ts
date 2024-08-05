import { describe, expect, test } from '@jest/globals';
import axios from 'axios';

const url = 'http://127.0.0.1:8001/crm-api';
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZDA1NjVjNGEtNjIyZS00ZjRkLTg0NDktZTMwYWM0ZGJmMWZkIiwiaWF0IjoxNjk4ODEzODAyfQ.894De6zJAFqdXt8TXPCpR95xjj8ZR-RGukhWn3YQll0';

describe('test references api', () => {
  test('get reference/get/:leadId', async () => {
    try {
      const referenceSchema = {
        id: expect.anything(),
        createdBy: expect.anything(),
        phoneNo: expect.anything(),
        relation: expect.anything(),
        name: expect.anything(),
        address: expect.anything(),
        city: expect.anything(),
        state: expect.anything(),
        pincode: expect.anything(),
      };

      const res = await axios.get(
        `${url}/reference/get/ea6abb41-bb88-4b99-9815-bffd97ca9154`,
        {
          headers: { 'auth-token': token },
        },
      );
      expect(res.status).toBe(200);
      expect(res.data).toEqual(expect.arrayContaining([referenceSchema]));
    } catch (error) {
      console.log('Error: ', error);
    }
  });
});
