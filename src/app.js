require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');
const loggerMiddleware = require('./middlewares/logger.middleware');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(loggerMiddleware);

// Root route - API info
app.get('/', (req, res) => {
  res.json({
    name: 'Travel Admin Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      locations: '/api/locations',
      festivals: '/api/festivals',
      users: '/api/users',
      reviews: '/api/reviews',
      transactions: '/api/transactions',
      objects: '/api/objects',
      objectives: '/api/objectives',
    },
  });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(errorMiddleware);

// Only start the server if running locally (not in serverless environment)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = config.port;
  app.listen(PORT, () => {
    console.log('Travel Admin Backend running on port ' + PORT);
    console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
  });
}

module.exports = app;
