import { describe, expect, test } from '@jest/globals';
import axios from 'axios';

const url = 'http://127.0.0.1:8001/crm-api';
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZDA1NjVjNGEtNjIyZS00ZjRkLTg0NDktZTMwYWM0ZGJmMWZkIiwiaWF0IjoxNjk4ODEzODAyfQ.894De6zJAFqdXt8TXPCpR95xjj8ZR-RGukhWn3YQll0';

describe('test lead api', () => {
  test('test get leads/get-leads-by-filter', async () => {
    const leads = {
      id: expect.anything(),
      leadAssignee: expect.anything(),
      loanRequired: expect.anything(),
      purpose: expect.anything(),
      tenure: expect.anything(),
      monthlyIncome: expect.anything(),
      salaryMode: expect.anything(),
      city: expect.anything(),
      state: expect.anything(),
      pincode: expect.anything(),
      utmSource: expect.anything(),
      domain: expect.anything(),
      status: expect.anything(),
      createdAt: expect.anything(),
      customerId: expect.anything(),
      customerName: expect.anything(),
      email: expect.anything(),
      phoneNo: expect.anything(),
      ip: expect.anything(),
      updatedAt: expect.anything(),
      loanCount: expect.anything(),
    };

    const res = await axios.get(
      `${url}/leads/get-leads-by-filter?limit=10&offset=0`,
      {
        headers: { 'auth-token': token },
      },
    );

    expect(res.status).toBe(200);
    expect(res.data).toEqual(
      expect.objectContaining({
        leads: expect.arrayContaining([leads]),
        leadsCount: expect.anything(),
      }),
    );
  });

  test('get /leadHistory/:leadId', async () => {
    const getLeadHistorySchema = [
      {
        id: expect.anything(),
        purpose: expect.anything(),
        requiredAmount: expect.anything(),
        tenure: expect.anything(),
        monthlyIncome: expect.anything(),
        city: expect.anything(),
        state: expect.anything(),
        pincode: expect.anything(),
        status: expect.anything(),
        source: expect.anything(),
        createdAt: expect.anything(),
      },
    ];

    const res = await axios.get(
      `${url}/leads/leadHistory/f7af1267-ab37-4e65-a3ae-2864965656df`,
      {
        headers: { 'auth-token': token },
      },
    );
    expect(res.status).toBe(200);
    expect(res.data).toEqual(getLeadHistorySchema);
  });

  test('get /get/credit-leads-by-filter', async () => {
    const getCreditLeadsSchema = {
      id: expect.anything(),
      loanType: expect.anything(),
      branch: expect.anything(),
      name: expect.anything(),
      email: expect.anything(),
      phoneNo: expect.anything(),
      loanAmount: expect.anything(),
      tenure: expect.anything(),
      roi: expect.anything(),
      repayDate: expect.anything(),
      processingFee: expect.anything(),
      monthlyIncome: expect.anything(),
      cibil: expect.anything(),
      creditedBy: expect.anything(),
      status: expect.anything(),
      updatedAt: expect.anything(),
    };

    const res = await axios.get(
      `${url}/leads/get/credit-leads-by-filter?limit=10&offset=0&leads=Approved`,
      {
        headers: { 'auth-token': token },
      },
    );

    expect(res.status).toBe(200);
    expect(res.data).toEqual(
      expect.objectContaining({
        leads: expect.arrayContaining([getCreditLeadsSchema]),
        leadsCount: expect.anything(),
      }),
    );
  });

  test('get lead by leadId', async () => {
    const leadSchema = {
      id: expect.anything(),
      leadAssignee: expect.anything(),
      loanRequired: expect.anything(),
      purpose: expect.anything(),
      tenure: expect.anything(),
      monthlyIncome: expect.anything(),
      salaryMode: expect.anything(),
      city: expect.anything(),
      state: expect.anything(),
      pincode: expect.anything(),
      utmSource: expect.anything(),
      domain: expect.anything(),
      status: expect.anything(),
      createdAt: expect.anything(),
    };
    const res = await axios.get(
      `${url}/leads/f7af1267-ab37-4e65-a3ae-2864965656df`,
      {
        headers: { 'auth-token': token },
      },
    );
    expect(res.status).toBe(200);
    expect(res.data).toEqual(leadSchema);
  });
});
