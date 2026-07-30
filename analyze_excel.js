const XLSX = require('xlsx');
const fs = require('fs');

try {
  const filePath = 'GELİR GİDER TABLOSU  - Kopya.xlsx';
  const workbook = XLSX.readFile(filePath);
  
  console.log(`Workbook contains ${workbook.SheetNames.length} sheets:`);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- SHEET: ${sheetName} ---`);
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to json
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
    
    if (data.length === 0) {
      console.log('  (Empty sheet)');
      return;
    }
    
    console.log(`Total Rows: ${data.length}`);
    console.log('Top 5 rows (Headers/Data):');
    for (let i = 0; i < Math.min(5, data.length); i++) {
      console.log(` Row ${i+1}:`, data[i]);
    }
  });
} catch (e) {
  console.error('Error reading excel:', e.message);
}
