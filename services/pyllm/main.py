# -*- coding: utf-8 -*-
"""
Soulbit LLM服务主入口
"""
from fastapi.middleware.cors import CORSMiddleware
from .utils.logger import logger
from .utils.env import load_env
from .database.db import init_db
from .api.routes import app

# 配置CORS中间件，允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源（生产环境应限制具体域名）
    allow_credentials=False,  # 不允许凭证
    allow_methods=["*"],  # 允许所有HTTP方法
    allow_headers=["*"],  # 允许所有HTTP头
)

# 健康检查接口
@app.get("/health")
def health():
    """
    服务健康检查接口，用于监控服务状态
    """
    logger.info("接收到健康检查请求")
    return {"status": "ok"}

# 主程序入口
if __name__ == "__main__":
    import uvicorn
    logger.info("Soulbit LLM服务启动")
    # 启动服务
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)