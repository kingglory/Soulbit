# Soulbit 前端应用

基于 Vite + React 构建的前端应用，作为 Soulbit 全栈项目的前端部分。

## 项目概述

该前端应用是 Soulbit 全栈项目的用户界面，主要功能包括：
- 展示来自 Go 网关的问候信息
- 提供与 LLM 服务交互的聊天界面
- 显示 LLM 服务的响应结果
- 提供日历功能（支持月份切换、阴历显示、宜忌信息）
- 响应式设计，适配不同屏幕尺寸

## 技术栈

- React 19
- Vite 7
- Fetch API
- Docker

## 目录结构

```
apps/web/
├── public/         # 静态资源目录，不经过打包直接复制到dist
├── src/            # 源代码目录
│   ├── assets/     # 静态资源，会经过打包处理
│   ├── App.css     # 根组件样式
│   ├── App.jsx     # 根组件
│   ├── index.css   # 全局样式
│   └── main.jsx    # 应用入口文件
├── .dockerignore   # Docker忽略配置
├── .gitignore      # Git忽略配置
├── .env.example    # 环境变量示例
├── Dockerfile      # Docker构建文件
├── eslint.config.js # ESLint配置
├── index.html      # HTML模板
├── package.json    # 项目配置和依赖
└── vite.config.js  # Vite配置
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动。

### 3. 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist` 目录中。

### 4. 预览生产构建

```bash
npm run preview
```

## 与后端集成

前端应用通过 Go 网关与后端服务进行通信：
- Go 网关地址：`http://localhost:8080`
- 主要 API 端点：
  - `GET /api/hello` - 获取问候信息
  - `POST /api/llm` - 与 LLM 服务交互

## 开发注意事项

1. 确保 Go 网关和 Python LLM 服务已启动
2. **环境变量配置**：
   - 复制 `.env.example` 为 `.env`
   - 修改 `VITE_API_URL` 配置为实际的 API 网关地址
   - 在代码中通过 `import.meta.env.VITE_API_URL` 访问环境变量
3. 开发过程中使用热模块替换(HMR)，修改代码后会自动刷新页面

## Docker部署

### 构建Docker镜像

```bash
docker build -t soulbit-web .
```

### 运行Docker容器

```bash
docker run -d -p 3000:80 --name soulbit-web soulbit-web
```

### 多阶段构建说明

- **构建阶段**：使用 `node:18-alpine` 安装依赖并构建应用
- **运行阶段**：使用 `nginx:alpine` 提供静态文件服务，减小镜像体积

### 环境变量配置

在Docker Compose中配置环境变量：

```yaml
web:
  build: ./apps/web
  environment:
    - VITE_API_URL=http://gateway:8080
  ports:
    - "3000:80"
  depends_on:
    - gateway
```

## 学习资源

- [Vite 官方文档](https://vitejs.dev/guide/)
- [React 官方文档](https://react.dev/learn)

