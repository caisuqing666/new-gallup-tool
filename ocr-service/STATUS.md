# OCR 服务说明

## ⚠️ Python 3.14 兼容性问题

PaddlePaddle 目前不支持 Python 3.14，需要 Python 3.10 或更低版本。

## 🔧 解决方案

### 方案 1：使用 Tesseract.js（推荐，无需 Python）

Tesseract.js 是纯 JavaScript OCR 库，直接在浏览器中运行，无需后端服务。

**优点：**
- 无需 Python 环境
- 无需额外的后端服务
- 支持中英文识别
- 可在浏览器中直接使用

### 方案 2：使用 Python 3.10

如果必须使用 PaddleOCR，需要：
1. 安装 Python 3.10 或更低版本
2. 使用 pyenv 等工具管理多版本 Python
3. 在 Python 3.10 环境中运行 OCR 服务

### 方案 3：使用在线 OCR API

使用云端 OCR 服务，如：
- Google Cloud Vision API
- Azure Computer Vision
- 百度 OCR API

---

## 当前实现状态

项目已集成 Tesseract.js 方案，可以直接使用，无需启动任何 Python 服务。
