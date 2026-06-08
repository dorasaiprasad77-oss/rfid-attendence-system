import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse, paginate, formatPagination } from '../utils/helpers.js';

const prisma = new PrismaClient();

export const getDevices = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where: { institutionId: req.user.institutionId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.device.count({ where: { institutionId: req.user.institutionId } }),
    ]);
    return successResponse(res, { devices, pagination: formatPagination(total, page, limit) });
  } catch (err) {
    next(err);
  }
};

export const getDevice = async (req, res, next) => {
  try {
    const device = await prisma.device.findFirst({
      where: { id: req.params.id, institutionId: req.user.institutionId },
    });
    if (!device) return errorResponse(res, 'Device not found.', 404);
    return successResponse(res, device);
  } catch (err) {
    next(err);
  }
};

export const createDevice = async (req, res, next) => {
  try {
    const { name, deviceId, location, deviceType, ipAddress, port } = req.body;
    if (!name || !deviceId) return errorResponse(res, 'Name and deviceId are required.', 400);
    const existing = await prisma.device.findUnique({ where: { deviceId } });
    if (existing) return errorResponse(res, 'Device ID already exists.', 409);
    const device = await prisma.device.create({
      data: { name, deviceId, location, deviceType, ipAddress, port: port ? parseInt(port) : null, institutionId: req.user.institutionId },
    });
    return successResponse(res, device, 'Device created.', 201);
  } catch (err) {
    next(err);
  }
};

export const updateDevice = async (req, res, next) => {
  try {
    const device = await prisma.device.findFirst({
      where: { id: req.params.id, institutionId: req.user.institutionId },
    });
    if (!device) return errorResponse(res, 'Device not found.', 404);
    const { name, location, deviceType, ipAddress, port, isActive } = req.body;
    const updated = await prisma.device.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(location !== undefined && { location }),
        ...(deviceType !== undefined && { deviceType }),
        ...(ipAddress !== undefined && { ipAddress }),
        ...(port !== undefined && { port: parseInt(port) }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return successResponse(res, updated, 'Device updated.');
  } catch (err) {
    next(err);
  }
};

export const deleteDevice = async (req, res, next) => {
  try {
    const device = await prisma.device.findFirst({
      where: { id: req.params.id, institutionId: req.user.institutionId },
    });
    if (!device) return errorResponse(res, 'Device not found.', 404);
    await prisma.device.update({ where: { id: req.params.id }, data: { isActive: false } });
    return successResponse(res, null, 'Device deactivated.');
  } catch (err) {
    next(err);
  }
};

export const heartbeat = async (req, res, next) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) return errorResponse(res, 'deviceId is required.', 400);
    const device = await prisma.device.findUnique({ where: { deviceId } });
    if (!device) return errorResponse(res, 'Device not found.', 404);
    await prisma.device.update({
      where: { id: device.id },
      data: { lastHeartbeat: new Date(), isActive: true },
    });
    return successResponse(res, { deviceId: device.deviceId }, 'Heartbeat received.');
  } catch (err) {
    next(err);
  }
};
