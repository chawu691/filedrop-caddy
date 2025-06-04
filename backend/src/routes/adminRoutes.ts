// Declaration for __dirname to satisfy TypeScript when @types/node might be missing/misconfigured
declare var __dirname: string;

import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getDb } from '../db';
import { basicAuth } from '../middleware/auth';
import sqlite3 from 'sqlite3';


const router = express.Router();

// Apply basic auth to all admin routes
router.use(basicAuth);

// Define a type for the file row for better type safety
interface FileDBAdminRow {
  id: number;
  uniqueId: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  expiresAt?: string | null;
  filePath?: string; 
}


// Get all files
router.get('/files', (req: Request, res: Response) => {
  const db = getDb();
  db.all('SELECT id, uniqueId, originalName, mimeType, size, uploadedAt, expiresAt FROM files ORDER BY uploadedAt DESC', [], (err: Error | null, rows: FileDBAdminRow[]) => {
    if (err) {
      console.error('Error fetching files for admin:', err);
      return res.status(500).json({ message: 'Failed to retrieve files.' });
    }
    res.json(rows);
  });
});

// Delete a file
router.delete('/files/:uniqueId', (req: Request, res: Response) => {
  const { uniqueId } = req.params;
  const db = getDb();

  db.get('SELECT filePath FROM files WHERE uniqueId = ?', [uniqueId], (err: Error | null, row: Pick<FileDBAdminRow, 'filePath'> | undefined) => {
    if (err) {
      return res.status(500).json({ message: 'Error finding file for deletion.' });
    }
    if (!row || !row.filePath) { // Ensure row and row.filePath exist
      return res.status(404).json({ message: 'File not found or filePath missing.' });
    }

    const filePathToDelete = path.join(__dirname, '..', '..', 'uploads', row.filePath);

    fs.unlink(filePathToDelete, (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== 'ENOENT') { // Ignore if file doesn't exist
        console.error('Error deleting file from disk:', unlinkErr);
        return res.status(500).json({ message: 'Failed to delete file from storage.' });
      }

      db.run('DELETE FROM files WHERE uniqueId = ?', [uniqueId], function (this: sqlite3.Statement, dbErr: Error | null) { // Explicitly type 'this'
        if (dbErr) {
          console.error('Error deleting file record from DB:', dbErr);
          // If DB deletion fails, the file might be orphaned. Manual cleanup might be needed.
          return res.status(500).json({ message: 'Failed to delete file record.' });
        }
        if (this.changes === 0) { 
            return res.status(404).json({ message: 'File record not found in database, but attempted disk deletion.' });
        }
        res.json({ message: 'File deleted successfully.' });
      });
    });
  });
});

// Set/Update file expiration
router.put('/files/:uniqueId/expire', (req: Request, res: Response) => {
  const { uniqueId } = req.params;
  const { expiresInDays } = req.body; 

  if (typeof expiresInDays !== 'number' || expiresInDays <= 0) {
    return res.status(400).json({ message: 'Invalid input: expiresInDays must be a positive number.' });
  }

  const db = getDb();
  const newExpiryDate = new Date();
  newExpiryDate.setDate(newExpiryDate.getDate() + expiresInDays);

  db.run(
    'UPDATE files SET expiresAt = ? WHERE uniqueId = ?',
    [newExpiryDate.toISOString(), uniqueId],
    function (this: sqlite3.Statement, err: Error | null) { // Explicitly type 'this'
      if (err) {
        console.error('Error updating file expiration:', err);
        return res.status(500).json({ message: 'Failed to update file expiration.' });
      }
      if (this.changes === 0) { 
        return res.status(404).json({ message: 'File not found for updating expiration.' });
      }
      res.json({ message: `File expiration set to ${newExpiryDate.toLocaleString()}.` });
    }
  );
});

export default router;