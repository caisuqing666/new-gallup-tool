/**
 * 路径选择（Path Decision）重构验证测试
 *
 * 验证 Decide 是否已经从"行动列表"升级为"路径判定"
 */

import { ProblemType, PROBLEM_TYPE_LABELS, PathDecision, PATH_DECISION_LABELS, PATH_DECISION_ENERGY_STATES, StrengthId } from '../lib/types';
import { buildPrompt } from '../lib/prompts';

const testProblemType = ProblemType.BOUNDARY_OVERLOAD;
const testProblemFocus = '如何在多方需求之间确定优先级？';
const testStrengths: StrengthId[] = ['harmony', 'empathy', 'responsibility']; // 使用优势 ID

console.log('='.repeat(80));
console.log('【路径选择重构验证测试】');
console.log('='.repeat(80));
console.log("");

console.log('【产品灵魂】');
console.log('不是告诉用户"你是怎样的人"');
console.log('而是告诉他："以你这样的能量结构，在这个处境下，哪条路值得你走"');
console.log("");

console.log('【测试参数】');
console.log('- 问题类型:', testProblemType, PROBLEM_TYPE_LABELS[testProblemType]);
console.log('- 问题焦点:', testProblemFocus);
console.log('- 优势组合:', testStrengths.join(' × '));
console.log("");

// ============================================================================
// 1. PathDecision 枚举验证
// ============================================================================

console.log('='.repeat(80));
console.log('【1. PathDecision 枚举验证】');
console.log('='.repeat(80));
console.log("");

console.log('四种路径类型：');
Object.values(PathDecision).forEach((path) => {
  console.log(`- ${path} (${PATH_DECISION_LABELS[path]})`);
  console.log(`  能量状态: ${PATH_DECISION_ENERGY_STATES[path]}`);
  console.log("");
});

// ============================================================================
// 2. Decide System Prompt 验证
// ============================================================================

console.log('='.repeat(80));
console.log('【2. Decide System Prompt 验证】');
console.log('='.repeat(80));
console.log("");

// 使用统一的 buildPrompt 函数
const { systemPrompt: decidePrompt } = buildPrompt({
  pathType: 'breakthrough-decide',
  params: {
    strengths: testStrengths,
    confusion: '如何在多方需求之间确定优先级？',
    problemType: testProblemType,
    problemFocus: testProblemFocus,
  },
});

