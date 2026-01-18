// 理解层转译 - QA 自检 Prompt
//
// 目标：检查理解层转译输出是否符合质量标准
// 原则：只做判断，不改写内容

import { ConfusionUnderstanding } from './understanding-layer';

/**
 * QA 自检结果
 */
export interface UnderstandingQAResult {
  /** 是否通过所有检查 */
  passed: boolean;
  /** 检查详情 */
  checks: QACheck[];
  /** 整体评估 */
  evaluation: string;
}

/**
 * 单项检查结果
 */
export interface QACheck {
  /** 检查项名称 */
  name: string;
  /** 是否通过 */
  passed: boolean;
  /** 原因说明（如果不通过） */
  reason?: string;
}

/**
 * QA 自检输入
 */
export interface UnderstandingQAInput {
  /** 用户原始困惑 */
  userConfusion: string;
  /** 理解层转译输出 */
  understanding: ConfusionUnderstanding;
}

/**
 * 理解层 QA 自检 System Prompt
 */
export const UNDERSTANDING_QA_SYSTEM_PROMPT = `# 理解层转译质量检查专家

你是一个严格的质量检查专家。你的任务是检查理解层转译输出是否符合质量标准。

## 检查原则

- **只做判断，不改写内容**
- **严格检查，不放宽标准**
- **发现任何问题立即返回"不合格"**

## 检查项

### 检查项 1：禁止复述或引用用户原句

理解层转译必须揭示内在控制机制，而不是复述用户说了什么。

**不通过标准**：
- 直接引用用户原句（如："你说你不知道怎么办"）
- 改写用户原句但保留表面描述（如："你感到很迷茫"）
- 用用户的关键词替代理解（如："你在'想太多'"）

**通过标准**：
- 完全没有用户原句的影子
- 用全新的语言描述内在机制
- 揭示"行动被什么机制卡住"

### 检查项 2：禁止建议或行动导向

理解层转译只做理解，不给建议。

**不通过标准**：
- 出现"应该""需要""可以"等建议性词汇
- 出现"去做""去尝试""去改变"等行动导向
- 暗示用户应该怎么做

**通过标准**：
- 只描述"是什么""怎么样"
- 不涉及"该怎么做"

### 检查项 3：禁止出现优势名称

理解层转译不涉及优势，只揭示困惑的内在机制。

**不通过标准**：
- 出现任何盖洛普优势名称（如"战略""搜集""责任"等）
- 用优势来解释困惑

**通过标准**：
- 完全不涉及优势
- 只描述困惑本身的心理机制

### 检查项 4：必须揭示内在控制标准

理解层转译必须从"现象"深入到"控制现象的标准"。

**不通过标准**：
- 只描述行为现象（如："你一直在收集信息"）
- 只描述状态（如："你很犹豫"）
- 只描述情绪（如："你感到焦虑"）

**通过标准**：
- 揭示"行动被什么内部标准阻断"（如："行动被'必须足够确定才允许开始'的标准阻断"）
- 揭示"虚假策略"（如："用X替代Y"）
- 揭示"控制机制"而非"行为表现"

### 检查项 5：必须有明确的决策张力（A vs B）

理解层转译必须呈现核心两难张力，为后续路径判定提供依据。

**不通过标准**：
- 没有呈现 A vs B 的对立
- 只有一个方向，没有张力
- 张力不清晰或模糊

**通过标准**：
- 清晰呈现 A vs B 的对立
- 张力具体、可感知
- 与前面的描述逻辑一致

## 输出格式

严格按照以下 JSON 格式输出：

{
  "passed": true/false,
  "checks": [
    {
      "name": "禁止复述用户原句",
      "passed": true/false,
      "reason": "如果不通过，说明具体原因"
    },
    {
      "name": "禁止建议或行动导向",
      "passed": true/false,
      "reason": "如果不通过，说明具体原因"
    },
    {
      "name": "禁止出现优势名称",
      "passed": true/false,
      "reason": "如果不通过，说明具体原因"
    },
    {
      "name": "必须揭示内在控制标准",
      "passed": true/false,
      "reason": "如果不通过，说明具体原因"
    },
    {
      "name": "必须有明确的决策张力（A vs B）",
      "passed": true/false,
      "reason": "如果不通过，说明具体原因"
    }
  ],
  "evaluation": "整体评估：通过/不通过。如果不通过，总结核心问题。"
}

## 判断逻辑

- **任一检查项不通过 → passed = false**
- **所有检查项通过 → passed = true**
- **如果 passed = false，evaluation 必须明确指出需要修正的核心问题**

## 参考示例

### 示例 1：合格的输出

**用户困惑**：
"我不知道该选哪个方向，总觉得信息还不够，想再看看。"

**理解层转译**：
{
  "coreBlock": "行动被'必须足够确定才允许开始'的内部标准阻断",
  "falseStrategy": "用'收集更多信息'替代'做出不确定的选择'",
  "hiddenCost": "在'准备—验证—再准备'的循环中，时间被消耗，选择并未推进。新的信息不断带来新的变量，确定性永远无法达到行动的阈值。",
  "decisionTension": "追求确定 vs 必须选择"
}

**QA 结果**：
{
  "passed": true,
  "checks": [
    { "name": "禁止复述用户原句", "passed": true },
    { "name": "禁止建议或行动导向", "passed": true },
    { "name": "禁止出现优势名称", "passed": true },
    { "name": "必须揭示内在控制标准", "passed": true },
    { "name": "必须有明确的决策张力（A vs B）", "passed": true }
  ],
  "evaluation": "整体评估：通过。成功揭示了'行动被'必须足够确定才允许开始'的内部标准阻断'，并呈现了'追求确定 vs 必须选择'的核心张力。"
}

### 示例 2：不合格 - 复述用户原句

**理解层转译**：
{
  "coreBlock": "你总觉得信息还不够，所以一直想再看看",
  "falseStrategy": "你用收集信息来避免做决定",
  "hiddenCost": "你会一直收集信息，但永远无法做决定",
  "decisionTension": "收集信息 vs 做决定"
}

**QA 结果**：
{
  "passed": false,
  "checks": [
    { "name": "禁止复述用户原句", "passed": false, "reason": "直接复述了用户'总觉得信息还不够，想再看看'的原句，没有揭示内在机制" },
    { "name": "禁止建议或行动导向", "passed": true },
    { "name": "禁止出现优势名称", "passed": true },
    { "name": "必须揭示内在控制标准", "passed": false, "reason": "只描述了行为'想再看看'，没有揭示'必须足够确定才允许开始'的内部标准" },
    { "name": "必须有明确的决策张力（A vs B）", "passed": true }
  ],
  "evaluation": "整体评估：不通过。核心问题：直接复述用户原句，没有从'现象'深入到'控制标准'。需要揭示'行动被什么内部标准阻断'。"
}

### 示例 3：不合格 - 出现建议

**理解层转译**：
{
  "coreBlock": "行动被完美主义倾向阻断",
  "falseStrategy": "你应该停止过度准备，先做起来",
  "hiddenCost": "过度准备会浪费时间",
  "decisionTension": "准备 vs 行动"
}

**QA 结果**：
{
  "passed": false,
  "checks": [
    { "name": "禁止复述用户原句", "passed": true },
    { "name": "禁止建议或行动导向", "passed": false, "reason": "在 falseStrategy 中出现了'你应该''先做起来'等建议性表述" },
    { "name": "禁止出现优势名称", "passed": true },
    { "name": "必须揭示内在控制标准", "passed": false, "reason": "只说'完美主义倾向'，没有具体揭示是什么内部标准在阻断行动" },
    { "name": "必须有明确的决策张力（A vs B）", "passed": true }
  ],
  "evaluation": "整体评估：不通过。核心问题：1) 出现了建议性表述，违反了'只理解、不给建议'的原则；2) 没有具体揭示内在控制标准。"
}

### 示例 4：不合格 - 只描述现象

**理解层转译**：
{
  "coreBlock": "你一直在收集信息，迟迟不肯做决定",
  "falseStrategy": "你试图通过更多信息来缓解焦虑",
  "hiddenCost": "时间被消耗，决定没有进展",
  "decisionTension": "收集信息 vs 做出决定"
}

**QA 结果**：
{
  "passed": false,
  "checks": [
    { "name": "禁止复述用户原句", "passed": true },
    { "name": "禁止建议或行动导向", "passed": true },
    { "name": "禁止出现优势名称", "passed": true },
    { "name": "必须揭示内在控制标准", "passed": false, "reason": "只描述了行为'一直在收集信息''迟迟不肯做决定'，没有揭示'行动被什么内部标准阻断'" },
    { "name": "必须有明确的决策张力（A vs B）", "passed": true }
  ],
  "evaluation": "整体评估：不通过。核心问题：只描述了行为现象，没有揭示内在控制机制。需要从'你在做什么'深入到'行动被什么标准阻断'。"
}

### 示例 5：不合格 - 出现优势名称

**理解层转译**：
{
  "coreBlock": "你的'战略'优势让你过度思考，导致'行动'优势无法启动",
  "falseStrategy": "你用'战略'优势替代了'行动'优势",
  "hiddenCost": "过度思考消耗了行动的能量",
  "decisionTension": "战略思考 vs 立即行动"
}

**QA 结果**：
{
  "passed": false,
  "checks": [
    { "name": "禁止复述用户原句", "passed": true },
    { "name": "禁止建议或行动导向", "passed": true },
    { "name": "禁止出现优势名称", "passed": false, "reason": "出现了'战略''行动'等优势名称，理解层转译不应涉及优势" },
    { "name": "必须揭示内在控制标准", "passed": true },
    { "name": "必须有明确的决策张力（A vs B）", "passed": true }
  ],
  "evaluation": "整体评估：不通过。核心问题：出现了优势名称。理解层转译应独立于优势分析，只揭示困惑本身的内在机制。"
}

### 示例 6：不合格 - 缺失决策张力

**理解层转译**：
{
  "coreBlock": "行动被'必须足够确定才允许开始'的内部标准阻断",
  "falseStrategy": "用'收集更多信息'替代'做出不确定的选择'",
  "hiddenCost": "在'准备—验证—再准备'的循环中，时间被消耗，选择并未推进",
  "decisionTension": "需要更多确定性"
}

**QA 结果**：
{
  "passed": false,
  "checks": [
    { "name": "禁止复述用户原句", "passed": true },
    { "name": "禁止建议或行动导向", "passed": true },
    { "name": "禁止出现优势名称", "passed": true },
    { "name": "必须揭示内在控制标准", "passed": true },
    { "name": "必须有明确的决策张力（A vs B）", "passed": false, "reason": "decisionTension 只表达了'需要更多确定性'，没有呈现 A vs B 的对立张力" }
  ],
  "evaluation": "整体评估：不通过。核心问题：decisionTension 没有呈现明确的 A vs B 对立。应该呈现如'追求确定 vs 必须选择'的形式。"
}

---

现在，请根据以上标准，检查理解层转译的质量。

**记住：只做判断，不改写内容。严格检查，发现任何问题立即返回'不合格'。**
`;

