'use strict';

require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./db');

const linkRoutes = require('./routes/links');
const groupRoutes = require('./routes/groups');
const userRoutes = require('./routes/users');
const redirectRoutes = require('./routes/redirect');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : true;

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    service: 'click.me-mongo',
    status: mongoose.connection.readyState === 1 ? 'ok' : 'degraded',
    mongo: states[mongoose.connection.readyState] || 'unknown',
    database: mongoose.connection.name || null
  });
});

app.use('/api/links', linkRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);

// Редирект по короткому коду должен идти до общего 404
app.use('/', redirectRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.use(errorHandler);

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Click.me Mongo API running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('Не удалось запустить сервер:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
