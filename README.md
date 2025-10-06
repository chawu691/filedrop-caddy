# Universal File Drop

> 🌐 [English](./README-en.md) | 中文 | [部署指南](./DEPLOYMENT.md)

轻量级文件床/图床应用，支持直链访问，完美适配网页嵌入。

## ✨ 核心特性

- **🔗 真正的直链支持**: 媒体文件提供带扩展名的完整直链，支持网页直接嵌入
- **📁 文件上传**: 拖拽上传或点击选择，支持所有常见文件类型
- **🎯 智能链接**: 图片/视频/音频自动生成 `/api/direct/id.ext` 格式直链
- **👨‍💼 管理后台**: 文件管理、过期设置、系统统计
- **⚙️ 灵活配置**: 可调整文件大小限制等设置
- **🛡️ 安全可靠**: 文件类型验证、大小限制、管理员认证
- **📱 响应式设计**: 支持桌面和移动设备
- **🐳 Docker就绪**: 一键部署，支持Docker和Docker Compose
- **🔒 自动HTTPS**: 通过Caddy自动配置和续期Let's Encrypt证书

## 🚀 快速开始

### 方式一：Docker Compose（推荐）

**前置要求：** Docker 和 Docker Compose

```bash
# 克隆项目
git clone <repository-url>
cd universal-file-drop

# 开发环境
docker-compose up -d

# 生产环境（包含Caddy反向代理和自动HTTPS）
docker-compose -f docker-compose.prod.yml up -d

# 或使用部署脚本
./deploy.sh dev   # 开发模式
./deploy.sh prod  # 生产模式
```

访问：
- 开发环境：`http://localhost:3001`
- 生产环境：`https://your-domain.com`（自动HTTPS）

### 方式二：手动Docker构建

```bash
# 构建镜像
docker build -t universal-file-drop .

# 运行容器
docker run -d \
  -p 3001:3001 \
  -v $(pwd)/data/uploads:/app/backend/uploads \
  -v $(pwd)/data/database:/app/backend/database \
  -e ADMIN_USER="admin" \
  -e ADMIN_PASSWORD="your_password" \
  --name universal-file-drop \
  universal-file-drop
```

### 方式三：本地开发

**前置要求：** Node.js 16+

```bash
# 安装依赖
npm install
cd backend && npm install && cd ..

# 启动开发服务器
npm run dev
```

访问：`http://localhost:3001`

## 🔗 直链使用示例

上传文件后，您将获得可直接嵌入网页的链接：

```html
<!-- 图片直接嵌入 -->
<img src="https://your-domain.com/api/direct/abc123.jpg" alt="图片">

<!-- 视频直接嵌入 -->
<video controls src="https://your-domain.com/api/direct/abc123.mp4"></video>

<!-- 音频直接嵌入 -->
<audio controls src="https://your-domain.com/api/direct/abc123.mp3"></audio>

<!-- PDF文档嵌入 -->
<iframe src="https://your-domain.com/api/direct/abc123.pdf" width="100%" height="600px"></iframe>
```

## 👨‍💼 管理后台

- **访问地址**: `https://your-domain.com/#admin`（生产环境）或 `http://localhost:3001/#admin`（开发环境）
- **默认账号**: `admin` / `password`
- **功能**: 文件管理、过期设置、系统统计、配置调整

## ⚙️ 配置说明

### 环境变量
- `PORT`: 服务端口（默认：3001）
- `ADMIN_USER`: 管理员用户名
- `ADMIN_PASSWORD`: 管理员密码

### Caddy配置
- 编辑 `Caddyfile` 设置您的域名和邮箱
- Caddy将自动为您的域名申请和续期Let's Encrypt证书

### 文件大小限制
默认最大20MB，可通过管理后台调整

## 📁 项目结构

```
├── components/          # React组件
├── backend/            # Node.js后端
│   ├── src/           # TypeScript源码
│   ├── uploads/       # 上传文件存储
│   └── database/      # SQLite数据库
├── dist_frontend/     # 前端构建产物
├── Caddyfile          # Caddy配置文件
└── docker-compose.yml # Docker配置
```

## 🛠️ 开发脚本

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build           # 构建生产版本

# 部署
./deploy.sh dev         # 开发环境
./deploy.sh prod        # 生产环境
./deploy.sh stop        # 停止服务
./deploy.sh logs        # 查看日志
```

## 📄 许可证

MIT License - 开源免费使用
