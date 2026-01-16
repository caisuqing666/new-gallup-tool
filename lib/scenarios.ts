/**
 * 使用场景数据
 *
 * 从 JSON 文件加载场景定义，实现配置与代码分离
 * 内容人员可以修改 JSON 文件来调整场景，无需改动代码
 */

import scenariosData from './data/scenarios.json';

// 从 JSON 导入类型
type ScenarioJSON = typeof scenariosData.scenarios[number];

// ============================================================
// 类型定义
// ============================================================

/** 场景定义（从 JSON 加载） */
export interface Scenario extends ScenarioJSON {}

/** 场景 ID 联合类型 */
export type ScenarioId = (typeof scenariosData.scenarios)[number]['id'];

// ============================================================
// 运行时数据
// ============================================================

/** 从 JSON 加载的场景列表 */
export const SCENARIOS = scenariosData.scenarios as readonly Scenario[];

/** 所有有效的 Scenario ID */
export const VALID_SCENARIO_IDS = SCENARIOS.map(s => s.id) as readonly ScenarioId[];

// ============================================================
// 辅助函数
// ============================================================

/**
 * 类型守卫：检查是否为有效的 Scenario ID
 */
export function isValidScenarioId(id: unknown): id is ScenarioId {
  return typeof id === 'string' && VALID_SCENARIO_IDS.includes(id as ScenarioId);
}

/**
 * 根据 ID 获取场景
 */
export function getScenarioById(id: ScenarioId): Scenario | undefined {
  return SCENARIOS.find(s => s.id === id);
}

/**
 * 根据关键词搜索场景
 */
export function searchScenarios(keyword: string): Scenario[] {
  const lowerKeyword = keyword.toLowerCase();
  return SCENARIOS.filter(s =>
    s.title.toLowerCase().includes(lowerKeyword) ||
    s.description.toLowerCase().includes(lowerKeyword) ||
    s.keywords.some(k => k.toLowerCase().includes(lowerKeyword))
  );
}

/**
 * 根据问题类型推荐场景
 */
export function getScenariosByProblemType(problemType: string): Scenario[] {
  return SCENARIOS.filter(s =>
    s.typicalProblemType.toLowerCase() === problemType.toLowerCase()
  );
}

// 导出版本信息
export const CONFIG_VERSION = scenariosData.version;
export const LAST_UPDATED = scenariosData.lastUpdated;
