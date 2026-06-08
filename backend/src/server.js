import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { initSocket } from './socket.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import rfidRoutes from './routes/rfidRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const io = initSocket(server);
app.set('io', io);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'RFID Attendance API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/rfid-cards', rfidRoutes);
app.use('/api/reports', reportRoutes);

const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  }
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/health`);
  console.log(`Frontend: http://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { app, server };
