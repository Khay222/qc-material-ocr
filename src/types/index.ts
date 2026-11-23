export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Batch {
  id: number;
  batchNumber: string;
  targetQty: number;
  completedQty: number;
  mismatchCount: number;
  status: 'in_progress' | 'completed' | 'aborted';
  operatorName: string;
  operatorEmail?: string | null;
  notes?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface ScanItem {
  id?: number;
  batchId: number;
  itemIndex: number;
  material1: string;
  material2: string;
  isMatch: boolean;
  scannedAt: string;
  errorReason?: string | null;
}

export interface ValidationResult {
  isValid: boolean;
  diffIndex?: number;
  reason?: string;
}
