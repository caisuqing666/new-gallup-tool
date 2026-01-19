/**
 * Prompt 国际化加载器
 * 根据 locale 生成对应语言版本的 Prompt
 */

import { Locale } from '@/i18n/config';
import { ProblemType, PROBLEM_TYPE_LABELS, PROBLEM_TYPE_DESCRIPTIONS } from './types';
import type { ContextPack } from './prompts';
import type { ConfusionUnderstanding } from './understanding-layer';
import {
  getProblemLockPrompt,
  getExplainSystemPrompt as getExplainSystemPromptBase,
  getDecideSystemPrompt as getDecideSystemPromptBase,
  getReferenceExample,
  getDecidePhaseAPrompt,
  getDecidePhaseBPrompt,
  getUnderstandingSystemPrompt as getUnderstandingSystemPromptBase,
  getContextPackLabels,
} from './i18n/prompts';

/**
 * 获取问题锁定 Prompt
 */
export function getProblemLockPromptI18n(locale: Locale): string {
  return getProblemLockPrompt(locale);
}

/**
 * 获取理解层转译 System Prompt
 */
export function getUnderstandingSystemPromptI18n(locale: Locale): string {
  return getUnderstandingSystemPromptBase(locale);
}

/**
 * 构建格式化的 Context Pack 文本（支持国际化）
 * 
 * @param pack - Context Pack 对象
 * @param locale - 语言代码
 * @returns 格式化后的 Context Pack 文本
 */
