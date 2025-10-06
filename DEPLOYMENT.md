# 服务器部署指南

## 📦 需要上传的文件

### 必需文件（约 50KB）：
```
├── Dockerfile                    # Docker构建文件
├── docker-compose.yml          # 开发环境配置
├── docker-compose.prod.yml     # 生产环境配置
├── Caddyfile                   # Caddy配置文件
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
- `nginx.conf` (不再需要，已替换为Caddyfile)

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

### 步骤2：配置域名

确保您的域名（例如：your-domain.com）已正确解析到服务器IP地址。

### 步骤3：上传项目文件

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
  --exclude='nginx.conf' \
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
    --exclude='nginx.conf' \
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

### 步骤4：配置Caddy

编辑`Caddyfile`文件，设置您的域名和邮箱：

```bash
# 编辑Caddyfile
nano Caddyfile
```

将以下内容中的`your-domain.com`替换为您的实际域名，`your-email@example.com`替换为您的邮箱：

```
your-domain.com {
    # Email for ACME registration
    email your-email@example.com
    
    # 其他配置保持不变
    ...
}
```

### 步骤5：服务器上部署

```bash
# 进入项目目录
cd /path/to/universal-file-drop

# 给部署脚本执行权限
chmod +x deploy.sh

# 启动生产环境
./deploy.sh prod
```

### 步骤6：配置防火墙（如果需要）

```bash
# 开放HTTP端口（Caddy需要80端口获取证书）
sudo ufw allow 80

# 开放HTTPS端口
sudo ufw allow 443
```

## 🔧 环境变量配置

创建 `.env` 文件（可选）：
```bash
# 在项目根目录创建
cat > .env << EOF
ADMIN_USER=your_admin_username
ADMIN_PASSWORD=your_secure_password
PORT=3001
EOF
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
sudo netstat -tlnp | grep :3001
```

2. **Caddy证书申请失败**
```bash
# 检查Caddy日志
docker-compose -f docker-compose.prod.yml logs caddy

# 确保域名已正确解析到服务器IP
# 确保80端口未被其他服务占用且可从外部访问
```

3. **权限问题**
```bash
# 确保Docker用户有权限
sudo usermod -aG docker $USER
# 重新登录生效
```

4. **磁盘空间不足**
```bash
# 清理Docker
docker system prune -a
```

## 🔒 HTTPS证书管理

- Caddy会自动为您的域名申请Let's Encrypt证书
- 证书将自动续期（通常在到期前30天）
- 证书存储在Caddy的数据卷中

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
