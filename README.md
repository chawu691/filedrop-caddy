
# Universal File Drop (通用文件投递服务)

Universal File Drop 是一个全栈 Web 应用程序，提供简单的文件上传服务以及用于管理已上传文件的管理面板。用户可以轻松拖放或选择文件进行上传，获取可共享的链接，管理员可以查看、删除这些文件并设置其过期日期。

该应用程序采用 React 前端（使用 Tailwind CSS 设计样式）和 Node.js/Express 后端，使用 SQLite 进行元数据存储。它设计为使用 Docker 进行部署。

## 功能特性

*   **文件上传:**
    *   支持拖放操作。
    *   通过对话框选择文件。
    *   上传过程中模拟进度条。
    *   最大文件大小限制（可配置，默认为 20MB）。
    *   成功上传后生成可共享链接。
*   **管理面板 (`#admin` 路由):**
    *   通过基本身份验证（Basic Authentication）进行保护。
    *   列出所有已上传文件及其详细信息（名称、大小、上传日期、过期日期）。
    *   允许删除已上传文件（从服务器存储和数据库中移除）。
    *   允许为文件设置/更新过期日期。
*   **静态文件服务:** 通过唯一链接直接提供已上传的文件。
*   **数据库存储:** 使用 SQLite 存储已上传文件的元数据。
*   **Docker化:** 包含 `Dockerfile` 以便轻松进行容器化部署。

## 技术栈

*   **前端:**
    *   React 19
    *   Tailwind CSS (通过 CDN)
    *   TypeScript
    *   `esbuild` (用于打包)
    *   Import Maps (通过 esm.sh 实现浏览器原生 ES 模块加载)
*   **后端:**
    *   Node.js
    *   Express.js
    *   SQLite3 (用于数据库)
    *   Multer (用于处理 `multipart/form-data` 文件上传)
    *   UUID (用于生成唯一文件 ID)
    *   TypeScript
*   **开发与部署:**
    *   Docker & Docker Compose (隐含，已提供 `Dockerfile`)
    *   `concurrently` (用于在开发中同时运行前端和后端)
    *   `nodemon` (用于后端开发中的热重载)

## 环境要求

