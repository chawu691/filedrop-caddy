// Declaration for __dirname to satisfy TypeScript when @types/node might be missing/misconfigured
declare var __dirname: string;

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import fileRoutes from './routes/fileRoutes';
import adminRoutes from './routes/adminRoutes';
import { initializeDatabase } from './db';
// import process from 'process'; // Not typically needed if @types/node is setup

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure 'uploads' and 'database' directories exist
const uploadsDir = path.join(__dirname, '..', 'uploads'); // one level up from dist/src
const databaseDir = path.join(__dirname, '..', 'database');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

// Initialize Database
initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully.');
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    // Cast process.exit to any to bypass type error if Process type is incomplete
    (process as any).exit(1); 
  });

// Simple rate limiting middleware
interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};

const rateLimit = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    // Clean up expired entries
    Object.keys(rateLimitStore).forEach(ip => {
      if (rateLimitStore[ip].resetTime < now) {
        delete rateLimitStore[ip];
      }
    });

    if (!rateLimitStore[clientIP]) {
      rateLimitStore[clientIP] = { count: 1, resetTime: now + windowMs };
    } else if (rateLimitStore[clientIP].resetTime < now) {
      rateLimitStore[clientIP] = { count: 1, resetTime: now + windowMs };
    } else {
      rateLimitStore[clientIP].count++;
    }

    if (rateLimitStore[clientIP].count > max) {
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimitStore[clientIP].resetTime - now) / 1000)
      });
    }

    next();
  };
};

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Health check endpoint (no rate limiting for monitoring)
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes with rate limiting
app.use('/api/admin', rateLimit(15 * 60 * 1000, 50), adminRoutes); // 50 admin requests per 15 minutes
app.use('/api', rateLimit(15 * 60 * 1000, 20), fileRoutes); // 20 file operations per 15 minutes

// Note: File serving is handled by fileRoutes.ts (/api/files/:uniqueId)
// We don't expose the uploads directory directly for security reasons


// Serve static frontend files
// The Dockerfile places built frontend into /app/dist_frontend
// The server runs from /app/backend/dist/server.js
// So, static path should be ../../dist_frontend
const frontendDistPath = path.join(__dirname, '..', '..', 'dist_frontend');
app.use(express.static(frontendDistPath));

// Error handling middleware
app.use((err: Error, req: Request, res: Response) => {
  console.error('Unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// For any other route, serve index.html for client-side routing (SPA behavior)
app.get('*', (req: Request, res: Response) => {
  // Check if the request is for an API endpoint, if so, don't serve index.html
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/files/')) {
    // fileRoutes handles /files/, so let it pass. api routes are handled above.
    // This is more of a fallback, ensure specific routes are defined before this.
    // Check if response has already been sent by other middleware (e.g. fileRoutes for /files/)
    if (!res.headersSent) {
      return res.status(404).json({ message: 'Resource not found.' });
    }
    return;
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});