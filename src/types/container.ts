export type ContainerStatus = 'Aberto' | 'Parcial' | 'Completo';

export interface ContainerPhotoSection {
  id: string;
  title: string;
  images: string[];
}

export interface ContainerDetail {
  id: string;
  code: string;
  description: string;
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

const SECTION_TEMPLATES: Array<Pick<ContainerPhotoSection, "id" | "title">> = [
  { id: "empty", title: "Vazio/Forrado" },
  { id: "partial", title: "Parcial" },
  { id: "full", title: "Cheio/Aberto" },
  { id: "half-door", title: "Meia Porta" },
  { id: "seals", title: "Lacres" },
];

export const createEmptyPhotoSections = (): ContainerPhotoSection[] =>
  SECTION_TEMPLATES.map((section) => ({ ...section, images: [] }));
