import * as ExcelJS from 'exceljs';

export type ExportRowData = {
  date: string;
  type: 'GELİR' | 'GİDER';
  payer: string;
  payee: string;
  department: string;
  description: string;
  amount: number;
  currency: string;
};

export async function exportToExcelWithTemplate(data: ExportRowData[], fileName: string = 'Rapor.xlsx') {
  try {
    // 1. Fetch the template file
    const response = await fetch('./template.xlsx');
    if (!response.ok) {
      throw new Error('Template file could not be loaded.');
    }
    const arrayBuffer = await response.arrayBuffer();

    // 2. Read the workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.worksheets[0];

    // 3. Write data rows starting from row 10
    let startRowNumber = 10;
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    data.forEach((item, index) => {
      const rowNum = startRowNumber + index;
      const row = worksheet.getRow(rowNum);

      let desc = item.description || '';
      if (item.currency !== 'USD' && item.currency !== 'SAR') {
        desc += ` (Not: ${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(item.amount)} ${item.currency})`;
      }

      row.getCell(1).value = item.date ? new Date(item.date).toLocaleDateString('tr-TR') : '-';
      row.getCell(2).value = item.type;
      row.getCell(3).value = item.payer || '-';
      row.getCell(4).value = item.payee || '-';
      row.getCell(5).value = item.department || '-';
      row.getCell(6).value = desc || '-';

      row.getCell(7).value = '';
      row.getCell(8).value = '';
      row.getCell(9).value = '';
      row.getCell(10).value = '';

      if (item.type === 'GELİR') {
        if (item.currency === 'SAR') {
          row.getCell(7).value = item.amount;
        } else if (item.currency === 'USD') {
          row.getCell(9).value = item.amount;
        }
      } else if (item.type === 'GİDER') {
        if (item.currency === 'SAR') {
          row.getCell(8).value = item.amount;
        } else if (item.currency === 'USD') {
          row.getCell(10).value = item.amount;
        }
      }

      for (let i = 1; i <= 10; i++) {
        const cell = row.getCell(i);
        cell.border = borderStyle;
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.font = { name: 'Arial', size: 11, bold: false };
      }
      
      row.commit();
    });

    // 4. Remove all trailing empty rows beyond the data rows
    const lastDataRowNumber = startRowNumber + data.length - 1;
    const initialRowCount = worksheet.rowCount;
    if (initialRowCount > lastDataRowNumber) {
      for (let i = initialRowCount; i > lastDataRowNumber; i--) {
        worksheet.spliceRows(i, 1);
      }
    }

    // Write file using browser buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Download using blob
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error exporting with template:', error);
    alert('Excel dışa aktarılırken bir hata oluştu: ' + (error as Error).message);
  }
}
