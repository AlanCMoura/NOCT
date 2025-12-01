export type OperationContainerStatus = 'Aberto' | 'Parcial' | 'Completo';

export interface OperationContainerDetail {
  id: string;
  weight: string;
  status: OperationContainerStatus | string;
}

export interface OperationCargoDetail {
  title: string;
  description: string;
  images: string[];
  notes?: string;
}

export interface OperationDetail {
  id: number;
  code: string;
  operation: string;
  reservation: string;
  terminal: string;
  destination: string;
  vessel: string;
  exporter: string;
  deadline: string;
  cargo: OperationCargoDetail;
  containers: OperationContainerDetail[];
}
