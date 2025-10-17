import { request } from './client';
import { OrderItemStatus } from '../utils/orderStatus';

export interface PopularFlavorReportItem {
  flavorId: string;
  flavorName: string;
  quantity: number;
  revenue: number;
}

export interface HourlyOrderCountReportItem {
  hour: number;
  count: number;
}

export interface StepDurationReportItem {
  status: OrderItemStatus;
  averageSeconds: number;
  fastestSeconds: number;
  slowestSeconds: number;
}

export interface DailyReportSummary {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  totalItems: number;
  averageTicket: number;
  averageOrderCompletionSeconds?: number | null;
  popularFlavors: PopularFlavorReportItem[];
  hourlyOrderCounts: HourlyOrderCountReportItem[];
  stepDurationStats: StepDurationReportItem[];
}

export function fetchDailyReport(date?: string, signal?: AbortSignal): Promise<DailyReportSummary> {
  const query = date ? `?${new URLSearchParams({ date })}` : '';
  return request<DailyReportSummary>(`/api/Reports/daily${query}`, { signal });
}
