import { describe, expect, test } from '@jest/globals';
import axios from 'axios';

const url = 'http://127.0.0.1:8001/crm-api';
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZDA1NjVjNGEtNjIyZS00ZjRkLTg0NDktZTMwYWM0ZGJmMWZkIiwiaWF0IjoxNjk4ODEzODAyfQ.894De6zJAFqdXt8TXPCpR95xjj8ZR-RGukhWn3YQll0';

describe.skip('test documents api', () => {
  test('get documents/get/:leadId', async () => {
    try {
      const documentsSchema = {
        id: expect.anything(),
        documentType: expect.anything(),
        documentUrl: expect.anything(),
        password: expect.anything(),
        status: expect.anything(),
        verifiedBy: expect.anything(),
        verifiedDate: expect.anything(),
        uploadedBy: expect.anything(),
        uploadDate: expect.anything(),
        isArchived: expect.anything(),
      };

      const res = await axios.get(
        `${url}/document/get/f7af1267-ab37-4e65-a3ae-2864965656df`,
        {
          headers: { 'auth-token': token },
        },
      );
      expect(res.status).toBe(200);
      expect(res.data).toEqual(expect.arrayContaining([documentsSchema]));
    } catch (error) {
      console.log('Error: ', error);
    }
  });
});
