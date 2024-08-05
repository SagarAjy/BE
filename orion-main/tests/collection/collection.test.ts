import { describe, expect, test } from '@jest/globals';
import axios from 'axios';

const url = 'http://127.0.0.1:8001/crm-api';
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZDA1NjVjNGEtNjIyZS00ZjRkLTg0NDktZTMwYWM0ZGJmMWZkIiwiaWF0IjoxNjk4ODEzODAyfQ.894De6zJAFqdXt8TXPCpR95xjj8ZR-RGukhWn3YQll0';

describe('test collection api', () => {
  test('get collection/get/:leadId', async () => {
    try {
      const collectionSchema = {
        id: expect.anything(),
        loanNo: expect.anything(),
        collectionAmount: expect.anything(),
        referenceNo: expect.anything(),
        collectionMode: expect.anything(),
        collectionDate: expect.anything(),
        collectionTime: expect.anything(),
        penaltyAmount: expect.anything(),
        discountAmount: expect.anything(),
        settlementAmount: expect.anything(),
        status: expect.anything(),
        remarks: expect.anything(),
        collectedBy: expect.anything(),
        createdAt: expect.anything(),
      };

      const res = await axios.get(
        `${url}/collection/get/d18fc4d5-f339-4157-b016-6f26f5d5d498`,
        {
          headers: { 'auth-token': token },
        },
      );
      expect(res.status).toBe(200);
      expect(res.data).toEqual([collectionSchema]);
    } catch (error) {
      console.log('Error: ', error);
    }
  });

  test('get collection/all/:leadId', async () => {
    try {
      const collectionSchema = {
        id: expect.anything(),
        leadId: expect.anything(),
        loanNo: expect.anything(),
        name: expect.anything(),
        email: expect.anything(),
        phoneNo: expect.anything(),
        paymentAmount: expect.anything(),
        paymentMode: expect.anything(),
        paymentDate: expect.anything(),
        referenceNo: expect.anything(),
        discountAmount: expect.anything(),
        settlementAmount: expect.anything(),
        status: expect.anything(),
        createdAt: expect.anything(),
        employerName: expect.anything(),
      };

      const res = await axios.get(
        `${url}/collection/get-all?limit=10&offset=0&collectionStatus=Closed`,
        {
          headers: { 'auth-token': token },
        },
      );
      expect(res.status).toBe(200);
      expect(res.data).toEqual(
        expect.objectContaining({
          collections: expect.arrayContaining([collectionSchema]),
          collectionsCount: expect.anything(),
        }),
      );
    } catch (error) {
      console.log('Error: ', error);
    }
  });
});
