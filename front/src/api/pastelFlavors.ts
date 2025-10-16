import { request } from './client';

export interface PastelFlavor {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  availableQuantity: number;
  price: number;
}

export function fetchPastelFlavors(signal?: AbortSignal): Promise<PastelFlavor[]> {
  return request<PastelFlavor[]>('/api/PastelFlavors', { signal });
}
