import { describe, expect, test } from '@jest/globals';
import axios from 'axios';

const url = 'http://127.0.0.1:8001/crm-api';
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZDA1NjVjNGEtNjIyZS00ZjRkLTg0NDktZTMwYWM0ZGJmMWZkIiwiaWF0IjoxNjk4ODEzODAyfQ.894De6zJAFqdXt8TXPCpR95xjj8ZR-RGukhWn3YQll0';

describe('test sanction-target api', () => {
  test('get sanction-target/get', async () => {
    try {
      const sanctionSchema = {
        id: expect.anything(),
        target: expect.anything(),
        approvedBy: expect.anything(),
        sanctionedTo: {
          id: expect.anything(),
          name: expect.anything(),
        },
        month: expect.anything(),
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      };

      const res = await axios.get(
        `${url}/sanction-target/get?limit=10&offset=0`,
        {
          headers: { 'auth-token': token },
        },
      );
      expect(res.status).toBe(200);
      expect(res.data).toEqual(
        expect.objectContaining({
          allSanctionTargets: expect.arrayContaining([sanctionSchema]),
          count: expect.anything(),
        }),
      );
    } catch (error) {
      console.log('Error: ', error);
    }
  });
});
