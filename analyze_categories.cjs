const XLSX = require('xlsx');

try {
  const filePath = 'GELİR GİDER TABLOSU  - Kopya.xlsx';
  const workbook = XLSX.readFile(filePath);
  
  const categories = {};
  
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
    
    data.forEach(row => {
      // Row must have enough columns and look like a transaction row (starts with date usually, but we can just check if row[4] exists and row[1] includes GELİR or GİDER)
      const type = String(row[1]).toUpperCase();
      if (type.includes('GELİR') || type.includes('GELIR') || type.includes('GİDER') || type.includes('GIDER') || type.includes('Gİ,DER')) {
        let cat = String(row[4]).trim();
        if (cat && cat !== 'undefined' && cat !== 'null') {
          cat = cat.toUpperCase();
          categories[cat] = (categories[cat] || 0) + 1;
        }
      }
    });
  });
  
  // Sort by frequency
  const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  
  console.log('Top DEPARTMAN entries:');
  sorted.slice(0, 50).forEach(([cat, count]) => {
    console.log(`${count}x : ${cat}`);
  });
} catch (e) {
  console.error('Error:', e.message);
}
