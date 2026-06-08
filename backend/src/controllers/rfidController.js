import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse, paginate, formatPagination } from '../utils/helpers.js';

const prisma = new PrismaClient();

export const getCards = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { search, status } = req.query;
    const where = {};
    if (status === 'active') where.isActive = true;
    else if (status === 'inactive') where.isActive = false;
    if (search) {
      where.OR = [
        { uid: { contains: search } },
        { student: { firstName: { contains: search } } },
        { student: { lastName: { contains: search } } },
        { student: { studentId: { contains: search } } },
      ];
    }
    const [cards, total] = await Promise.all([
      prisma.rfidCard.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, studentId: true, photo: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rfidCard.count({ where }),
    ]);
    return successResponse(res, { cards, pagination: formatPagination(total, page, limit) });
  } catch (err) {
    next(err);
  }
};

export const getCard = async (req, res, next) => {
  try {
    const card = await prisma.rfidCard.findUnique({
      where: { id: req.params.id },
      include: { student: true, attendance: { take: 20, orderBy: { scanTime: 'desc' } } },
    });
    if (!card) return errorResponse(res, 'Card not found.', 404);
    return successResponse(res, card);
  } catch (err) {
    next(err);
  }
};

export const assignCard = async (req, res, next) => {
  try {
    const { uid, studentId, cardType } = req.body;
    if (!uid || !studentId) return errorResponse(res, 'uid and studentId are required.', 400);
    const existing = await prisma.rfidCard.findUnique({ where: { uid } });
    if (existing) return errorResponse(res, 'Card UID already exists.', 409);
    const card = await prisma.rfidCard.create({
      data: { uid, studentId, cardType: cardType || 'student' },
      include: { student: { select: { id: true, firstName: true, lastName: true, studentId: true } } },
    });
    return successResponse(res, card, 'Card assigned.', 201);
  } catch (err) {
    next(err);
  }
};

export const updateCard = async (req, res, next) => {
  try {
    const { isActive, isLost, studentId, cardType } = req.body;
    const card = await prisma.rfidCard.findUnique({ where: { id: req.params.id } });
    if (!card) return errorResponse(res, 'Card not found.', 404);
    const updated = await prisma.rfidCard.update({
      where: { id: req.params.id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(isLost !== undefined && { isLost }),
        ...(studentId !== undefined && { studentId }),
        ...(cardType !== undefined && { cardType }),
      },
      include: { student: { select: { id: true, firstName: true, lastName: true, studentId: true } } },
    });
    return successResponse(res, updated, 'Card updated.');
  } catch (err) {
    next(err);
  }
};

export const deleteCard = async (req, res, next) => {
  try {
    const card = await prisma.rfidCard.findUnique({ where: { id: req.params.id } });
    if (!card) return errorResponse(res, 'Card not found.', 404);
    await prisma.rfidCard.update({ where: { id: req.params.id }, data: { isActive: false } });
    return successResponse(res, null, 'Card deactivated.');
  } catch (err) {
    next(err);
  }
};

export const lookupCard = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const card = await prisma.rfidCard.findUnique({
      where: { uid },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentId: true, photo: true, class: { select: { name: true } } },
        },
      },
    });
    if (!card) return errorResponse(res, 'Card not found.', 404);
    return successResponse(res, card);
  } catch (err) {
    next(err);
  }
};
