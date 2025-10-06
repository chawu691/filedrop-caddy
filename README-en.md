
# Universal File Drop

> English | [中文](./README.md) | [Deployment Guide](./DEPLOYMENT.md)

A lightweight file hosting service with direct link support, perfect for web embedding.

## ✨ Key Features

- **🔗 True Direct Links**: Media files get complete direct links with extensions for web embedding
- **📁 File Upload**: Drag & drop or click to upload any file type
- **🎯 Smart Links**: Images/videos/audio automatically get `/api/direct/id.ext` format links
- **👨‍💼 Admin Panel**: File management, expiration settings, system statistics
- **⚙️ Configurable**: Adjustable file size limits and settings
- **🛡️ Secure**: File type validation, size limits, admin authentication
- **📱 Responsive**: Works on desktop and mobile devices
- **🐳 Docker Ready**: One-click deployment with Docker and Docker Compose
- **🔒 Automatic HTTPS**: Auto-configured and renewable Let's Encrypt certificates via Caddy

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

**Prerequisites:** Docker and Docker Compose

```bash
# Clone project
git clone <repository-url>
cd universal-file-drop

# Development environment
docker-compose up -d

# Production environment (with Caddy reverse proxy and automatic HTTPS)
docker-compose -f docker-compose.prod.yml up -d

# Or use deployment scripts
./deploy.sh dev   # Development mode
./deploy.sh prod  # Production mode
```

Access:
- Development: `http://localhost:3001`
- Production: `https://your-domain.com` (automatic HTTPS)

### Option 2: Manual Docker Build

```bash
# Build image
docker build -t universal-file-drop .

# Run container
docker run -d \
  -p 3001:3001 \
  -v $(pwd)/data/uploads:/app/backend/uploads \
  -v $(pwd)/data/database:/app/backend/database \
  -e ADMIN_USER="admin" \
  -e ADMIN_PASSWORD="your_password" \
  --name universal-file-drop \
  universal-file-drop
```

### Option 3: Local Development

**Prerequisites:** Node.js 16+

```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Start development server
npm run dev
```

Access: `http://localhost:3001`

## 🔗 Direct Link Usage

After uploading files, you get direct links ready for web embedding:

```html
<!-- Direct image embedding -->
<img src="https://your-domain.com/api/direct/abc123.jpg" alt="Image">

<!-- Direct video embedding -->
<video controls src="https://your-domain.com/api/direct/abc123.mp4"></video>

<!-- Direct audio embedding -->
<audio controls src="https://your-domain.com/api/direct/abc123.mp3"></audio>

<!-- PDF document embedding -->
<iframe src="https://your-domain.com/api/direct/abc123.pdf" width="100%" height="600px"></iframe>
```

## 👨‍💼 Admin Panel

- **URL**: `https://your-domain.com/#admin` (production) or `http://localhost:3001/#admin` (development)
- **Default Credentials**: `admin` / `password`
- **Features**: File management, expiration settings, system statistics

## ⚙️ Configuration

### Environment Variables
- `PORT`: Server port (default: 3001)
- `ADMIN_USER`: Admin username
- `ADMIN_PASSWORD`: Admin password

### Caddy Configuration
- Edit `Caddyfile` to set your domain and email
- Caddy will automatically obtain and renew Let's Encrypt certificates for your domain

### File Size Limits
Default 20MB, adjustable via admin panel

## 🛠️ Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production

# Deployment
./deploy.sh dev         # Development environment
./deploy.sh prod        # Production environment
./deploy.sh stop        # Stop services
./deploy.sh logs        # View logs
```

## 📄 License

MIT License - Free and open source
