# Soulbit 前端应用

基于 Vite + React 构建的前端应用，作为 Soulbit 全栈项目的前端部分。

## 项目概述

该前端应用是 Soulbit 全栈项目的用户界面，主要功能包括：
- **多页面应用结构**：通过导航栏实现聊天、日历、设置等页面的无缝切换
- **智能聊天功能**：与 LLM 服务实时交互的聊天界面，支持多轮对话和加载状态显示
- **日历功能**：支持月份切换、阴历显示、传统宜忌信息查询
- **设置管理**：提供主题切换、语言选择、通知设置等个性化配置
- **响应式设计**：适配不同屏幕尺寸的设备
- **本地存储**：用户设置持久化保存，提升用户体验

## 技术栈

- React 19
- Vite 7
- React Router (v6+)：实现客户端路由，支持多页面应用
- Fetch API：与后端服务通信
- WebSocket：实现实时聊天功能
- LocalStorage：用户设置持久化
- Docker

## 目录结构

```
apps/web/
├── public/            # 静态资源目录，不经过打包直接复制到dist
├── src/               # 源代码目录
│   ├── assets/        # 静态资源，会经过打包处理
│   ├── components/    # 通用组件目录
│   │   └── Navbar.jsx # 导航栏组件，提供页面切换功能
│   ├── pages/         # 页面组件目录
│   │   ├── ChatPage.jsx      # 聊天页面，实现与LLM的实时交互
│   │   ├── CalendarPage.jsx  # 日历页面，提供日历视图和宜忌信息
│   │   └── SettingsPage.jsx  # 设置页面，管理用户偏好设置
│   ├── App.css        # 根组件样式
│   ├── App.jsx        # 根组件，配置路由结构
│   ├── index.css      # 全局样式
│   └── main.jsx       # 应用入口文件
├── .dockerignore      # Docker忽略配置
├── .gitignore         # Git忽略配置
├── .env.example       # 环境变量示例
├── Dockerfile         # Docker构建文件
├── eslint.config.js   # ESLint配置
├── index.html         # HTML模板
├── package.json       # 项目配置和依赖
└── vite.config.js     # Vite配置
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
  - `POST /api/llm` - 与 LLM 服务交互（传统HTTP方式）
  - `WebSocket /api/ws/chat` - 与 LLM 服务进行实时聊天通信

### WebSocket 通信协议

聊天功能使用 WebSocket 协议实现实时通信：
- **连接建立**：客户端通过 `ws://localhost:8080/api/ws/chat` 建立连接
- **发送消息**：客户端发送 JSON 格式的消息，包含用户问题
- **接收消息**：服务器发送 JSON 格式的响应，包含：
  - `message`: 聊天消息内容
  - `is_final`: 布尔值，指示是否为最终回复
  - `loading`: 布尔值，指示加载状态
- **断开连接**：聊天结束或页面关闭时自动断开连接

## 开发注意事项

1. **服务依赖**：确保 Go 网关和 Python LLM 服务已启动，否则前端应用将无法正常工作

2. **环境变量配置**：
   - 复制 `.env.example` 为 `.env`
   - 修改 `VITE_API_URL` 配置为实际的 API 网关地址
   - 在代码中通过 `import.meta.env.VITE_API_URL` 访问环境变量

3. **路由开发**：
   - 使用 React Router v6 进行路由管理
   - 在 `App.jsx` 中配置路由规则
   - 新页面应放在 `src/pages/` 目录下
   - 通用组件应放在 `src/components/` 目录下
   - 使用 `Link` 组件进行页面导航，避免页面刷新

4. **WebSocket 通信**：
   - 聊天功能使用 WebSocket 进行实时通信
   - 确保 WebSocket 服务器地址正确配置
   - 页面卸载时会自动关闭 WebSocket 连接，避免内存泄漏

5. **本地存储**：
   - 用户设置使用 LocalStorage 进行持久化
   - 敏感信息请勿存储在 LocalStorage 中

6. **开发体验**：
   - 开发过程中使用热模块替换(HMR)，修改代码后会自动刷新页面
   - 使用 `npm run dev` 启动开发服务器

7. **代码规范**：
   - 所有新组件应添加详细注释
   - 组件注释应包括组件用途、状态管理、副作用和UI逻辑
   - 遵循 React 最佳实践和团队代码风格

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

