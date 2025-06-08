# 通用文件上传系统

基于 React、Node.js、Express 和 SQLite 构建的全栈文件上传和分享应用程序。

## 功能特性

- **文件上传**: 支持拖拽上传或点击选择文件（可配置大小限制）
- **文件分享**: 为上传的文件生成可分享的链接
- **管理后台**: 管理已上传文件、设置过期时间、删除文件
- **系统统计**: 查看文件上传统计和系统指标
- **可配置设置**: 通过管理面板调整文件大小限制
- **安全存储**: 文件存储在服务器上，使用 SQLite 数据库跟踪
- **响应式设计**: 现代化 UI，支持桌面和移动设备
- **Docker 就绪**: 支持 Docker 和 Docker Compose 轻松部署

## 快速开始

### 方式一：本地开发

**前置要求：** Node.js (v16 或更高版本)

1. 克隆仓库并安装依赖：
   ```bash
   git clone <仓库地址>
   cd universal-file-drop
   npm install
   cd backend && npm install && cd ..
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

3. 在浏览器中打开 `http://localhost:3001`

### 方式二：Docker（推荐用于生产环境）

**前置要求：** Docker 和 Docker Compose

1. 克隆仓库：
   ```bash
   git clone <仓库地址>
   cd universal-file-drop
   ```

2. 使用 Docker Compose 启动：
   ```bash
   # 快速开始 - 开发模式
   docker-compose up -d

   # 生产模式（包含 Nginx 反向代理）
   docker-compose -f docker-compose.prod.yml up -d

   # 或使用部署脚本（推荐）
   ./deploy.sh dev   # 开发模式
   ./deploy.sh prod  # 生产模式
   ```

3. 访问应用：
   - 开发环境：`http://localhost:3001`
   - 生产环境：`http://localhost`（使用 Nginx）

### 方式三：手动 Docker 构建

```bash
# 构建镜像
docker build -t universal-file-drop .

# 运行容器
docker run -d \
  -p 3001:3001 \
  -v $(pwd)/data/uploads:/app/backend/uploads \
  -v $(pwd)/data/database:/app/backend/database \
  --name universal-file-drop \
  universal-file-drop
```

## 管理员访问

- **地址**: `http://localhost:3001/#admin`
- **用户名**: `admin`
- **密码**: `password`

## 配置说明

### 环境变量

- `PORT`: 服务器端口（默认：3001）
- `NODE_ENV`: 环境模式（development/production）

### 文件大小限制

默认最大文件大小为 20MB。您可以通过管理面板的设置页面修改此限制。

## 数据持久化

使用 Docker 时，请确保挂载卷以实现数据持久化：

- `/app/backend/uploads` - 上传的文件
- `/app/backend/database` - SQLite 数据库

## 生产环境部署

生产环境部署建议：

1. **使用带 Nginx 配置的 Docker Compose** 进行反向代理和 SSL 终止
2. **在 `ssl/` 目录中设置 SSL 证书**
3. **为数据库和上传目录配置适当的备份**
4. **设置监控和健康检查**
5. **使用环境变量进行敏感配置**

## 开发说明

### 项目结构

```
├── components/          # React 组件
├── backend/            # Node.js 后端
│   ├── src/           # TypeScript 源码
│   ├── dist/          # 编译后的 JavaScript
│   ├── uploads/       # 上传的文件
│   └── database/      # SQLite 数据库
├── dist_frontend/     # 构建的前端资源
└── docker-compose.yml # Docker 配置
```

### 可用脚本

**开发脚本：**
- `npm run dev` - 启动带热重载的开发服务器
- `npm run build` - 构建前端和后端用于生产环境
- `npm run build:frontend` - 仅构建前端
- `npm run build:backend` - 仅构建后端
- `npm start` - 启动生产服务器

**部署脚本：**
- `./deploy.sh dev` - 使用 Docker 启动开发环境
- `./deploy.sh prod` - 使用 Nginx 启动生产环境
- `./deploy.sh stop` - 停止所有服务
- `./deploy.sh logs` - 查看应用日志
- `./deploy.sh clean` - 清理所有容器和卷

## 界面预览

### 上传页面
- 现代化的拖拽上传界面
- 更大的上传区域（占页面宽度的60%）
- 更大的 SVG 图标，提升视觉效果
- 底部显示社区项目信息

### 管理后台
- 文件管理：查看、删除、设置过期时间
- 系统统计：文件数量、存储使用情况等
- 系统设置：配置文件大小限制
- 右上角返回上传页面按钮
- 统一的内容宽度，确保界面一致性

## 安全特性

- 文件类型验证
- 文件大小限制
- 管理员身份验证
- 安全的文件存储
- 防止路径遍历攻击

## 技术栈

- **前端**: React, TypeScript, Tailwind CSS
- **后端**: Node.js, Express, TypeScript
- **数据库**: SQLite
- **构建工具**: esbuild
- **容器化**: Docker, Docker Compose
- **反向代理**: Nginx（可选）

## 许可证

本项目是开源项目，采用 MIT 许可证。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 支持

如果您在使用过程中遇到问题，请：

1. 查看本文档的常见问题
2. 检查 GitHub Issues
3. 提交新的 Issue 描述您的问题

---

**注意**: 这是一个社区项目，免费使用，仅供教育目的。请谨慎上传敏感文件。
