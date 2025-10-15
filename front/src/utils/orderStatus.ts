export type OrderItemStatus = 'Pending' | 'Frying' | 'Packaging' | 'ReadyForPickup' | 'Completed';

export const ORDER_WORKFLOW: OrderItemStatus[] = ['Pending', 'Frying', 'Packaging', 'ReadyForPickup', 'Completed'];

export const ORDER_STATUS_LABELS: Record<OrderItemStatus, string> = {
  Pending: 'Aguardando',
  Frying: 'Fritando',
  Packaging: 'Embalando',
  ReadyForPickup: 'Pronto',
  Completed: 'Entregue'
};

export function getStatusClass(status: OrderItemStatus): string {
  return `status-${status.toLowerCase()}`;
}

export function describeWorkflowProgress(status: OrderItemStatus): string {
  const step = ORDER_WORKFLOW.indexOf(status) + 1;
  return `Etapa ${step} de ${ORDER_WORKFLOW.length}`;
}
