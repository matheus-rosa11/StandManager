import { request } from './client';

export interface PastelFlavor {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  availableQuantity: number;
  price: number;
}

export interface CreatePastelFlavorPayload {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  availableQuantity: number;
  price: number;
}

export function fetchPastelFlavors(signal?: AbortSignal): Promise<PastelFlavor[]> {
  return request<PastelFlavor[]>('/api/PastelFlavors', { signal });
}

export function createPastelFlavorsBatch(items: CreatePastelFlavorPayload[]): Promise<PastelFlavor[]> {
  return request<PastelFlavor[]>(`/api/PastelFlavors/batch`, {
    method: 'POST',
    body: JSON.stringify({ items })
  });
}
