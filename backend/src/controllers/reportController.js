import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { errorResponse } from '../utils/helpers.js';

const prisma = new PrismaClient();

export const exportReport = async (req, res, next) => {
  try {
    const { format = 'pdf', type = 'attendance', dateFrom, dateTo } = req.query;

    if (!['attendance', 'daily', 'students'].includes(type)) {
      return errorResponse(res, 'Invalid report type. Use: attendance, daily, or students.', 400);
    }
    if (!['pdf', 'excel', 'csv'].includes(format)) {
      return errorResponse(res, 'Invalid format. Use: pdf, excel, or csv.', 400);
    }

    let data;
    const where = {};

    if (type === 'attendance' || type === 'daily') {
      if (dateFrom || dateTo) {
        where.scanTime = {};
        if (dateFrom) where.scanTime.gte = new Date(dateFrom);
        if (dateTo) {
          const end = new Date(dateTo);
          end.setHours(23, 59, 59, 999);
          where.scanTime.lte = end;
        }
      }
      data = await prisma.attendance.findMany({
        where,
        include: {
          student: { select: { firstName: true, lastName: true, studentId: true, class: { select: { name: true } } } },
          rfidCard: { select: { uid: true } },
          device: { select: { name: true } },
        },
        orderBy: { scanTime: 'desc' },
      });
    } else if (type === 'students') {
      data = await prisma.student.findMany({
        include: { class: { select: { name: true } }, rfidCards: { select: { uid: true, isActive: true } } },
        orderBy: { studentId: 'asc' },
      });
    }

    if (format === 'pdf') {
      return generatePDF(res, data, type);
    } else if (format === 'excel') {
      return generateExcel(res, data, type);
    } else if (format === 'csv') {
      return generateCSV(res, data, type);
    }
  } catch (err) {
    next(err);
  }
};

function generatePDF(res, data, type) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-report.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).font('Helvetica-Bold').text('RFID Attendance System', { align: 'center' });
  doc.fontSize(14).text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(1.5);

  if (data.length === 0) {
    doc.fontSize(12).text('No data available.', { align: 'center' });
  } else if (type === 'students') {
    const tableTop = doc.y;
    const cols = [30, 80, 120, 80, 60, 80];
    const headers = ['#', 'ID', 'Name', 'Class', 'Gender', 'Cards'];

    doc.fontSize(9).font('Helvetica-Bold');
    let x = 40;
    headers.forEach((h, i) => {
      doc.text(h, x, tableTop, { width: cols[i], align: 'left' });
      x += cols[i];
    });
    doc.moveDown(0.5);
    doc.font('Helvetica');

    data.forEach((s, i) => {
      const y = doc.y;
      if (y > 720) {
        doc.addPage();
        doc.y = 40;
      }
      x = 40;
      const vals = [i + 1, s.studentId, `${s.firstName} ${s.lastName}`, s.class?.name || '-', s.gender || '-', s.rfidCards?.length || 0];
      vals.forEach((v, j) => {
        doc.text(String(v), x, doc.y, { width: cols[j], align: 'left' });
        x += cols[j];
      });
      doc.moveDown(0.3);
    });
  } else {
    const tableTop = doc.y;
    const cols = [30, 70, 100, 60, 60, 70];
    const headers = ['#', 'Student ID', 'Name', 'Status', 'Time', 'Device'];

    doc.fontSize(9).font('Helvetica-Bold');
    let x = 40;
    headers.forEach((h, i) => {
      doc.text(h, x, tableTop, { width: cols[i], align: 'left' });
      x += cols[i];
    });
    doc.moveDown(0.5);
    doc.font('Helvetica');

    data.forEach((a, i) => {
      const y = doc.y;
      if (y > 720) {
        doc.addPage();
        doc.y = 40;
      }
      x = 40;
      const vals = [
        i + 1,
        a.student?.studentId || '-',
        `${a.student?.firstName || ''} ${a.student?.lastName || ''}`,
        a.status,
        new Date(a.scanTime).toLocaleTimeString(),
        a.device?.name || '-',
      ];
      vals.forEach((v, j) => {
        doc.text(String(v), x, doc.y, { width: cols[j], align: 'left' });
        x += cols[j];
      });
      doc.moveDown(0.3);
    });
  }

  doc.end();
}

function generateExcel(res, data, type) {
  let rows;
  if (type === 'students') {
    rows = data.map((s) => ({
      'Student ID': s.studentId,
      'First Name': s.firstName,
      'Last Name': s.lastName,
      'Email': s.email || '',
      'Phone': s.phone || '',
      'Gender': s.gender || '',
      'Class': s.class?.name || '',
      'Active': s.isActive ? 'Yes' : 'No',
      'RFID Cards': s.rfidCards?.length || 0,
    }));
  } else {
    rows = data.map((a) => ({
      'Student ID': a.student?.studentId || '',
      'First Name': a.student?.firstName || '',
      'Last Name': a.student?.lastName || '',
      'Status': a.status,
      'Date': new Date(a.scanTime).toLocaleDateString(),
      'Time': new Date(a.scanTime).toLocaleTimeString(),
      'Card UID': a.rfidCard?.uid || '',
      'Device': a.device?.name || '',
      'Mode': a.mode,
    }));
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, type);
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-report.xlsx"`);
  res.send(buf);
}

function generateCSV(res, data, type) {
  let rows;
  if (type === 'students') {
    rows = data.map((s) =>
      [s.studentId, s.firstName, s.lastName, s.email || '', s.phone || '', s.gender || '', s.class?.name || '', s.isActive ? 'Active' : 'Inactive']
        .map(escapeCSV).join(',')
    );
    rows.unshift(['Student ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'Class', 'Status'].join(','));
  } else {
    rows = data.map((a) =>
      [a.student?.studentId || '', a.student?.firstName || '', a.student?.lastName || '', a.status,
        new Date(a.scanTime).toLocaleDateString(), new Date(a.scanTime).toLocaleTimeString(),
        a.rfidCard?.uid || '', a.device?.name || '', a.mode]
        .map(escapeCSV).join(',')
    );
    rows.unshift(['Student ID', 'First Name', 'Last Name', 'Status', 'Date', 'Time', 'Card UID', 'Device', 'Mode'].join(','));
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
  res.send(rows.join('\n'));
}

function escapeCSV(str) {
  const s = String(str || '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
