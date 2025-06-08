
// Declaration for __dirname to satisfy TypeScript when @types/node might be missing/misconfigured
declare var __dirname: string;

import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'database', 'app.db'); // one level up from dist/src for 'database'

let db: sqlite3.Database;

export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database', err.message);
        return reject(err);
      }
      console.log('Connected to the SQLite database.');
      db.serialize(() => {
        db.run(`
          CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uniqueId TEXT UNIQUE NOT NULL,
            originalName TEXT NOT NULL,
            mimeType TEXT NOT NULL,
            size INTEGER NOT NULL,
            filePath TEXT NOT NULL,
            uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            expiresAt DATETIME NULL
          )
        `, (err) => {
          if (err) {
            console.error('Error creating files table', err.message);
            return reject(err);
          }

          // Create settings table for configuration
          db.run(`
            CREATE TABLE IF NOT EXISTS settings (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              key TEXT UNIQUE NOT NULL,
              value TEXT NOT NULL,
              updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (settingsErr) => {
            if (settingsErr) {
              console.error('Error creating settings table', settingsErr.message);
              return reject(settingsErr);
            }

            // Insert default max file size if not exists
            db.run(`
              INSERT OR IGNORE INTO settings (key, value) VALUES ('maxFileSizeMB', '20')
            `, (insertErr) => {
              if (insertErr) {
                console.error('Error inserting default settings', insertErr.message);
                return reject(insertErr);
              }
              resolve();
            });
          });
        });
      });
    });
  });
};

export const getDb = (): sqlite3.Database => {
  if (!db) {
    // This case should ideally not happen if initializeDatabase is called at startup
    // and awaited. For robustness, we can try to re-initialize or throw.
    console.warn("Database not initialized, attempting to connect...");
    // Synchronous connection attempt here is not ideal.
    // Better to ensure initializeDatabase has completed.
    // For now, this will likely use the uninitialized 'db' object which might be closed.
    // A robust solution would involve a singleton pattern with promise-based initialization.
    // However, for this structure, we assume `initializeDatabase` is called and completes first.
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) throw new Error("DB connection failed when getDb was called after initial failure or no init.");
    });
  }
  return db;
};