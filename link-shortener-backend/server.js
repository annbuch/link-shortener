const express = require('express');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const linkRoutes = require('./routes/links');
const groupRoutes = require('./routes/groups');
const analyticsRoutes = require('./routes/analytics');
const redirectRoutes = require('./routes/redirect');
const errorHandler = require('./middlewares/errorHandler');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = 3000;

app.use(express.json());

// Маршруты
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/links', linkRoutes);
app.use('/groups', groupRoutes);
app.use('/analytics', analyticsRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'LinkHub API Documentation'
}));

app.use('/', redirectRoutes); 

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});