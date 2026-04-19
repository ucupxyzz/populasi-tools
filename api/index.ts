import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Jalur cek kesehatan untuk testing
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API is alive" });
});

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || "1hN2bnnGZI19C6eByXrlXRiiUmni9FtLLIVsMaq0mYAw";

let auth: any = null;
try {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
    let credentialsRaw = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
    
    // Perbaikan untuk masalah karakter newline yang sering terjadi di env vars
    const credentials = JSON.parse(credentialsRaw);
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
    
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
} catch (e: any) {
  console.error("Gagal memproses GOOGLE_SERVICE_ACCOUNT_CREDENTIALS:", e.message);
}

const sheets = google.sheets({ version: "v4", auth });

async function getSheetData() {
  if (!auth) {
    throw new Error("Kredensial Google belum dikonfigurasi di Environment Variables Vercel.");
  }
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "A:Q",
  });
  return response.data.values || [];
}

app.get("/api/tools", async (req, res) => {
  try {
    const values = await getSheetData();
    res.json(values);
  } catch (error: any) {
    console.error("Fetch Error:", error.message);
    let userMessage = error.message;
    
    if (error.message.includes("Requested entity was not found") || error.code === 404) {
      userMessage = "ID Spreadsheet tidak ditemukan. Pastikan GOOGLE_SHEET_ID sudah benar.";
    } else if (error.message.includes("permission denied") || error.code === 403) {
      userMessage = "Akses ditolak. Share Google Sheet ke email Service Account sebagai Editor.";
    }
    
    res.status(500).json({ error: userMessage });
  }
});

app.post("/api/tools", async (req, res) => {
  try {
    if (!auth) throw new Error("Kredensial belum dikonfigurasi.");
    const values = await getSheetData();
    const nextNo = values.length - 1;

    const { 
      jobsite, location, category, name, specification, 
      quantity, unit, brand, supplyDate, registerNo, 
      status, certifiedBy, condition, remarks 
    } = req.body;

    const newRow = [
      nextNo > 0 ? nextNo : 1,
      jobsite, location, category, name, specification,
      quantity, unit, brand, supplyDate, registerNo,
      status, certifiedBy,
      condition === 'BAIK' ? 'ü' : '',
      condition === 'RUSAK' ? 'ü' : '',
      condition === 'HILANG' ? 'ü' : '',
      remarks
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] },
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/tools/:rowIdx", async (req, res) => {
  try {
    if (!auth) throw new Error("Kredensial belum dikonfigurasi.");
    const rowIdx = parseInt(req.params.rowIdx);
    
    // Ambil metadata spreadsheet untuk mendapatkan sheetId yang benar
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId;
    
    if (sheetId === undefined || sheetId === null) {
      throw new Error("Tidak dapat menemukan ID Lembar (Sheet ID).");
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: { 
              sheetId: sheetId, 
              dimension: "ROWS", 
              startIndex: rowIdx, 
              endIndex: rowIdx + 1 
            }
          }
        }]
      },
    });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete Error:", error.message);
    res.status(500).json({ error: error.message || "Gagal menghapus data dari Google Sheets" });
  }
});

export default app;
