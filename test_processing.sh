#!/bin/bash

PROJECT_ID="3825be97-2e77-408e-aca7-b4b21feb6964"
API_URL="http://localhost:5000/api"

# 开始处理
echo "Starting processing..."
curl -X POST \
  "${API_URL}/projects/${PROJECT_ID}/start_processing" \
  -H "Content-Type: application/json" \
  -v

# 等待几秒
sleep 2

# 检查状态
echo -e "\nChecking status..."
curl -X GET \
  "${API_URL}/projects/${PROJECT_ID}/status" \
  -H "Content-Type: application/json" \
  -v