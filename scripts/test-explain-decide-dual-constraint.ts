/**
 * 完整测试：Explain + Decide 双重硬约束验证
 *
 * 测试案例：和谐 × 体谅 × 责任
 * - problemType: P2 边界与责任过载
 * - problemFocus: "如何在多方需求之间确定优先级？"
 */

import { ProblemType, PROBLEM_TYPE_LABELS, StrengthId } from '../lib/types';
import { buildPrompt } from '../lib/prompts';

const testProblemType = ProblemType.BOUNDARY_OVERLOAD; // P2
const testProblemFocus = '如何在多方需求之间确定优先级？';
const testStrengths: StrengthId[] = ['harmony', 'empathy', 'responsibility']; // 使用优势 ID
const testConfusion = '事情太多，每件都想负责，结果把自己累垮了，不知道怎么拒绝别人';

console.log('='.repeat(80));
console.log('【Explain + Decide 双重硬约束完整测试】');
console.log('='.repeat(80));
console.log('');

console.log('【测试参数】');
console.log('- 问题类型:', testProblemType, PROBLEM_TYPE_LABELS[testProblemType]);
console.log('- 问题焦点:', testProblemFocus);
console.log('');

// ============================================================================
// Explain 测试
// ============================================================================

console.log('='.repeat(80));
console.log('【1. Explain 双重硬约束验证】');
console.log('='.repeat(80));
console.log('');

// 使用统一的 buildPrompt 函数
const { systemPrompt: explainPrompt } = buildPrompt({
  pathType: 'breakthrough-explain',
  params: {
    strengths: testStrengths,
    confusion: testConfusion,
    problemType: testProblemType,
    problemFocus: testProblemFocus,
  },
});

const explainChecks = [
  {
    name: '包含问题类型标识',
    check: () => explainPrompt.includes('## 【当前问题类型】')
  },
  {
    name: '包含问题焦点标识',
    check: () => explainPrompt.includes('## 【当前问题焦点】')
  },
  {
    name: '包含上下文变量声明',
    check: () => explainPrompt.includes('## 【当前上下文变量】') &&
              explainPrompt.includes('problemType') &&
              explainPrompt.includes('problemFocus') &&
              explainPrompt.includes('strengths')
  },
  {
    name: '包含"不是解释人格，而是解释..."声明',
    check: () => explainPrompt.includes('你不是在解释"这个人是什么样的人"')
  },
  {
    name: '包含 Explain 核心定义',
    check: () => explainPrompt.includes('在【') &&
              explainPrompt.includes('】的情境下，针对【') &&
              explainPrompt.includes('】这件事，这组优势是如何影响用户的判断与行为的')
  },
  {
    name: '包含 Explain 补全格式',
    check: () => explainPrompt.includes('在【') &&
              explainPrompt.includes('】下，当用户面对【') &&
              explainPrompt.includes('】时，……')
  },
  {
    name: '禁止泛化人格描述',
    check: () => explainPrompt.includes('禁止输出') &&
              explainPrompt.includes('泛化人格描述')
  },
  {
    name: '包含 problemFocus 互换测试',
    check: () => explainPrompt.includes('problemFocus 互换测试') ||
              explainPrompt.includes('【' + testProblemFocus + '】换成另一件事')
  },
  {
    name: '包含 problemType 互换测试',
    check: () => explainPrompt.includes('problemType 互换测试') ||
              explainPrompt.includes('问题类型换成')
  },
  {
    name: '包含解释的唯一目标',
    check: () => explainPrompt.includes('解释的目标') &&
              explainPrompt.includes('为什么我会在') &&
              explainPrompt.includes(testProblemFocus) &&
              explainPrompt.includes('这件事上卡住')
  },
];

console.log('Explain 硬约束检查结果:');
let explainPassed = 0;
let explainFailed = 0;
explainChecks.forEach(check => {
  const passed = check.check();
  if (passed) explainPassed++; else explainFailed++;
  console.log(`  ${passed ? '✓' : '✗'} ${check.name}`);
});
console.log('');
console.log(`Explain 检查结果: ${explainPassed}/${explainChecks.length} 通过`);
console.log('');

// 提取并显示 Explain 的核心约束段落
const explainSectionIndex = explainPrompt.indexOf('### 【系统级硬约束 - 双重锁定】');
if (explainSectionIndex !== -1) {
  const explainSection = explainPrompt.substring(explainSectionIndex, Math.min(explainSectionIndex + 800, explainPrompt.length));
  console.log('【Explain 核心约束段落】：');
  console.log(explainSection);
  console.log('...');
  console.log('');
}

