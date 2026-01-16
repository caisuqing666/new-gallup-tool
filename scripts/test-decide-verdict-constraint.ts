/**
 * Decide 判定力度强化测试
 *
 * 验证 Decide prompt 是否包含足够的约束来强制 AI 给出明确的"问题级结论"
 */

import { ProblemType, PROBLEM_TYPE_LABELS } from '../lib/types';
import { buildPrompt } from '../lib/prompts';

const testProblemType = ProblemType.BOUNDARY_OVERLOAD;
const testProblemFocus = '如何在多方需求之间确定优先级？';

console.log('='.repeat(80));
console.log('【Decide 判定力度强化测试】');
console.log('='.repeat(80));
console.log('');

console.log('【测试参数】');
console.log('- 问题类型:', testProblemType, PROBLEM_TYPE_LABELS[testProblemType]);
console.log('- 问题焦点:', testProblemFocus);
console.log('');

const { systemPrompt: decidePrompt } = buildPrompt({
  pathType: 'breakthrough-decide',
  params: {
    strengths: [],
    confusion: '',
    problemType: testProblemType,
    problemFocus: testProblemFocus,
  },
});

// ============================================================================
// 判定力度检查
// ============================================================================

console.log('='.repeat(80));
console.log('【判定力度检查】');
console.log('='.repeat(80));
console.log('');

const verdictChecks = [
  {
    category: '核心要求',
    checks: [
      {
        name: '包含"唯一任务是给出判断"声明',
        check: () => decidePrompt.includes('唯一任务是') && decidePrompt.includes('给出明确判断')
      },
      {
        name: '包含问题级结论要求',
        check: () => decidePrompt.includes('问题级结论')
      },
      {
        name: '明确要求"继续/停止/抽身/收敛"判断',
        check: () => decidePrompt.includes('继续') && decidePrompt.includes('停止') &&
                  decidePrompt.includes('抽身') && decidePrompt.includes('收敛')
      },
    ]
  },
  {
    category: '禁止模糊判断',
    checks: [
      {
        name: '禁止"考虑/尝试/或许"',
        check: () => decidePrompt.includes('禁止') && decidePrompt.includes('考虑') &&
                  decidePrompt.includes('尝试') && decidePrompt.includes('或许')
      },
      {
        name: '禁止"平衡/协调"',
        check: () => decidePrompt.includes('禁止') && decidePrompt.includes('平衡') &&
                  decidePrompt.includes('协调')
      },
      {
        name: '禁止"建议/推荐"',
        check: () => decidePrompt.includes('禁止') && decidePrompt.includes('建议') &&
                  decidePrompt.includes('推荐')
      },
      {
        name: '禁止"用分析替代判断"',
        check: () => decidePrompt.includes('禁止') && decidePrompt.includes('分析') &&
                  decidePrompt.includes('替代判断')
      },
    ]
  },
  {
    category: '判定失败条件',
    checks: [
      {
        name: '包含判定失败条件',
        check: () => decidePrompt.includes('判定失败条件') &&
                  decidePrompt.includes('换成另一件事') &&
                  decidePrompt.includes('仍然成立')
      },
      {
        name: '明确失败后必须重写',
        check: () => decidePrompt.includes('判定失败') && decidePrompt.includes('必须重写')
      },
    ]
  },
  {
    category: '终极判断规则',
    checks: [
      {
        name: '包含终极判断规则',
        check: () => decidePrompt.includes('终极判断规则')
      },
      {
        name: '终极规则问"用户是否对 problemFocus 做出清晰判断"',
        check: () => decidePrompt.includes('是否对') && decidePrompt.includes('做出了清晰的') &&
                  decidePrompt.includes('是 / 否 / 停止')
      },
      {
        name: '终极规则要求答案否定则重写',
        check: () => decidePrompt.includes('如果答案是否定的') && decidePrompt.includes('立即重写')
      },
    ]
  },
  {
    category: 'verdict 约束',
    checks: [
      {
        name: 'verdict 必须使用"现在应该"开头',
        check: () => decidePrompt.includes('现在应该继续') &&
                  decidePrompt.includes('现在应该停止') &&
                  decidePrompt.includes('现在应该抽身') &&
                  decidePrompt.includes('现在应该收敛')
      },
      {
        name: 'verdict 不超过 30 字',
        check: () => decidePrompt.includes('不超过 30 字')
      },
      {
        name: 'verdict 失败示例包含"没有给出明确判断"',
        check: () => decidePrompt.includes('失败示例') && decidePrompt.includes('没有给出明确判断')
      },
      {
        name: 'verdict 成功示例包含"给出了明确判断"',
        check: () => decidePrompt.includes('成功示例') && decidePrompt.includes('给出了明确判断')
      },
    ]
  },
  {
    category: '行动建议约束',
    checks: [
      {
        name: 'doMore 必须直接推动 problemFocus 解决',
        check: () => decidePrompt.includes('doMore') && decidePrompt.includes('直接推动') &&
                  decidePrompt.includes('problemFocus') && decidePrompt.includes('解决')
      },
      {
        name: 'doMore 关键检查：是否帮助用户做出判断',
        check: () => decidePrompt.includes('关键检查') && decidePrompt.includes('做出清晰的') &&
                  decidePrompt.includes('是/否/停止') && decidePrompt.includes('判断')
      },
      {
        name: 'doLess 关键检查：是否让用户做出更清晰判断',
        check: () => decidePrompt.includes('doLess') && decidePrompt.includes('关键检查') &&
                  decidePrompt.includes('更清晰的判断')
      },
    ]
  },
  {
    category: 'checkRule 约束',
    checks: [
      {
        name: 'checkRule 问题版：用户是否对 problemFocus 做出判断',
        check: () => decidePrompt.includes('checkRule') && decidePrompt.includes('problemFocus 版') &&
                  decidePrompt.includes('是否对 problemFocus 做出了清晰的判断')
      },
      {
        name: 'checkRule 必须指向 problemFocus 解决',
        check: () => decidePrompt.includes('直接指向') && decidePrompt.includes('problemFocus') &&
                  decidePrompt.includes('解决')
      },
    ]
  },
  {
    category: '核心原则',
    checks: [
      {
        name: '核心原则：唯一任务是给出判断',
        check: () => decidePrompt.includes('核心原则') && decidePrompt.includes('唯一任务是给出判断')
      },
      {
        name: '禁止"可以考虑/或许/建议"',
        check: () => decidePrompt.includes('核心原则') && decidePrompt.includes('可以考虑') &&
                  decidePrompt.includes('或许') && decidePrompt.includes('建议') &&
                  decidePrompt.includes('立即删除')
      },
      {
        name: '禁止"用分析替代判断"',
        check: () => decidePrompt.includes('核心原则') && decidePrompt.includes('分析替代判断') &&
                  decidePrompt.includes('立即重写')
      },
      {
        name: '终极原则：必须帮助用户做出清晰判断',
        check: () => decidePrompt.includes('核心原则') && decidePrompt.includes('清晰的') &&
                  decidePrompt.includes('是/否/停止') && decidePrompt.includes('判断') &&
                  decidePrompt.includes('立即重写')
      },
    ]
  },
];

