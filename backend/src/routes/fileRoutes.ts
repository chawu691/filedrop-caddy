// Declaration for __dirname to satisfy TypeScript when @types/node might be missing/misconfigured
declare var __dirname: string;

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import sqlite3 from 'sqlite3'; // Added import for sqlite3 types

const router = express.Router();

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Multer setup for file storage
// Files will be stored in 'backend/uploads/'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destPath = path.join(__dirname, '..', '..', 'uploads'); // Relative to dist/routes
    cb(null, destPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMiddleware = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    // Add any specific file type filtering here if needed
    // For now, accept all files within size limit
    cb(null, true);
  }
}).single('file'); // 'file' is the name of the form field

router.post('/upload', (req: Request, res: Response) => {
  // Invoke multer middleware programmatically
  uploadMiddleware(req, res, function (err: any) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: `File too large. Max size is ${MAX_FILE_SIZE_MB}MB.` });
      }
      return res.status(500).json({ message: `Multer error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ message: `Unknown upload error: ${err.message}` });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const db = getDb();
    const uniqueId = uuidv4();
    const { originalname, mimetype, size, filename } = req.file;
    const filePath = filename; // filename given by multer is just the name in uploads dir

    db.run(
      'INSERT INTO files (uniqueId, originalName, mimeType, size, filePath) VALUES (?, ?, ?, ?, ?)',
      [uniqueId, originalname, mimetype, size, filePath],
      function (this: sqlite3.Statement, dbErr: Error | null) { // Explicitly type 'this'
        if (dbErr) {
          console.error('Error saving file metadata to DB:', dbErr);
          // Attempt to delete orphaned file
          fs.unlink(path.join(__dirname, '..', '..', 'uploads', filePath), unlinkErr => {
            if (unlinkErr) console.error("Error deleting orphaned file:", unlinkErr);
          });
          return res.status(500).json({ message: 'Failed to save file information.' });
        }
        const fileUrl = `/files/${uniqueId}`; // Relative URL for client to use
        res.status(201).json({
          message: 'File uploaded successfully!',
          fileId: this.lastID, 
          uniqueId: uniqueId,
          fileName: originalname,
          fileUrl: fileUrl 
        });
      }
    );
  });
});

interface FileDBRow {
  id: number;
  uniqueId: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
  uploadedAt: string;
  expiresAt?: string | null;
}

router.get('/files/:uniqueId', (req: Request, res: Response) => {
  const { uniqueId } = req.params;
  const db = getDb();

  db.get('SELECT * FROM files WHERE uniqueId = ?', [uniqueId], (dbErr: Error | null, row: FileDBRow) => { 
    if (dbErr) {
      console.error('Error fetching file from DB:', dbErr);
      return res.status(500).json({ message: 'Error retrieving file information.' });
    }
    if (!row) {
      return res.status(404).json({ message: 'File not found.' });
    }

    // Check for expiration
    if (row.expiresAt) {
      const expiryDate = new Date(row.expiresAt);
      if (expiryDate < new Date()) {
        // Optional: Delete expired file from disk and DB
        // fs.unlink(path.join(__dirname, '..', '..', 'uploads', row.filePath), () => {});
        // db.run('DELETE FROM files WHERE uniqueId = ?', [uniqueId], () => {});
        return res.status(410).json({ message: 'File has expired and is no longer available.' });
      }
    }
    
    const filePathFull = path.join(__dirname, '..', '..', 'uploads', row.filePath);
    
    // Check if file exists on disk
    if (!fs.existsSync(filePathFull)) {
        console.error(`File ${row.filePath} for uniqueId ${uniqueId} not found on disk.`);
        // Optionally, clean up DB record if file is missing
        // db.run('DELETE FROM files WHERE uniqueId = ?', [uniqueId], () => {});
        return res.status(404).json({ message: 'File not found on server storage.' });
    }

    // Set headers to prompt download or display inline based on MIME type
    // For simplicity, sending as an attachment.
    // res.setHeader('Content-Disposition', `attachment; filename="${row.originalName}"`);
    // res.setHeader('Content-Type', row.mimeType);
    res.sendFile(filePathFull, (errSendFile) => {
        if (errSendFile) {
            console.error("Error sending file:", errSendFile);
            // Check if headers were already sent
            if (!res.headersSent) {
                 res.status(500).send("Error sending file.");
            }
        }
    });
  });
});

export default router;