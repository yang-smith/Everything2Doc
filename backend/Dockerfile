FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制pyproject.toml
COPY pyproject.toml .

# 安装项目依赖
RUN pip install --no-cache-dir .

# 复制项目文件
COPY . .

# 配置环境变量
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production
ENV PROJECT_FOLDER=/data/projects

# 创建项目文件夹
RUN mkdir -p /data/projects

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]