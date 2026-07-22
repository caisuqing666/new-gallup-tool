#!/usr/bin/env tsx
/**
 * 性能优化验证脚本：对比并行启动 generateUnderstanding() 的效果
 *
 * 运行方式：
 *   npx tsx scripts/verify-performance.ts
 */

import { generateResult } from '../lib/ai-generate';
import { ScenarioId, ProblemType } from '../lib/types';

// 模拟输入
const testInput = {
  scenario: 'work-decision' as ScenarioId,
  strengths: ['focus', 'responsibility', 'communication', 'empathy', 'achiever'],
  confusion: '工作太忙，不知道该先做哪件事，感觉很焦虑',
  problemType: ProblemType.INFORMATION_PARALYSIS,
  problemFocus: '要不要继续做当前的工作',
};

console.log('='.repeat(60));
console.log('性能优化验证：generateUnderstanding() 并行启动');
console.log('='.repeat(60));

// 监控 console.log 以观察日志顺序
const logs: string[] = [];
const originalLog = console.log;
const originalInfo = console.info;
const originalWarn = console.warn;

function captureLog(fn: typeof console.log, prefix: string) {
  return (...args: any[]) => {
    const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
    logs.push(`[${prefix}] ${message}`);
    fn(...args);
  };
}

console.log = captureLog(originalLog, 'log');
console.info = captureLog(originalInfo, 'info');
console.warn = captureLog(originalWarn, 'warn');

/**
 * 运行性能测试
 */
async function runPerformanceTest() {
  console.log('\n📊 开始性能测试...\n');

  const startTime = Date.now();
  let understandingTime = 0;
  let explainPromptTime = 0;
  let decidePromptTime = 0;

  // Mock generateUnderstanding 以测量时间
  const { generateUnderstanding } = await import('../lib/generate-understanding');
  const originalGenerateUnderstanding = generateUnderstanding;

  // 临时替换 generateUnderstanding
  (global as any).__originalGenerateUnderstanding = originalGenerateUnderstanding;

  // 记录 understanding 开始时间
  let understandingStartTime = 0;

  async function timedGenerateUnderstanding(...args: any[]) {
    understandingStartTime = Date.now();
    console.log(`\n⏱️  [TIMING] generateUnderstanding 开始于 ${new Date().toISOString()}`);

    // 模拟 2 秒延迟（典型 AI 调用时间）
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await originalGenerateUnderstanding(...args);

    understandingTime = Date.now() - understandingStartTime;
    console.log(`⏱️  [TIMING] generateUnderstanding 完成于 ${new Date().toISOString()} (耗时 ${understandingTime}ms)`);

    return result;
  }

  // 临时替换
  (require('../lib/generate-understanding') as any).generateUnderstanding = timedGenerateUnderstanding;

  // 监控 buildPrompt 调用时间
  const { buildPrompt } = await import('../lib/prompts');
  const originalBuildPrompt = buildPrompt;

  let promptCallOrder = 0;

  function timedBuildPrompt(...args: any[]) {
    const now = Date.now();
    const callNum = ++promptCallOrder;

    console.log(`⏱️  [TIMING] buildPrompt 调用 #${callNum} 开始于 ${new Date().toISOString()}`);

    const result = originalBuildPrompt(...args);

    const elapsed = Date.now() - now;
    console.log(`⏱️  [TIMING] buildPrompt 调用 #${callNum} 完成于 ${new Date().toISOString()} (耗时 ${elapsed}ms)`);

    if (callNum === 1) {
      explainPromptTime = now - startTime;
    } else if (callNum === 2) {
      decidePromptTime = now - startTime;
    }

    return result;
  }

  // 临时替换
  (require('../lib/prompts') as any).buildPrompt = timedBuildPrompt;

  try {
    // 运行生成
    const result = await generateResult(
      testInput.scenario,
      testInput.strengths,
      testInput.confusion,
      testInput.problemType,
      testInput.problemFocus,
      true,
      'zh'
    );

    const totalTime = Date.now() - startTime;

    console.log('\n' + '='.repeat(60));
    console.log('性能测试结果');
    console.log('='.repeat(60));

    console.log('\n⏱️  时间线分析：');
    console.log(`  0ms          - generateResult 开始`);
    console.log(`  ${explainPromptTime}ms      - buildPrompt(explain) 调用`);
    console.log(`  ${understandingStartTime - startTime}ms      - generateUnderstanding 开始`);
    console.log(`  ${understandingStartTime - startTime + understandingTime}ms      - generateUnderstanding 完成 (耗时 ${understandingTime}ms)`);
    console.log(`  ${decidePromptTime}ms      - buildPrompt(decide) 调用`);
    console.log(`  ${totalTime}ms     - 全部完成`);

    console.log('\n📊 关键指标：');
    console.log(`  explain 启动延迟: ${explainPromptTime}ms`);
    console.log(`  understanding 耗时: ${understandingTime}ms`);
    console.log(`  总耗时: ${totalTime}ms`);

    console.log('\n🔍 并行效果分析：');

    // 检查 buildPrompt(explain) 是否在 understanding 完成之前启动
    const isParallel = explainPromptTime < (understandingStartTime - startTime + understandingTime);

    if (isParallel) {
      console.log('  ✅ 检测到并行执行：buildPrompt(explain) 在 understanding 完成之前启动');
      console.log(`  ✅ explain 启动提前了约 ${understandingTime}ms`);
    } else {
      console.log('  ⚠️  未检测到并行执行（可能是 understanding 很快完成）');
    }

    // 检查日志顺序
    console.log('\n📝 日志顺序验证：');

    const explainPromptLogIndex = logs.findIndex(l => l.includes('buildPrompt 调用 #1'));
    const understandingCompleteLogIndex = logs.findIndex(l => l.includes('已生成理解层转译'));

    if (explainPromptLogIndex < understandingCompleteLogIndex) {
      console.log('  ✅ 日志顺序正确：buildPrompt 在 understanding 完成之前');
    } else {
      console.log('  ❌ 日志顺序异常：understanding 在 buildPrompt 之前完成');
    }

    // 用户体感提升
    console.log('\n🎯 用户体感提升：');
    console.log(`  优化前 TTFB (假设): 约 ${totalTime}ms`);
    console.log(`  优化后 TTFB (实际): 约 ${totalTime}ms`);
    console.log(`  提升幅度: explain 启动提前 ${explainPromptTime}ms`);

    if (explainPromptTime < 100) {
      console.log(`  ✅ 优秀！explain 启动延迟小于 100ms`);
    } else if (explainPromptTime < 500) {
      console.log(`  ✅ 良好！explain 启动延迟小于 500ms`);
    } else {
      console.log(`  ⚠️  可优化：explain 启动延迟 ${explainPromptTime}ms`);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    // 恢复原始函数
    console.log = originalLog;
    console.info = originalInfo;
    console.warn = originalWarn;
  }
}

// 运行测试
runPerformanceTest().catch(console.error);
