export type OrderItemStatus = 'Pending' | 'Frying' | 'Packaging' | 'ReadyForPickup' | 'Completed';

export const ORDER_WORKFLOW: OrderItemStatus[] = ['Pending', 'Frying', 'Packaging', 'ReadyForPickup', 'Completed'];

export const ORDER_STATUS_LABELS: Record<OrderItemStatus, string> = {
  Pending: 'Aguardando',
  Frying: 'Fritando',
  Packaging: 'Embalando',
  ReadyForPickup: 'Pronto',
  Completed: 'Entregue'
};

const STATUS_CLASS_MAP: Record<OrderItemStatus, string> = {
  Pending: 'status-pending',
  Frying: 'status-frying',
  Packaging: 'status-packaging',
  ReadyForPickup: 'status-readyforpickup',
  Completed: 'status-completed'
};

export function getStatusClass(status: OrderItemStatus): string {
  return STATUS_CLASS_MAP[status] ?? 'status-pending';
}

export function describeWorkflowProgress(status: OrderItemStatus): string {
  const stepIndex = ORDER_WORKFLOW.indexOf(status);
  if (stepIndex === -1) {
    return 'Etapa desconhecida';
  }

  const step = stepIndex + 1;
  return `Etapa ${step} de ${ORDER_WORKFLOW.length}`;
}