let totalPassed = 0;
let totalFailed = 0;

verdictChecks.forEach(category => {
  console.log(`【${category.category}】`);
  category.checks.forEach(check => {
    const passed = check.check();
    if (passed) totalPassed++; else totalFailed++;
    console.log(`  ${passed ? '✓' : '✗'} ${check.name}`);
  });
  console.log('');
});

console.log('='.repeat(80));
console.log('【总体测试结果】');
console.log('='.repeat(80));
console.log('');

const totalChecks = verdictChecks.reduce((sum, cat) => sum + cat.checks.length, 0);
console.log(`总计: ${totalPassed}/${totalChecks} 检查通过`);
console.log('');

if (totalFailed === 0) {
  console.log('✓ 所有判定力度约束验证通过！');
  console.log('');
  console.log('系统现在强制保证：');
  console.log('');
  console.log('【Decide 必须给出问题级结论】');
  console.log(`  针对问题焦点："${testProblemFocus}"`);
  console.log(`  在问题类型："${PROBLEM_TYPE_LABELS[testProblemType]}"下`);
  console.log('  必须明确回答：继续 / 停止 / 抽身 / 收敛？');
  console.log('');
  console.log('【禁止模糊判断】');
  console.log('  - 禁止"考虑/尝试/或许/或许可以"');
  console.log('  - 禁止"平衡一下/协调一下"');
  console.log('  - 禁止"建议/推荐"');
  console.log('  - 禁止"用分析替代判断"');
  console.log('');
  console.log('【终极判断规则】');
  console.log('  "今天，用户是否对 problemFocus 做出了清晰的"是/否/停止"判断？"');
  console.log('  如果答案是否定的，立即重写。');
} else {
  console.log('✗ 部分检查失败，请检查实现。');
  process.exit(1);
}

// 提取并显示核心约束段落
console.log('');
console.log('='.repeat(80));
console.log('【核心约束段落预览】');
console.log('='.repeat(80));
console.log('');

const sections = [
  { name: '【核心要求】', marker: '## 【核心要求（必须满足）】' },
  { name: '【判定失败条件】', marker: '## 【判定失败条件】' },
  { name: '【终极判断规则】', marker: '## 【终极判断规则】' },
];

sections.forEach(section => {
  const index = decidePrompt.indexOf(section.marker);
  if (index !== -1) {
    const start = index;
    const end = Math.min(index + 400, decidePrompt.length);
    const content = decidePrompt.substring(start, end);
    console.log(`${section.name}:`);
    console.log(content);
    console.log('...');
    console.log('');
  }
});
