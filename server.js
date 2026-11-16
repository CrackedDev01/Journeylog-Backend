const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// const mongoSanitize = require('express-mongo-sanitize');
const app = express();

// Environment validation
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not defined in environment variables`);
    process.exit(1);
  }
}

// Request ID and logging middleware
app.use((req, res, next) => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.id = requestId;

  const start = Date.now();

  // Log incoming request
  console.log(`[${requestId}] ${req.method} ${req.originalUrl} - Started`);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${requestId}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV !== 'production') {
      try {
        const { hostname, protocol } = new URL(origin);
        if (protocol === 'http:' && ['localhost', '127.0.0.1'].includes(hostname)) {
          return callback(null, true);
        }
      } catch {
        return callback(new Error('Not allowed by CORS'));
      }
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Security middleware
app.use(helmet());
// app.use(mongoSanitize());

// Body parsing middleware with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting — generous general limit for normal app use
// (each page fires several API calls at once), plus a stricter
// limit on auth endpoints to slow down brute-force attempts.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 login/register attempts per 15 min per IP
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use(limiter);

// Basic health check route
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'JourneyLog API is running' });
});

// Routes
const accountRoutes = require('./routes/account.routes');
const authRoutes = require('./routes/auth.routes');
const dailyPlanRoutes = require('./routes/dailyPlan.routes');
const dailyReviewRoutes = require('./routes/dailyReview.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const goalRoutes = require('./routes/goal.routes');
const habitRoutes = require('./routes/habit.routes');
const monthlyReviewRoutes = require('./routes/monthlyReview.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const skillRoutes = require('./routes/skill.routes');
const streakRoutes = require('./routes/streak.routes');
const weeklyPlanRoutes = require('./routes/weeklyPlan.routes');
const weeklyReviewRoutes = require('./routes/weeklyReview.routes');
const workSessionRoutes = require('./routes/workSession.routes');

// Mount routes
app.use('/api/v1/account', accountRoutes);
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/daily-plans', dailyPlanRoutes);
app.use('/api/v1/daily-reviews', dailyReviewRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/goals', goalRoutes);
app.use('/api/v1/habits', habitRoutes);
app.use('/api/v1/monthly-reviews', monthlyReviewRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/skills', skillRoutes);
app.use('/api/v1/streak', streakRoutes);
app.use('/api/v1/weekly-plans', weeklyPlanRoutes);
app.use('/api/v1/weekly-reviews', weeklyReviewRoutes);
app.use('/api/v1/work-sessions', workSessionRoutes);

// Test route to see if routing is working
app.get('/api/v1/test', (req, res) => {
  console.log('Test route called');
  res.json({ success: true, message: 'Test route works' });
});

// Global error handling middleware (must be after all routes)
const errorHandler = require('./middlewares/error.middleware');
app.use(errorHandler);

// 404 handler for undefined routes (must be last)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Only start server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  const connectDB = require('./config/db');

  // Connect to MongoDB first, then start the server
  connectDB()
    .then(() => {
      const server = app.listen(PORT, () => {
        console.log(`MongoDB connected. Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      });

      // Graceful shutdown
      const gracefulShutdown = () => {
        console.log('Received shutdown signal, closing server...');
        server.close(() => {
          console.log('Server closed successfully');
          process.exit(0);
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
          console.log('Force closing server after timeout');
          process.exit(1);
        }, 10000);
      };

      process.on('SIGTERM', gracefulShutdown);
      process.on('SIGINT', gracefulShutdown);
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB:', err.message);
      process.exit(1);
    });
}

module.exports = app;