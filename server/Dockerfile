FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and libs first
COPY requirements.txt .
COPY libs/ ./libs/

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy rest of the application
COPY . .

# Create necessary directories
RUN mkdir -p /data/projects

# Set environment variables
ENV FLASK_APP=app
ENV FLASK_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Run gunicorn
CMD ["gunicorn", "--bind", ":8080", "--workers", "2", "--timeout", "300", "--worker-class", "gevent", "--limit-request-line","0","app:create_app"]