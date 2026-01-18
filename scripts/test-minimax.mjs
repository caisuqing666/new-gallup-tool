#!/usr/bin/env node

/**
 * Minimax API 测试脚本
 * 用于验证 Minimax 模型调用是否成功
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

// 测试 Minimax API 调用
async function testMinimaxAPI() {
  console.log('🧪 开始测试 Minimax API 调用...\n');

  // 加载环境变量
  const env = loadEnvFile();
  const apiKey = env.MINIMAX_API_KEY;
  const groupId = env.MINIMAX_GROUP_ID;
  const endpoint = env.MINIMAX_ENDPOINT || 'https://api.minimax.chat/v1/text/chatcompletion_v2';
  const model = env.MINIMAX_MODEL || 'abab6.5-chat';

  // 验证配置
  if (!apiKey) {
    console.error('❌ MINIMAX_API_KEY 未配置');
    return false;
  }

  if (!groupId) {
    console.error('❌ MINIMAX_GROUP_ID 未配置');
    return false;
  }

  // 清理可能包含的注释
  const cleanGroupId = groupId.split('#')[0].trim();
  const cleanApiKey = apiKey.split('#')[0].trim();

  console.log('✅ 配置信息:');
  console.log(`   - Endpoint: ${endpoint}`);
  console.log(`   - Model: ${model}`);
  console.log(`   - API Key: ${cleanApiKey.substring(0, 20)}...`);
  console.log(`   - Group ID: ${cleanGroupId}`);
  console.log();

  // 构建带 GroupId 的完整 URL
  const fullUrl = `${endpoint}?GroupId=${cleanGroupId}`;
  console.log(`   - 完整 URL: ${fullUrl}`);
  console.log();

  // 构建测试请求
  const systemPrompt = '你是一个专业的盖洛普优势测试分析专家，擅长解读用户的优势组合。';
  const userPrompt = '请简单介绍一下盖洛普优势测试中的"成就"优势。';

  console.log('📤 发送测试请求...');
  console.log(`   System: ${systemPrompt}`);
  console.log(`   User: ${userPrompt}`);
  console.log();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanApiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
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

    // 打印完整响应结构
    console.log('📊 响应数据结构:');
    console.log(JSON.stringify(data, null, 2));
    console.log();

    // 提取内容
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error('❌ 响应中没有找到内容');
      console.error('响应数据:', JSON.stringify(data, null, 2));
      return false;
    }

    console.log('✅ Minimax 响应成功!');
    console.log();
    console.log('📝 生成的内容:');
    console.log('─'.repeat(60));
    console.log(content);
    console.log('─'.repeat(60));
    console.log();

    return true;

  } catch (error) {
    console.error('❌ 请求失败:');
    if (error.name === 'AbortError') {
      console.error('   请求超时（30秒）');
    } else {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error(error.stack);
      }
    }
    return false;
  }
}

// 主执行逻辑
async function main() {
  console.log('🚀 Minimax API 测试工具');
  console.log('='.repeat(60));
  console.log();

  const success = await testMinimaxAPI();

  console.log();
  console.log('='.repeat(60));
  if (success) {
    console.log('✅ 测试通过！Minimax API 调用成功。');
    process.exit(0);
  } else {
    console.log('❌ 测试失败！请检查配置和错误信息。');
    process.exit(1);
  }
}

main();
