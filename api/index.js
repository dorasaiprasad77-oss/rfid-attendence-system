import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

import authRoutes from '../backend/src/routes/authRoutes.js';
import attendanceRoutes from '../backend/src/routes/attendanceRoutes.js';
import studentRoutes from '../backend/src/routes/studentRoutes.js';
import deviceRoutes from '../backend/src/routes/deviceRoutes.js';
import rfidRoutes from '../backend/src/routes/rfidRoutes.js';
import reportRoutes from '../backend/src/routes/reportRoutes.js';
import { notFound, errorHandler } from '../backend/src/middleware/errorMiddleware.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'RFID Attendance API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/rfid-cards', rfidRoutes);
app.use('/api/reports', reportRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
