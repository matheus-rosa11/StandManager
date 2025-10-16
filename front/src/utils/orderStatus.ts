export type OrderItemStatus = 'Pending' | 'Frying' | 'ReadyForPickup' | 'Completed' | 'Cancelled';

export const ORDER_WORKFLOW: OrderItemStatus[] = [
  'Pending',
  'Frying',
  'ReadyForPickup'
];

export const ORDER_STATUS_LABEL_KEYS: Record<OrderItemStatus, string> = {
  Pending: 'orderStatus.pending',
  Frying: 'orderStatus.frying',
  ReadyForPickup: 'orderStatus.readyForPickup',
  Completed: 'orderStatus.finalized',
  Cancelled: 'orderStatus.cancelled'
};

const STATUS_CLASS_MAP: Record<OrderItemStatus, string> = {
  Pending: 'status-pending',
  Frying: 'status-frying',
  ReadyForPickup: 'status-readyforpickup',
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

  if (status === 'Completed') {
    return { key: 'orderStatus.finalized' };
  }

  const stepIndex = ORDER_WORKFLOW.indexOf(status);
  if (stepIndex === -1) {
    return { key: 'orderStatus.unknown' };
  }

  const step = stepIndex + 1;
  return { key: 'orderStatus.progress', params: { step, total: ORDER_WORKFLOW.length } };
}
