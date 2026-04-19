import Papa from 'papaparse';
import { ToolData } from '../types';

const SHEET_ID = '1hN2bnnGZI19C6eByXrlXRiiUmni9FtLLIVsMaq0mYAw';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

export async function fetchToolData(): Promise<ToolData[]> {
  try {
    const response = await fetch(CSV_URL);
    const csvString = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvString, {
        complete: (results) => {
          // Skip first 2 rows (header and sub-header)
          const dataRows = results.data.slice(2) as string[][];
          
          const tools: ToolData[] = dataRows
            .filter(row => row[1] && row[1].trim() !== '') // Filter empty rows
            .map(row => {
              let condition: ToolData['condition'] = 'UNKNOWN';
              if (row[13] && row[13].includes('ü')) condition = 'BAIK';
              else if (row[14] && row[14].includes('ü')) condition = 'RUSAK';
              else if (row[15] && row[15].includes('ü')) condition = 'HILANG';

              return {
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
          
          resolve(tools);
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching tool data:', error);
    return [];
  }
}
