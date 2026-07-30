import ExcelJS from 'exceljs';

async function test() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('public/template.xlsx');
  const worksheet = workbook.worksheets[0];

  const totalRows = worksheet.rowCount;
  for (let i = 10; i <= totalRows; i++) {
    const row = worksheet.getRow(i);
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.value = null;
      // also remove border/fill if needed
      cell.border = {};
      cell.fill = {};
    });
  }

  console.log('Row 11 after:', worksheet.getRow(11).values);
}

test();
