export interface ContainerPhotoSection {
  id: string;
  title: string;
  images: string[];
}

export type ContainerStatus = 'Nao iniciado' | 'Em andamento' | 'Concluido';

export interface ContainerDetail {
  id: string;
  code: string;
  operationCode: string;
  operationName: string;
  status: ContainerStatus;
  sacariaQuantity: string;
  tare: string;
  netWeight: string;
  grossWeight: string;
  sealAgency: string;
  otherSeals: string;
  pickupDate: string;
  stuffingDate: string;
  photoSections: ContainerPhotoSection[];
}

const createImages = (count: number, query: string) =>
  Array.from({ length: count }).map((_, index) =>
    `https://source.unsplash.com/collection/483251/${900 + index}x${600 + index}?${query}`,
  );

export const MOCK_CONTAINER_DETAILS: ContainerDetail[] = [
  {
    id: 'CNTR 100001-1',
    code: 'CNTR 100001-1',
    operationCode: 'AMV-12346/25',
    operationName: 'Operacao Exportacao Santos',
    status: 'Nao iniciado',
    sacariaQuantity: '540 sacas',
    tare: '2.220 kg',
    netWeight: '27.000 kg',
    grossWeight: '27.081 kg',
    sealAgency: 'MQ45314',
    otherSeals: 'Multiplos lacres',
    pickupDate: '2025-06-30',
    stuffingDate: '2025-08-04',
    photoSections: [
      { id: 'empty', title: 'Vazio/Forrado', images: createImages(4, 'empty-container') },
      { id: 'partial', title: 'Parcial', images: createImages(5, 'partial-load') },
      { id: 'full', title: 'Cheio/Aberto', images: createImages(3, 'full-container') },
      { id: 'half-door', title: 'Meia Porta', images: createImages(4, 'container-door') },
      { id: 'seals', title: 'Lacres', images: createImages(6, 'container-seal') },
    ],
  },
  {
    id: 'CNTR 200001-1',
    code: 'CNTR 200001-1',
    operationCode: 'AMV-5678/26',
    operationName: 'Operacao Refrigerados Vitoria',
    status: 'Em andamento',
    sacariaQuantity: '320 sacas',
    tare: '1.840 kg',
    netWeight: '18.550 kg',
    grossWeight: '20.390 kg',
    sealAgency: 'ZX90633',
    otherSeals: 'Lacres frigorificos',
    pickupDate: '2025-07-18',
    stuffingDate: '2025-08-12',
    photoSections: [
      { id: 'empty', title: 'Vazio/Forrado', images: createImages(3, 'empty-reefer') },
      { id: 'partial', title: 'Parcial', images: createImages(4, 'reefer-cargo') },
      { id: 'full', title: 'Cheio/Aberto', images: createImages(5, 'reefer-full') },
      { id: 'half-door', title: 'Meia Porta', images: createImages(2, 'reefer-door') },
      { id: 'seals', title: 'Lacres', images: createImages(4, 'reefer-seal') },
    ],
  },
];

export const findContainerDetail = (id: string) =>
  MOCK_CONTAINER_DETAILS.find((detail) => detail.id === id);
