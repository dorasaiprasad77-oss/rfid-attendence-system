import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse, paginate, formatPagination } from '../utils/helpers.js';
import { checkCooldown } from '../utils/simulator.js';

const prisma = new PrismaClient();

export const scanCard = async (req, res, next) => {
  try {
    const { uid, deviceId, temperature } = req.body;
    if (!uid) return errorResponse(res, 'UID is required.', 400);

    const cooldown = checkCooldown(uid);
    if (cooldown.onCooldown) {
      return errorResponse(res, `Cooldown active. Wait ${cooldown.remaining}s.`, 429);
    }

    const card = await prisma.rfidCard.findUnique({
      where: { uid },
      include: { student: true },
    });
    if (!card) return errorResponse(res, 'RFID card not registered.', 404);
    if (!card.isActive) return errorResponse(res, 'RFID card is deactivated.', 403);
    if (!card.student || !card.student.isActive) {
      return errorResponse(res, 'Associated student is inactive.', 403);
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const hour = now.getHours();
    let status = hour < 9 ? 'present' : (hour < 12 ? 'late' : 'present');

    const attendance = await prisma.attendance.create({
      data: {
        studentId: card.student.id,
        rfidCardId: card.id,
        deviceId: deviceId || null,
        status,
        temperature: temperature ? parseFloat(temperature) : null,
        mode: deviceId ? 'device' : 'manual',
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentId: true, photo: true },
        },
        rfidCard: { select: { uid: true } },
      },
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('attendance:new', attendance);
    }

    return successResponse(res, attendance, 'Attendance recorded.', 201);
  } catch (err) {
    next(err);
  }
};

export const getAttendance = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { studentId, classId, status, dateFrom, dateTo } = req.query;
    const where = {};
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.scanTime = {};
      if (dateFrom) where.scanTime.gte = new Date(dateFrom);
      if (dateTo) where.scanTime.lte = new Date(dateTo);
    }
    if (classId) {
      where.student = { classId };
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, studentId: true, photo: true, class: { select: { name: true } } },
          },
          rfidCard: { select: { uid: true } },
          device: { select: { name: true, location: true } },
        },
        orderBy: { scanTime: 'desc' },
      }),
      prisma.attendance.count({ where }),
    ]);
    return successResponse(res, { records, pagination: formatPagination(total, page, limit) });
  } catch (err) {
    next(err);
  }
};

export const getTodayAttendance = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    const [records, total, present, late, absent] = await Promise.all([
      prisma.attendance.findMany({
        where: { scanTime: { gte: todayStart, lt: todayEnd } },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, studentId: true, photo: true, class: { select: { name: true } } },
          },
          rfidCard: { select: { uid: true } },
          device: { select: { name: true } },
        },
        orderBy: { scanTime: 'desc' },
      }),
      prisma.attendance.count({ where: { scanTime: { gte: todayStart, lt: todayEnd } } }),
      prisma.attendance.count({ where: { scanTime: { gte: todayStart, lt: todayEnd }, status: 'present' } }),
      prisma.attendance.count({ where: { scanTime: { gte: todayStart, lt: todayEnd }, status: 'late' } }),
    ]);

    const totalStudents = await prisma.student.count({ where: { institutionId: req.user.institutionId, isActive: true } });

    return successResponse(res, {
      records,
      stats: { total, present, late, absent: totalStudents - total, totalStudents },
    });
  } catch (err) {
    next(err);
  }
};

export const getAttendanceStats = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const totalStudents = await prisma.student.count({
      where: { institutionId: req.user.institutionId, isActive: true },
    });
    const todayTotal = await prisma.attendance.count({
      where: { scanTime: { gte: todayStart }, student: { institutionId: req.user.institutionId } },
    });
    const todayPresent = await prisma.attendance.count({
      where: { scanTime: { gte: todayStart }, status: 'present', student: { institutionId: req.user.institutionId } },
    });
    const todayLate = await prisma.attendance.count({
      where: { scanTime: { gte: todayStart }, status: 'late', student: { institutionId: req.user.institutionId } },
    });

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekly = await prisma.attendance.findMany({
      where: {
        scanTime: { gte: startOfWeek },
        student: { institutionId: req.user.institutionId },
      },
      select: { scanTime: true, status: true },
      orderBy: { scanTime: 'asc' },
    });

    const dailyStats = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dailyStats[key] = { date: key, present: 0, late: 0, total: 0 };
    }
    weekly.forEach((a) => {
      const key = a.scanTime.toISOString().split('T')[0];
      if (dailyStats[key]) {
        dailyStats[key].total++;
        if (a.status === 'present') dailyStats[key].present++;
        else if (a.status === 'late') dailyStats[key].late++;
      }
    });

    return successResponse(res, {
      totalStudents,
      today: { total: todayTotal, present: todayPresent, late: todayLate },
      weekly: Object.values(dailyStats),
      attendanceRate: totalStudents > 0 ? Math.round((todayTotal / totalStudents) * 100) : 0,
    });
  } catch (err) {
    next(err);
  }
};

export const getAttendanceByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) return errorResponse(res, 'Invalid date format. Use YYYY-MM-DD.', 400);

    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const records = await prisma.attendance.findMany({
      where: {
        scanTime: { gte: dayStart, lt: dayEnd },
        student: { institutionId: req.user.institutionId },
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentId: true, photo: true, class: { select: { name: true } } },
        },
      },
      orderBy: { scanTime: 'desc' },
    });

    return successResponse(res, records);
  } catch (err) {
    next(err);
  }
};
