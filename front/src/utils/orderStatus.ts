export type OrderItemStatus =
  | 'Pending'
  | 'Frying'
  | 'Packaging'
  | 'ReadyForPickup'
  | 'OutForDelivery'
  | 'Completed'
  | 'Cancelled';

export const ORDER_WORKFLOW: OrderItemStatus[] = [
  'Pending',
  'Frying',
  'Packaging',
  'ReadyForPickup',
  'OutForDelivery',
  'Completed'
];

export const ORDER_STATUS_LABEL_KEYS: Record<OrderItemStatus, string> = {
  Pending: 'orderStatus.pending',
  Frying: 'orderStatus.frying',
  Packaging: 'orderStatus.packaging',
  ReadyForPickup: 'orderStatus.readyForPickup',
  OutForDelivery: 'orderStatus.outForDelivery',
  Completed: 'orderStatus.completed',
  Cancelled: 'orderStatus.cancelled'
};

const STATUS_CLASS_MAP: Record<OrderItemStatus, string> = {
  Pending: 'status-pending',
  Frying: 'status-frying',
  Packaging: 'status-packaging',
  ReadyForPickup: 'status-readyforpickup',
  OutForDelivery: 'status-outfordelivery',
  Completed: 'status-completed',
  Cancelled: 'status-cancelled'
};

export function getStatusClass(status: OrderItemStatus): string {
  return STATUS_CLASS_MAP[status] ?? 'status-pending';
}

export interface WorkflowProgressDescriptor {
  key: string;
  params?: { step: number; total: number };
}

export function describeWorkflowProgress(status: OrderItemStatus): WorkflowProgressDescriptor {
  if (status === 'Cancelled') {
    return { key: 'orderStatus.cancelled' };
  }

  const stepIndex = ORDER_WORKFLOW.indexOf(status);
  if (stepIndex === -1) {
    return { key: 'orderStatus.unknown' };
  }

  const step = stepIndex + 1;
  return { key: 'orderStatus.progress', params: { step, total: ORDER_WORKFLOW.length } };
}
