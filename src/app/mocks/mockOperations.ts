export interface MockUser {
  id: number;
  firstName: string;
  lastName: string;
  cpf: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
}

export interface MockContainer {
  id: string;
  description: string;
  images: string[];
}

export interface MockOperation {
  id: number;
  container: MockContainer;
  user: MockUser;
  createdAt: string;
}

export const MOCK_OPERATIONS: MockOperation[] = [
  {
    id: 101,
    container: {
      id: 'CNTR-1001',
      description: 'Inspeção de carga refrigerada',
      images: [],
    },
    user: {
      id: 1,
      firstName: 'Paulo',
      lastName: 'Silva',
      cpf: '123.456.789-00',
      email: 'paulo.silva@example.com',
      role: 'ANALYST',
      twoFactorEnabled: false,
    },
    createdAt: '2025-01-15T08:30:00Z',
  },
  {
    id: 102,
    container: {
      id: 'CNTR-2042',
      description: 'Acompanhamento de exportação',
      images: [],
    },
    user: {
      id: 2,
      firstName: 'Ana',
      lastName: 'Costa',
      cpf: '987.654.321-00',
      email: 'ana.costa@example.com',
      role: 'SUPERVISOR',
      twoFactorEnabled: false,
    },
    createdAt: '2025-02-02T14:05:00Z',
  },
  {
    id: 103,
    container: {
      id: 'CNTR-3120',
      description: 'Vistoria de avaria em porto de Santos',
      images: [],
    },
    user: {
      id: 3,
      firstName: 'Juliana',
      lastName: 'Oliveira',
      cpf: '321.654.987-00',
      email: 'juliana.oliveira@example.com',
      role: 'INSPECTOR',
      twoFactorEnabled: true,
    },
    createdAt: '2025-02-20T09:45:00Z',
  },
  {
    id: 104,
    container: {
      id: 'CNTR-4508',
      description: 'Checklist pré-embarque de perecíveis',
      images: [],
    },
    user: {
      id: 4,
      firstName: 'Carlos',
      lastName: 'Ferreira',
      cpf: '456.789.123-00',
      email: 'carlos.ferreira@example.com',
      role: 'COORDINATOR',
      twoFactorEnabled: false,
    },
    createdAt: '2025-03-05T16:20:00Z',
  },
  {
    id: 105,
    container: {
      id: 'CNTR-5087',
      description: 'Auditoria de documentação para importação',
      images: [],
    },
    user: {
      id: 5,
      firstName: 'Renata',
      lastName: 'Souza',
      cpf: '654.987.321-00',
      email: 'renata.souza@example.com',
      role: 'AUDITOR',
      twoFactorEnabled: true,
    },
    createdAt: '2025-03-18T11:10:00Z',
  },
];



export const getMockContainerImages = (containerId: string): string[] => {
  const operation = MOCK_OPERATIONS.find((item) => item.container.id === containerId);
  return operation?.container.images ?? [];
};
