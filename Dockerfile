FROM node:25-alpine

# 安装 pnpm
RUN npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install

# 复制项目文件
COPY . .

# 暴露端口
EXPOSE 5933

# 启动开发服务器 (使用轮询模式以支持 Windows Docker 热重载)
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5933", "--force"]
