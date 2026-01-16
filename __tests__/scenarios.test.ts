/**
 * 场景配置测试
 *
 * 测试 scenarios.json 配置是否正确加载和验证
 */

import { describe, it, expect } from '@jest/globals';
import {
  SCENARIOS,
  VALID_SCENARIO_IDS,
  isValidScenarioId,
  getScenarioById,
  searchScenarios,
  getScenariosByProblemType,
  CONFIG_VERSION,
} from '@/lib/scenarios';

describe('场景配置测试', () => {
  describe('SCENARIOS 数据加载', () => {
    it('应该加载了4个场景', () => {
      expect(SCENARIOS).toHaveLength(4);
    });

    it('每个场景应该有有效的 ID', () => {
      SCENARIOS.forEach(scenario => {
        expect(scenario.id).toBeDefined();
        expect(typeof scenario.id).toBe('string');
        expect(scenario.id.length).toBeGreaterThan(0);
      });
    });

    it('每个场景应该有标题', () => {
      SCENARIOS.forEach(scenario => {
        expect(scenario.title).toBeDefined();
        expect(typeof scenario.title).toBe('string');
        expect(scenario.title.length).toBeGreaterThan(0);
      });
    });

    it('每个场景应该有描述', () => {
      SCENARIOS.forEach(scenario => {
        expect(scenario.description).toBeDefined();
        expect(typeof scenario.description).toBe('string');
        expect(scenario.description.length).toBeGreaterThan(0);
      });
    });

    it('每个场景应该有典型问题类型', () => {
      SCENARIOS.forEach(scenario => {
        expect(scenario.typicalProblemType).toBeDefined();
        expect(typeof scenario.typicalProblemType).toBe('string');
      });
    });
  });

  describe('VALID_SCENARIO_IDS', () => {
    it('应该有与 SCENARIOS 相同数量的 ID', () => {
      expect(VALID_SCENARIO_IDS).toHaveLength(SCENARIOS.length);
    });

    it('所有 ID 应该来自 SCENARIOS', () => {
      VALID_SCENARIO_IDS.forEach(id => {
        const found = SCENARIOS.find(s => s.id === id);
        expect(found).toBeDefined();
      });
    });
  });

  describe('isValidScenarioId', () => {
    it('应该返回 true 给有效的 ID', () => {
      VALID_SCENARIO_IDS.forEach(id => {
        expect(isValidScenarioId(id)).toBe(true);
      });
    });

    it('应该返回 false 给无效的 ID', () => {
      expect(isValidScenarioId('invalid-id')).toBe(false);
      expect(isValidScenarioId('')).toBe(false);
      expect(isValidScenarioId(null)).toBe(false);
      expect(isValidScenarioId(undefined)).toBe(false);
      expect(isValidScenarioId(123)).toBe(false);
    });
  });

  describe('getScenarioById', () => {
    it('应该返回正确的场景', () => {
      const scenario = getScenarioById('work-decision');
      expect(scenario).toBeDefined();
      expect(scenario?.id).toBe('work-decision');
      expect(scenario?.title).toBe('手头事太多，不知道该先保哪一个');
    });

    it('应该返回 undefined 给无效的 ID', () => {
      expect(getScenarioById('invalid')).toBeUndefined();
    });
  });

  describe('searchScenarios', () => {
    it('应该根据标题搜索到场景', () => {
      const results = searchScenarios('手头事太多');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('work-decision');
    });

    it('应该根据关键词搜索到场景', () => {
      const results = searchScenarios('决策');
      expect(results.length).toBeGreaterThan(0);
    });

    it('应该返回空数组给不匹配的搜索', () => {
      const results = searchScenarios('不存在的场景');
      expect(results).toHaveLength(0);
    });
  });

  describe('getScenariosByProblemType', () => {
    it('应该返回匹配问题类型的场景', () => {
      const results = getScenariosByProblemType('EFFICIENCY_BOTTLENECK');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(s => s.id === 'work-decision')).toBe(true);
      expect(results.some(s => s.id === 'efficiency')).toBe(true);
    });

    it('应该返回空数组给不匹配的问题类型', () => {
      const results = getScenariosByProblemType('NONEXISTENT');
      expect(results).toHaveLength(0);
    });
  });

  describe('配置版本', () => {
    it('应该有版本信息', () => {
      expect(CONFIG_VERSION).toBeDefined();
      expect(typeof CONFIG_VERSION).toBe('string');
    });
  });
});