export function formatContextPackForPromptI18n(pack: ContextPack, locale: Locale): string {
  const labels = getContextPackLabels(locale);
  const lines: string[] = [];

  // ─────────────── 问题锁定 ───────────────
  const contextPackLabel = locale === 'en' ? 'CONTEXT PACK' : 'CONTEXT PACK';
  lines.push(`╔══════════════════════════════════════════════════════════╗
║  📌 ${contextPackLabel}（${locale === 'en' ? 'Strongly Constrained Context' : '强约束上下文'}）                           ║
╚══════════════════════════════════════════════════════════╝

## 🎯 ${locale === 'en' ? 'Problem Locking' : '问题锁定'}

| ${locale === 'en' ? 'Field' : '字段'} | ${locale === 'en' ? 'Value' : '值'} |
|------|-----:|
| problemType | **${pack.confusion.problemType}** |
| problemFocus | **${pack.confusion.problemFocus}** |
| ${locale === 'en' ? 'Expected Outcome' : '用户期望'} | ${pack.confusion.desiredOutcome} |
| ${locale === 'en' ? 'Cost of No Change' : '不改变的代价'} | ${pack.confusion.hiddenCost} |

> ${locale === 'en' ? 'Original Confusion' : '原始困惑'}：${pack.confusion.raw}`);

  // ─────────────── 优势能量 ───────────────
  const strengthLabel = locale === 'en' ? 'Strength' : '优势';
  const driveLabel = locale === 'en' ? 'Drive' : '驱动力';
  const costLabel = locale === 'en' ? 'Cost Zone' : '代价区';
  const basementLabel = locale === 'en' ? 'Basement' : '地下室';

  const strengthTable = pack.strengths.map(s => 
    `| ${s.name} | ${s.drive} | ${s.cost} | ${s.basement} |`
  ).join('\n');

  lines.push(`## ⚡ ${locale === 'en' ? 'Strength Energy Features' : '优势能量特征'}

| ${strengthLabel} | ${driveLabel} | ${costLabel} | ${basementLabel} |
|------|--------|--------|--------|
${strengthTable}`);

  // ─────────────── 组合效应 ───────────────
  const comboItems: string[] = [];
  const trapsLabel = locale === 'en' ? 'Traps' : '陷阱';
  const blindspotsLabel = locale === 'en' ? 'Blindspots' : '盲区';
  const amplificationsLabel = locale === 'en' ? 'Amplifications' : '放大';

  if (pack.combo.traps.length > 0) {
    comboItems.push(`🚨 **${trapsLabel}**：${pack.combo.traps.join('；')}`);
  }
  if (pack.combo.blindspots.length > 0) {
    comboItems.push(`👁️ **${blindspotsLabel}**：${pack.combo.blindspots.join('；')}`);
  }
  if (pack.combo.amplifications.length > 0) {
    comboItems.push(`🚀 **${amplificationsLabel}**：${pack.combo.amplifications.join('；')}`);
  }

  if (comboItems.length > 0) {
    const comboTitle = locale === 'en' ? 'Combination Effects' : '组合效应';
    lines.push(`## 🔗 ${comboTitle}

${comboItems.join('\n')}`);
  }

  // ─────────────── 纠偏建议 ───────────────
  if (pack.combo.topCorrection) {
    const topCorrectionLabel = locale === 'en' ? 'Top Correction' : '首选纠偏';
    const insightLabel = locale === 'en' ? 'Insight' : '洞察';
    const actionLabel = locale === 'en' ? 'Action' : '行动';
    const boundaryLabel = locale === 'en' ? 'Boundary' : '边界';

    lines.push(`## 🔧 ${topCorrectionLabel}

- **${insightLabel}**：${pack.combo.topCorrection.insight}
- **${actionLabel}**：${pack.combo.topCorrection.action}
- **${boundaryLabel}**：${pack.combo.topCorrection.boundary}`);
  }

  // ─────────────── 硬性约束 ───────────────
  const hardConstraintTitle = locale === 'en' ? 'Hard Constraints' : '硬性约束';
  const forbiddenListTitle = locale === 'en' ? 'Forbidden List' : '禁止清单';
  const selfCheckRuleTitle = locale === 'en' ? 'Self-Check Rule' : '自检规则';
  const generalizingText = locale === 'en' ? 'you are generalizing, rewrite' : '你在泛化，重写';
  const correctText = locale === 'en' ? 'correct' : '正确';

  lines.push(`╔══════════════════════════════════════════════════════════╗
║  ⛔ ${hardConstraintTitle}                                               ║
╚══════════════════════════════════════════════════════════╝

**${locale === 'en' ? 'Only reason based on Context Pack above, forbid generalizing.' : '只允许依据以上 Context Pack 推理，禁止泛化。'}**

${forbiddenListTitle}：
- ❌ ${locale === 'en' ? "Output content that 'different problemFocus also applies'" : "输出「换一个 problemFocus 也能成立」的内容"}
- ❌ ${locale === 'en' ? "Output content that 'different strengths also apply'" : "输出「换一组优势也能成立」的内容"}
- ❌ ${locale === 'en' ? 'Output suggestions not referencing Context Pack fields' : "输出不引用 Context Pack 字段的建议"}

${selfCheckRuleTitle}：${locale === 'en' ? 'Delete Context Pack, does output still make sense?' : '删掉 Context Pack，输出是否还有意义？'}
- ${locale === 'en' ? 'Yes → ' : '有 → '}${generalizingText}
- ${locale === 'en' ? 'No → ' : '没有 → '}${correctText}`);

  return lines.join('\n\n');
}

/**
 * 构建解释页系统提示（支持国际化）
 */