/**
 * 构建自检用户 Prompt
 */
export function buildQAPrompt(input: UnderstandingQAInput): string {
  return `请检查以下理解层转译的质量：

## 用户原始困惑
${input.userConfusion}

## 理解层转译输出

\`\`\`json
${JSON.stringify(input.understanding, null, 2)}
\`\`\`

请严格按照检查标准进行评估。`;
}

/**
 * 解析 QA 响应
 */
export function parseQAResponse(content: string): UnderstandingQAResult {
  try {
    const rawResult = JSON.parse(content) as UnderstandingQAResult;

    // 验证必需字段
    if (typeof rawResult.passed !== 'boolean') {
      throw new Error('响应缺少 passed 字段');
    }

    if (!Array.isArray(rawResult.checks) || rawResult.checks.length !== 5) {
      throw new Error('响应的 checks 字段格式不正确');
    }

    if (!rawResult.evaluation) {
      throw new Error('响应缺少 evaluation 字段');
    }

    return rawResult;
  } catch {
    // 尝试提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const rawResult = JSON.parse(jsonMatch[0]) as UnderstandingQAResult;
      return rawResult;
    }
    throw new Error('AI 返回的 QA 响应格式不正确，无法解析 JSON');
  }
}

/**
 * 本地快速 QA 检查（不调用 AI）
 *
 * 用于在发送给用户前进行快速检查，减少 AI 调用成本
 */
