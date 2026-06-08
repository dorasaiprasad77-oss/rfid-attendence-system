import jwt from 'jsonwebtoken';

const getSecret = () => process.env.JWT_SECRET || 'fallback-secret';

export const generateToken = (payload) => {
  return jwt.sign(payload, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, getSecret());
};
