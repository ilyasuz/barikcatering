import fs from 'fs';
import * as XLSX from 'xlsx';

const buffer = fs.readFileSync('GELİR GİDER TABLOSU  - Kopya.xlsx');
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
for (let i = 0; i < Math.min(20, data.length); i++) {
  console.log(`Row ${i + 1}:`, data[i]);
}
