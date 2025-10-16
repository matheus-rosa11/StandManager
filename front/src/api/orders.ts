import { API_BASE_URL, parseResponse, request } from './client';
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
  customerSessionId: string;
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
  customerSessionId: string;
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
  customerSessionId: string;
  customerName: string;
  orders: OrderHistoryOrder[];
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

export interface CreateOrderResult {
  data?: OrderCreatedResponse;
  customerSessionId?: string;
}

export async function createOrder(payload: CreateOrderInput, signal?: AbortSignal): Promise<CreateOrderResult> {
  const response = await fetch(`${API_BASE_URL}/api/Orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal
  });

  const data = await parseResponse<OrderCreatedResponse | undefined>(response);
  const customerSessionId = response.headers.get('x-customer-session-id') ?? undefined;

  return { data: data ?? undefined, customerSessionId: customerSessionId ?? data?.customerSessionId };
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

export function fetchCustomerOrders(sessionId: string, signal?: AbortSignal): Promise<CustomerOrder[]> {
  return request<CustomerOrder[]>(`/api/Orders/customer/${sessionId}`, { signal });
}

export function cancelOrder(orderId: number, customerSessionId: string, signal?: AbortSignal): Promise<void> {
  return request<void>(`/api/Orders/${orderId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ customerSessionId }),
    signal
  });
}

export function fetchOrderHistory(signal?: AbortSignal): Promise<OrderHistoryGroup[]> {
  return request<OrderHistoryGroup[]>('/api/Orders/history', { signal });
}
