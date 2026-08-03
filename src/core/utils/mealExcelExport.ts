import * as ExcelJS from 'exceljs';
import type { MealCalculation } from '../../modules/meals/types';
import { getExcursionsFromMeal } from '../../modules/meals/types';

export type MealExportTemplate = 'standard' | 'daily' | 'excursion' | 'corporate';

export async function exportMealToExcel(
  meal: MealCalculation,
  template: MealExportTemplate = 'standard',
  fileName?: string
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Yemek Hesap Tablosu');

  // Page Setup for Printing
  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1;
  worksheet.pageSetup.fitToHeight = 0;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  const excursions = getExcursionsFromMeal(meal);
  const totalExcursionDays = excursions.reduce((sum, item) => sum + (item.days || 0), 0);
  const grossDays = meal.total_days + totalExcursionDays;
  const dailyPrice = (meal.morning_price || 0) + (meal.evening_price || 0);
  const costPerDayAllPax = meal.pax_count * dailyPrice;
  const deductionAmount = totalExcursionDays * costPerDayAllPax;

  // Primary Branding Colors
  const headerBgColor = '1F2937'; // Dark Slate
  const headerTextColor = 'FFFFFF';
  const subHeaderBgColor = '374151';
  const accentRedBg = 'FEF2F2';
  const accentRedText = 'DC2626';
  const zebraBg = 'F9FAFB';

  const defaultBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'D1D5DB' } },
    left: { style: 'thin', color: { argb: 'D1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
    right: { style: 'thin', color: { argb: 'D1D5DB' } }
  };

  // Header Title Row
  worksheet.mergeCells('A1:N1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'OSMANLI MUTFAĞI UMRE ACENTA GİRİŞ-ÇIKIŞ HESAP TABLOSU';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: '1E3A8A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:N2');
  const titleArCell = worksheet.getCell('A2');
  titleArCell.value = 'المطبخ العثماني - حاسبة وجبات وجداول دخول وخروج مجموعات العمرة';
  titleArCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: '1E3A8A' } };
  titleArCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]); // Blank row 3

  if (template === 'standard' || template === 'corporate') {
    // -------------------------------------------------------------
    // TEMPLATE 1 & TEMPLATE 4: STANDARD & CORPORATE TEMPLATES
    // -------------------------------------------------------------
    
    // Turkish Header (Row 4)
    const headerTr = worksheet.getRow(4);
    const trTitles = [
      'ŞİRKET ADI', 'OTEL ADI', 'GİRİŞ TARİHİ', 'SABAH', 'AKŞAM',
      'ÇIKIŞ TARİHİ', 'SABAH', 'AKŞAM', 'KİŞİ SAYISI', 'BRÜT GÜN',
      'GEZİ DÜŞÜŞÜ', 'SABAH FİYAT', 'AKŞAM FİYAT', 'TOPLAM TUTAR'
    ];
    headerTr.values = trTitles;
    headerTr.font = { name: 'Arial', size: 10, bold: true, color: { argb: headerTextColor } };
    headerTr.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerTr.height = 28;

    trTitles.forEach((_, colIdx) => {
      const cell = headerTr.getCell(colIdx + 1);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colIdx === 10 ? '991B1B' : headerBgColor }
      };
      cell.border = defaultBorder;
    });

    // Arabic Header (Row 5)
    const headerAr = worksheet.getRow(5);
    const arTitles = [
      '(اسم الشركة)', '(اسم الفندق)', '(تاريخ الدخول)', '(صباح)', '(مساء)',
      '(تاريخ الخروج)', '(صباح)', '(مساء)', '(عدد الأشخاص)', '(عدد الأيام)',
      '(خصم الرحلة)', '(سعر الصباح)', '(سعر المساء)', '(المبلغ الإجمالي)'
    ];
    headerAr.values = arTitles;
    headerAr.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'E5E7EB' } };
    headerAr.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerAr.height = 24;

    arTitles.forEach((_, colIdx) => {
      const cell = headerAr.getCell(colIdx + 1);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colIdx === 10 ? '7F1D1D' : subHeaderBgColor }
      };
      cell.border = defaultBorder;
    });

    // Data Row (Row 6)
    const dataRow = worksheet.getRow(6);
    dataRow.values = [
      meal.company_name || 'Bilinmiyor',
      meal.hotel_name,
      formatDate(meal.entry_date),
      meal.entry_morning > 0 ? 0.5 : '-',
      meal.entry_evening > 0 ? 0.5 : '-',
      formatDate(meal.exit_date),
      meal.exit_morning > 0 ? 0.5 : '-',
      meal.exit_evening > 0 ? 0.5 : '-',
      meal.pax_count,
      grossDays,
      totalExcursionDays > 0 ? totalExcursionDays : '-',
      meal.morning_price,
      meal.evening_price,
      meal.total_amount
    ];
    dataRow.height = 28;
    dataRow.font = { name: 'Arial', size: 11, bold: true };
    dataRow.alignment = { horizontal: 'center', vertical: 'middle' };

    for (let i = 1; i <= 14; i++) {
      const cell = dataRow.getCell(i);
      cell.border = defaultBorder;
      if (i === 12 || i === 13 || i === 14) {
        cell.numFmt = `#,##0.00 "${meal.currency}"`;
      }
      if (i === 11 && totalExcursionDays > 0) {
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: accentRedText } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: accentRedBg } };
      }
    }

    let nextRow = 8;

    // Excursion Detail Notes if Excursions exist
    if (excursions.length > 0) {
      worksheet.mergeCells(`A${nextRow}:N${nextRow}`);
      const excTitle = worksheet.getCell(`A${nextRow}`);
      excTitle.value = 'GEZİ / KESİNTİ DÜŞÜŞ DETAYLARI (تفاصيل الخصومات والرحلات)';
      excTitle.font = { name: 'Arial', size: 11, bold: true, color: { argb: '991B1B' } };
      excTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
      excTitle.border = defaultBorder;
      nextRow++;

      excursions.forEach((exc, idx) => {
        const row = worksheet.getRow(nextRow);
        row.values = [
          `${idx + 1}. Gezi / Düşüş`,
          `Başlangıç: ${formatDate(exc.start_date)} (تاريخ البدء)`,
          `Bitiş: ${formatDate(exc.end_date)} (تاريخ الانتهاء)`,
          `Süre: ${exc.days} Gün (عدد الأيام)`,
          `Açıklama: ${exc.note || '-'} (ملاحظات)`
        ];
        row.font = { name: 'Arial', size: 10 };
        nextRow++;
      });
      nextRow++;
    }

    if (template === 'corporate') {
      // Add Stamp & Signature Rows for Corporate Approval Template
      nextRow += 2;
      worksheet.mergeCells(`A${nextRow}:F${nextRow}`);
      const signLeftHeader = worksheet.getCell(`A${nextRow}`);
      signLeftHeader.value = 'HAZIRLAYAN / TESLİM EDEN (إعداد وتكليف الخدمة)';
      signLeftHeader.font = { name: 'Arial', size: 11, bold: true, color: { argb: headerBgColor } };
      signLeftHeader.alignment = { horizontal: 'center' };

      worksheet.mergeCells(`I${nextRow}:N${nextRow}`);
      const signRightHeader = worksheet.getCell(`I${nextRow}`);
      signRightHeader.value = 'KONTROL EDEN / ACENTA ONAYI (مراجعة واعتماد الوكالة)';
      signRightHeader.font = { name: 'Arial', size: 11, bold: true, color: { argb: headerBgColor } };
      signRightHeader.alignment = { horizontal: 'center' };
      nextRow++;

      // Empty stamp boxes
      for (let r = 0; r < 4; r++) {
        worksheet.mergeCells(`A${nextRow}:F${nextRow}`);
        worksheet.mergeCells(`I${nextRow}:N${nextRow}`);
        const cLeft = worksheet.getCell(`A${nextRow}`);
        const cRight = worksheet.getCell(`I${nextRow}`);
        cLeft.border = defaultBorder;
        cRight.border = defaultBorder;
        if (r === 3) {
          cLeft.value = 'İmza & Kaşe (التوقيع والختم)';
          cRight.value = 'İmza & Kaşe (التوقيع والختم)';
          cLeft.font = { name: 'Arial', size: 9, italic: true, color: { argb: '6B7280' } };
          cRight.font = { name: 'Arial', size: 9, italic: true, color: { argb: '6B7280' } };
          cLeft.alignment = { horizontal: 'center', vertical: 'bottom' };
          cRight.alignment = { horizontal: 'center', vertical: 'bottom' };
        }
        nextRow++;
      }
    }
  } else if (template === 'daily') {
    // -------------------------------------------------------------
    // TEMPLATE 2: DAILY VARIABLE PAX BREAKDOWN (GÜN GÜN PAX TABLOSU)
    // -------------------------------------------------------------
    
    // Info Block
    worksheet.mergeCells('A4:D4');
    worksheet.getCell('A4').value = `Şirket / Acenta: ${meal.company_name || '-'}`;
    worksheet.getCell('A4').font = { bold: true, size: 11 };

    worksheet.mergeCells('E4:H4');
    worksheet.getCell('E4').value = `Otel Adı: ${meal.hotel_name}`;
    worksheet.getCell('E4').font = { bold: true, size: 11 };

    worksheet.mergeCells('I4:L4');
    worksheet.getCell('I4').value = `Tarih: ${formatDate(meal.entry_date)} - ${formatDate(meal.exit_date)}`;
    worksheet.getCell('I4').font = { bold: true, size: 11 };

    // Daily Table Headers (Row 6 TR, Row 7 AR)
    const headerTr = worksheet.getRow(6);
    headerTr.values = [
      'GÜN NO', 'TARİH', 'GÜN', 'SABAH PAX', 'AKŞAM PAX',
      'SABAH FİYAT', 'AKŞAM FİYAT', 'GÜNLÜK TOPLAM TUTAR'
    ];
    headerTr.font = { name: 'Arial', size: 10, bold: true, color: { argb: headerTextColor } };
    headerTr.alignment = { horizontal: 'center', vertical: 'middle' };
    headerTr.height = 24;

    for (let i = 1; i <= 8; i++) {
      const cell = headerTr.getCell(i);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgColor } };
      cell.border = defaultBorder;
    }

    const headerAr = worksheet.getRow(7);
    headerAr.values = [
      '(رقم اليوم)', '(التاريخ)', '(اليوم)', '(عدد أشخاص الصباح)', '(عدد أشخاص المساء)',
      '(سعر الصباح)', '(سعر المساء)', '(المبلغ اليومي الإجمالي)'
    ];
    headerAr.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'E5E7EB' } };
    headerAr.alignment = { horizontal: 'center', vertical: 'middle' };
    headerAr.height = 22;

    for (let i = 1; i <= 8; i++) {
      const cell = headerAr.getCell(i);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: subHeaderBgColor } };
      cell.border = defaultBorder;
    }

    let nextRow = 8;
    const start = new Date(meal.entry_date);
    const end = new Date(meal.exit_date);
    let dayCount = 1;
    let grandMorningPaxSum = 0;
    let grandEveningPaxSum = 0;
    let grandAmountSum = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      let mPax = meal.pax_count;
      let ePax = meal.pax_count;

      if (meal.is_variable_pax && meal.daily_pax && meal.daily_pax.length > 0) {
        const found = meal.daily_pax.find(p => p.date === dateStr);
        if (found) {
          mPax = found.morning_pax ?? found.pax ?? meal.pax_count;
          ePax = found.evening_pax ?? found.pax ?? meal.pax_count;
        }
      }

      const dayNameTr = d.toLocaleDateString('tr-TR', { weekday: 'long' });
      const dayNameAr = d.toLocaleDateString('ar-SA', { weekday: 'long' });
      const dailyTotal = (mPax * (meal.morning_price || 0)) + (ePax * (meal.evening_price || 0));

      grandMorningPaxSum += mPax;
      grandEveningPaxSum += ePax;
      grandAmountSum += dailyTotal;

      const r = worksheet.getRow(nextRow);
      r.values = [
        `${dayCount}. Gün`,
        formatDate(dateStr),
        `${dayNameTr} / ${dayNameAr}`,
        mPax,
        ePax,
        meal.morning_price,
        meal.evening_price,
        dailyTotal
      ];
      r.alignment = { horizontal: 'center', vertical: 'middle' };
      r.font = { name: 'Arial', size: 10 };

      for (let i = 1; i <= 8; i++) {
        const cell = r.getCell(i);
        cell.border = defaultBorder;
        if (i === 6 || i === 7 || i === 8) {
          cell.numFmt = `#,##0.00 "${meal.currency}"`;
        }
        if (nextRow % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        }
      }

      dayCount++;
      nextRow++;
    }

    // Grand Totals Row
    const totRow = worksheet.getRow(nextRow);
    totRow.values = [
      'GENEL TOPLAM / الإجمالي',
      '',
      '',
      grandMorningPaxSum,
      grandEveningPaxSum,
      '',
      '',
      grandAmountSum
    ];
    totRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: headerTextColor } };
    totRow.alignment = { horizontal: 'center', vertical: 'middle' };
    totRow.height = 28;

    for (let i = 1; i <= 8; i++) {
      const cell = totRow.getCell(i);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgColor } };
      cell.border = defaultBorder;
      if (i === 8) cell.numFmt = `#,##0.00 "${meal.currency}"`;
    }
  } else if (template === 'excursion') {
    // -------------------------------------------------------------
    // TEMPLATE 3: EXCURSION DEDUCTIONS DETAILED (GEZİ DÜŞÜŞ DETAYI)
    // -------------------------------------------------------------

    // Gross Stay Summary Table
    const trTitles = [
      'ŞİRKET ADI', 'OTEL ADI', 'GİRİŞ TARİHİ', 'ÇIKIŞ TARİHİ',
      'BRÜT GÜN', 'KİŞİ SAYISI', 'GÜNLÜK KİŞİ BAŞI FİYAT', 'BRÜT TOPLAM TUTAR'
    ];
    const headerTr = worksheet.getRow(4);
    headerTr.values = trTitles;
    headerTr.font = { name: 'Arial', size: 10, bold: true, color: { argb: headerTextColor } };
    headerTr.alignment = { horizontal: 'center', vertical: 'middle' };
    headerTr.height = 24;

    for (let i = 1; i <= 8; i++) {
      const cell = headerTr.getCell(i);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgColor } };
      cell.border = defaultBorder;
    }

    const arTitles = [
      '(اسم الشركة)', '(اسم الفندق)', '(تاريخ الدخول)', '(تاريخ الخروج)',
      '(عدد الأيام الإجمالي)', '(عدد الأشخاص)', '(السعر اليومي للشخص)', '(المبلغ الإجمالي قبل الخصم)'
    ];
    const headerAr = worksheet.getRow(5);
    headerAr.values = arTitles;
    headerAr.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'E5E7EB' } };
    headerAr.alignment = { horizontal: 'center', vertical: 'middle' };
    headerAr.height = 22;

    for (let i = 1; i <= 8; i++) {
      const cell = headerAr.getCell(i);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: subHeaderBgColor } };
      cell.border = defaultBorder;
    }

    const grossAmount = grossDays * costPerDayAllPax;

    const dataRow = worksheet.getRow(6);
    dataRow.values = [
      meal.company_name || '-',
      meal.hotel_name,
      formatDate(meal.entry_date),
      formatDate(meal.exit_date),
      grossDays,
      meal.pax_count,
      dailyPrice,
      grossAmount
    ];
    dataRow.font = { name: 'Arial', size: 11, bold: true };
    dataRow.alignment = { horizontal: 'center', vertical: 'middle' };
    dataRow.height = 26;

    for (let i = 1; i <= 8; i++) {
      const cell = dataRow.getCell(i);
      cell.border = defaultBorder;
      if (i === 7 || i === 8) cell.numFmt = `#,##0.00 "${meal.currency}"`;
    }

    // Excursion Deductions Section Header
    worksheet.mergeCells('A8:H8');
    const excHead = worksheet.getCell('A8');
    excHead.value = 'GEZİ VE YEMEK KESİNTİSİ DÖKÜM DETAYLARI (تفاصيل خصومات الرحلات والوجبات)';
    excHead.font = { name: 'Arial', size: 11, bold: true, color: { argb: '991B1B' } };
    excHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
    excHead.alignment = { horizontal: 'center', vertical: 'middle' };
    excHead.height = 26;
    excHead.border = defaultBorder;

    const excTrHeader = worksheet.getRow(9);
    excTrHeader.values = [
      'GEZİ NO', 'BAŞLANGIÇ TARİHİ', 'BİTİŞ TARİHİ', 'KESİNTİ GÜN SAYISI',
      'ETKİLENEN KİŞİ SAYISI', 'GÜNLÜK KESİNTİ TUTARI', 'KESİNTİ AÇIKLAMASI', 'TOPLAM KESİNTİ TUTARI'
    ];
    excTrHeader.font = { name: 'Arial', size: 9, bold: true, color: { argb: headerTextColor } };
    excTrHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    excTrHeader.height = 22;

    for (let i = 1; i <= 8; i++) {
      const cell = excTrHeader.getCell(i);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '991B1B' } };
      cell.border = defaultBorder;
    }

    let nextRow = 10;
    let totalDeductionSum = 0;

    excursions.forEach((exc, idx) => {
      const dAmount = (exc.days || 0) * costPerDayAllPax;
      totalDeductionSum += dAmount;

      const r = worksheet.getRow(nextRow);
      r.values = [
        `${idx + 1}. Gezi / Düşüş`,
        formatDate(exc.start_date),
        formatDate(exc.end_date),
        `${exc.days} Gün`,
        meal.pax_count,
        costPerDayAllPax,
        exc.note || '-',
        -dAmount
      ];
      r.alignment = { horizontal: 'center', vertical: 'middle' };
      r.font = { name: 'Arial', size: 10 };

      for (let i = 1; i <= 8; i++) {
        const cell = r.getCell(i);
        cell.border = defaultBorder;
        if (i === 6 || i === 8) {
          cell.numFmt = `#,##0.00 "${meal.currency}"`;
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: accentRedText } };
        }
      }
      nextRow++;
    });

    // Net Summary Rows
    nextRow++;
    const netSummaryRows = [
      ['BRÜT TUTAR (الإجمالي قبل الخصم)', grossAmount],
      ['TOPLAM GEZİ DÜŞÜŞÜ (إجمالي خصم الرحلات)', -deductionAmount],
      ['NET ÖDENECEK TUTAR (المبلغ الصافي المستحق)', meal.total_amount]
    ];

    netSummaryRows.forEach((sRow, idx) => {
      const r = worksheet.getRow(nextRow);
      r.values = ['', '', '', '', '', '', sRow[0], sRow[1]];
      r.height = 26;

      const cLabel = r.getCell(7);
      const cVal = r.getCell(8);
      cLabel.font = { name: 'Arial', size: 11, bold: true };
      cVal.font = { name: 'Arial', size: 12, bold: true };
      cLabel.alignment = { horizontal: 'right', vertical: 'middle' };
      cVal.alignment = { horizontal: 'right', vertical: 'middle' };
      cLabel.border = defaultBorder;
      cVal.border = defaultBorder;
      cVal.numFmt = `#,##0.00 "${meal.currency}"`;

      if (idx === 2) {
        cLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
        cVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
        cVal.font = { name: 'Arial', size: 13, bold: true, color: { argb: '065F46' } };
      }

      nextRow++;
    });
  }

  // Column Width Auto-Fitting
  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? String(cell.value).length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(maxLength + 4, 30);
  });

  // Write and Save File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  
  const saveName = fileName || `${meal.company_name || 'Yemek'}_${meal.hotel_name}_${template}.xlsx`;
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = saveName;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export async function exportBatchMealsToExcel(
  meals: MealCalculation[],
  template: MealExportTemplate = 'standard',
  fileName: string = 'Toplu_Yemek_Hesaplari_Raporu.xlsx'
) {
  if (!meals || meals.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Toplu Yemek Hesapları');

  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  const headerBgColor = '1F2937';
  const headerTextColor = 'FFFFFF';
  const subHeaderBgColor = '374151';
  const accentRedBg = 'FEF2F2';
  const accentRedText = 'DC2626';
  const zebraBg = 'F9FAFB';

  const defaultBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'D1D5DB' } },
    left: { style: 'thin', color: { argb: 'D1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
    right: { style: 'thin', color: { argb: 'D1D5DB' } }
  };

  // Header Title
  worksheet.mergeCells('A1:N1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'OSMANLI MUTFAĞI UMRE ACENTA GİRİŞ-ÇIKIŞ HESAP TABLOSU (TOPLU DÖKÜM)';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: '1E3A8A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:N2');
  const titleArCell = worksheet.getCell('A2');
  titleArCell.value = 'المطبخ العثماني - حاسبة وجبات وجداول دخول وخروج مجموعات العمرة (كشف جماعي)';
  titleArCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: '1E3A8A' } };
  titleArCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Turkish Header (Row 4)
  const headerTr = worksheet.getRow(4);
  const trTitles = [
    'ŞİRKET ADI', 'OTEL ADI', 'GİRİŞ TARİHİ', 'SABAH', 'AKŞAM',
    'ÇIKIŞ TARİHİ', 'SABAH', 'AKŞAM', 'KİŞİ SAYISI', 'BRÜT GÜN',
    'GEZİ DÜŞÜŞÜ', 'SABAH FİYAT', 'AKŞAM FİYAT', 'TOPLAM TUTAR'
  ];
  headerTr.values = trTitles;
  headerTr.font = { name: 'Arial', size: 10, bold: true, color: { argb: headerTextColor } };
  headerTr.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerTr.height = 28;

  trTitles.forEach((_, colIdx) => {
    const cell = headerTr.getCell(colIdx + 1);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colIdx === 10 ? '991B1B' : headerBgColor }
    };
    cell.border = defaultBorder;
  });

  // Arabic Header (Row 5)
  const headerAr = worksheet.getRow(5);
  const arTitles = [
    '(اسم الشركة)', '(اسم الفندق)', '(تاريخ الدخول)', '(صباح)', '(مساء)',
    '(تاريخ الخروج)', '(صباح)', '(مساء)', '(عدد الأشخاص)', '(عدد الأيام)',
    '(خصم الرحلة)', '(سعر الصباح)', '(سعر المساء)', '(المبلغ الإجمالي)'
  ];
  headerAr.values = arTitles;
  headerAr.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'E5E7EB' } };
  headerAr.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerAr.height = 24;

  arTitles.forEach((_, colIdx) => {
    const cell = headerAr.getCell(colIdx + 1);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colIdx === 10 ? '7F1D1D' : subHeaderBgColor }
    };
    cell.border = defaultBorder;
  });

  let nextRow = 6;
  let totalPaxSum = 0;
  let totalGrossDaysSum = 0;
  let totalExcursionDaysSum = 0;
  const totalsByCurrency: Record<string, number> = {};

  meals.forEach((meal, idx) => {
    const excursions = getExcursionsFromMeal(meal);
    const totalExcursionDays = excursions.reduce((sum, item) => sum + (item.days || 0), 0);
    const grossDays = meal.total_days + totalExcursionDays;

    totalPaxSum += meal.pax_count;
    totalGrossDaysSum += grossDays;
    totalExcursionDaysSum += totalExcursionDays;

    if (!totalsByCurrency[meal.currency]) totalsByCurrency[meal.currency] = 0;
    totalsByCurrency[meal.currency] += meal.total_amount;

    const row = worksheet.getRow(nextRow);
    row.values = [
      meal.company_name || 'Bilinmiyor',
      meal.hotel_name,
      formatDate(meal.entry_date),
      meal.entry_morning > 0 ? 0.5 : '-',
      meal.entry_evening > 0 ? 0.5 : '-',
      formatDate(meal.exit_date),
      meal.exit_morning > 0 ? 0.5 : '-',
      meal.exit_evening > 0 ? 0.5 : '-',
      meal.pax_count,
      grossDays,
      totalExcursionDays > 0 ? totalExcursionDays : '-',
      meal.morning_price,
      meal.evening_price,
      meal.total_amount
    ];
    row.height = 26;
    row.font = { name: 'Arial', size: 10 };
    row.alignment = { horizontal: 'center', vertical: 'middle' };

    for (let i = 1; i <= 14; i++) {
      const cell = row.getCell(i);
      cell.border = defaultBorder;
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
      }
      if (i === 12 || i === 13 || i === 14) {
        cell.numFmt = `#,##0.00 "${meal.currency}"`;
      }
      if (i === 11 && totalExcursionDays > 0) {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: accentRedText } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: accentRedBg } };
      }
    }
    nextRow++;
  });

  // Grand Total Summary Row
  const totalSummaryText = Object.entries(totalsByCurrency)
    .map(([curr, amt]) => `${amt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${curr}`)
    .join(' | ');

  const totRow = worksheet.getRow(nextRow);
  totRow.values = [
    'GENEL TOPLAM / الإجمالي',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totalPaxSum,
    totalGrossDaysSum,
    totalExcursionDaysSum > 0 ? totalExcursionDaysSum : '-',
    '',
    '',
    totalSummaryText
  ];
  totRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: headerTextColor } };
  totRow.alignment = { horizontal: 'center', vertical: 'middle' };
  totRow.height = 30;

  for (let i = 1; i <= 14; i++) {
    const cell = totRow.getCell(i);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgColor } };
    cell.border = defaultBorder;
  }

  if (template === 'corporate') {
    nextRow += 2;
    worksheet.mergeCells(`A${nextRow}:F${nextRow}`);
    const signLeftHeader = worksheet.getCell(`A${nextRow}`);
    signLeftHeader.value = 'HAZIRLAYAN / TESLİM EDEN (إعداد وتكليف الخدمة)';
    signLeftHeader.font = { name: 'Arial', size: 11, bold: true, color: { argb: headerBgColor } };
    signLeftHeader.alignment = { horizontal: 'center' };

    worksheet.mergeCells(`I${nextRow}:N${nextRow}`);
    const signRightHeader = worksheet.getCell(`I${nextRow}`);
    signRightHeader.value = 'KONTROL EDEN / ACENTA ONAYI (مراجعة واعتماد الوكالة)';
    signRightHeader.font = { name: 'Arial', size: 11, bold: true, color: { argb: headerBgColor } };
    signRightHeader.alignment = { horizontal: 'center' };
    nextRow++;

    for (let r = 0; r < 4; r++) {
      worksheet.mergeCells(`A${nextRow}:F${nextRow}`);
      worksheet.mergeCells(`I${nextRow}:N${nextRow}`);
      const cLeft = worksheet.getCell(`A${nextRow}`);
      const cRight = worksheet.getCell(`I${nextRow}`);
      cLeft.border = defaultBorder;
      cRight.border = defaultBorder;
      if (r === 3) {
        cLeft.value = 'İmza & Kaşe (التوقيع والختم)';
        cRight.value = 'İmza & Kaşe (التوقيع والختم)';
        cLeft.font = { name: 'Arial', size: 9, italic: true, color: { argb: '6B7280' } };
        cRight.font = { name: 'Arial', size: 9, italic: true, color: { argb: '6B7280' } };
        cLeft.alignment = { horizontal: 'center', vertical: 'bottom' };
        cRight.alignment = { horizontal: 'center', vertical: 'bottom' };
      }
      nextRow++;
    }
  }

  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? String(cell.value).length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(maxLength + 4, 32);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
