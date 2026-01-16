#!/bin/bash
# PaddleOCR OCR 服务启动脚本

echo "🚀 启动 PaddleOCR 微服务..."
echo ""

# 检查 Python 是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 Python 3"
    echo "请先安装 Python 3.8 或更高版本"
    exit 1
fi

# 进入 OCR 服务目录
cd "$(dirname "$0")"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建 Python 虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "📥 安装依赖..."
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 启动服务
echo ""
echo "✅ 准备完成！"
echo "🚀 启动 OCR 服务..."
echo ""
echo "📍 服务地址: http://localhost:5000"
echo "📄 API 文档:"
echo "   - POST /ocr      - Base64 图片识别"
echo "   - POST /ocr/file - 文件上传识别"
echo "   - GET  /health   - 健康检查"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

python app.py
