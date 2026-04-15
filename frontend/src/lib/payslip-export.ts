import type { PayslipLineItemRecord, PayslipRecord } from './api/payroll';
import { API_BASE_URL } from './api/types';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-CA') : '-';
}

function getAssetUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads')) return `${API_BASE_URL}${path}`;
  if (path.startsWith('uploads/')) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}/uploads/${path.replace(/^\//, '')}`;
}

function uniqueLines(lines: Array<string | null | undefined>) {
  const seen = new Set<string>();
  return lines.filter((line): line is string => {
    if (!line) return false;
    const normalized = line.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function amountToWords(amount: number) {
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertHundreds = (num: number): string => {
    let result = '';
    if (num > 99) {
      result += `${ones[Math.floor(num / 100)]} Hundred `;
      num %= 100;
    }
    if (num > 19) {
      result += `${tens[Math.floor(num / 10)]} `;
      num %= 10;
    }
    if (num > 0) {
      result += `${ones[num]} `;
    }
    return result.trim();
  };

  const convertNumber = (num: number): string => {
    if (num === 0) return 'Zero';

    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const remainder = num;

    const parts: string[] = [];
    if (crore) parts.push(`${convertHundreds(crore)} Crore`);
    if (lakh) parts.push(`${convertHundreds(lakh)} Lakh`);
    if (thousand) parts.push(`${convertHundreds(thousand)} Thousand`);
    if (remainder) parts.push(convertHundreds(remainder));
    return parts.join(' ').trim();
  };

  const rounded = Number(amount.toFixed(2));
  const rupees = Math.floor(rounded);
  const paisa = Math.round((rounded - rupees) * 100);

  const rupeeWords = convertNumber(rupees);
  if (!paisa) {
    return `${rupeeWords} Rupees Only`;
  }

  return `${rupeeWords} Rupees and ${convertNumber(paisa)} Paisa Only`;
}

function buildSideBySideRows(earnings: PayslipLineItemRecord[], deductions: PayslipLineItemRecord[]) {
  const rows = Math.max(earnings.length, deductions.length, 4);
  const result: string[] = [];

  for (let index = 0; index < rows; index += 1) {
    const earning = earnings[index];
    const deduction = deductions[index];
    result.push(`
      <tr>
        <td>${escapeHtml(earning?.title || '')}</td>
        <td class="amount">${earning ? escapeHtml(formatCurrency(earning.amount)) : ''}</td>
        <td>${escapeHtml(deduction?.title || '')}</td>
        <td class="amount">${deduction ? escapeHtml(formatCurrency(deduction.amount)) : ''}</td>
      </tr>
    `);
  }

  return result.join('');
}

function buildMetaRows(
  leftRows: Array<{ label: string; value: string }>,
  rightRows: Array<{ label: string; value: string }>,
) {
  const rowCount = Math.max(leftRows.length, rightRows.length);
  const rows: string[] = [];

  for (let index = 0; index < rowCount; index += 1) {
    const left = leftRows[index];
    const right = rightRows[index];

    rows.push(`
      <tr>
        <td class="meta-label">${escapeHtml(left?.label || '')}</td>
        <td class="meta-colon">${left ? ':' : ''}</td>
        <td class="meta-value">${escapeHtml(left?.value || '')}</td>
        <td class="meta-spacer"></td>
        <td class="meta-label">${escapeHtml(right?.label || '')}</td>
        <td class="meta-colon">${right ? ':' : ''}</td>
        <td class="meta-value">${escapeHtml(right?.value || '')}</td>
      </tr>
    `);
  }

  return rows.join('');
}

export function openPayslipPdfExport(payslip: PayslipRecord) {
  const exportWindow = window.open('', '_blank', 'width=1024,height=900');

  if (!exportWindow) {
    throw new Error('Unable to open print window. Please allow pop-ups and try again.');
  }

  const company = payslip.company;
  const employee = payslip.employee;
  const logoUrl = getAssetUrl(company?.logoUrl || null);
  const earnings = (payslip.lineItems || []).filter((item) => item.type === 'EARNING');
  const deductions = (payslip.lineItems || []).filter((item) => item.type === 'DEDUCTION');
  const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0);
  const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
  const companyAddress = uniqueLines([company?.address, company?.city, company?.country]);
  const employeeName = [employee?.firstName, employee?.lastName].filter(Boolean).join(' ') || 'Employee';
  const leftMetaRows = [
    {
      label: 'Employee name',
      value: employeeName,
    },
    {
      label: 'Department',
      value: employee?.department?.name || '-',
    },
  ];
  
  const rightMetaRows = [
    {
      label: 'Designation',
      value: employee?.designation?.name || '-',
    },
    {
      label: 'Pay Period',
      value: payslip.payrollPeriod?.periodLabel || '-',
    },
  ];

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Payslip</title>
        <style>
          * { box-sizing: border-box; }
          @page { margin: 12mm; }
          body {
            margin: 0;
            background: #ffffff;
            color: #111111;
            font-family: Arial, Helvetica, sans-serif;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 18mm 16mm;
            background: white;
          }
          .top {
            text-align: center;
          }
          .top h1 {
            margin: 0 0 10px;
            font-size: 28px;
            font-weight: 700;
          }
          .top h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
          }
          .top p {
            margin: 4px 0;
            font-size: 14px;
          }
          .logo {
            display: block;
            margin: 0 auto 12px;
            width: 64px;
            height: 64px;
            object-fit: cover;
          }
          .meta-wrapper {
            margin-top: 34px;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .meta-table td {
            padding: 7px 0;
            font-size: 14px;
            vertical-align: top;
          }
          .meta-label {
            width: 20%;
            font-weight: 500;
          }
          .meta-colon {
            width: 24px;
            text-align: center;
          }
          .meta-value {
            width: 24%;
            font-weight: 600;
            padding-left: 8px;
            word-break: break-word;
          }
          .meta-spacer {
            width: 52px;
          }
          .pay-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 36px;
            border: 2px solid #333333;
          }
          .pay-table th,
          .pay-table td {
            border: 1px solid #333333;
            padding: 9px 10px;
            font-size: 14px;
          }
          .pay-table th {
            background: #e5e7eb;
            font-size: 15px;
            font-weight: 700;
            text-align: center;
          }
          .pay-table td.amount {
            text-align: right;
            white-space: nowrap;
          }
          .pay-table td.label-cell {
            text-align: right;
            font-weight: 600;
          }
          .net-pay {
            margin-top: 34px;
            text-align: center;
          }
          .net-pay .amount {
            font-size: 22px;
            font-weight: 700;
          }
          .net-pay .words {
            margin-top: 6px;
            font-size: 16px;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 70px;
            margin-top: 56px;
            text-align: center;
          }
          .signatures .label {
            font-size: 15px;
            margin-bottom: 52px;
          }
          .line {
            border-top: 1px solid #111111;
            width: 72%;
            margin: 0 auto;
          }
          .footer-note {
            margin-top: 46px;
            text-align: center;
            font-size: 15px;
          }
          .toolbar {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin-bottom: 20px;
          }
          .print-btn {
            border: 1px solid #111111;
            background: #ffffff;
            color: #111111;
            padding: 10px 18px;
            font-size: 14px;
            cursor: pointer;
          }
          @media print {
            .toolbar { display: none; }
            body { margin: 0; }
            .page {
              width: auto;
              min-height: auto;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
        </div>
        <div class="page">
          <div class="top">
            ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(company?.name || 'Company')}" class="logo" />` : ''}
            <h1>Payslip</h1>
            <h2>${escapeHtml(company?.name || 'Company')}</h2>
            ${companyAddress.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
          </div>

          <div class="meta-wrapper">
            <table class="meta-table">
              ${buildMetaRows(leftMetaRows, rightMetaRows)}
            </table>
          </div>

          <table class="pay-table">
            <thead>
              <tr>
                <th>Earnings</th>
                <th>Amount</th>
                <th>Deductions</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${buildSideBySideRows(earnings, deductions)}
              <tr>
                <td class="label-cell">Total Earnings</td>
                <td class="amount">${escapeHtml(formatCurrency(totalEarnings))}</td>
                <td class="label-cell">Total Deductions</td>
                <td class="amount">${escapeHtml(formatCurrency(totalDeductions))}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td class="label-cell">Net Pay</td>
                <td class="amount">${escapeHtml(formatCurrency(payslip.netSalary))}</td>
              </tr>
            </tbody>
          </table>

          <div class="net-pay">
            <div class="amount">${escapeHtml(formatCurrency(payslip.netSalary))}</div>
            <div class="words">${escapeHtml(amountToWords(payslip.netSalary))}</div>
          </div>

          <div class="signatures">
            <div>
              <div class="label">Employer Signature</div>
              <div class="line"></div>
            </div>
            <div>
              <div class="label">Employee Signature</div>
              <div class="line"></div>
            </div>
          </div>

          <div class="footer-note">This is system generated payslip</div>
        </div>
        <script>
          window.onload = function () {
            setTimeout(function () {
              try {
                window.focus();
                window.print();
              } catch (error) {
                console.error('Print failed', error);
              }
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  exportWindow.document.open();
  exportWindow.document.write(html);
  exportWindow.document.close();
  exportWindow.document.title = 'Payslip';
  exportWindow.focus();
}
