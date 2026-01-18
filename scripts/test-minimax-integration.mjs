#!/usr/bin/env node

/**
 * Minimax 集成测试脚本
 * 用于验证 Minimax 通过项目 API 路由的完整集成
 */

import fs from 'fs';
import path from 'path';

// 读取 .env 文件
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    console.error('❌ .env 文件不存在');
    return {};
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      env[key] = valueParts.join('=').trim();
    }
  }

  return env;
}

// 测试报告解读 API
async function testReportInterpretAPI() {
  console.log('🧪 测试报告解读 API（使用 Minimax）...\n');

  const env = loadEnvFile();

  // 验证配置
  if (!env.MINIMAX_API_KEY) {
    console.error('❌ MINIMAX_API_KEY 未配置');
    return false;
  }

  if (!env.MINIMAX_GROUP_ID) {
    console.error('❌ MINIMAX_GROUP_ID 未配置');
    return false;
  }

  console.log('✅ Minimax 配置已加载');
  console.log();

  // 构建测试请求
  const testData = {
    strengths: ['achiever', 'strategic', 'learner'],
    useAi: true,
    provider: 'minimax'
  };

  console.log('📤 发送测试请求到 API...');
  console.log('   Endpoint: http://localhost:3001/api/interpret');
  console.log('   Provider: minimax');
  console.log('   Strengths:', testData.strengths.join(', '));
  console.log();
  console.log('⚠️  注意：需要开发服务器运行在 localhost:3001');
  console.log('   请在另一个终端运行: npm run dev');
  console.log();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch('http://localhost:3001/api/interpret', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`📥 响应状态: ${response.status} ${response.statusText}`);
    console.log();

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 调用失败:');
      console.error(errorText);
      return false;
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ API 返回失败:', data.error);
      return false;
    }

    console.log('✅ API 调用成功!');
    console.log();

    // 显示结果摘要
    if (data.data) {
      console.log('📊 返回数据摘要:');
      console.log('─'.repeat(60));

      if (data.data.overview) {
        console.log('总体分析:');
        console.log(data.data.overview.substring(0, 200) + '...');
        console.log();
      }

      if (data.data.strengthInsights && data.data.strengthInsights.length > 0) {
        console.log(`优势洞察: ${data.data.strengthInsights.length} 个优势`);
        data.data.strengthInsights.forEach((insight, index) => {
          console.log(`  ${index + 1}. ${insight.strengthName}`);
        });
        console.log();
      }

      console.log('─'.repeat(60));
    }

    // 显示元数据
    if (data.metadata) {
      console.log();
      console.log('📋 元数据:');
      console.log(`   是否使用 Mock 降级: ${data.metadata.usedMockFallback ? '是' : '否'}`);
      console.log(`   处理时间: ${data.metadata.processingTimeMs}ms`);
    }

    return true;

  } catch (error) {
    console.error('❌ 请求失败:');
    if (error.name === 'AbortError') {
      console.error('   请求超时（60秒）');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('   无法连接到开发服务器');
      console.error('   请确保运行: npm run dev');
    } else {
      console.error(`   ${error.message}`);
    }
    return false;
  }
}

// 主执行逻辑
async function main() {
  console.log('🚀 Minimax 集成测试工具');
  console.log('='.repeat(60));
  console.log();

  const success = await testReportInterpretAPI();

  console.log();
  console.log('='.repeat(60));
  if (success) {
    console.log('✅ 集成测试通过！Minimax 已成功集成到项目中。');
    console.log();
    console.log('💡 下一步：');
    console.log('   1. 在浏览器中访问 http://localhost:3001');
    console.log('   2. 选择报告解读路径');
    console.log('   3. 上传报告或选择优势');
    console.log('   4. 在前端测试 Minimax 生成效果');
    process.exit(0);
  } else {
    console.log('❌ 集成测试失败！');
    console.log();
    console.log('🔍 排查建议：');
    console.log('   1. 检查 .env 文件中的 MINIMAX_API_KEY 和 MINIMAX_GROUP_ID');
    console.log('   2. 确保开发服务器正在运行: npm run dev');
    console.log('   3. 检查网络连接');
    console.log('   4. 查看服务器控制台输出的错误信息');
    process.exit(1);
  }
}

main();
