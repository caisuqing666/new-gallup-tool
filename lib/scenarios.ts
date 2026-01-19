/**
 * 使用场景数据（多语言版本）
 *
 * 从 JSON 文件加载场景定义，实现配置与代码分离
 * 内容人员可以修改 JSON 文件来调整场景，无需改动代码
 * 支持中英双语
 */

import { Locale } from '@/i18n/config';
import scenariosZh from './data/scenarios/zh.json';
import scenariosEn from './data/scenarios/en.json';
import scenariosData from './data/scenarios.json'; // 保留向后兼容性

// 从 JSON 导入类型
type ScenarioJSON = typeof scenariosZh.scenarios[number];

// ============================================================
// 类型定义
// ============================================================

/** 场景定义（从 JSON 加载） */
export interface Scenario extends ScenarioJSON {}

/** 场景 ID 联合类型 */
export type ScenarioId = (typeof scenariosZh.scenarios)[number]['id'];

// ============================================================
// 多语言运行时数据
// ============================================================

/** 多语言场景数据映射 */
export const SCENARIOS_I18N: Record<Locale, readonly Scenario[]> = {
  zh: scenariosZh.scenarios as readonly Scenario[],
  en: scenariosEn.scenarios as readonly Scenario[],
};

/** 默认场景列表（中文，保留向后兼容性） */
export const SCENARIOS = scenariosData.scenarios as readonly Scenario[];

/** 所有有效的 Scenario ID */
export const VALID_SCENARIO_IDS = SCENARIOS.map(s => s.id) as readonly ScenarioId[];

// ============================================================
// 多语言辅助函数
// ============================================================

/**
 * 获取指定语言的所有场景
 */
export function getScenarios(locale: Locale = 'zh'): Scenario[] {
  return [...(SCENARIOS_I18N[locale] ?? SCENARIOS_I18N['zh'])];
}

/**
 * 根据 ID 获取指定语言的场景
 */
export function getScenario(id: ScenarioId, locale: Locale = 'zh'): Scenario | undefined {
  return getScenarios(locale).find(s => s.id === id);
}

/**
 * 获取指定语言的所有有效 Scenario ID
 */
export function getValidScenarioIds(locale: Locale = 'zh'): readonly ScenarioId[] {
  return getScenarios(locale).map(s => s.id) as readonly ScenarioId[];
}

/**
 * 类型守卫：检查是否为有效的 Scenario ID（指定语言）
 */
export function isValidScenarioIdForLocale(id: unknown, locale: Locale = 'zh'): id is ScenarioId {
  return typeof id === 'string' && getValidScenarioIds(locale).includes(id as ScenarioId);
}

/**
 * 根据关键词搜索场景（指定语言）
 */
export function searchScenarios(keyword: string, locale: Locale = 'zh'): Scenario[] {
  const lowerKeyword = keyword.toLowerCase();
  return getScenarios(locale).filter(s =>
    s.title.toLowerCase().includes(lowerKeyword) ||
    s.description.toLowerCase().includes(lowerKeyword) ||
    s.keywords.some(k => k.toLowerCase().includes(lowerKeyword))
  );
}

/**
 * 根据问题类型推荐场景（指定语言）
 */
export function getScenariosByProblemType(problemType: string, locale: Locale = 'zh'): Scenario[] {
  return getScenarios(locale).filter(s =>
    s.typicalProblemType.toLowerCase() === problemType.toLowerCase()
  );
}

// ============================================================
// 向后兼容的原有函数
// ============================================================

/**
 * 根据 ID 获取场景（向后兼容，默认中文）
 */
export function getScenarioById(id: ScenarioId): Scenario | undefined {
  return SCENARIOS.find(s => s.id === id);
}

/**
 * 类型守卫：检查是否为有效的 Scenario ID（向后兼容）
 */
export function isValidScenarioId(id: unknown): id is ScenarioId {
  return typeof id === 'string' && VALID_SCENARIO_IDS.includes(id as ScenarioId);
}

// 导出版本信息
export const CONFIG_VERSION = scenariosData.version;
export const LAST_UPDATED = scenariosData.lastUpdated;
