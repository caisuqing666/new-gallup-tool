/**
 * 测试脚本：验证 problemType + problemFocus 双重硬约束
 *
 * 测试案例：和谐 × 体谅 × 责任
 * - problemType: P2 边界与责任过载
 * - problemFocus: "如何在多方需求之间确定优先级？"
 */

import { ProblemType, PROBLEM_TYPE_LABELS, PROBLEM_TYPE_DESCRIPTIONS, StrengthId, isValidProblemFocus } from '../lib/types';
import { buildPrompt } from '../lib/prompts';

// 测试参数
const testStrengths: StrengthId[] = ['harmony', 'empathy', 'responsibility']; // 使用优势 ID
const testProblemType = ProblemType.BOUNDARY_OVERLOAD; // P2
const testProblemFocus = '如何在多方需求之间确定优先级？';
const testScenario = '职场决策';
const testConfusion = '事情太多，每件都想负责，结果把自己累垮了，不知道怎么拒绝别人';

console.log('='.repeat(80));
console.log('【双重硬约束测试：problemType + problemFocus】');
console.log('='.repeat(80));
console.log('');

console.log('【测试参数】');
console.log('- 优势组合:', testStrengths.join(' × '));
console.log('- 问题类型:', testProblemType, PROBLEM_TYPE_LABELS[testProblemType]);
console.log('- 问题焦点:', testProblemFocus);
console.log('- 场景:', testScenario);
console.log('- 困惑描述:', testConfusion);
console.log('');

// 验证 problemFocus 有效性
console.log('【1. problemFocus 有效性验证】');
const isValid = isValidProblemFocus(testProblemFocus);
console.log(`✓ problemFocus 有效: ${isValid}`);
console.log('');

console.log('【2. Decide 系统 Prompt 验证】');
console.log('='.repeat(80));
console.log('');

// 使用统一的 buildPrompt 函数
const { systemPrompt: decidePrompt } = buildPrompt({
  pathType: 'breakthrough-decide',
  params: {
    strengths: testStrengths,
    confusion: testConfusion,
    problemType: testProblemType,
    problemFocus: testProblemFocus,
  },
});

// 只显示前 1500 字符
const preview = decidePrompt.substring(0, 1500);
console.log(preview);
console.log('...');
console.log('');

console.log('='.repeat(80));
console.log('【3. 双重硬约束检查】');
console.log('='.repeat(80));
console.log('');

// 验证双重硬约束
const dualConstraintChecks = [
  {
    name: '包含问题类型标识',
    check: () => decidePrompt.includes(`## 【当前问题类型】`)
  },
  {
    name: '包含问题焦点标识',
    check: () => decidePrompt.includes(`## 【当前问题焦点】`)
  },
  {
    name: '包含具体问题焦点内容',
    check: () => decidePrompt.includes(testProblemFocus)
  },
  {
    name: '包含"针对【${problemFocus}】"约束',
    check: () => decidePrompt.includes(`针对【${testProblemFocus}】`)
  },
  {
    name: '包含"在【${problemType}】下"约束',
    check: () => decidePrompt.includes(`在【${PROBLEM_TYPE_LABELS[testProblemType]}】下`)
  },
  {
    name: '包含总约束格式',
    check: () => decidePrompt.includes('针对【') && decidePrompt.includes('】，在【') && decidePrompt.includes('】下，现在应该怎么做')
  },
  {
    name: '包含 problemFocus 互换测试',
    check: () => decidePrompt.includes('problemFocus 互换测试') || decidePrompt.includes('问题焦点换成')
  },
  {
    name: '包含 problemType 互换测试',
    check: () => decidePrompt.includes('problemType 互换测试') || decidePrompt.includes('问题类型换成')
  },
  {
    name: '每条判定强制格式要求',
    check: () => decidePrompt.includes('必须能够补全为') && decidePrompt.includes('针对【') && decidePrompt.includes('】')
  },
];

console.log('双重硬约束检查结果:');
dualConstraintChecks.forEach(constraint => {
  const passed = constraint.check();
  console.log(`  ${passed ? '✓' : '✗'} ${constraint.name}`);
});
console.log('');

console.log('='.repeat(80));
console.log('【4. 关键约束段落提取】');
console.log('='.repeat(80));
console.log('');

// 提取并显示关键约束段落
const sections = [
  { name: '【当前问题焦点】', marker: '## 【当前问题焦点】' },
  { name: '【系统级硬约束 - 双重锁定】', marker: '### 【系统级硬约束 - 双重锁定】' },
  { name: '总约束', marker: '**总约束：**' },
  { name: '硬约束 #1：problemFocus', marker: '### 硬约束 #1：problemFocus' },
  { name: '硬约束 #2：problemType', marker: '### 硬约束 #2：problemType' },
  { name: '终极自检规则', marker: '### 【终极自检规则】' },
];

sections.forEach(section => {
  const index = decidePrompt.indexOf(section.marker);
  if (index !== -1) {
    const start = index;
    const end = Math.min(index + 300, decidePrompt.length);
    const content = decidePrompt.substring(start, end);
    console.log(`${section.name}:`);
    console.log(content);
    console.log('...');
    console.log('');
  }
});

console.log('='.repeat(80));
console.log('【测试完成】');
console.log('='.repeat(80));
console.log('');
console.log('预期效果：');
console.log('');
console.log('✓ AI 在生成 Decide 时，必须同时满足：');
console.log('  1. 针对"' + testProblemFocus + '"这个具体问题');
console.log('  2. 在"' + PROBLEM_TYPE_LABELS[testProblemType] + '"这个问题类型下');
console.log('');
console.log('✓ 如果换了 problemFocus（如改成"如何对他人说不？"）');
console.log('  输出应该完全不成立');
console.log('');
console.log('✓ 如果换了 problemType（如改成 P1 方向不确定性）');
console.log('  输出应该完全不成立');
