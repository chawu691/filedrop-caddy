// Declaration for __dirname to satisfy TypeScript when @types/node might be missing/misconfigured
declare var __dirname: string;

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { RunResult } from 'sqlite3'; // Updated import

const router = express.Router();

// Function to get current max file size from database
const getMaxFileSize = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.get('SELECT value FROM settings WHERE key = ?', ['maxFileSizeMB'], (err: Error | null, row: any) => {
      if (err) {
        console.error('Error fetching max file size:', err);
        resolve(20); // Default fallback
      } else {
        const maxSizeMB = row ? parseInt(row.value, 10) : 20;
        resolve(maxSizeMB);
      }
    });
  });
};

// Function to sanitize filename
const sanitizeFilename = (filename: string): string => {
  // Remove or replace dangerous characters
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Replace dangerous chars with underscore
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 255); // Limit length
};

// Multer setup for file storage
// Files will be stored in 'backend/uploads/'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destPath = path.join(__dirname, '..', '..', 'uploads'); // Relative to dist/routes
    cb(null, destPath);
  },
  filename: function (req, file, cb) {
    // Sanitize original filename
    const sanitizedName = sanitizeFilename(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(sanitizedName);
    const baseName = path.basename(sanitizedName, fileExtension);
    cb(null, `${baseName}-${uniqueSuffix}${fileExtension}`);
  }
});

// Dangerous file extensions that should be blocked
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.app', '.deb', '.pkg', '.dmg', '.rpm', '.msi', '.run', '.bin'
];

// Create dynamic multer middleware
const createUploadMiddleware = (maxSizeBytes: number) => {
  return multer({
    storage: storage,
    limits: {
      fileSize: maxSizeBytes,
      files: 1 // Only allow one file at a time
    },
    fileFilter: (req, file, cb) => {
      // Check file extension for dangerous types
      const fileExt = path.extname(file.originalname).toLowerCase();
      if (DANGEROUS_EXTENSIONS.includes(fileExt)) {
        return cb(new Error(`File type ${fileExt} is not allowed for security reasons.`));
      }

      // Additional MIME type validation
      const allowedMimeTypes = [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'image/tiff', 'image/tif', 'image/bmp', 'image/x-icon', 'image/vnd.microsoft.icon',
        'image/heic', 'image/heif', 'image/avif',

        // Documents
        'application/pdf', 'text/plain', 'text/csv', 'text/tab-separated-values',
        'application/rtf', 'text/rtf',
        // Microsoft Office
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // OpenDocument
        'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet',
        'application/vnd.oasis.opendocument.presentation',
        // iWork
        'application/vnd.apple.pages', 'application/vnd.apple.numbers', 'application/vnd.apple.keynote',

        // Archives
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
        'application/gzip', 'application/x-gzip', 'application/x-tar', 'application/x-bzip2',
        'application/x-xz', 'application/x-lzma',

        // Audio
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac',
        'audio/m4a', 'audio/wma', 'audio/opus', 'audio/webm',

        // Video
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
        'video/ogg', 'video/3gpp', 'video/x-flv', 'video/x-ms-wmv',

        // Code and Text
        'text/html', 'text/css', 'application/javascript', 'application/json',
        'text/xml', 'application/xml', 'text/yaml', 'application/x-yaml',
        'text/markdown', 'text/x-markdown',
        'application/x-python-code', 'text/x-python', 'text/x-java-source',
        'text/x-c', 'text/x-c++', 'text/x-csharp', 'text/x-php',
        'application/x-sh', 'text/x-shellscript',

        // Fonts
        'font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/font-woff',
        'application/x-font-ttf', 'application/x-font-otf',

        // 3D and CAD
        'model/obj', 'model/stl', 'model/gltf+json', 'model/gltf-binary',

        // eBooks
        'application/epub+zip', 'application/x-mobipocket-ebook',

        // Other common types
        'application/octet-stream' // For unknown but potentially safe files
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error(`File type ${file.mimetype} is not allowed.`));
      }

      cb(null, true);
    }
  }).single('file'); // 'file' is the name of the form field
};

router.post('/upload', async (req: Request, res: Response) => {
  try {
    // Get current max file size from database
    const maxFileSizeMB = await getMaxFileSize();
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

    // Create upload middleware with current max size
    const uploadMiddleware = createUploadMiddleware(maxFileSizeBytes);

    // Invoke multer middleware programmatically
    uploadMiddleware(req, res, function (err: any) {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: `File too large. Max size is ${maxFileSizeMB}MB.` });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ message: 'Too many files. Only one file allowed per upload.' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        console.error('Upload error:', err);
        if (err.message.includes('not allowed')) {
          return res.status(400).json({ message: err.message });
        }
        return res.status(500).json({ message: 'Upload failed. Please try again.' });
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
        function (this: RunResult, dbErr: Error | null) { // Explicitly type 'this' as RunResult
          if (dbErr) {
            console.error('Error saving file metadata to DB:', dbErr);
            // Attempt to delete orphaned file
            fs.unlink(path.join(__dirname, '..', '..', 'uploads', filePath), unlinkErr => {
              if (unlinkErr) console.error("Error deleting orphaned file:", unlinkErr);
            });
            return res.status(500).json({ message: 'Failed to save file information.' });
          }
          const fileUrl = `/api/files/${uniqueId}`; // Correct API path for client to use
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
  } catch (error) {
    console.error('Error in upload route:', error);
    res.status(500).json({ message: 'Internal server error during upload.' });
  }
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

    // Set appropriate headers for file serving
    res.setHeader('Content-Type', row.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${row.originalName}"`);

    res.sendFile(filePathFull, (errSendFile) => {
        if (errSendFile) {
            console.error("Error sending file:", errSendFile);
            // Check if headers were already sent
            if (!res.headersSent) {
                 res.status(500).json({ message: "Error sending file." });
            }
        }
    });
  });
});

// Get current max file size setting
router.get('/config', async (req: Request, res: Response) => {
  try {
    const maxFileSizeMB = await getMaxFileSize();
    res.json({ maxFileSizeMB });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ message: 'Failed to fetch configuration.' });
  }
});

export default router;