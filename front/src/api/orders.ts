import { request } from './client';
import { OrderItemStatus } from '../utils/orderStatus';

export interface OrderStatusSnapshot {
  status: OrderItemStatus;
  changedAt: string;
}

export interface OrderItemSummary {
  orderItemId: string;
  pastelFlavorId: string;
  quantity: number;
  status: OrderItemStatus;
  unitPrice: number;
}

export interface OrderCreatedResponse {
  orderId: number;
  customerId: number;
  totalAmount: number;
  items: OrderItemSummary[];
}

export interface ActiveOrderItem {
  itemId: string;
  pastelFlavorId: string;
  flavorName: string;
  quantity: number;
  unitPrice: number;
  status: OrderItemStatus;
  createdAt: string;
  lastUpdatedAt?: string | null;
}

export interface ActiveOrder {
  orderId: number;
  createdAt: string;
  totalAmount: number;
  items: ActiveOrderItem[];
}

export interface ActiveOrderGroup {
  customerId: number;
  customerName: string;
  orders: ActiveOrder[];
}

export interface CustomerOrderItem {
  itemId: string;
  pastelFlavorId: string;
  flavorName: string;
  quantity: number;
  unitPrice: number;
  status: OrderItemStatus;
  createdAt: string;
  lastUpdatedAt?: string | null;
  history: OrderStatusSnapshot[];
}

export interface CustomerOrder {
  orderId: number;
  createdAt: string;
  totalAmount: number;
  isCancelable: boolean;
  items: CustomerOrderItem[];
}

export interface OrderHistoryItem {
  itemId: string;
  pastelFlavorId: string;
  flavorName: string;
  quantity: number;
  unitPrice: number;
  history: OrderStatusSnapshot[];
}

export interface OrderHistoryOrder {
  orderId: number;
  createdAt: string;
  totalAmount: number;
  items: OrderHistoryItem[];
}

export interface OrderHistoryGroup {
  customerId: number;
  customerName: string;
  orders: OrderHistoryOrder[];
}

export interface CreateOrderItemInput {
  pastelFlavorId: string;
  quantity: number;
  notes?: string;
}

export interface CreateOrderInput {
  customerId: number;
  customerName: string;
  items: CreateOrderItemInput[];
}

export function fetchActiveOrders(search?: string, signal?: AbortSignal): Promise<ActiveOrderGroup[]> {
  const query = search?.trim()
    ? `?${new URLSearchParams({ search: search.trim() }).toString()}`
    : '';
  return request<ActiveOrderGroup[]>(`/api/Orders/active${query}`, { signal });
}

export function createOrder(payload: CreateOrderInput, signal?: AbortSignal): Promise<OrderCreatedResponse> {
  return request<OrderCreatedResponse>('/api/Orders', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal
  });
}

export function advanceOrderItemStatus(
  orderId: number,
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

export function fetchCustomerOrders(customerId: number, signal?: AbortSignal): Promise<CustomerOrder[]> {
  return request<CustomerOrder[]>(`/api/Orders/customer/${customerId}`, { signal });
}

export function cancelOrder(orderId: number, customerId: number, signal?: AbortSignal): Promise<void> {
  return request<void>(`/api/Orders/${orderId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ customerId }),
    signal
  });
}

export function fetchOrderHistory(search?: string, signal?: AbortSignal): Promise<OrderHistoryGroup[]> {
  const query = search?.trim()
    ? `?${new URLSearchParams({ search: search.trim() }).toString()}`
    : '';
  return request<OrderHistoryGroup[]>(`/api/Orders/history${query}`, { signal });
}
