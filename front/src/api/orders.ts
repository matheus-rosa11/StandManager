import { request } from './client';
import { OrderItemStatus } from '../utils/orderStatus';

export interface OrderItemSummary {
  orderItemId: string;
  pastelFlavorId: string;
  quantity: number;
  status: OrderItemStatus;
}

export interface OrderCreatedResponse {
  orderId: string;
  customerSessionId: string;
  items: OrderItemSummary[];
}

export interface ActiveOrderItem {
  itemId: string;
  pastelFlavorId: string;
  flavorName: string;
  quantity: number;
  status: OrderItemStatus;
  createdAt: string;
  lastUpdatedAt?: string | null;
}

export interface ActiveOrder {
  orderId: string;
  createdAt: string;
  items: ActiveOrderItem[];
}

export interface ActiveOrderGroup {
  customerSessionId: string;
  customerName: string;
  orders: ActiveOrder[];
}

export interface CreateOrderItemInput {
  pastelFlavorId: string;
  quantity: number;
  notes?: string;
}

export interface CreateOrderInput {
  customerName: string;
  customerSessionId?: string;
  items: CreateOrderItemInput[];
}

export function fetchActiveOrders(signal?: AbortSignal): Promise<ActiveOrderGroup[]> {
  return request<ActiveOrderGroup[]>('/api/Orders/active', { signal });
}

export function createOrder(payload: CreateOrderInput, signal?: AbortSignal): Promise<OrderCreatedResponse> {
  return request<OrderCreatedResponse>('/api/Orders', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal
  });
}

export function advanceOrderItemStatus(
  orderId: string,
  itemId: string,
  targetStatus?: OrderItemStatus,
  signal?: AbortSignal
): Promise<ActiveOrderItem> {
  return request<ActiveOrderItem>(`/api/Orders/${orderId}/items/${itemId}/advance`, {
    method: 'POST',
    body: JSON.stringify({ targetStatus }),
    signal
  });
}
