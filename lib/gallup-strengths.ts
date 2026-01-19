// 34个盖洛普优势才干 (CliftonStrengths)
// 官方四个领域分类及中文翻译

import { Locale } from '@/i18n/config';

export const ALL_STRENGTHS = [
  // ========== 执行力领域 (Executing) - 9项 ==========
  // 帮助人们将想法变成行动
  { id: 'focus', name: '专注', domain: 'executing' as const },
  { id: 'belief', name: '信仰', domain: 'executing' as const },
  { id: 'consistency', name: '公平', domain: 'executing' as const },
  { id: 'deliberative', name: '审慎', domain: 'executing' as const },
  { id: 'achiever', name: '成就', domain: 'executing' as const },
  { id: 'restorative', name: '排难', domain: 'executing' as const },
  { id: 'discipline', name: '纪律', domain: 'executing' as const },
  { id: 'arranger', name: '统筹', domain: 'executing' as const },
  { id: 'responsibility', name: '责任', domain: 'executing' as const },

  // ========== 影响力领域 (Influencing) - 8项 ==========
  // 帮助人们表达观点、说服他人、促成结果
  { id: 'woo', name: '取悦', domain: 'influencing' as const },
  { id: 'maximizer', name: '完美', domain: 'influencing' as const },
  { id: 'communication', name: '沟通', domain: 'influencing' as const },
  { id: 'competition', name: '竞争', domain: 'influencing' as const },
  { id: 'command', name: '统率', domain: 'influencing' as const },
  { id: 'self-assurance', name: '自信', domain: 'influencing' as const },
  { id: 'activator', name: '行动', domain: 'influencing' as const },
  { id: 'significance', name: '追求', domain: 'influencing' as const },

  // ========== 关系建立领域 (Relationship Building) - 9项 ==========
  // 帮助人们建立更强大的团队和人际关系
  { id: 'individualization', name: '个别', domain: 'relationship' as const },
  { id: 'relator', name: '交往', domain: 'relationship' as const },
  { id: 'developer', name: '伯乐', domain: 'relationship' as const },
  { id: 'empathy', name: '体谅', domain: 'relationship' as const },
  { id: 'connectedness', name: '关联', domain: 'relationship' as const },
  { id: 'include', name: '包容', domain: 'relationship' as const },
  { id: 'harmony', name: '和谐', domain: 'relationship' as const },
  { id: 'positivity', name: '积极', domain: 'relationship' as const },
  { id: 'adaptability', name: '适应', domain: 'relationship' as const },

  // ========== 战略思维领域 (Strategic Thinking) - 8项 ==========
  // 帮助人们分析和处理信息
  { id: 'analytical', name: '分析', domain: 'strategic' as const },
  { id: 'futuristic', name: '前瞻', domain: 'strategic' as const },
  { id: 'context', name: '回顾', domain: 'strategic' as const },
  { id: 'learner', name: '学习', domain: 'strategic' as const },
  { id: 'intellection', name: '思维', domain: 'strategic' as const },
  { id: 'strategic', name: '战略', domain: 'strategic' as const },
  { id: 'input', name: '搜集', domain: 'strategic' as const },
  { id: 'ideation', name: '理念', domain: 'strategic' as const },
] as const;

// 推导出 Strength ID 的联合类型（从 ALL_STRENGTHS 推导）
export type StrengthId = (typeof ALL_STRENGTHS)[number]['id'];

// 推导出 Strength Domain 的联合类型
export type StrengthDomain = (typeof ALL_STRENGTHS)[number]['domain'];

// 导出 Strength 类型（从 ALL_STRENGTHS 推导）
export type Strength = (typeof ALL_STRENGTHS)[number];

// 获取所有有效的 Strength ID（运行时校验数组）
export const VALID_STRENGTH_IDS = ALL_STRENGTHS.map(
  (s) => s.id
) as readonly StrengthId[];

// 类型守卫：检查是否为有效的 Strength ID
export function isValidStrengthId(id: unknown): id is StrengthId {
  return typeof id === 'string' && VALID_STRENGTH_IDS.includes(id as StrengthId);
}

// 根据 ID 查找优势（类型安全）
export function getStrengthById(id: StrengthId): Strength | undefined {
  return ALL_STRENGTHS.find((s) => s.id === id);
}

// 领域配色方案 - 盖洛普官方颜色（柔和版，智性温暖 + 晶石）
// 使用之前推送版本的柔和色系，但确保类型正确
export const DOMAIN_COLORS = {
  executing: '#8B7A9B',     // 执行力 - 柔和紫色（保持之前柔和度）
  influencing: '#B8A082',   // 影响力 - 柔和黄色（保持之前柔和度）
  relationship: '#7A8B9B',   // 关系建立 - 柔和蓝色（保持之前柔和度）
  strategic: '#6B8E6B',     // 战略思维 - 柔和绿色（保持之前柔和度）
};

