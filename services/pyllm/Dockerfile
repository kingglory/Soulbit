# 使用Python 3.11的轻量级镜像作为基础镜像
FROM python:3.11-slim

# 设置工作目录为/app
WORKDIR /app

# 将requirements.txt文件复制到容器中
COPY requirements.txt /app/requirements.txt

# 安装项目依赖（--no-cache-dir选项避免缓存依赖，减小镜像体积）
RUN pip install --no-cache-dir -r requirements.txt

# 将当前目录的所有文件复制到容器的/app目录
COPY . /app

# 暴露容器的8000端口
EXPOSE 8000

# 设置容器启动命令：使用uvicorn运行FastAPI应用
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

