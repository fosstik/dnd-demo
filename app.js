import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import gameRoutes from './routes/game.js';
import teamsRoutes from './routes/teams.js';
import roomsRoutes from './routes/rooms.js';

import { setupSocketHandlers } from './utils/socketHandlers.js';
import { initGameData } from './utils/dataManager.js';

import { requestLogger, errorHandler, createRateLimiter } from './middleware/validation.js';

const app = express();
const server = http.createServer(app);

// ПРОСТАЯ CORS НАСТРОЙКА ДЛЯ РАЗРАБОТКИ
app.use(cors({
  origin: true, // Разрешаем все origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Player-ID']
}));

// Явно обрабатываем preflight запросы
app.options('*', cors());

app.use(express.json());
app.use(requestLogger);

// Rate limiting
app.use('/api/', createRateLimiter(15 * 60 * 1000, 1000));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/rooms', roomsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Простой тестовый эндпоинт
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
setupSocketHandlers(io);

// Инициализация данных игры
initGameData();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for all origins (development mode)`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
});