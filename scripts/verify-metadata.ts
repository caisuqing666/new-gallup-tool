#!/usr/bin/env tsx
/**
 * 本地验证脚本：验证 action-plan.ts 的 metadata 可观测性
 *
 * 运行方式：
 *   npx tsx scripts/verify-metadata.ts
 */

import { generateActionPlan } from '../lib/services/action-plan';
import { ScenarioId } from '../lib/types';

// 模拟输入
const testInput = {
  scenario: 'work-decision' as ScenarioId,
  strengths: ['focus', 'responsibility', 'communication', 'empathy', 'achiever'],
  confusion: '工作太忙，不知道该先做哪件事，感觉很焦虑',
};

console.log('='.repeat(60));
console.log('验证 action-plan.ts metadata 可观测性');
console.log('='.repeat(60));

async function runTests() {
  const results: { name: string; result: any }[] = [];

  // 测试1：AI 未启用
  console.log('\n📋 测试1: AI 未启用 (ENABLE_AI=false)');
  try {
    const originalEnableAI = process.env.ENABLE_AI;
    process.env.ENABLE_AI = 'false';

    const result = await generateActionPlan(testInput);

    process.env.ENABLE_AI = originalEnableAI;

    console.log('✓ usedMockFallback:', result.metadata.usedMockFallback);
    console.log('✓ fallbackReason:', result.metadata.fallbackReason);
    console.log('✓ aiEnabled:', result.metadata.aiEnabled);
    console.log('✓ effectiveProviderType:', result.metadata.effectiveProviderType);

    const passed =
      result.metadata.usedMockFallback === true &&
      result.metadata.fallbackReason === 'ai_disabled' &&
      result.metadata.aiEnabled === false &&
      result.metadata.effectiveProviderType === 'mock';

    console.log(passed ? '✅ 测试1 通过' : '❌ 测试1 失败');
    results.push({ name: 'AI 未启用', result });
  } catch (error) {
    console.error('❌ 测试1 失败:', error);
  }

  // 测试2：AI 配置无效
  console.log('\n📋 测试2: AI 配置无效 (API Key 缺失)');
  try {
    const originalKey = process.env.ZHIPU_API_KEY;
    delete process.env.ZHIPU_API_KEY;
    process.env.ENABLE_AI = 'true';

    const result = await generateActionPlan(testInput);

    if (originalKey) process.env.ZHIPU_API_KEY = originalKey;

    console.log('✓ usedMockFallback:', result.metadata.usedMockFallback);
    console.log('✓ fallbackReason:', result.metadata.fallbackReason);
    console.log('✓ aiEnabled:', result.metadata.aiEnabled);
    console.log('✓ effectiveProviderType:', result.metadata.effectiveProviderType);

    const passed =
      result.metadata.usedMockFallback === true &&
      result.metadata.fallbackReason === 'invalid_config' &&
      result.metadata.aiEnabled === false &&
      result.metadata.effectiveProviderType === 'mock';

    console.log(passed ? '✅ 测试2 通过' : '❌ 测试2 失败');
    results.push({ name: 'AI 配置无效', result });
  } catch (error) {
    console.error('❌ 测试2 失败:', error);
  }

  // 测试3：明确指定 Mock
  console.log('\n📋 测试3: 明确指定 Mock (provider: { type: "mock" })');
  try {
    const result = await generateActionPlan({
      ...testInput,
      provider: { type: 'mock' },
    });

    console.log('✓ usedMockFallback:', result.metadata.usedMockFallback);
    console.log('✓ fallbackReason:', result.metadata.fallbackReason);
    console.log('✓ aiEnabled:', result.metadata.aiEnabled);
    console.log('✓ effectiveProviderType:', result.metadata.effectiveProviderType);

    const passed =
      result.metadata.usedMockFallback === true &&
      result.metadata.fallbackReason !== null &&
      result.metadata.effectiveProviderType === 'mock';

    console.log(passed ? '✅ 测试3 通过' : '❌ 测试3 失败');
    results.push({ name: '明确指定 Mock', result });
  } catch (error) {
    console.error('❌ 测试3 失败:', error);
  }

  // 测试4：AI 启用且配置有效（需要实际 API Key）
  console.log('\n📋 测试4: AI 启用且配置有效（需要 API Key）');
  const hasApiKey = !!(process.env.ZHIPU_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
  if (!hasApiKey) {
    console.log('⚠️  跳过测试4：未配置 API Key');
  } else {
    try {
      process.env.ENABLE_AI = 'true';

      const result = await generateActionPlan(testInput);

      console.log('✓ usedMockFallback:', result.metadata.usedMockFallback);
      console.log('✓ fallbackReason:', result.metadata.fallbackReason);
      console.log('✓ aiEnabled:', result.metadata.aiEnabled);
      console.log('✓ effectiveProviderType:', result.metadata.effectiveProviderType);

      const isAI = result.metadata.effectiveProviderType === 'ai';
      const isMockFallback = result.metadata.usedMockFallback === true;

      if (isAI) {
        console.log('✅ 测试4 通过：AI 生成成功');
        results.push({ name: 'AI 生成成功', result });
      } else if (isMockFallback) {
        const hasReason = result.metadata.fallbackReason === 'ai_error' || result.metadata.fallbackReason === 'schema_invalid';
        console.log(hasReason ? '✅ 测试4 通过：AI 失败，正确降级到 Mock' : '❌ 测试4 失败：降级原因不正确');
        results.push({ name: 'AI 降级到 Mock', result });
      } else {
        console.log('❌ 测试4 失败：状态不明确');
      }
    } catch (error) {
      console.error('❌ 测试4 失败:', error);
    }
  }

  // 汇总
  console.log('\n' + '='.repeat(60));
  console.log('测试汇总');
  console.log('='.repeat(60));
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name}:`);
    console.log('   ', JSON.stringify(r.result.metadata, null, 2));
  });

  // 验证要求
  console.log('\n' + '='.repeat(60));
  console.log('验证要求');
  console.log('='.repeat(60));

  const allTests = results.map(r => r.result.metadata);
  const allUsedMockCorrect = allTests.every(
    m => m.usedMockFallback === (m.effectiveProviderType === 'mock' || m.fallbackReason !== null)
  );
  const allHaveFallbackReason = allTests.every(
    m => m.usedMockFallback ? m.fallbackReason !== null : true
  );
  const allHaveAiEnabled = allTests.every(m => typeof m.aiEnabled === 'boolean');
  const allHaveProviderType = allTests.every(m => m.effectiveProviderType === 'ai' || m.effectiveProviderType === 'mock');

  console.log(`1. usedMockFallback 正确标识: ${allUsedMockCorrect ? '✅' : '❌'}`);
  console.log(`2. fallbackReason 取值正确: ${allHaveFallbackReason ? '✅' : '❌'}`);
  console.log(`3. aiEnabled 为 boolean: ${allHaveAiEnabled ? '✅' : '❌'}`);
  console.log(`4. effectiveProviderType 正确: ${allHaveProviderType ? '✅' : '❌'}`);

  const allPassed = allUsedMockCorrect && allHaveFallbackReason && allHaveAiEnabled && allHaveProviderType;
  console.log('\n' + (allPassed ? '✅ 所有测试通过' : '❌ 部分测试失败'));
}

runTests().catch(console.error);
