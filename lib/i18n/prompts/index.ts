/**
 * Prompt 多语言加载器
 * 根据locale动态加载对应语言的Prompt
 */

import { Locale } from '@/i18n/config';

// 导入中文Prompt
import {
  PROBLEM_LOCK_PROMPT_ZH,
  EXPLAIN_SYSTEM_PROMPT_ZH,
  DECIDE_SYSTEM_PROMPT_ZH,
  REFERENCE_EXAMPLE_ZH,
  DECIDE_PHASE_A_PROMPT_ZH,
  DECIDE_PHASE_B_PROMPT_ZH,
  UNDERSTANDING_SYSTEM_PROMPT_ZH,
  formatContextPackLabelsZH,
} from './zh';

// 导入英文Prompt
import {
  PROBLEM_LOCK_PROMPT_EN,
  EXPLAIN_SYSTEM_PROMPT_EN,
  DECIDE_SYSTEM_PROMPT_EN,
  REFERENCE_EXAMPLE_EN,
  DECIDE_PHASE_A_PROMPT_EN,
  DECIDE_PHASE_B_PROMPT_EN,
  UNDERSTANDING_SYSTEM_PROMPT_EN,
  formatContextPackLabelsEN,
} from './en';

/**
 * 多语言Prompt集合接口
 */
export interface PromptI18n {
  /** 问题锁定 Prompt */
  problemLockPrompt: string;
  
  /** 解释页系统提示 */
  explainSystemPrompt: string;
  
  /** 判定页系统提示 */
  decideSystemPrompt: string;
  
  /** 参考输出标准 */
  referenceExample: string;
  
  /** Phase A 理解转译 Prompt */
  decidePhaseAPrompt: string;
  
  /** Phase B 判定渲染 Prompt */
  decidePhaseBPrompt: string;
  
  /** 理解层转译系统提示 */
  understandingSystemPrompt: string;
  
  /** Context Pack 格式化标签 */
  contextPackLabels: Record<string, string>;
}

/**
 * 多语言Prompt映射
 */
const PROMPTS_I18N: Record<Locale, PromptI18n> = {
  zh: {
    problemLockPrompt: PROBLEM_LOCK_PROMPT_ZH,
    explainSystemPrompt: EXPLAIN_SYSTEM_PROMPT_ZH,
    decideSystemPrompt: DECIDE_SYSTEM_PROMPT_ZH,
    referenceExample: REFERENCE_EXAMPLE_ZH,
    decidePhaseAPrompt: DECIDE_PHASE_A_PROMPT_ZH,
    decidePhaseBPrompt: DECIDE_PHASE_B_PROMPT_ZH,
    understandingSystemPrompt: UNDERSTANDING_SYSTEM_PROMPT_ZH,
    contextPackLabels: formatContextPackLabelsZH(),
  },
  en: {
    problemLockPrompt: PROBLEM_LOCK_PROMPT_EN,
    explainSystemPrompt: EXPLAIN_SYSTEM_PROMPT_EN,
    decideSystemPrompt: DECIDE_SYSTEM_PROMPT_EN,
    referenceExample: REFERENCE_EXAMPLE_EN,
    decidePhaseAPrompt: DECIDE_PHASE_A_PROMPT_EN,
    decidePhaseBPrompt: DECIDE_PHASE_B_PROMPT_EN,
    understandingSystemPrompt: UNDERSTANDING_SYSTEM_PROMPT_EN,
    contextPackLabels: formatContextPackLabelsEN(),
  },
};

/**
 * 根据 locale 加载对应语言的 Prompt 集合
 * @param locale - 语言代码（'zh' | 'en'）
 * @returns 该语言的 Prompt 集合
 */
export function loadPrompts(locale: Locale): PromptI18n {
  return PROMPTS_I18N[locale] || PROMPTS_I18N['zh'];
}

/**
 * 获取问题锁定 Prompt
 */
export function getProblemLockPrompt(locale: Locale): string {
  return loadPrompts(locale).problemLockPrompt;
}

/**
 * 获取解释页系统提示
 */
export function getExplainSystemPrompt(locale: Locale): string {
  return loadPrompts(locale).explainSystemPrompt;
}

/**
 * 获取判定页系统提示
 */
export function getDecideSystemPrompt(locale: Locale): string {
  return loadPrompts(locale).decideSystemPrompt;
}

/**
 * 获取参考输出标准
 */
export function getReferenceExample(locale: Locale): string {
  return loadPrompts(locale).referenceExample;
}

/**
 * 获取 Phase A 理解转译 Prompt
 */
export function getDecidePhaseAPrompt(locale: Locale): string {
  return loadPrompts(locale).decidePhaseAPrompt;
}

/**
 * 获取 Phase B 判定渲染 Prompt
 */
export function getDecidePhaseBPrompt(locale: Locale): string {
  return loadPrompts(locale).decidePhaseBPrompt;
}

/**
 * 获取理解层转译系统提示
 */
export function getUnderstandingSystemPrompt(locale: Locale): string {
  return loadPrompts(locale).understandingSystemPrompt;
}

/**
 * 获取 Context Pack 格式化标签
 */
export function getContextPackLabels(locale: Locale): Record<string, string> {
  return loadPrompts(locale).contextPackLabels;
}

// 导出所有对象
export { PROMPTS_I18N };
