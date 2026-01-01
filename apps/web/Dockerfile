# 阶段1：构建前端应用
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制项目文件
COPY . .

# 构建生产版本
RUN npm run build

# 阶段2：使用Nginx提供静态文件
FROM nginx:alpine

# 复制构建产物到Nginx的html目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义Nginx配置（可选，如果需要的话）
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]