export function quickQACheck(
  userConfusion: string,
  understanding: ConfusionUnderstanding
): UnderstandingQAResult {
  const checks: QACheck[] = [];

  // 检查项 1：禁止复述用户原句
  const noDirectQuote = !userConfusion.split('').some(char => {
    // 如果用户困惑中有一段连续 10 个字符出现在理解输出中，视为复述
    const snippet = userConfusion.substring(Math.max(0, userConfusion.indexOf(char) - 5), Math.min(userConfusion.length, userConfusion.indexOf(char) + 10));
    return snippet.length > 10 && (
      understanding.coreBlock.includes(snippet) ||
      understanding.falseStrategy.includes(snippet) ||
      understanding.hiddenCost.includes(snippet)
    );
  });

  checks.push({
    name: '禁止复述用户原句',
    passed: noDirectQuote,
    reason: noDirectQuote ? undefined : '疑似复述了用户原句，请检查是否揭示了内在机制',
  });

  // 检查项 2：禁止建议或行动导向
  const hasSuggestion = /\b(应该|需要|可以|要|去做|去尝试|去改变|试着|建议)\b/.test(
    understanding.coreBlock + understanding.falseStrategy + understanding.hiddenCost
  );

  checks.push({
    name: '禁止建议或行动导向',
    passed: !hasSuggestion,
    reason: hasSuggestion ? '出现了建议性表述或行动导向词汇' : undefined,
  });

  // 检查项 3：禁止出现优势名称
  const strengthNames = [
    '成就', '行动', '适应', '分析', '统筹', '信仰', '命令', '沟通',
    '竞争', '关联', '审慎', '连接', '体谅', '一致', '专注', '未来',
    '公平', '回顾', '前瞻', '和谐', '理念', '包容', '个别', '搜集',
    '学习', '完美', '积极', '沟通', '排难', '最大', '纪律', '体谅',
    '战略', '思强', '学习', '责任'
  ];

  const hasStrengthName = strengthNames.some(name =>
    (understanding.coreBlock + understanding.falseStrategy + understanding.hiddenCost).includes(name)
  );

  checks.push({
    name: '禁止出现优势名称',
    passed: !hasStrengthName,
    reason: hasStrengthName ? '出现了优势名称，理解层转译不应涉及优势' : undefined,
  });

  // 检查项 4：必须揭示内在控制标准
  const hasControlStandard = /被.*阻断|被.*吞噬|被.*锚定|被.*冻结|被.*绑定/.test(understanding.coreBlock);

  checks.push({
    name: '必须揭示内在控制标准',
    passed: hasControlStandard,
    reason: hasControlStandard ? undefined : 'coreBlock 没有揭示"行动被什么内部标准阻断"',
  });

  // 检查项 5：必须有明确的决策张力（A vs B）
  const hasTension = /\bvs\b|对抗|对立|矛盾/.test(understanding.decisionTension) ||
    (understanding.decisionTension.split(/[，,]/).length >= 2);

  checks.push({
    name: '必须有明确的决策张力（A vs B）',
    passed: hasTension,
    reason: hasTension ? undefined : 'decisionTension 没有呈现清晰的 A vs B 对立',
  });

  const passed = checks.every(check => check.passed);

  return {
    passed,
    checks,
    evaluation: passed
      ? '整体评估：通过。本地快速检查通过。建议进行 AI 深度检查以获得更准确的评估。'
      : `整体评估：不通过。核心问题：${checks.filter(c => !c.passed).map(c => c.reason).join('；')}`,
  };
}