// ============================================================================
// Decide 测试
// ============================================================================

console.log('='.repeat(80));
console.log('【2. Decide 双重硬约束验证】');
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

const decideChecks = [
  {
    name: '包含问题类型标识',
    check: () => decidePrompt.includes('## 【当前问题类型】')
  },
  {
    name: '包含问题焦点标识',
    check: () => decidePrompt.includes('## 【当前问题焦点】')
  },
  {
    name: '包含双重锁定声明',
    check: () => decidePrompt.includes('### 【系统级硬约束 - 双重锁定】')
  },
  {
    name: '包含 Decide 核心定义',
    check: () => decidePrompt.includes('针对【') &&
              decidePrompt.includes('】这个具体问题') &&
              decidePrompt.includes('在【') &&
              decidePrompt.includes('】这个问题类型下')
  },
  {
    name: '包含 Decide 总约束格式',
    check: () => decidePrompt.includes('针对【') &&
              decidePrompt.includes('】，在【') &&
              decidePrompt.includes('】下，现在应该怎么做？')
  },
  {
    name: '包含 problemFocus 约束',
    check: () => decidePrompt.includes('### 硬约束 #1：problemFocus')
  },
  {
    name: '包含 problemType 约束',
    check: () => decidePrompt.includes('### 硬约束 #2：problemType')
  },
  {
    name: '包含 problemFocus 互换测试',
    check: () => decidePrompt.includes('problemFocus 互换测试')
  },
  {
    name: '包含 problemType 互换测试',
    check: () => decidePrompt.includes('problemType 互换测试')
  },
  {
    name: '包含判定强制格式',
    check: () => decidePrompt.includes('必须能够补全为') &&
              decidePrompt.includes('针对【') &&
              decidePrompt.includes('】，在【') &&
              decidePrompt.includes('】下，现在应该')
  },
];

console.log('Decide 硬约束检查结果:');
let decidePassed = 0;
let decideFailed = 0;
decideChecks.forEach(check => {
  const passed = check.check();
  if (passed) decidePassed++; else decideFailed++;
  console.log(`  ${passed ? '✓' : '✗'} ${check.name}`);
});
console.log('');
console.log(`Decide 检查结果: ${decidePassed}/${decideChecks.length} 通过`);
console.log('');

// 提取并显示 Decide 的核心约束段落
const decideSectionIndex = decidePrompt.indexOf('### 【系统级硬约束 - 双重锁定】');
if (decideSectionIndex !== -1) {
  const decideSection = decidePrompt.substring(decideSectionIndex, Math.min(decideSectionIndex + 800, decidePrompt.length));
  console.log('【Decide 核心约束段落】：');
  console.log(decideSection);
  console.log('...');
  console.log('');
}

// ============================================================================
// 总体结果
// ============================================================================

console.log('='.repeat(80));
console.log('【总体测试结果】');
console.log('='.repeat(80));
console.log('');

const totalPassed = explainPassed + decidePassed;
const totalFailed = explainFailed + decideFailed;
const totalChecks = explainChecks.length + decideChecks.length;

console.log(`总计: ${totalPassed}/${totalChecks} 检查通过`);
console.log('');

if (totalFailed === 0) {
  console.log('✓ 所有双重硬约束验证通过！');
  console.log('');
  console.log('系统现在强制保证：');
  console.log('');
  console.log('【Explain】');
  console.log('  每一段解释都必须能补全为：');
  console.log(`  "在【${PROBLEM_TYPE_LABELS[testProblemType]}】下，`);
  console.log(`   当用户面对【${testProblemFocus}】时，……"`);
  console.log('');
  console.log('  如果换了 problemFocus，解释必须不成立。');
  console.log('');
  console.log('【Decide】');
  console.log('  每一条判定都必须能补全为：');
  console.log(`  "针对【${testProblemFocus}】，`);
  console.log(`   在【${PROBLEM_TYPE_LABELS[testProblemType]}】下，`);
  console.log('   现在应该……"');
  console.log('');
  console.log('  如果换了 problemFocus 或 problemType，判定必须不成立。');
} else {
  console.log('✗ 部分检查失败，请检查实现。');
  process.exit(1);
}