// 领域名称映射
export const DOMAIN_NAMES = {
  executing: '执行力',
  influencing: '影响力',
  relationship: '关系建立',
  strategic: '战略思维',
};

// ============================================================
// ✨ 多语言支持（第3阶段国际化）
// ============================================================

/**
 * 优势名称多语言映射
 * 用于获取特定语言的优势名称
 */
export const STRENGTH_NAMES: Record<Locale, Record<StrengthId, string>> = {
  zh: {
    focus: '专注',
    belief: '信仰',
    consistency: '公平',
    deliberative: '审慎',
    achiever: '成就',
    restorative: '排难',
    discipline: '纪律',
    arranger: '统筹',
    responsibility: '责任',
    woo: '取悦',
    maximizer: '完美',
    communication: '沟通',
    competition: '竞争',
    command: '统率',
    'self-assurance': '自信',
    activator: '行动',
    significance: '追求',
    individualization: '个别',
    relator: '交往',
    developer: '伯乐',
    empathy: '体谅',
    connectedness: '关联',
    include: '包容',
    harmony: '和谐',
    positivity: '积极',
    adaptability: '适应',
    analytical: '分析',
    futuristic: '前瞻',
    context: '回顾',
    learner: '学习',
    intellection: '思维',
    strategic: '战略',
    input: '搜集',
    ideation: '理念',
  },
  en: {
    focus: 'Focus',
    belief: 'Belief',
    consistency: 'Consistency',
    deliberative: 'Deliberative',
    achiever: 'Achiever',
    restorative: 'Restorative',
    discipline: 'Discipline',
    arranger: 'Arranger',
    responsibility: 'Responsibility',
    woo: 'Woo',
    maximizer: 'Maximizer',
    communication: 'Communication',
    competition: 'Competition',
    command: 'Command',
    'self-assurance': 'Self-Assurance',
    activator: 'Activator',
    significance: 'Significance',
    individualization: 'Individualization',
    relator: 'Relator',
    developer: 'Developer',
    empathy: 'Empathy',
    connectedness: 'Connectedness',
    include: 'Inclusion',
    harmony: 'Harmony',
    positivity: 'Positivity',
    adaptability: 'Adaptability',
    analytical: 'Analytical',
    futuristic: 'Futuristic',
    context: 'Context',
    learner: 'Learner',
    intellection: 'Intellection',
    strategic: 'Strategic',
    input: 'Input',
    ideation: 'Ideation',
  },
};

/**
 * 获取指定语言的优势名称
 * @param id 优势ID
 * @param locale 语言，默认为中文
 * @returns 优势名称，如果不存在则返回 ID
 */
export function getStrengthName(
  id: StrengthId,
  locale: Locale = 'zh'
): string {
  return STRENGTH_NAMES[locale]?.[id] ?? STRENGTH_NAMES.zh[id] ?? id;
}

/**
 * 获取指定语言的所有优势（带名称）
 * @param locale 语言，默认为中文
 * @returns 优势数组，包含指定语言的名称
 */
export function getStrengthsByLocale(
  locale: Locale = 'zh'
): Array<Strength & { name: string }> {
  return ALL_STRENGTHS.map((s) => ({
    ...s,
    name: getStrengthName(s.id, locale),
  })) as Array<Strength & { name: string }>;
}

/**
 * 获取指定语言的优势对象（带名称）
 * @param id 优势ID
 * @param locale 语言，默认为中文
 * @returns 优势对象，包含指定语言的名称
 */
export function getStrengthWithName(
  id: StrengthId,
  locale: Locale = 'zh'
): (Strength & { name: string }) | undefined {
  const strength = getStrengthById(id);
  if (!strength) return undefined;
  return {
    ...strength,
    name: getStrengthName(id, locale),
  } as Strength & { name: string };
}

/**
 * 领域名称多语言映射
 */
export const DOMAIN_NAMES_I18N: Record<Locale, Record<StrengthDomain, string>> = {
  zh: {
    executing: '执行力',
    influencing: '影响力',
    relationship: '关系建立',
    strategic: '战略思维',
  },
  en: {
    executing: 'Executing',
    influencing: 'Influencing',
    relationship: 'Relationship Building',
    strategic: 'Strategic Thinking',
  },
};

/**
 * 获取指定语言的领域名称
 * @param domain 领域ID
 * @param locale 语言，默认为中文
 * @returns 领域名称
 */
export function getDomainName(
  domain: StrengthDomain,
  locale: Locale = 'zh'
): string {
  return DOMAIN_NAMES_I18N[locale]?.[domain] ?? DOMAIN_NAMES_I18N.zh[domain] ?? domain;
}
