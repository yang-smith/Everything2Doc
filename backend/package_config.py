"""Package dependency configuration"""
import os

# 检测是否在Docker环境中
IN_DOCKER = os.environ.get('IN_DOCKER', False)

# 本地开发环境路径
LOCAL_WHEEL_PATH = "./libs/everything2doc-0.1.0-py3-none-any.whl"

# Docker环境路径
DOCKER_WHEEL_PATH = "/app/libs/everything2doc-0.1.0-py3-none-any.whl"

# 根据环境选择合适的路径
WHEEL_PATH = DOCKER_WHEEL_PATH if IN_DOCKER else LOCAL_WHEEL_PATH

# 辅助函数 - 根据环境选择合适的依赖字符串
def get_everything2doc_dependency():
    return f"everything2doc @ file://{WHEEL_PATH}" 