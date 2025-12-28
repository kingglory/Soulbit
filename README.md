# Soulbit 全栈 Demo

一个本地可运行的全栈学习项目，技术栈：React（前端）、Go（网关）、Python FastAPI（LLM 服务），数据库使用 SQLite。

## 目录结构
- `apps/web`：静态前端，用 Nginx 容器提供
- `services/gateway`：Go 网关，统一对外 `http://localhost:8080`
- `services/pyllm`：Python FastAPI，提供 `/llm` 与 `/health`
- `docs/plan.md`：分阶段学习与实现计划（持续更新）

## 快速开始（本地不使用 Docker）
- Python 服务：
  - `cd services/pyllm`
  - `python -m venv .venv && .venv\Scripts\activate`
  - `pip install -r requirements.txt`
  - `uvicorn main:app --port 8000 --reload`
- Go 网关：
  - `cd services/gateway`
  - `go mod tidy`
  - `go run .`
- 前端：直接打开 `apps/web/index.html`

## 一键部署（Docker Compose）
- 先安装 Docker & Docker Compose
- 在项目根目录执行：`docker compose up -d`
- 访问：
  - 前端 `http://localhost:3000`
  - 网关 `http://localhost:8080/api/hello`
  - Python `http://localhost:8000/health`
- 环境变量：
  - 可在命令行注入 `OPENAI_API_KEY`，Python 服务会自动读取

## 技术学习路线（简要）
- 阶段 0：跑通最小骨架（已完成）
- 阶段 1：React 基础与组件化（输入、请求、加载/错误态）
- 阶段 2：Go 网关巩固（中间件、统一错误结构）
- 阶段 3：Python 服务与持久化（查询接口与 DAO）
- 阶段 4：数据库升级（可选，Postgres）
- 阶段 5：LLM 能力演进（直连云模型、上下文）

## 注意事项
- 端口：前端 `3000`，网关 `8080`，Python `8000`
- 跨域：通过网关处理；前端仅请求网关
- 密钥：使用 `OPENAI_API_KEY` 环境变量；不要写入仓库
- 数据：SQLite 位于 Python 容器 `/app/data`（使用 Compose 卷持久化）

更多细节与阶段目标请查看 `docs/plan.md`。
