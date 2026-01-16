/**
 * 测试脚本：验证 problemType 硬约束实现
 *
 * 测试案例：和谐 × 体谅 × 责任
 * 问题类型：P2 - 边界与责任过载
 */

import { ProblemType, PROBLEM_TYPE_LABELS, PROBLEM_TYPE_DESCRIPTIONS, StrengthId } from '../lib/types';
import { buildPrompt } from '../lib/prompts';

// 测试参数
const testStrengths: StrengthId[] = ['harmony', 'empathy', 'responsibility']; // 使用优势 ID
const testProblemType = ProblemType.BOUNDARY_OVERLOAD; // P2
const testProblemFocus = '如何在多方需求之间确定优先级？';
const testScenario = '职场决策';
const testConfusion = '事情太多，每件都想负责，结果把自己累垮了，不知道怎么拒绝别人';

console.log('='.repeat(80));
console.log('【问题类型硬约束测试】');
console.log('='.repeat(80));
console.log('');

console.log('【测试参数】');
console.log('- 优势组合:', testStrengths.join(' × '));
console.log('- 问题类型:', testProblemType, PROBLEM_TYPE_LABELS[testProblemType]);
console.log('- 场景:', testScenario);
console.log('- 困惑描述:', testConfusion);
console.log('');

console.log('【问题类型定义】');
console.log(PROBLEM_TYPE_DESCRIPTIONS[testProblemType]);
console.log('');

console.log('='.repeat(80));
console.log('【1. Explain 系统 Prompt 验证】');
console.log('='.repeat(80));
console.log('');

const { systemPrompt: explainPrompt } = buildPrompt({
  pathType: 'breakthrough-explain',
  params: {
    strengths: testStrengths,
    confusion: testConfusion,
    problemType: testProblemType,
    problemFocus: testProblemFocus,
  },
});
console.log(explainPrompt.substring(0, 1000) + '...');
console.log('');
console.log('【验证点】');
console.log('✓ 包含问题类型标识:', explainPrompt.includes(testProblemType));
console.log('✓ 包含问题类型名称:', explainPrompt.includes(PROBLEM_TYPE_LABELS[testProblemType]));
console.log('✓ 包含"当前只允许解决"约束:', explainPrompt.includes('当前只允许解决'));
console.log('✓ 包含自检规则:', explainPrompt.includes('自检规则'));
console.log('');

console.log('='.repeat(80));
console.log('【2. Decide 系统 Prompt 验证】');
console.log('='.repeat(80));
console.log('');

const { systemPrompt: decidePrompt } = buildPrompt({
  pathType: 'breakthrough-decide',
  params: {
    strengths: testStrengths,
    confusion: testConfusion,
    problemType: testProblemType,
    problemFocus: testProblemFocus,
  },
});
console.log(decidePrompt.substring(0, 1000) + '...');
console.log('');
console.log('【验证点】');
console.log('✓ 包含问题类型标识:', decidePrompt.includes(testProblemType));
console.log('✓ 包含问题类型名称:', decidePrompt.includes(PROBLEM_TYPE_LABELS[testProblemType]));
console.log('✓ 包含"当前只允许解决"约束:', decidePrompt.includes('当前只允许解决'));
console.log('✓ 包含判定约束（继续/停止/抽身/收敛）:', decidePrompt.includes('继续') && decidePrompt.includes('停止'));
console.log('✓ 包含自检规则:', decidePrompt.includes('自检规则'));
console.log('');

console.log('='.repeat(80));
console.log('【3. 硬约束验证】');
console.log('='.repeat(80));
console.log('');

// 验证 Explain 硬约束
const explainHardConstraints = [
  { name: '问题类型定义', check: () => explainPrompt.includes('## 【当前问题类型】') },
  { name: '只允许解决这一类问题', check: () => explainPrompt.includes('你当前只允许解决') },
  { name: '禁止输出与问题类型无关的内容', check: () => explainPrompt.includes('禁止输出') },
  { name: '自检规则（换问题类型验证）', check: () => explainPrompt.includes('换一个问题类型') },
  { name: '每段内容必须能补全为"在【...】下"', check: () => explainPrompt.includes('在【') && explainPrompt.includes('】下') },
];

console.log('Explain 硬约束检查:');
explainHardConstraints.forEach(constraint => {
  const passed = constraint.check();
  console.log(`  ${passed ? '✓' : '✗'} ${constraint.name}`);
});
console.log('');

// 验证 Decide 硬约束
const decideHardConstraints = [
  { name: '问题类型定义', check: () => decidePrompt.includes('## 【当前问题类型】') },
  { name: '只允许解决这一类问题', check: () => decidePrompt.includes('你当前只允许解决') },
  { name: '判定必须回答继续/停止/抽身/收敛', check: () => decidePrompt.includes('继续') && decidePrompt.includes('停止') && decidePrompt.includes('抽身') && decidePrompt.includes('收敛') },
  { name: '禁止输出通用建议', check: () => decidePrompt.includes('通用') && decidePrompt.includes('禁止') },
  { name: '自检规则（换问题类型验证）', check: () => decidePrompt.includes('换一个问题类型') },
  { name: '每条判定必须能补全为"针对【...】"', check: () => decidePrompt.includes('针对【') && decidePrompt.includes('】现在') },
];

console.log('Decide 硬约束检查:');
decideHardConstraints.forEach(constraint => {
  const passed = constraint.check();
  console.log(`  ${passed ? '✓' : '✗'} ${constraint.name}`);
});
console.log('');

console.log('='.repeat(80));
console.log('【测试完成】');
console.log('='.repeat(80));
console.log('');
console.log('预期效果：');
console.log('- AI 在生成 Explain 时，只会解释"边界与责任过载"下的优势表现');
console.log('- AI 在生成 Decide 时，只会给出针对"边界与责任过载"的判定');
console.log('- 如果换成其他问题类型（如 P1 方向不确定性），输出应该完全不同');
