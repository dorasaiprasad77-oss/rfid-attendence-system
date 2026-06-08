import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const getSecret = () => {
  return process.env.JWT_SECRET || (() => {
    console.warn('WARNING: JWT_SECRET not set. Using ephemeral key. Set JWT_SECRET in .env for production.');
    return crypto.randomBytes(32).toString('hex');
  })();
};

export const generateToken = (payload) => {
  return jwt.sign(payload, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, getSecret());
};
