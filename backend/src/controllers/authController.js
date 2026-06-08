import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

const prisma = new PrismaClient();

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, institutionName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return errorResponse(res, 'Email, password, first name, and last name are required.', 400);
    }
    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters.', 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse(res, 'Email is already registered.', 409);
    }

    let institution = await prisma.institution.findFirst();
    if (!institution) {
      institution = await prisma.institution.create({
        data: {
          name: institutionName || 'Default Institution',
          code: 'DEFAULT',
        },
      });
    }

    let adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
    if (!adminRole) {
      const roles = ['admin', 'manager', 'operator'];
      for (const roleName of roles) {
        await prisma.role.create({
          data: { name: roleName, permissions: JSON.stringify(roleName === 'admin' ? ['all'] : ['read', 'write']) },
        });
      }
      adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        roleId: adminRole.id,
        institutionId: institution.id,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: adminRole.name,
      institutionId: institution.id,
    });

    return successResponse(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: adminRole.name,
        institution: { id: institution.id, name: institution.name },
      },
    }, 'Registration successful.', 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required.', 400);
    }
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, institution: true },
    });
    if (!user) {
      return errorResponse(res, 'Invalid credentials.', 401);
    }
    if (!user.isActive) {
      return errorResponse(res, 'Account is deactivated.', 403);
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return errorResponse(res, 'Invalid credentials.', 401);
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
      institutionId: user.institutionId,
    });
    return successResponse(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        institution: { id: user.institution.id, name: user.institution.name },
      },
    }, 'Login successful.');
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, avatar: true, isActive: true, lastLogin: true,
        createdAt: true, role: { select: { name: true } },
        institution: { select: { id: true, name: true } },
      },
    });
    if (!user) return errorResponse(res, 'User not found.', 404);
    return successResponse(res, user);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { ...(firstName && { firstName }), ...(lastName && { lastName }), ...(phone && { phone }) },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true },
    });
    return successResponse(res, user, 'Profile updated.');
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current and new password are required.', 400);
    }
    if (newPassword.length < 6) {
      return errorResponse(res, 'New password must be at least 6 characters.', 400);
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return errorResponse(res, 'Current password is incorrect.', 400);
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    return successResponse(res, null, 'Password changed successfully.');
  } catch (err) {
    next(err);
  }
};
