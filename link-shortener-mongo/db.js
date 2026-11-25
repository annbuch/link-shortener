'use strict';

const dns = require('dns');
const mongoose = require('mongoose');

/**
 * Некоторые VPN/прокси оставляют Node DNS-сервером 127.0.0.1,
 * который не умеет отвечать на SRV-запросы MongoDB Atlas.
 * DNS_SERVERS в .env позволяет явно задать рабочие DNS.
 */
function applyDnsServers() {
  const servers = String(process.env.DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.length > 0) {
    dns.setServers(servers);
    console.log(`DNS for Node: ${servers.join(', ')}`);
  }
}

/**
 * Подключение к MongoDB через Mongoose.
 * MONGO_URI берётся из .env (см. .env.example).
 */
async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) {
    throw new Error(
      'MONGO_URI не задан. Скопируйте .env.example в .env и вставьте строку подключения MongoDB Atlas.'
    );
  }

  applyDnsServers();
  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000
  });

  const { host, name } = mongoose.connection;
  console.log(`MongoDB connected: ${host}/${name}`);

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  return mongoose.connection;
}

module.exports = connectDB;
