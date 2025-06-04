
import { Request, Response, NextFunction } from 'express';
import { Buffer } from 'buffer'; // Added import for Buffer

// WARNING: This is a very basic and insecure way to handle authentication.
// It's for demonstration purposes only. In a production environment,
// use a robust authentication library (e.g., Passport.js) and secure credential storage.
const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password'; // Hardcoded for demo

export const basicAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const [type, credentialsB64] = authHeader.split(' ');

  if (type !== 'Basic' || !credentialsB64) { // also check if credentialsB64 exists
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"'); // Prompt again if malformed
    return res.status(401).json({ message: 'Unsupported or malformed authentication type.' });
  }

  try {
    const decoded = Buffer.from(credentialsB64, 'base64').toString('utf-8'); // Specify utf-8 for clarity
    const [username, password] = decoded.split(':');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return next(); // Authenticated
    } else {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
  } catch (error) {
    console.error("Error decoding auth credentials:", error);
    return res.status(400).json({ message: 'Malformed authentication credentials.'});
  }
};
