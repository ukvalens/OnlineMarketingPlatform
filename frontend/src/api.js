import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const UPLOAD_BASE = API_BASE.replace('/api', '');

export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${UPLOAD_BASE}${path}`;
}

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export async function exportCsv(path, filename) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/admin/export/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Export failed (${res.status}): ${msg}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Export array of objects as a styled Excel-compatible file (.xls HTML table)
export function exportCsvData(rows, filename) {
  if (!rows?.length) return;

  const xlsFilename = filename.replace(/\.(csv|xlsx)$/i, '.xls');
  const title = xlsFilename.replace(/\.xls$/i, '').replace(/[-_]/g, ' ');
  const keys = Object.keys(rows[0]);
  const headers = keys.map(k => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
  const now = new Date().toLocaleString('en-RW', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });

  const esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const headerRow = headers.map(h =>
    `<td style="background:#0057B8;color:#fff;font-weight:bold;font-size:12pt;padding:8px 12px;border:1px solid #004a9e;white-space:nowrap">${esc(h)}</td>`
  ).join('');

  const dataRows = rows.map((row, i) => {
    const bg = i % 2 === 0 ? '#ffffff' : '#F0F4FA';
    const cells = keys.map(k =>
      `<td style="padding:6px 12px;border:1px solid #D1D5DB;background:${bg};font-size:11pt">${esc(row[k])}</td>`
    ).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>
    <x:ExcelWorksheet><x:Name>Report</x:Name>
    <x:WorksheetOptions><x:FreezePanes/><x:FrozenNoSplit/>
    <x:SplitHorizontal>1</x:SplitHorizontal><x:TopRowBottomPane>1</x:TopRowBottomPane>
    </x:WorksheetOptions></x:ExcelWorksheet>
  </x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    .info-cell { font-size: 10pt; color: #6B7280; padding: 3px 0; }
    .company { font-size: 16pt; font-weight: bold; color: #0057B8; }
  </style>
</head>
<body>
  <p class="company">DigitalMarkRW</p>
  <p class="info-cell">Digital Marketing &amp; Business Promotion &middot; Kigali, Rwanda</p>
  <p class="info-cell">Report: <b>${esc(title)}</b> &nbsp;&nbsp; Generated: ${esc(now)}</p>
  <p class="info-cell">www.digitalmarkrw.com &nbsp;&middot;&nbsp; info@digitalmarkrw.com &nbsp;&middot;&nbsp; +250 780 000 000</p>
  <br/>
  <table>
    <thead><tr>${headerRow}</tr></thead>
    <tbody>${dataRows}</tbody>
  </table>
  <br/>
  <p class="info-cell">Total records: ${rows.length} &nbsp;&nbsp; TIN: 123456789 &nbsp;&middot;&nbsp; KG 123 St, Kigali, Rwanda</p>
</body>
</html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = xlsFilename;
  a.click();
  URL.revokeObjectURL(url);
}

// Print a DOM element as PDF via browser print dialog
export function printElement(elementId, title = 'Document') {
  const el = document.getElementById(elementId);
  if (!el) return;

  // Clone and strip interactive elements
  const clone = el.cloneNode(true);
  clone.querySelectorAll('.receipt-actions, .receipt-print-btn, button, input, select').forEach(n => n.remove());

  const now = new Date().toLocaleString('en-RW', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

  const win = window.open('', '_blank', 'width=900,height=1000');
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title} — DigitalMarkRW</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      color: #1F2937;
      background: #fff;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Page wrapper ── */
    .pdf-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 48px 56px;
    }

    /* ── Header ── */
    .pdf-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 20px;
      border-bottom: 2px solid #0057B8;
      margin-bottom: 28px;
    }

    .pdf-header__left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .pdf-logo {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      object-fit: contain;
      border: 1px solid #E2E8F0;
      padding: 3px;
    }

    .pdf-company-name {
      font-size: 18px;
      font-weight: 800;
      color: #0057B8;
      letter-spacing: -0.3px;
    }

    .pdf-company-sub {
      font-size: 11px;
      color: #6B7280;
      margin-top: 2px;
    }

    .pdf-header__right {
      text-align: right;
    }

    .pdf-doc-title {
      font-size: 20px;
      font-weight: 800;
      color: #1F2937;
      letter-spacing: -0.4px;
    }

    .pdf-meta {
      font-size: 11px;
      color: #6B7280;
      margin-top: 4px;
      line-height: 1.6;
    }

    /* ── Table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    thead tr {
      background: #0057B8;
      color: white;
    }

    thead th {
      padding: 10px 14px;
      text-align: left;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      white-space: nowrap;
    }

    tbody tr {
      border-bottom: 1px solid #E2E8F0;
    }

    tbody tr:nth-child(even) {
      background: #F8FAFC;
    }

    tbody tr:last-child {
      border-bottom: none;
    }

    tbody td {
      padding: 9px 14px;
      color: #1F2937;
      vertical-align: middle;
    }

    /* ── Status badges ── */
    .status-badge {
      display: inline-block;
      padding: 2px 9px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: capitalize;
    }

    .status-badge--completed  { background: #f0fdf4; color: #15803d; }
    .status-badge--cancelled  { background: #fef2f2; color: #b91c1c; }
    .status-badge--requested  { background: #eff6ff; color: #1d4ed8; }
    .status-badge--in_progress{ background: #fffbeb; color: #b45309; }
    .status-badge--quoted     { background: #f5f3ff; color: #7c3aed; }
    .status-badge--confirmed  { background: #ecfeff; color: #0e7490; }
    .status-badge--in_review  { background: #fff7ed; color: #c2410c; }
    .status-badge--paid       { background: #f0fdf4; color: #15803d; }
    .status-badge--pending    { background: #fffbeb; color: #b45309; }
    .status-badge--failed     { background: #fef2f2; color: #b91c1c; }
    .status-badge--partial    { background: #eff6ff; color: #1d4ed8; }

    /* ── Role badge ── */
    .role-badge {
      display: inline-block;
      padding: 2px 9px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: capitalize;
      background: #eff6ff;
      color: #1d4ed8;
    }

    /* ── Receipt card ── */
    .receipt-card {
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .receipt-header { display: flex; align-items: center; gap: 14px; }
    .receipt-logo-img { width: 44px; height: 44px; border-radius: 8px; border: 1px solid #E2E8F0; padding: 3px; }
    .receipt-company { flex: 1; }
    .receipt-title { font-size: 15px; font-weight: 800; color: #1F2937; }
    .receipt-sub { font-size: 11px; color: #6B7280; }
    .receipt-badge { font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #0057B8; background: #e8f0fb; border: 1px solid #93c5fd; padding: 3px 10px; border-radius: 20px; }
    .receipt-divider { height: 1px; background: #E2E8F0; }
    .receipt-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
    .receipt-info-block { display: flex; flex-direction: column; gap: 2px; }
    .receipt-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #6B7280; }
    .receipt-muted { font-size: 12px; color: #6B7280; }
    .receipt-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #6B7280; }
    .receipt-payments { list-style: none; padding: 0; margin: 4px 0 0; display: flex; flex-direction: column; gap: 8px; }
    .receipt-payment-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 14px; background: #F8FAFC; border-radius: 8px; font-size: 12px; }
    .receipt-footer { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
    .receipt-total-block { display: flex; flex-direction: column; gap: 3px; }
    .receipt-total-amount { font-size: 24px; font-weight: 800; color: #1F2937; }
    .receipt-qr { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .receipt-note { font-size: 10px; color: #6B7280; text-align: center; border-top: 1px dashed #E2E8F0; padding-top: 12px; }

    /* ── Detail grid (for drawers) ── */
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .detail-item {
      background: #F8FAFC;
      border-radius: 8px;
      padding: 12px 14px;
    }

    .detail-item span {
      display: block;
      font-size: 10px;
      color: #6B7280;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .detail-item strong { font-size: 13px; color: #1F2937; }

    /* ── Footer ── */
    .pdf-footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #9CA3AF;
    }

    /* ── Hide empty states & spinners ── */
    .dash-empty, .spinner { display: none !important; }

    @media print {
      body { padding: 0; }
      .pdf-page { padding: 24px 32px 40px; }
      @page { margin: 12mm 10mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="pdf-page">
    <div class="pdf-header">
      <div class="pdf-header__left">
        <img src="${window.location.origin}/logo192.png" alt="DigitalMarkRW" class="pdf-logo" />
        <div>
          <div class="pdf-company-name">DigitalMarkRW</div>
          <div class="pdf-company-sub">Digital Marketing &amp; Business Promotion · Kigali, Rwanda</div>
        </div>
      </div>
      <div class="pdf-header__right">
        <div class="pdf-doc-title">${title}</div>
        <div class="pdf-meta">
          Generated: ${now}<br/>
          www.digitalmarkrw.com · info@digitalmarkrw.com
        </div>
      </div>
    </div>

    ${clone.outerHTML}

    <div class="pdf-footer">
      <span>DigitalMarkRW · KG 123 St, Kigali, Rwanda · TIN: 123456789</span>
      <span>Printed: ${now}</span>
    </div>
  </div>
</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 600);
}
