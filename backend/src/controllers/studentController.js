import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse, paginate, formatPagination } from '../utils/helpers.js';

const prisma = new PrismaClient();

export const getStudents = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { search, classId, gender, status } = req.query;
    const where = { institutionId: req.user.institutionId };
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { studentId: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (classId) where.classId = classId;
    if (gender) where.gender = gender;
    if (status === 'active') where.isActive = true;
    else if (status === 'inactive') where.isActive = false;

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          class: { select: { id: true, name: true, code: true } },
          rfidCards: { select: { id: true, uid: true, isActive: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);
    return successResponse(res, {
      students,
      pagination: formatPagination(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

export const getStudent = async (req, res, next) => {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, institutionId: req.user.institutionId },
      include: {
        class: { include: { department: true } },
        rfidCards: true,
        attendance: {
          take: 50,
          orderBy: { scanTime: 'desc' },
          include: { device: { select: { name: true, location: true } } },
        },
      },
    });
    if (!student) return errorResponse(res, 'Student not found.', 404);
    return successResponse(res, student);
  } catch (err) {
    next(err);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const { studentId, firstName, lastName, email, phone, address, gender, dateOfBirth, classId, guardianName, guardianPhone } = req.body;
    if (!studentId || !firstName || !lastName || !classId) {
      return errorResponse(res, 'studentId, firstName, lastName, and classId are required.', 400);
    }
    const existing = await prisma.student.findUnique({ where: { studentId } });
    if (existing) return errorResponse(res, 'Student ID already exists.', 409);
    const student = await prisma.student.create({
      data: {
        studentId, firstName, lastName, email, phone, address, gender, dateOfBirth,
        guardianName, guardianPhone,
        classId,
        institutionId: req.user.institutionId,
      },
    });
    return successResponse(res, student, 'Student created.', 201);
  } catch (err) {
    next(err);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, address, gender, dateOfBirth, classId, isActive, guardianName, guardianPhone } = req.body;
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, institutionId: req.user.institutionId },
    });
    if (!student) return errorResponse(res, 'Student not found.', 404);
    const updated = await prisma.student.update({
      where: { id: req.params.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(gender !== undefined && { gender }),
        ...(dateOfBirth !== undefined && { dateOfBirth }),
        ...(classId !== undefined && { classId }),
        ...(isActive !== undefined && { isActive }),
        ...(guardianName !== undefined && { guardianName }),
        ...(guardianPhone !== undefined && { guardianPhone }),
      },
    });
    return successResponse(res, updated, 'Student updated.');
  } catch (err) {
    next(err);
  }
};

export const deleteStudent = async (req, res, next) => {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, institutionId: req.user.institutionId },
    });
    if (!student) return errorResponse(res, 'Student not found.', 404);
    await prisma.student.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    return successResponse(res, null, 'Student deactivated.');
  } catch (err) {
    next(err);
  }
};
