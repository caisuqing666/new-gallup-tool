# PaddleOCR OCR 服务

用于识别盖洛普报告中的 TOP5 优势的 Python 微服务。

## 功能特性

- 基于 PaddleOCR 的高精度中文识别
- 自动提取盖洛普 34 个优势中的 TOP5
- 支持 Base64 图片和文件上传两种方式
- RESTful API 接口

## 快速开始

### 1. 安装依赖

```bash
# 使用启动脚本（推荐）
cd ocr-service
chmod +x start.sh
./start.sh
```

或手动安装：

```bash
cd ocr-service

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

### 2. 启动服务

```bash
python app.py
```

服务将在 `http://localhost:5000` 启动。

### 3. 测试接口

```bash
# 健康检查
curl http://localhost:5000/health

# OCR 识别（需要发送 Base64 编码的图片）
curl -X POST http://localhost:5000/ocr \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,..."}'
```

## API 接口

### POST /ocr

Base64 图片 OCR 识别。

**请求：**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "top5": ["专注", "信仰", "责任", "前瞻", "搜集"],
    "all_text": "所有识别出的文本",
    "raw_results": [...]
  }
}
```

### POST /ocr/file

文件上传方式 OCR 识别。

**请求：**
```
Content-Type: multipart/form-data

file: <图片文件>
```

**响应：**
```json
{
  "success": true,
  "data": {
    "top5": ["专注", "信仰", "责任", "前瞻", "搜集"],
    "all_text": "所有识别出的文本",
    "raw_results": [...]
  }
}
```

### GET /health

健康检查接口。

**响应：**
```json
{
  "status": "ok",
  "service": "PaddleOCR"
}
```

## 支持的优势列表

### 执行力领域 (9项)
专注、信仰、公平、审慎、成就、排难、纪律、统筹、责任

### 影响力领域 (8项)
取悦、完美、沟通、竞争、统率、自信、行动、追求

### 关系建立领域 (9项)
个别、交往、伯乐、体谅、关联、包容、和谐、积极、适应

### 战略思维领域 (8项)
分析、前瞻、回顾、学习、思维、战略、搜集、理念

## 常见问题

### Q: 如何使用 GPU 加速？
A: 修改 `app.py` 中的配置：
```python
ocr = PaddleOCR(
    use_gpu=True,  # 改为 True
    ...
)
```

### Q: 识别不准确怎么办？
A: 
1. 确保上传的图片清晰
2. 报告中的优势名称应该完整显示
3. 可以在前端手动调整识别结果

### Q: 内存不足怎么办？
A: PaddleOCR 默认会占用较多内存，可以尝试：
```python
ocr = PaddleOCR(
    det_model_dir=None,  # 使用轻量级检测模型
    rec_model_dir=None,  # 使用轻量级识别模型
    ...
)
```

## 技术栈

- **PaddleOCR**: 百度开源的 OCR 工具库
- **Flask**: Python Web 框架
- **Flask-CORS**: 跨域支持
- **Pillow**: 图像处理

## 开发

### 项目结构

```
ocr-service/
├── app.py              # 主应用
├── requirements.txt    # Python 依赖
├── start.sh           # 启动脚本
└── README.md          # 说明文档
```

### 扩展功能

如需自定义识别逻辑，可以修改 `app.py` 中的 `extract_top5_from_text` 函数。

## 许可证

MIT License
