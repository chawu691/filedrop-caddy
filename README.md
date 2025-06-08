# Universal File Drop

A full-stack file upload and sharing application built with React, Node.js, Express, and SQLite.

## Features

- **File Upload**: Drag & drop or click to upload files (configurable size limit)
- **File Sharing**: Get shareable links for uploaded files
- **Admin Panel**: Manage uploaded files, set expiration dates, delete files
- **System Statistics**: View file upload statistics and system metrics
- **Configurable Settings**: Adjust file size limits through admin panel
- **Secure Storage**: Files stored on server with SQLite database tracking
- **Responsive Design**: Modern UI that works on desktop and mobile devices
- **Docker Ready**: Easy deployment with Docker and Docker Compose

## Quick Start

### Option 1: Local Development

**Prerequisites:** Node.js (v16 or higher)

1. Clone the repository and install dependencies:
   ```bash
   git clone <repository-url>
   cd universal-file-drop
   npm install
   cd backend && npm install && cd ..
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3001`

### Option 2: Docker (Recommended for Production)

**Prerequisites:** Docker and Docker Compose

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd universal-file-drop
   ```

2. Start with Docker Compose:
   ```bash
   # Quick start - Development mode
   docker-compose up -d

   # Production mode with Nginx reverse proxy
   docker-compose -f docker-compose.prod.yml up -d

   # Or use the deployment script (recommended)
   ./deploy.sh dev   # Development mode
   ./deploy.sh prod  # Production mode
   ```

3. Access the application:
   - Development: `http://localhost:3001`
   - Production: `http://localhost` (with Nginx)

### Option 3: Manual Docker Build

```bash
# Build the image
docker build -t universal-file-drop .

# Run the container
docker run -d \
  -p 3001:3001 \
  -v $(pwd)/data/uploads:/app/backend/uploads \
  -v $(pwd)/data/database:/app/backend/database \
  --name universal-file-drop \
  universal-file-drop
```

## Admin Access

- **URL**: `http://localhost:3001/#admin`
- **Username**: `admin`
- **Password**: `password`

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)

### File Size Limits

Default maximum file size is 20MB. You can change this through the admin panel under Settings.

## Data Persistence

When using Docker, make sure to mount volumes for data persistence:

- `/app/backend/uploads` - Uploaded files
- `/app/backend/database` - SQLite database

## Production Deployment

For production deployment, consider:

1. **Use Docker Compose with Nginx profile** for reverse proxy and SSL termination
2. **Set up SSL certificates** in the `ssl/` directory
3. **Configure proper backup** for the database and uploads directories
4. **Set up monitoring** and health checks
5. **Use environment variables** for sensitive configuration

## Development

### Project Structure

```
├── components/          # React components
├── backend/            # Node.js backend
│   ├── src/           # TypeScript source
│   ├── dist/          # Compiled JavaScript
│   ├── uploads/       # Uploaded files
│   └── database/      # SQLite database
├── dist_frontend/     # Built frontend assets
└── docker-compose.yml # Docker configuration
```

### Available Scripts

**Development Scripts:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build both frontend and backend for production
- `npm run build:frontend` - Build frontend only
- `npm run build:backend` - Build backend only
- `npm start` - Start production server

**Deployment Scripts:**
- `./deploy.sh dev` - Start development environment with Docker
- `./deploy.sh prod` - Start production environment with Nginx
- `./deploy.sh stop` - Stop all services
- `./deploy.sh logs` - View application logs
- `./deploy.sh clean` - Clean up all containers and volumes

## License

This project is open source and available under the MIT License.
