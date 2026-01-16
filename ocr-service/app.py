#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PaddleOCR 微服务
用于识别盖洛普报告中的 TOP5 优势
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from paddleocr import PaddleOCR
import base64
import io
from PIL import Image
import re

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 初始化 PaddleOCR（使用中英文模型）
ocr = PaddleOCR(
    use_angle_cls=True,  # 使用方向分类器
    lang='ch',           # 中文
    use_gpu=False,       # 默认使用 CPU（有 GPU 可改为 True）
    show_log=False       # 关闭日志输出
)

# 盖洛普 34 个优势的完整列表
GALLUP_STRENGTHS = [
    # 执行力领域
    '专注', '信仰', '公平', '审慎', '成就', '排难', '纪律', '统筹', '责任',
    # 影响力领域
    '取悦', '完美', '沟通', '竞争', '统率', '自信', '行动', '追求',
    # 关系建立领域
    '个别', '交往', '伯乐', '体谅', '关联', '包容', '和谐', '积极', '适应',
    # 战略思维领域
    '分析', '前瞻', '回顾', '学习', '思维', '战略', '搜集', '理念'
]


def extract_top5_from_text(text_lines):
    """
    从 OCR 识别的文本中提取 TOP5 优势
    
    Args:
        text_lines: OCR 识别出的所有文本行
        
    Returns:
        list: 提取到的 TOP5 优势列表
    """
    # 将所有文本合并为一个字符串
    full_text = '\n'.join(text_lines)
    
    found_strengths = []
    
    # 方法1：查找 "TOP5" 或 "前五" 或 "五大" 等关键词附近的文本
    patterns = [
        r'TOP\s*5[：:：\s]*([\u4e00-\u9fa5]+)',
        r'前五[大]?[：:：\s]*([\u4e00-\u9fa5]+)',
        r'五大[：:：\s]*([\u4e00-\u9fa5]+)',
        r'优势[：:：\s]*([\u4e00-\u9fa5]+)',
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, full_text, re.IGNORECASE)
        for match in matches:
            after_keyword = match.group(1) if match.groups() else ''
            # 在匹配后的文本中查找优势
            for strength in GALLUP_STRENGTHS:
                if strength in after_keyword or strength in full_text[match.end():match.end()+100]:
                    if strength not in found_strengths:
                        found_strengths.append(strength)
    
    # 方法2：直接在整个文本中搜索所有优势名称
    for strength in GALLUP_STRENGTHS:
        if strength in full_text and strength not in found_strengths:
            found_strengths.append(strength)
    
    # 方法3：尝试解析常见的报告格式
    # 例如：1. 专注 2. 信仰 等
    numbered_pattern = r'(\d+)[.、\s]*([\u4e00-\u9fa5]{2})'
    numbered_matches = re.findall(numbered_pattern, full_text)
    for num, name in numbered_matches:
        if name in GALLUP_STRENGTHS and name not in found_strengths:
            found_strengths.append(name)
    
    # 只返回前 5 个
    return found_strengths[:5]


def base64_to_image(base64_string):
    """将 base64 字符串转换为 PIL Image"""
    # 移除 data:image/xxx;base64, 前缀
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    image_data = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_data))
    return image


@app.route('/health', methods=['GET'])
def health():
    """健康检查接口"""
    return jsonify({'status': 'ok', 'service': 'PaddleOCR'})


@app.route('/ocr', methods=['POST'])
def ocr_endpoint():
    """
    OCR 接口
    
    请求格式:
    {
        "image": "base64编码的图片字符串"
    }
    
    响应格式:
    {
        "success": true,
        "data": {
            "top5": ["专注", "信仰", ...],
            "all_text": "所有识别出的文本",
            "raw_results": [...]  # 原始 OCR 结果
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': '缺少 image 参数'
            }), 400
        
        # 将 base64 转换为图片
        image = base64_to_image(data['image'])
        
        # 执行 OCR 识别
        result = ocr.ocr(image, cls=True)
        
        # 提取所有文本行
        all_text_lines = []
        if result and result[0]:
            for line in result[0]:
                if line and len(line) > 0:
                    text_content = line[0]
                    if text_content:
                        all_text_lines.append(text_content)
        
        # 提取 TOP5 优势
        top5_strengths = extract_top5_from_text(all_text_lines)
        
        # 如果没有找到足够优势，尝试使用备用方法
        if len(top5_strengths) < 3:
            # 将所有文本合并后再尝试一次
            combined_text = ''.join(all_text_lines)
            for strength in GALLUP_STRENGTHS:
                if strength in combined_text and strength not in top5_strengths:
                    top5_strengths.append(strength)
                if len(top5_strengths) >= 5:
                    break
        
        return jsonify({
            'success': True,
            'data': {
                'top5': top5_strengths,
                'all_text': '\n'.join(all_text_lines),
                'raw_results': result[0] if result else []
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/ocr/file', methods=['POST'])
def ocr_file_endpoint():
    """
    OCR 文件上传接口
    
    支持 multipart/form-data 格式的文件上传
    """
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': '缺少 file 参数'
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': '文件名为空'
            }), 400
        
        # 读取图片
        image = Image.open(file.stream)
        
        # 执行 OCR 识别
        result = ocr.ocr(image, cls=True)
        
        # 提取所有文本行
        all_text_lines = []
        if result and result[0]:
            for line in result[0]:
                if line and len(line) > 0:
                    text_content = line[0]
                    if text_content:
                        all_text_lines.append(text_content)
        
        # 提取 TOP5 优势
        top5_strengths = extract_top5_from_text(all_text_lines)
        
        return jsonify({
            'success': True,
            'data': {
                'top5': top5_strengths,
                'all_text': '\n'.join(all_text_lines),
                'raw_results': result[0] if result else []
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    print("🚀 PaddleOCR 微服务启动中...")
    print("📝 监听端口: 5001")
    print("🔗 OCR 接口: http://localhost:5001/ocr")
    print("📁 文件上传接口: http://localhost:5001/ocr/file")
    print("❤️ 健康检查: http://localhost:5001/health")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