export function buildExplainSystemPromptI18n(
  problemType: ProblemType,
  problemFocus: string,
  locale: Locale,
  contextPack?: ContextPack,
  knowledgeContext?: string
): string {
  const problemTypeName = PROBLEM_TYPE_LABELS[problemType];
  const problemTypeDesc = PROBLEM_TYPE_DESCRIPTIONS[problemType];
  
  // 如果有 Context Pack，放在最前面
  const contextPackSection = contextPack 
    ? formatContextPackForPromptI18n(contextPack, locale) + '\n\n---\n\n'
    : '';

  const knowledgeSection = knowledgeContext
    ? `${knowledgeContext}\n\n---\n\n`
    : '';

  const basePrompt = getExplainSystemPromptBase(locale);
  
  // 构建问题类型和焦点部分
  const currentProblemTypeLabel = locale === 'en' ? 'Current Problem Type' : '当前问题类型';
  const currentProblemFocusLabel = locale === 'en' ? 'Current Problem Focus' : '当前问题焦点';
  const problemTypeDefinitionLabel = locale === 'en' ? 'Problem Type Definition' : '问题类型定义';
  const currentContextLabel = locale === 'en' ? 'Current Context Variables' : '当前上下文变量';
  const strengthsLabel = locale === 'en' ? 'strengths' : '优势';
  const systemLevelHardConstraintLabel = locale === 'en' ? 'System-Level Hard Constraint - Double Lock' : '系统级硬约束 - 双重锁定';
  const youAreNotExplainingLabel = locale === 'en' ? "You are not explaining 'what kind of person this is', but explaining:" : '你不是在解释\"这个人是什么样的人\"，而是在解释：';
  const inSituationLabel = locale === 'en' ? 'situation, for' : '的情境下，针对';
  const thisCombinationLabel = locale === 'en' ? 'this combination is how it affects user\'s judgment and behavior.' : '这件事，这组优势是如何影响用户的判断与行为的。';
  const keyConstraintLabel = locale === 'en' ? 'Key Constraint:' : '关键约束：';
  const onlyAllowedLabel = locale === 'en' ? 'only allow reasoning based on Context Pack' : '只允许依据 Context Pack 推理';
  const forbiddenLabel = locale === 'en' ? 'Forbidden: output that doesn\'t relate to' : '禁止输出：与';
  const irrelevantLabel = locale === 'en' ? 'irrelevant strength analysis' : '无关的优势分析';
  const forbiddenGeneralizationLabel = locale === 'en' ? 'Forbidden: generalized personality description (applies to different people)' : '禁止输出：泛化人格描述（换成另一个人也能成立）';
  const forbiddenUniversalLabel = locale === 'en' ? 'Forbidden: universal psychological summary' : '禁止输出：放之四海而皆准的心理总结';
  const hardConstraint1Label = locale === 'en' ? 'Hard Constraint #1: problemFocus Constraint' : '硬约束 #1：problemFocus 约束';
  const everyExplanationLabel = locale === 'en' ? 'Every explanation must supplement to: "In [' : '每一段解释都必须能补全为：\"在【';
  const whenUserFacesLabel = locale === 'en' ? '], when user faces [' : '】下，当用户面对【';
  const thenLabel = locale === 'en' ? '], ……"' : '】时，……\"';
  const forbiddenUnrelatedLabel = locale === 'en' ? 'Forbidden: output unrelated to [' : '禁止输出：与【';
  const ofTypeLabel = locale === 'en' ? 'of type [' : '】无关的【';
  const strengthAnalysisLabel = locale === 'en' ? '] strength analysis' : '】优势分析';
  const hardConstraint2Label = locale === 'en' ? 'Hard Constraint #2: problemType Constraint' : '硬约束 #2：problemType 约束';
  const mustExplainLabel = locale === 'en' ? 'You must explain under [' : '你必须在【';
  const frameworkLabel = locale === 'en' ? '] framework' : '】的框架下解释';
  const forbiddenSwitchLabel = locale === 'en' ? 'Forbidden: output that still applies if switching to other problemType' : '禁止输出：换成其他 problemType 也能成立的内容';
  const eachExplanationLabel = locale === 'en' ? 'Each explanation must embody [' : '每一段解释都必须体现【';
  const characteristicLabel = locale === 'en' ? '] characteristics' : '】的特征';

  const systemConstraintText = locale === 'en' 
    ? `In [${problemTypeName}] the situation, for [${problemFocus}] this situation, how does this combination affect the user's judgment and behavior?`
    : `在【${problemTypeName}】的情境下，针对【${problemFocus}】这件事，这组优势是如何影响用户的判断与行为的。`;

  const checkTestText1 = locale === 'en' ? 'Delete Context Pack, does your explanation still hold?' : '删掉 Context Pack，你的解释是否还能成立？';
  const checkTestText2 = locale === 'en' ? 'If yes → you are generalizing, rewrite immediately' : '如果能 → 你在泛化，立即重写';
  const checkTestText3 = locale === 'en' ? 'If no → correct' : '如果不能 → 正确';
  
  return `${contextPackSection}${knowledgeSection}## 【${currentProblemTypeLabel}】${problemTypeName}（${problemType}）

### ${problemTypeDefinitionLabel}
${problemTypeDesc}

---

## 【${currentProblemFocusLabel}】${problemFocus}

### 【${systemLevelHardConstraintLabel}】

**${youAreNotExplainingLabel}**
> "${systemConstraintText}"

**${keyConstraintLabel}**
- ${onlyAllowedLabel}
- ${locale === 'en' ? 'Each strength behavior description must be based on Context Pack [drive / cost zone / basement]' : '每个优势的行为描述必须基于 Context Pack 中该优势的「驱动力」「代价区」「地下室」'}
- ${locale === 'en' ? 'Combination effects must reference Context Pack [traps / blindspots / amplification]' : '组合效应必须引用 Context Pack 中的「陷阱」「盲区」「放大」'}
- ${locale === 'en' ? 'Forbid creating strength characteristics out of thin air' : '禁止凭空创造优势特性'}

### ${hardConstraint1Label}
- ${everyExplanationLabel}${problemTypeName}${whenUserFacesLabel}${problemFocus}${thenLabel}
- ${forbiddenUnrelatedLabel}${problemFocus}${locale === 'en' ? '] of' : '】无关的'}${strengthAnalysisLabel}
- ${forbiddenGeneralizationLabel}
- ${forbiddenUniversalLabel}

### ${hardConstraint2Label}
- ${mustExplainLabel}${problemTypeName}${frameworkLabel}
- ${forbiddenSwitchLabel}
- ${eachExplanationLabel}${problemTypeName}${characteristicLabel}

### 【${locale === 'en' ? 'Ultimate Self-Check Rules (must check after each generation)' : '终极自检规则（每次生成后必须检查）'}】

**${locale === 'en' ? 'Check #1: Context Pack Dependency Test' : '检查 #1：Context Pack 依赖测试'}**
- ${checkTestText1}
- ${checkTestText2}
- ${checkTestText3}

**${locale === 'en' ? 'Check #2: problemFocus Swap Test' : '检查 #2：problemFocus 互换测试'}**
- ${locale === 'en' ? `If [${problemFocus}] swapped with another thing` : `如果【${problemFocus}】换成另一件事`}
- ${locale === 'en' ? 'Does your explanation still hold?' : '你的解释是否仍然成立？'}
- ${locale === 'en' ? 'If yes → delete and rewrite immediately' : '如果成立 → 立即删除重写'}

**${locale === 'en' ? 'Check #3: Strength Swap Test' : '检查 #3：优势互换测试'}**
- ${locale === 'en' ? 'If swap to different strengths' : '如果换一组优势'}
- ${locale === 'en' ? 'Does your explanation still hold?' : '你的解释是否仍然成立？'}
- ${locale === 'en' ? 'If yes → delete and rewrite immediately' : '如果成立 → 立即删除重写'}

---

${basePrompt}`;
}