const promptChecks = [
  {
    category: '产品灵魂',
    checks: [
      {
        name: '包含"产品灵魂"声明',
        check: () => decidePrompt.includes('产品灵魂') &&
                  decidePrompt.includes('不是告诉用户"你是怎样的人"') &&
                  decidePrompt.includes('以你这样的能量结构') &&
                  decidePrompt.includes('哪条路值得你走')
      },
      {
        name: '核心任务是"路径判定"而非"行动建议"',
        check: () => decidePrompt.includes('核心任务') &&
                  decidePrompt.includes('路径判定') &&
                  decidePrompt.includes('唯一输出是')
      },
    ]
  },
  {
    category: '四种路径类型',
    checks: [
      {
        name: '包含 Path A: DoubleDown 定义',
        check: () => decidePrompt.includes('Path A：继续投入') &&
                  decidePrompt.includes('DoubleDown') &&
                  decidePrompt.includes('省能量') &&
                  decidePrompt.includes('优势被正向使用')
      },
      {
        name: '包含 Path B: Reframe 定义',
        check: () => decidePrompt.includes('Path B：结构性调整') &&
                  decidePrompt.includes('Reframe') &&
                  decidePrompt.includes('当前榨能量') &&
                  decidePrompt.includes('使用方式错了')
      },
      {
        name: '包含 Path C: Narrow 定义',
        check: () => decidePrompt.includes('Path C：阶段性收敛') &&
                  decidePrompt.includes('Narrow') &&
                  decidePrompt.includes('分散消耗') &&
                  decidePrompt.includes('优势过度发散')
      },
      {
        name: '包含 Path D: Exit 定义',
        check: () => decidePrompt.includes('Path D：退出/放弃') &&
                  decidePrompt.includes('Exit') &&
                  decidePrompt.includes('代价区') &&
                  decidePrompt.includes('长期榨干')
      },
    ]
  },
  {
    category: '能量判断硬规则',
    checks: [
      {
        name: '包含规则1: 主驱动力匹配度',
        check: () => decidePrompt.includes('主驱动力匹配度') &&
                  decidePrompt.includes('核心驱动力') &&
                  decidePrompt.includes('省能量') &&
                  decidePrompt.includes('榨能量')
      },
      {
        name: '包含规则2: 优势代价区检测',
        check: () => decidePrompt.includes('优势代价区检测') &&
                  decidePrompt.includes('代价区') &&
                  decidePrompt.includes('长期激活代价区') &&
                  decidePrompt.includes('必须排除')
      },
      {
        name: '包含规则3: 可持续性检查',
        check: () => decidePrompt.includes('可持续性检查') &&
                  decidePrompt.includes('短期可行但长期榨能量') &&
                  decidePrompt.includes('必须排除')
      },
      {
        name: '包含关键判断: 6个月视角',
        check: () => decidePrompt.includes('关键判断') &&
                  decidePrompt.includes('6 个月') &&
                  decidePrompt.includes('越来越强') &&
                  decidePrompt.includes('越来越被榨干')
      },
    ]
  },
  {
    category: '路径选择判定流程',
    checks: [
      {
        name: '包含逐条路径评估步骤',
        check: () => decidePrompt.includes('逐条路径评估') &&
                  decidePrompt.includes('DoubleDown / Reframe / Narrow / Exit')
      },
      {
        name: '包含能量最优解选择',
        check: () => decidePrompt.includes('选择能量最优解') &&
                  decidePrompt.includes('最省能量')
      },
      {
        name: 'pathDecision 必须是枚举值',
        check: () => decidePrompt.includes('必须') &&
                  decidePrompt.includes('枚举值') &&
                  decidePrompt.includes('"DoubleDown" | "Reframe" | "Narrow" | "Exit"')
      },
    ]
  },
  {
    category: 'pathReason 要求',
    checks: [
      {
        name: 'pathReason 必须解释能量最优解',
        check: () => decidePrompt.includes('pathReason 的撰写要求') &&
                  decidePrompt.includes('能量最优解')
      },
      {
        name: 'pathReason 必须对比其他路径',
        check: () => decidePrompt.includes('为什么其他路径不是最优解')
      },
    ]
  },
  {
    category: 'doMore/doLess 路径绑定',
    checks: [
      {
        name: 'doMore/doLess 必须与 pathDecision 强绑定',
        check: () => decidePrompt.includes('必须与 pathDecision 强绑定') &&
                  decidePrompt.includes('为了走好这条路径')
      },
      {
        name: '包含不同路径的行动意义',
        check: () => decidePrompt.includes('不同路径的行动意义') &&
                  decidePrompt.includes('Path A (DoubleDown) 的行动') &&
                  decidePrompt.includes('Path B (Reframe) 的行动') &&
                  decidePrompt.includes('Path C (Narrow) 的行动') &&
                  decidePrompt.includes('Path D (Exit) 的行动')
      },
      {
        name: '换路径仍然成立则失败',
        check: () => decidePrompt.includes('如果换一条路径仍然成立') &&
                  decidePrompt.includes('视为失败输出')
      },
    ]
  },
  {
    category: '输出格式',
    checks: [
      {
        name: 'pathDecision 是枚举值字段',
        check: () => decidePrompt.includes('"pathDecision": "Reframe"') &&
                  decidePrompt.includes('必须是 "DoubleDown" | "Reframe" | "Narrow" | "Exit" 之一')
      },
      {
        name: '包含 pathReason 字段',
        check: () => decidePrompt.includes('"pathReason":')
      },
    ]
  },
  {
    category: '终极检查规则',
    checks: [
      {
        name: '检查1: 路径枚举值',
        check: () => decidePrompt.includes('检查 1：路径枚举值')
      },
      {
        name: '检查2: pathReason 完整性',
        check: () => decidePrompt.includes('检查 2：pathReason 完整性')
      },
      {
        name: '检查3: 行动路径绑定',
        check: () => decidePrompt.includes('检查 3：行动路径绑定')
      },
      {
        name: '检查4: 能量判断依据',
        check: () => decidePrompt.includes('检查 4：能量判断依据')
      },
    ]
  },
  {
    category: '核心原则',
    checks: [
      {
        name: '唯一任务是路径判定',
        check: () => decidePrompt.includes('唯一任务是给出路径判定')
      },
      {
        name: '判断依据是能量不是对错',
        check: () => decidePrompt.includes('判断依据必须是"能量"而不是"对错"')
      },
      {
        name: '没有能量判断立即重写',
        check: () => decidePrompt.includes('如果发现自己没有从能量角度判断') &&
                  decidePrompt.includes('立即重写')
      },
    ]
  },
];

let totalPassed = 0;
let totalFailed = 0;

promptChecks.forEach(category => {
  console.log(`【${category.category}】`);
  category.checks.forEach(check => {
    const passed = check.check();
    if (passed) totalPassed++; else totalFailed++;
    console.log(`  ${passed ? '✓' : '✗'} ${check.name}`);
  });
  console.log("");
});

console.log('='.repeat(80));
console.log('【总体测试结果】');
console.log('='.repeat(80));
console.log("");

const totalChecks = promptChecks.reduce((sum, cat) => sum + cat.checks.length, 0);
console.log(`总计: ${totalPassed}/${totalChecks} 检查通过`);
console.log("");

if (totalFailed === 0) {
  console.log('✓ 路径选择重构验证通过！');
  console.log("");
  console.log('【重构前后对比】');
  console.log("");
  console.log('重构前：');
  console.log('  Decide 输出：verdict（行动判断）+ doMore/doLess（行动列表）');
  console.log('  核心问题：行动建议换人也能成立，没有针对能量结构');
  console.log("");
  console.log('重构后：');
  console.log('  Decide 输出：pathDecision（路径枚举）+ pathReason（能量判断）+ doMore/doLess（路径专属行动）');
  console.log('  核心改进：');
  console.log('    - pathDecision 必须是 DoubleDown|Reframe|Narrow|Exit 之一');
  console.log('    - pathReason 必须解释为什么这条路径是能量最优解');
  console.log('    - doMore/doLess 必须与路径强绑定，换路径不成立');
  console.log('    - 判断依据是"能量"而不是"对错"');
  console.log("");
  console.log('【产品灵魂】');
  console.log('  不是告诉用户"你是怎样的人"');
  console.log('  而是告诉他："以你这样的能量结构，在这个处境下，哪条路值得你走"');
} else {
  console.log('✗ 部分检查失败，请检查实现。');
  process.exit(1);
}
