export interface OperationContainerDetail {
  id: string;
  weight: string;
  status: 'Nao iniciado' | 'Em andamento' | 'Concluido';
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

export const MOCK_OPERATION_DETAILS: OperationDetail[] = [
  {
    id: 101,
    code: 'OP-101',
    operation: 'AMV-1234/25',
    reservation: 'COD-123',
    terminal: 'Terminal Portuario Santos',
    destination: 'Destino Internacional',
    vessel: 'MSC Fantasia',
    exporter: 'Empresa Exportadora S.A.',
    deadline: '2025-07-20',
    cargo: {
      title: 'Sacaria',
      description: 'Conteudo visual da sacaria inspecionada nesta operacao.',
      images: [
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&w=900&q=60',
        'https://images.unsplash.com/photo-1526401485004-7120f3b9c4be?auto=format&w=900&q=60',
        'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&w=900&q=60',
      ],
      notes: 'Marcacao da sacaria: MARA-01',
    },
    containers: [
      { id: 'CNTR 100001-1', weight: '27000kg Peso Bruto', status: 'Nao iniciado' },
      { id: 'CNTR 100002-2', weight: '27123kg Peso Bruto', status: 'Nao iniciado' },
      { id: 'CNTR 100003-3', weight: '27246kg Peso Bruto', status: 'Nao iniciado' },
    ],
  },
  {
    id: 102,
    code: 'OP-102',
    operation: 'AMV-5678/26',
    reservation: 'COD-456',
    terminal: 'Terminal Multimodal Vitoria',
    destination: 'Destino Nacional',
    vessel: 'Maersk Horizon',
    exporter: 'Companhia de Logistica LTDA',
    deadline: '2025-08-12',
    cargo: {
      title: 'Refrigerados',
      description: 'Monitoramento termico constante dos itens pereciveis.',
      images: [
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&w=900&q=60',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&w=900&q=60',
      ],
      notes: 'Temperatura alvo: -4C',
    },
    containers: [
      { id: 'CNTR 200001-1', weight: '18000kg Peso Bruto', status: 'Em andamento' },
      { id: 'CNTR 200002-2', weight: '18550kg Peso Bruto', status: 'Concluido' },
    ],
  },
  {
    id: 103,
    code: 'OP-103',
    operation: 'AMV-9012/26',
    reservation: 'COD-789',
    terminal: 'Terminal Portuario Itajai',
    destination: 'Destino America do Sul',
    vessel: 'Evergreen Explorer',
    exporter: 'Global Trading Corp.',
    deadline: '2025-09-05',
    cargo: {
      title: 'Granel',
      description: 'Carga a granel com inspecao programada e amostragem.',
      images: [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&w=900&q=60',
      ],
      notes: 'Amostra coletada: 12/07/2025',
    },
    containers: [
      { id: 'CNTR 300001-1', weight: '35000kg Peso Bruto', status: 'Em andamento' },
      { id: 'CNTR 300002-2', weight: '34800kg Peso Bruto', status: 'Nao iniciado' },
      { id: 'CNTR 300003-3', weight: '34950kg Peso Bruto', status: 'Concluido' },
    ],
  },
];

export const findOperationDetail = (id: number) =>
  MOCK_OPERATION_DETAILS.find(detail => detail.id === id);

