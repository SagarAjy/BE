import { describe, expect, test } from '@jest/globals';
import axios from 'axios';

const url = 'http://127.0.0.1:8001/crm-api';
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZDA1NjVjNGEtNjIyZS00ZjRkLTg0NDktZTMwYWM0ZGJmMWZkIiwiaWF0IjoxNjk4ODEzODAyfQ.894De6zJAFqdXt8TXPCpR95xjj8ZR-RGukhWn3YQll0';

describe('test user api', () => {
  test('test get user/all', async () => {
    const users = {
      id: expect.anything(),
      fullName: expect.anything(),
      email: expect.anything(),
      phoneNo: expect.anything(),
      branch: expect.anything(),
      role: expect.anything(),
      status: expect.anything(),
      reporting: expect.anything(),
      collectionUser: expect.anything(),
      allowedMacAddress: expect.anything(),
      createdBy: expect.anything(),
      createdAt: expect.anything(),
      updatedAt: expect.anything(),
    };

    const res = await axios.get(`${url}/user/all?limit=10&offset=0`, {
      headers: { 'auth-token': token },
    });

    expect(res.status).toBe(200);
    expect(res.data).toEqual(
      expect.objectContaining({
        users: expect.arrayContaining([users]),
        userCount: expect.anything(),
      }),
    );
  });

  test('test get user/get/role', async () => {
    const usersByRole = {
      key: expect.anything(),
      value: expect.anything(),
      label: expect.anything(),
    };

    const res = await axios.get(`${url}/user/get/role/Admin?branch='Delhi'`, {
      headers: { 'auth-token': token },
    });
    expect(res.status).toBe(200);
    expect(res.data).toEqual([expect.objectContaining(usersByRole)]);
  });

  test('test post user/add', async () => {
    const res = await axios.options(`${url}/user/add`, {
      headers: { 'auth-token': token },
    });
    expect(res.status).toBe(204);
  });
});