/**
 * 构建判定页系统提示（支持国际化）
 */
export function buildDecideSystemPromptI18n(
  problemType: ProblemType,
  problemFocus: string,
  locale: Locale,
  contextPack?: ContextPack,
  understanding?: ConfusionUnderstanding,
  knowledgeContext?: string
): string {
  const problemTypeName = PROBLEM_TYPE_LABELS[problemType];
  const problemTypeDesc = PROBLEM_TYPE_DESCRIPTIONS[problemType];

  // 如果有 Context Pack，放在最前面
  const contextPackSection = contextPack 
    ? formatContextPackForPromptI18n(contextPack, locale) + '\n\n---\n\n'
    : '';

  const knowledgeSection = knowledgeContext
    ? `${knowledgeContext}\n\n---\n\n`
    : '';

  const basePrompt = getDecideSystemPromptBase(locale);
  const referenceExampleText = getReferenceExample(locale);

  const currentProblemTypeLabel = locale === 'en' ? 'Current Problem Type' : '当前问题类型';
  const problemTypeDefinitionLabel = locale === 'en' ? 'Problem Type Definition' : '问题类型定义';
  const currentProblemFocusLabel = locale === 'en' ? 'Current Problem Focus' : '当前问题焦点';
  const understandingLayerLabel = locale === 'en' ? 'Understanding Layer Translation (must be judgment starting point)' : '理解层转译（必须作为判定起点）';
  const coreBlockMechanismLabel = locale === 'en' ? 'Core Block Mechanism' : '核心阻断机制';
  const falseStrategyLabel = locale === 'en' ? 'False Strategy' : '虚假策略';
  const hiddenCostLabel = locale === 'en' ? 'Hidden Cost' : '隐形代价';
  const decisionTensionLabel = locale === 'en' ? 'Decision Tension' : '判定张力';
  const usageRuleLabel = locale === 'en' ? 'Usage Rules' : '使用规则';
  const reframedInsightLabel = locale === 'en' ? 'reframedInsight must be "restatement understanding sentence"' : 'reframedInsight 必须是"复述式理解句"';
  const basedOnLabel = locale === 'en' ? 'based on above four items rewrite' : '基于上述四项改写';
  const cannotReusLabel = locale === 'en' ? 'Cannot reuse user\'s original words' : '不得复用用户原话';
  const forbiddenAdviceLabel = locale === 'en' ? 'Cannot give advice, no "should/need/suggest" words' : '不能给建议，不要出现"应该/需要/建议"';
  const mustIncludeStructureLabel = locale === 'en' ? 'Must include "true motivation/internal standard" and "resulting consequence" parts' : '必须包含"真实动机/内部标准"与"导致的结果"两个部分';
  const wordsRangeLabel = locale === 'en' ? 'Single sentence preferred, max two; total 24-60 words' : '单句为主，最多两句；总字数 24-60 字';

  const understandingSection = understanding
    ? `## 【${understandingLayerLabel}】
- ${coreBlockMechanismLabel}：${understanding.coreBlock}
- ${falseStrategyLabel}：${understanding.falseStrategy}
- ${hiddenCostLabel}：${understanding.hiddenCost}
- ${decisionTensionLabel}：${understanding.decisionTension}

### ${usageRuleLabel}
- ${reframedInsightLabel}，${basedOnLabel}
- ${forbiddenAdviceLabel}
- ${locale === 'en' ? 'Cannot reuse user\'s original wording for 4+ consecutive words' : '不使用用户原话连续四字'}
- ${mustIncludeStructureLabel}
- ${wordsRangeLabel}

---

`
    : '';

  return `${contextPackSection}${knowledgeSection}## 【${currentProblemTypeLabel}】${problemTypeName}（${problemType}）

### ${problemTypeDefinitionLabel}
${problemTypeDesc}

---

## 【${currentProblemFocusLabel}】${problemFocus}

---

${understandingSection}${referenceExampleText}

---

${basePrompt}`;
}

/**
 * 获取 Phase A Prompt（支持国际化）
 */
export function getDecidePhaseAPromptI18n(locale: Locale): string {
  return getDecidePhaseAPrompt(locale);
}

/**
 * 获取 Phase B Prompt（支持国际化）
 */
export function getDecidePhaseBPromptI18n(locale: Locale): string {
  return getDecidePhaseBPrompt(locale);
}
