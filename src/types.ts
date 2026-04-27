export interface ToolData {
  rowIdx?: number;
  no: string;
  jobsite: string;
  location: string;
  category: string;
  name: string;
  specification: string;
  quantity: number;
  unit: string;
  brand: string;
  supplyDate: string;
  registerNo: string;
  status: string;
  certifiedBy: string;
  condition: 'BAIK' | 'RUSAK' | 'HILANG' | 'UNKNOWN';
  remarks: string;
}

export interface JobsiteStats {
  name: string;
  totalTools: number;
  baik: number;
  rusak: number;
  hilang: number;
}

export interface LoanData {
  rowIdx?: number;
  jobsite: string;
  loanDate: string;
  borrowerName: string;
  registerNo: string;
  toolName: string;
  status: 'DIPINJAM' | 'DIKEMBALIKAN';
}
