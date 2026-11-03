export type LabId = 'quimica' | 'biologia' | 'multiuso';

export type ShiftType = 'manha' | 'tarde' | 'noite';

export type ReagentClassification = 'comum' | 'controlado_pf' | 'controlado_exercito';

export type EquipmentCondition = 'excelente' | 'regular' | 'manutencao';

export type ReservationStatus = 
  | 'pendente'
  | 'aprovado'
  | 'reprovado'
  | 'ajuste'
  | 'preparacao'
  | 'finalizado';

export interface Reagent {
  id: string;
  name: string;
  concentration: string;
  physicalStock: number;
  reservedStock: number;
  unit: string;
  classification: ReagentClassification;
}

export interface Material {
  id: string;
  name: string;
  type: string; // e.g., Vidraria, EPIs, etc.
  physicalStock: number;
  reservedStock: number;
  unit: string;
}

export interface Equipment {
  id: string;
  name: string;
  condition: EquipmentCondition;
  observations: string;
}

export interface ReagentRequirement {
  id: string; // matches reagent id or custom key if dynamically entered
  reagentId: string;
  name: string;
  concentration: string;
  quantityPerGroup: number;
  quantityTotalRequired: number;
  actualUsed?: number;
}

export interface MaterialRequirement {
  id: string; // matches material id or custom key if dynamically entered
  materialId: string;
  name: string;
  type: string;
  quantityRequired: number;
  actualUsed?: number;
}

export interface WasteRecord {
  type: 'organico' | 'inorganico' | 'inflamavel' | 'oxidante' | 'biologico';
  quantity: number;
  unit: string;
  realQuantity?: number; // Technical inputs this when finalizing
  disposalMethod?: string;
  collected?: boolean;
}

export interface Reservation {
  id: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  labId: LabId;
  professorName: string;
  practiceName: string;
  course: string;
  studentCount: number;
  benchesCount: number; // 1 to 3 benches
  reservationType?: 'aula' | 'projeto';
  selectedBenches?: number[]; // indices of benches reserved, e.g., 1, 2, 3
  status: ReservationStatus;
  reagentsNeeded: ReagentRequirement[];
  materialsNeeded: MaterialRequirement[];
  equipmentsNeeded: string[]; // Equipment IDs
  expectedWaste: WasteRecord[];
  actualWaste?: WasteRecord[];
  attachmentName?: string;
  adjustNotes?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface ControlledLog {
  id: string;
  date: string;
  reagentName: string;
  quantity: number;
  unit: string;
  purpose: string; // e.g., "Química Orgânica I" or "Análise de Cátions"
  wasteQuantity: number;
  wasteUnit: string;
  professor: string;
  technician: string;
}