*   [Node.js](https://nodejs.org/) (建议 v18 或更高版本)
*   [npm](https://www.npmjs.com/) (通常随 Node.js 一起安装)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (或 Linux 上的 Docker Engine)

## 开始与本地开发

1.  **克隆仓库:**
    ```bash
    git clone https://github.com/fandong1993/filedrop
    cd universal-file-drop
    ```

2.  **安装根目录依赖:**
    (这些主要用于 `esbuild` 和 `concurrently`)
    ```bash
    npm install
    ```

3.  **安装后端依赖:**
    ```bash
    cd backend
    npm install
    cd ..
    ```

4.  **环境变量 (后端 - 本地开发可选):**
    后端使用基本身份验证来保护管理面板。默认凭据是 `admin` / `password`。
    您可以通过在 `backend/` 目录下创建一个 `.env` 文件来覆盖这些默认值：
    ```
    # backend/.env
    ADMIN_USER=your_custom_admin_username
    ADMIN_PASSWORD=your_custom_admin_password
    PORT=3001 # 可选, 默认为 3001
    ```
    *注意: `.env` 文件已被 gitignore。如果需要，请记得手动创建。*

5.  **构建应用程序 (前端和后端):**
    此命令会构建前端资源并编译后端 TypeScript 代码。
    ```bash
    npm run build
    ```

6.  **以开发模式运行 (带热重载):**
    这将以观察模式启动前端打包工具，并使用 `nodemon` 启动后端服务器。
    ```bash
    npm run dev
    ```
    *   前端将可通过后端服务访问：`http://localhost:3001`
    *   管理面板地址：`http://localhost:3001/#admin`

7.  **以类生产模式运行 (构建后):**
    ```bash
    npm start
    ```
    这将仅启动后端服务器，该服务器提供预先构建的前端资源。访问地址：`http://localhost:3001`。

## Docker 部署

应用程序包含一个 `Dockerfile` 用于构建生产就绪的镜像。

1.  **确保 Dockerfile 和 .dockerignore 文件名正确:**
    *   Docker 配置文件应命名为 `Dockerfile` (无扩展名)。
    *   忽略文件应命名为 `.dockerignore` (无扩展名)。

2.  **构建 Docker 镜像:**
    在项目根目录下运行：
    ```bash
    docker build -t universal-file-drop .
    ```

3.  **为数据卷准备主机目录:**
    为了在容器外部持久化已上传的文件和 SQLite 数据库，您应该挂载数据卷。**首次运行容器前**，请在您的主机上创建这些目录：
    ```bash
    mkdir -p backend/uploads
    mkdir -p backend/database
    ```
    如果您从项目根目录运行 `docker run`，这些路径对应于数据卷挂载的源路径。

4.  **运行 Docker 容器:**
    ```bash
    docker run -d \
      -p 3001:3001 \
      -v "$(pwd)/backend/uploads:/app/backend/uploads" \
      -v "$(pwd)/backend/database:/app/backend/database" \
      -e ADMIN_USER="your_admin_username" \
      -e ADMIN_PASSWORD="your_admin_password" \
      -e PORT="3001" \
      --name ufd-app \
      universal-file-drop
    ```
    *   `-d`: 以分离模式运行。
    *   `-p 3001:3001`: 将主机的 3001 端口映射到容器的 3001 端口。
    *   `-v "$(pwd)/backend/uploads:/app/backend/uploads"`: 将主机的 `./backend/uploads` 目录挂载到容器内的 `/app/backend/uploads`，用于持久化文件存储。
    *   `-v "$(pwd)/backend/database:/app/backend/database"`: 将主机的 `./backend/database` 目录挂载到容器内的 `/app/backend/database`，用于持久化 SQLite 数据库。
    *   `-e ADMIN_USER="your_admin_username"`: 设置管理员用户名。
    *   `-e ADMIN_PASSWORD="your_admin_password"`: 设置管理员密码。
    *   `-e PORT="3001"`: (可选) 设置容器内服务器监听的端口。
    *   `--name ufd-app`: 为容器分配一个名称，方便管理。

    应用程序将可以通过 `http://localhost:3001` 访问。

5.  **数据卷权限 (排查 `SQLITE_CANTOPEN` 错误):**
    使用 Docker 数据卷时，容器内的用户 (`appuser`) 需要对挂载的主机目录具有写权限。如果您遇到 `SQLITE_CANTOPEN: unable to open database file` 错误，这很可能是您主机目录 (`backend/database`) 的权限问题。
    *   **快速修复 (开发环境):** 为您的主机目录授予通用写权限：
        ```bash
        sudo chmod -R 777 backend/database
        sudo chmod -R 777 backend/uploads
        ```
    *   **更安全的修复:** 确定容器内 `appuser` 的 UID/GID (对于 Alpine 的 `adduser -S` 通常是 1000 或 100)，然后将您的主机目录 `chown` 给该 UID/GID。
        ```bash
        # 示例：如果 appuser 的 UID/GID 是 1000
        sudo chown -R 1000:1000 backend/database
        sudo chown -R 1000:1000 backend/uploads
        ```

## 使用方法

*   **上传页面:** 导航到 `http://localhost:3001` (或您的 Docker 主机的 IP/域名)。
*   **管理面板:** 导航到 `http://localhost:3001/#admin`。
    *   **默认凭据 (如果未被覆盖):**
        *   用户名: `admin`
        *   密码: `password`
    *   这些凭据可以在运行 Docker 容器时通过环境变量更改 (见上文)，或者直接修改 `backend/src/middleware/auth.ts` 中的代码 (如果在生产环境中使用 Docker，则不推荐此方式)。

## 项目结构

```
.
├── Dockerfile            # Docker 配置
├── .dockerignore         # Docker 构建时忽略的文件
├── index.html            # 前端主 HTML 文件
├── index.tsx             # 前端入口点 (React)
├── App.tsx               # 主 React 应用组件
├── metadata.json         # 应用元数据
├── package.json          # 根项目脚本和前端构建依赖
├── package-lock.json     # 根项目锁定文件
├── tsconfig.json         # (如果根目录为编辑器添加，目前前端直接使用esbuild)
├── components/           # 前端 React 组件
│   ├── FileUpload.tsx
│   ├── AdminPage.tsx
│   └── UploadIcon.tsx
├── dist_frontend/        # 构建后的前端资源输出目录 (生成)
└── backend/
    ├── package.json      # 后端依赖和脚本
    ├── package-lock.json # 后端锁定文件
    ├── tsconfig.json     # 后端 TypeScript 配置
    ├── src/              # 后端源代码 (TypeScript)
    │   ├── server.ts     # Express 服务器设置
    │   ├── db.ts         # SQLite 数据库初始化和访问
    │   ├── middleware/
    │   │   └── auth.ts   # 基本身份验证中间件
    │   └── routes/
    │       ├── fileRoutes.ts # 文件上传和访问路由
    │       └── adminRoutes.ts# 管理面板功能路由
    ├── dist/             # 编译后的后端 JavaScript 输出目录 (生成)
    ├── uploads/          # 存储已上传文件的目录 (通过 Docker 数据卷持久化)
    └── database/         # SQLite 数据库文件目录 (通过 Docker 数据卷持久化)
```

## 贡献

欢迎贡献！请随时提交拉取请求 (Pull Request) 或开启问题 (Issue)。

## 许可证

本项目开源，基于 MIT 许可证 (如果您喜欢，也可以选择其他许可证)。
```

I've named this file `README.zh-CN.md` so it can coexist with your English `README.md`.
