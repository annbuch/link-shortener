require('dotenv').config();
const express = require('express');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profile');
const linkRoutes = require('./routes/links');
const groupRoutes = require('./routes/groups');
const analyticsRoutes = require('./routes/analytics');
const redirectRoutes = require('./routes/redirect');
const errorHandler = require('./middlewares/errorHandler');
const { secretFromEnv } = require('./utils/tokenService');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/profile', profileRoutes);
app.use('/links', linkRoutes);
app.use('/groups', groupRoutes);
app.use('/analytics', analyticsRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Click.me API Documentation'
}));

app.use('/', redirectRoutes);

app.use(errorHandler);

if (!secretFromEnv) {
  console.warn('ВНИМАНИЕ: JWT_SECRET не задан в .env — используется значение по умолчанию');
}

sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL connected successfully');
    // Схема изменяется только миграциями; sync() включается флагом DB_SYNC для отладки
    if (String(process.env.DB_SYNC).toLowerCase() === 'true') {
      console.log('DB_SYNC=true -> выполняю sequelize.sync()');
      return sequelize.sync();
    }
    return null;
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to PostgreSQL:', err.message);
    process.exit(1);
  });