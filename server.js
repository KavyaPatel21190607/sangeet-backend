import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import { limiter } from './middleware/rateLimiter.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize express app
const app = express();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Data Sanitization
app.use(mongoSanitize()); // Against NoSQL injection
app.use(xss()); // Against XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Compression Middleware
app.use(compression());

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate Limiting
app.use('/api', limiter);

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SANGEET Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import trackRoutes from './routes/trackRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import spotifyRoutes from './routes/spotifyRoutes.js';
import spotifyAuthRoutes from './routes/spotifyAuthRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/spotify-auth', spotifyAuthRoutes);
app.use('/api/upload', uploadRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler Middleware (must be last)
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`

                                                                                                                
    🎧  SANGEET Backend Server  🎧                                                                        
                                                                                                              
    Server running in ${process.env.NODE_ENV || 'development'} mode                                             
    Port: ${PORT}                                                                                               
    URL: http://localhost:${PORT}                                                                               
    Health: http://localhost:${PORT}/health                                                                         

  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});

export default app;
