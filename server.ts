import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || "1hN2bnnGZI19C6eByXrlXRiiUmni9FtLLIVsMaq0mYAw";

let auth: any = null;
try {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
} catch (e) {
  console.error("Failed to initialize Google Auth:", e);
}

const sheets = google.sheets({ version: "v4", auth });

// --- API ROUTES ---

async function getSheetData() {
  if (!auth) {
    throw new Error("Kredensial Google belum dikonfigurasi. Silakan masukkan GOOGLE_SERVICE_ACCOUNT_CREDENTIALS di menu Settings.");
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
      userMessage = "ID Spreadsheet tidak ditemukan. Pastikan GOOGLE_SHEET_ID di Settings sudah benar.";
    } else if (error.message.includes("permission denied") || error.code === 403) {
      userMessage = "Akses ditolak. Pastikan email Service Account sudah di-Share ke Google Sheet sebagai Editor.";
    }
    
    res.status(500).json({ error: userMessage });
  }
});

app.post("/api/tools", async (req, res) => {
  try {
    if (!auth) throw new Error("Kredensial Google belum dikonfigurasi. Silakan masukkan GOOGLE_SERVICE_ACCOUNT_CREDENTIALS di menu Settings.");
    
    const { 
      jobsite, location, category, name, specification, 
      quantity, unit, brand, supplyDate, registerNo, 
      status, certifiedBy, condition, remarks 
    } = req.body;

    const baik = condition === 'BAIK' ? 'ü' : '';
    const rusak = condition === 'RUSAK' ? 'ü' : '';
    const hilang = condition === 'HILANG' ? 'ü' : '';

    const values = await getSheetData();
    const nextNo = values.length - 1;

    const newRow = [
      nextNo > 0 ? nextNo : 1,
      jobsite,
      location,
      category,
      name,
      specification,
      quantity,
      unit,
      brand,
      supplyDate,
      registerNo,
      status,
      certifiedBy,
      baik,
      rusak,
      hilang,
      remarks
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [newRow],
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/tools/:rowIdx", async (req, res) => {
  try {
    if (!auth) throw new Error("Kredensial Google belum dikonfigurasi. Silakan masukkan GOOGLE_SERVICE_ACCOUNT_CREDENTIALS di menu Settings.");
    const rowIdx = parseInt(req.params.rowIdx);
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: "ROWS",
                startIndex: rowIdx,
                endIndex: rowIdx + 1,
              },
            },
          },
        ],
      },
    });
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- VITE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Hanya jalankan listen jika tidak di lingkungan Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

// Ekspor app untuk digunakan oleh Vercel
export default app;
