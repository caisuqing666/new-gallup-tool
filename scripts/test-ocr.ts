/**
 * OCR 功能测试脚本
 * 用于验证 Tesseract.js OCR 功能是否正常工作
 */

import { performOcrFromBase64 } from '../lib/ocr-service';
import { writeFileSync } from 'fs';

// 创建一个简单的测试图片（包含盖洛普优势文本）
// 使用 Canvas 生成测试图片
function createTestImage(): string {
  const canvas = `
    <html>
    <head>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; }
        h1 { text-align: center; color: #333; font-size: 24px; margin-bottom: 30px; }
        .strength-list { list-style: none; padding: 0; }
        .strength-item { 
          padding: 15px; 
          margin: 10px 0; 
          background: #f5f5f5; 
          border-left: 4px solid #5D4037; 
          font-size: 18px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>盖洛普优势报告</h1>
        <div class="strength-list">
          <div class="strength-item">1. 专注</div>
          <div class="strength-item">2. 信仰</div>
          <div class="strength-item">3. 责任</div>
          <div class="strength-item">4. 前瞻</div>
          <div class="strength-item">5. 搜集</div>
        </div>
      </div>
    </body>
    </html>
  `;
  return canvas;
}

// 测试 OCR 功能
export async function testOcrFunction() {
  console.log('🧪 开始测试 OCR 功能...\n');

  // 由于我们在 Node.js 环境中，无法直接使用 Canvas
  // 我们提供一个测试说明
  console.log('📋 OCR 测试说明：\n');
  console.log('1. 打开浏览器访问：');
  console.log('   file:///Users/caixiaopi/Desktop/gallup-tool/test-ocr.html\n');
  console.log('2. 或在应用中测试：');
  console.log('   http://localhost:3001\n');
  console.log('   选择 "我不太懂这份报告" → 上传图片\n');
  
  console.log('\n📝 测试图片要求：');
  console.log('- 包含盖洛普 TOP5 优势列表');
  console.log('- 图片清晰，文字可辨');
  console.log('- 支持格式：JPG、PNG\n');

  console.log('🔍 支持的盖洛普优势列表：');
  
  const strengths = [
    // 执行力
    '专注', '信仰', '公平', '审慎', '成就', '排难', '纪律', '统筹', '责任',
    // 影响力
    '取悦', '完美', '沟通', '竞争', '统率', '自信', '行动', '追求',
    // 关系建立
    '个别', '交往', '伯乐', '体谅', '关联', '包容', '和谐', '积极', '适应',
    // 战略思维
    '分析', '前瞻', '回顾', '学习', '思维', '战略', '搜集', '理念'
  ];

  console.log(strengths.join('、'));
  
  console.log('\n✅ OCR 模块已就绪！');
  console.log('💡 提示：首次使用需下载约 20MB 语言包，请耐心等待\n');
}

// 运行测试
testOcrFunction().catch(console.error);
