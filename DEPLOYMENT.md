# 服务器部署指南

## 📦 需要上传的文件

### 必需文件（约 50KB）：
```
├── Dockerfile                    # Docker构建文件
├── docker-compose.yml          # 开发环境配置
├── docker-compose.prod.yml     # 生产环境配置
├── nginx.conf                  # Nginx配置
├── deploy.sh                   # 部署脚本
├── package.json                # 根目录依赖
├── package-lock.json           # 锁定版本
├── tsconfig.json               # TypeScript配置
├── index.html                  # 前端入口
├── index.tsx                   # 前端主文件
├── metadata.json               # 应用元数据
├── App.tsx                     # 主应用组件
├── components/                 # React组件目录
│   ├── AdminPage.tsx
│   ├── ErrorBoundary.tsx
│   ├── FileUpload.tsx
│   └── UploadIcon.tsx
└── backend/                    # 后端源码
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    └── src/                    # TypeScript源码
        ├── server.ts
        ├── database.ts
        └── routes/
            ├── fileRoutes.ts
            └── adminRoutes.ts
```

### 不需要上传的文件：
- `node_modules/` (Docker会重新安装)
- `dist_frontend/` (Docker会重新构建)
- `backend/dist/` (Docker会重新编译)
- `backend/uploads/` (运行时创建)
- `backend/database/` (运行时创建)
- `.git/` (版本控制文件)

## 🚀 部署步骤

### 步骤1：准备服务器环境

确保服务器已安装：
- Docker (20.10+)
- Docker Compose (2.0+)

```bash
# 检查Docker版本
docker --version
docker-compose --version
```

### 步骤2：上传项目文件

**方法A：使用rsync（推荐）**
```bash
# 在本地项目目录执行
rsync -av --exclude-from='.gitignore' \
  --exclude='node_modules' \
  --exclude='dist_frontend' \
  --exclude='backend/dist' \
  --exclude='backend/uploads' \
  --exclude='backend/database' \
  --exclude='.git' \
  ./ user@your-server:/path/to/universal-file-drop/
```

**方法B：使用scp**
```bash
# 创建压缩包（排除不需要的文件）
tar --exclude='node_modules' \
    --exclude='dist_frontend' \
    --exclude='backend/dist' \
    --exclude='backend/uploads' \
    --exclude='backend/database' \
    --exclude='.git' \
    -czf universal-file-drop.tar.gz .

# 上传到服务器
scp universal-file-drop.tar.gz user@your-server:/path/to/

# 在服务器上解压
ssh user@your-server
cd /path/to/
tar -xzf universal-file-drop.tar.gz
```

**方法C：使用Git（如果有代码仓库）**
```bash
# 在服务器上
git clone https://github.com/your-username/universal-file-drop.git
cd universal-file-drop
```

### 步骤3：服务器上部署

```bash
# 进入项目目录
cd /path/to/universal-file-drop

# 给部署脚本执行权限
chmod +x deploy.sh

# 启动生产环境
./deploy.sh prod
```

### 步骤4：配置防火墙（如果需要）

```bash
# 开放HTTP端口
sudo ufw allow 80

# 开放HTTPS端口（如果使用SSL）
sudo ufw allow 443
```

## 🔧 高级配置

### SSL证书配置

1. 将SSL证书放在 `ssl/` 目录：
```bash
mkdir ssl
# 复制你的证书文件
cp /path/to/your/cert.pem ssl/
cp /path/to/your/key.pem ssl/
```

2. 或者使用Let's Encrypt：
```bash
# 安装certbot
sudo apt install certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 复制证书到项目目录
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
```

### 环境变量配置

创建 `.env` 文件：
```bash
# 复制示例文件
cp .env.example .env

# 编辑配置
nano .env
```

## 📊 监控和维护

### 查看服务状态
```bash
# 查看运行状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
./deploy.sh logs

# 查看资源使用
docker stats
```

### 备份数据
```bash
# 备份上传的文件
tar -czf backup-uploads-$(date +%Y%m%d).tar.gz data/uploads/

# 备份数据库
tar -czf backup-database-$(date +%Y%m%d).tar.gz data/database/
```

### 更新应用
```bash
# 停止服务
./deploy.sh stop

# 拉取最新代码（如果使用Git）
git pull

# 重新构建并启动
docker-compose -f docker-compose.prod.yml build --no-cache
./deploy.sh prod
```

## 🔍 故障排除

### 常见问题

1. **端口被占用**
```bash
# 检查端口使用
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

2. **权限问题**
```bash
# 确保Docker用户有权限
sudo usermod -aG docker $USER
# 重新登录生效
```

3. **磁盘空间不足**
```bash
# 清理Docker
docker system prune -a
```

## 📞 支持

如果遇到问题：
1. 检查日志：`./deploy.sh logs`
2. 查看Docker状态：`docker-compose ps`
3. 检查防火墙设置
4. 确认域名DNS解析

---

**部署完成后访问：**
- 应用地址：`http://your-server-ip` 或 `https://your-domain.com`
- 管理后台：添加 `/#admin` 后缀
