const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const { CORS_ORIGIN, LOG_LEVEL } = require('./config/environment');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(morgan(LOG_LEVEL));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(generalLimiter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'HSK Quiz API Docs',
  swaggerOptions: { persistAuthorization: true },
}));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

app.use('/api', routes);

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', data: null });
});

app.use(errorHandler);

module.exports = app;
