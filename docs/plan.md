# 全栈学习与实现计划（React + Go + Python）

## 项目愿景
- 在一个本地可运行的 Demo 中同时学习并实践 React（前端）、Go（网关/后端）、Python FastAPI（LLM 服务），并配套最小数据库持久化（SQLite）。
- 目标是从 0 到 1，按阶段推进，每一步有清晰的完成标准与验证方法。

## 架构总览
- 前端：`apps/web`（基于Vite构建的React应用）
- 网关：`services/gateway`（Go，统一对外暴露 `http://localhost:8080`，转发到 Python）
- 后端：`services/pyllm`（Python FastAPI，提供 `/llm` 与 `/health`，负责业务与可选 LLM 调用）
- 数据库：本地 `SQLite`（Python 侧简单持久化，后续可升级 Postgres）

## 当前进度
- 前端入口：`apps/web/index.html:26` 通过 `fetch` 请求网关 `GET /api/hello` 与 `POST /api/llm`。
- Go 网关：`services/gateway/main.go:66` 提供 `/api/hello`（测试用）与 `/api/llm`（转发到 Python），含基础 CORS。
- Python 服务：`services/pyllm/main.py:42` 提供 `/llm`（基于多Agent工作流生成回复并写入 SQLite，支持ModelScope和OpenAI模型）与 `/health`。
- 依赖文件：`services/pyllm/requirements.txt`，包含 `fastapi/uvicorn/pydantic/openai`。

## 阶段计划

### 阶段 0：跑通最小骨架
- 目标：理解架构，打通链路，不做复杂特性。
- 完成标准：浏览器能显示“Hello from Go”，输入提示词后得到“Echo: xxx”。
- 验证：
  - Python：`GET http://localhost:8000/health` 返回 `{"status":"ok"}`（`services/pyllm/main.py:38`）。
  - Go：`GET http://localhost:8080/api/hello` 返回 `{"message":"Hello from Go"}`（`services/gateway/main.go:36`）。
  - 前端：`apps/web/index.html:50` 显示表单和回复。

### 阶段 1：React 基础与组件化
- 学习要点：`useState/useEffect`、受控输入框、`fetch`、加载与错误态。
- 实践：把 `App` 拆分为输入区与结果区组件，增加加载和错误提示。
- 完成标准：输入、发送、等待、显示结果的体验完整且代码清晰。

### 阶段 2：Go 网关巩固
- 学习要点：`net/http`、中间件（CORS、日志）、统一错误响应。
- 实践：在 `/api/llm` 增加输入校验与一致的错误结构。
- 完成标准：所有响应为 `application/json`，错误格式统一，转发健壮。

### 阶段 3：Python 服务与持久化
- 学习要点：FastAPI 路由/模型/响应，SQLite 简单持久化，查询接口。
- 实践：新增 `GET /messages?limit=20` 查询最近消息；抽象数据访问层。
- 完成标准：能查看历史消息；表结构与迁移脚本（简易版）明确。

### 阶段 4：数据库升级（可选）
- 本地演示用 `SQLite`；后续升级到 `Postgres`。
- 切换策略：先抽象 DAO 层，避免业务直接依赖具体库。

### 阶段 5：LLM 能力演进（可选）
- 路线：回声 → 云模型直连（OpenAI/ModelScope） → 多Agent工作流（决策Agent+专业Agent） → 简单上下文记忆 → 历史拼接 → 可配置模型参数（温度/系统提示）。
- 安全：使用环境变量 `OPENAI_API_KEY` 或 `MODELSCOPE_API_KEY`，不要把密钥写入仓库。

## 运行与验证（Windows）
- 启动 Python 服务：
  - `cd d:\githubs\Soulbit\services\pyllm`
  - `python -m venv .venv && .venv\Scripts\activate`
  - `pip install -r requirements.txt`
  - `uvicorn main:app --port 8000 --reload`
- 启动 Go 网关：
  - `cd d:\githubs\Soulbit\services\gateway`
  - `go mod tidy`
  - `go run .`
- 打开前端：
  - `cd d:\githubs\Soulbit\apps\web`
  - `npm install`（首次运行需要）
  - `npm run dev`
  - 访问 `http://localhost:5173`
- 验证链路：
  - 页面顶部显示“Hello from Go”（`services/gateway/main.go:36`）。
  - 输入并发送后显示“LLM 回复：Echo: ...”（`services/pyllm/main.py:42`）。

## 注意事项
- 端口占用：前端默认 `:5173`；Go 默认 `:8080`；Python 默认 `:8000`。
- 跨域：网关已设置 CORS（`services/gateway/main.go:23`），前端直接请求网关。
- 密钥：若使用 OpenAI，设置系统环境变量 `OPENAI_API_KEY`；若使用 ModelScope，设置 `MODELSCOPE_API_KEY`；未配置则回退到回声。
- 依赖：Python 虚拟环境隔离；Go 建议 1.21+；前端需要 Node.js 16+ 和 npm 8+。
- 日志与错误：先用简单 `log.Println`（Go）与统一 JSON 错误结构，避免混乱输出。

## 下一步
- 完成阶段 1：优化前端组件结构，增加加载/错误态与简单输入校验。
- 完成阶段 2：在网关实现统一错误响应与输入校验，补充基础日志。
- 完成阶段 3：实现消息查询接口与 DAO 层，巩固持久化能力。

---
最后更新：初始版本（已打通最小链路，等待阶段 1~3 的细化实现与验证）。

## Docker 一键部署
- 前置：安装 Docker 与 Docker Compose
- 在项目根目录执行：`docker compose up -d`
- 服务与端口：
  - 前端（Nginx）：`http://localhost:3000`
  - Go 网关：`http://localhost:8080/api/hello`
  - Python 服务：`http://localhost:8000/health`
- 环境变量：
  - 如需云模型，设置 `OPENAI_API_KEY`（Compose 会透传）
  - 网关通过 `PY_SERVICE_URL` 指向 Python 服务（Compose已配置为 `http://pyllm:8000`）
