import { ToolData } from '../types';

export async function fetchToolData(): Promise<ToolData[]> {
  try {
    const response = await fetch('/api/tools');
    const dataRows = await response.json();

    if (!response.ok) {
      throw new Error(dataRows.error || 'Failed to fetch tools');
    }
    
    if (!Array.isArray(dataRows)) {
      console.error('Expected array from server, got:', dataRows);
      return [];
    }
    
    // Process rows while keeping track of their original spreadsheet index (index in dataRows)
    const tools: ToolData[] = dataRows
      .map((row: any[], originalIndex: number) => ({ row, originalIndex }))
      .slice(2) // Skip first 2 header rows
      .filter((item: any) => item.row[1] && item.row[1].trim() !== '') // Filter empty rows based on Jobsite column
      .map((item: any) => {
        const { row, originalIndex } = item;
        let condition: ToolData['condition'] = 'UNKNOWN';
        if (row[13] && row[13].includes('ü')) condition = 'BAIK';
        else if (row[14] && row[14].includes('ü')) condition = 'RUSAK';
        else if (row[15] && row[15].includes('ü')) condition = 'HILANG';

        return {
          rowIdx: originalIndex, // Use the actual index in dataRows for precise deletion
          no: row[0],
          jobsite: row[1]?.trim(),
          location: row[2],
          category: row[3],
          name: row[4],
          specification: row[5],
          quantity: parseFloat(row[6]) || 0,
          unit: row[7],
          brand: row[8],
          supplyDate: row[9],
          registerNo: row[10],
          status: row[11],
          certifiedBy: row[12],
          condition,
          remarks: row[16]
        };
      });
    
    return tools;
  } catch (error: any) {
    console.error('Error fetching tool data:', error);
    throw error;
  }
}

export async function addTool(tool: Omit<ToolData, 'rowIdx' | 'no'>): Promise<boolean> {
  try {
    const response = await fetch('/api/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tool)
    });
    return response.ok;
  } catch (error) {
    console.error('Error adding tool:', error);
    return false;
  }
}

export async function deleteTool(rowIdx: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/tools/${rowIdx}`, {
      method: 'DELETE'
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting tool:', error);
    return false;
  }
}
