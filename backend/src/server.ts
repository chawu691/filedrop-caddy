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

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// API Routes
app.use('/api', fileRoutes);
app.use('/api/admin', adminRoutes);

// Serve uploaded files statically from the 'uploads' directory (relative to backend/ )
// The path for files will be /files/:fileId which is handled by fileRoutes, 
// but direct access if needed for other static assets in uploads can be set up.
// For actual file serving, fileRoutes.ts uses res.sendFile or res.download.
app.use('/uploads', express.static(uploadsDir));


// Serve static frontend files
// The Dockerfile places built frontend into /app/dist_frontend
// The server runs from /app/backend/dist/server.js
// So, static path should be ../../dist_frontend
const frontendDistPath = path.join(__dirname, '..', '..', 'dist_frontend');
app.use(express.static(frontendDistPath));

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