import { ToolData, LoanData } from '../types';

export async function fetchToolData(): Promise<ToolData[]> {
  try {
    const response = await fetch('/api/tools');
    const dataRows = await response.json();
    if (!response.ok) throw new Error(dataRows.error || 'Gagal mengambil data');
    if (!Array.isArray(dataRows)) return [];
    
    return dataRows.slice(2)
      .map((row: any[], originalIndex: number) => ({ row, originalIndex: originalIndex + 2 }))
      .filter((item: any) => item.row[1] && item.row[1].trim() !== '')
      .map((item: any) => {
        const { row, originalIndex } = item;
        let condition: ToolData['condition'] = 'UNKNOWN';
        if (row[13] && row[13].includes('ü')) condition = 'BAIK';
        else if (row[14] && row[14].includes('ü')) condition = 'RUSAK';
        else if (row[15] && row[15].includes('ü')) condition = 'HILANG';

        return {
          rowIdx: originalIndex,
          no: row[0] || '',
          jobsite: (row[1] || '').trim(),
          location: row[2] || '',
          category: row[3] || '',
          name: row[4] || '',
          specification: row[5] || '',
          quantity: parseFloat(row[6]) || 0,
          unit: row[7] || '',
          brand: row[8] || '',
          supplyDate: row[9] || '',
          registerNo: row[10] || '',
          status: row[11] || '',
          certifiedBy: row[12] || '',
          condition,
          remarks: row[16] || ''
        };
      });
  } catch (error) {
    console.error('Error fetching tools:', error);
    throw error;
  }
}

export async function fetchLoanData(): Promise<LoanData[]> {
  try {
    const response = await fetch('/api/loans');
    const dataRows = await response.json();
    if (!response.ok) throw new Error(dataRows.error || 'Gagal mengambil data pinjaman');
    if (!Array.isArray(dataRows)) return [];

    return dataRows.slice(1)
      .map((row: any[], idx: number) => ({ row, originalIdx: idx + 1 }))
      .filter((item: any) => item.row[2] && item.row[2].trim() !== '') // Filter based on Borrower Name (column C)
      .map((item: any) => ({
        rowIdx: item.originalIdx,
        jobsite: item.row[0] || '',
        loanDate: item.row[1] || '',
        borrowerName: item.row[2] || '',
        registerNo: item.row[3] || '',
        toolName: item.row[4] || '',
        status: (item.row[5] || 'DIPINJAM') as LoanData['status']
      }));
  } catch (error) {
    console.error('Error fetching loans:', error);
    throw error;
  }
}

export async function addLoan(loan: Omit<LoanData, 'rowIdx'>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loan)
    });
    const data = await response.json();
    return { success: response.ok, error: data.error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteLoan(rowIdx: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/loans/${rowIdx}`, { method: 'DELETE' });
    const data = await response.json();
    return { success: response.ok, error: data.error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateLoan(rowIdx: number, loan: Omit<LoanData, 'rowIdx'>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/loans/${rowIdx}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loan)
    });
    const data = await response.json();
    return { success: response.ok, error: data.error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addTool(tool: Omit<ToolData, 'rowIdx' | 'no'>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tool)
    });
    
    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || 'Gagal menambahkan data' };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error adding tool:', error);
    return { success: false, error: error.message || 'Koneksi ke server gagal' };
  }
}

export async function deleteTool(rowIdx: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/tools/${rowIdx}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || 'Terjadi kesalahan sistem' };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting tool:', error);
    return { success: false, error: error.message || 'Koneksi ke server gagal' };
  }
}

