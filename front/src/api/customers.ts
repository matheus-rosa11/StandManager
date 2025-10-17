import { request } from './client';

export interface CustomerPayload {
  id: number;
  name: string;
  createdAt: string;
}

export async function registerCustomer(name: string, signal?: AbortSignal): Promise<CustomerPayload> {
  return request<CustomerPayload>('/api/Customers/register', {
    method: 'POST',
    body: JSON.stringify({ name }),
    signal
  });
}

export async function confirmCustomer(id: number, name: string, signal?: AbortSignal): Promise<CustomerPayload> {
  return request<CustomerPayload>('/api/Customers/confirm', {
    method: 'POST',
    body: JSON.stringify({ customerId: id, name }),
    signal
  });
}

export async function fetchCustomer(id: number, signal?: AbortSignal): Promise<CustomerPayload> {
  return request<CustomerPayload>(`/api/Customers/${id}`, { signal });
}
