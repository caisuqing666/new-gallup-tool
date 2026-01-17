import { applyRules } from '@/lib/coach_rules/applyRules';
import type { Stage3Output } from '@/lib/legacy-pipeline/types';

function baseDiagnosis(overrides: Partial<Stage3Output>): Stage3Output {
  return {
    profile_summary: '测试摘要',
    top_strengths: [
      { name: '分析', core_value: '逻辑推演', overuse_pattern: '分析过度', blind_spot: '行动拖延' },
    ],
    current_pattern: '一般模式',
    leverage_plan: ['计划A'],
    anti_pattern: ['避免B'],
    micro_habits_7d: ['习惯1'],
    proof_points: ['证据1'],
    ...overrides,
  };
}

describe('applyRules', () => {
  test('命中：过度分析拖延不行动', () => {
    const diagnosis = baseDiagnosis({
      current_pattern: '过度分析导致迟迟不行动',
      top_strengths: [
        { name: '分析', core_value: '逻辑', overuse_pattern: '分析过度', blind_spot: '拖延' },
      ],
    });
    const result = applyRules(diagnosis);
    expect(result.matchedRules.map((r) => r.id)).toContain('R1-overanalysis-procrastination');
    expect(result.actionHints.do_more.length).toBeGreaterThan(0);
  });

  test('命中：过度求完美导致卡死', () => {
    const diagnosis = baseDiagnosis({
      current_pattern: '完美导致无法定稿',
      top_strengths: [
        { name: '完美', core_value: '质量极致', overuse_pattern: '标准过高', blind_spot: '停滞' },
      ],
    });
    const result = applyRules(diagnosis);
    expect(result.matchedRules.map((r) => r.id)).toContain('R2-perfection-paralysis');
    expect(result.actionHints.do_less.length).toBeGreaterThan(0);
  });

  test('命中：讨好/回避冲突导致边界缺失', () => {
    const diagnosis = baseDiagnosis({
      current_pattern: '不敢拒绝，避免冲突',
      top_strengths: [
        { name: '和谐', core_value: '维持关系', overuse_pattern: '回避冲突', blind_spot: '边界模糊' },
      ],
    });
    const result = applyRules(diagnosis);
    expect(result.matchedRules.map((r) => r.id)).toContain('R3-people-pleasing-boundary');
    expect(result.actionHints.boundary.length).toBeGreaterThan(0);
  });

  test('命中：责任感过载把一切扛在自己身上', () => {
    const diagnosis = baseDiagnosis({
      current_pattern: '责任都自己扛，接盘',
      top_strengths: [
        { name: '责任', core_value: '可靠', overuse_pattern: '过度承担', blind_spot: '超载' },
      ],
    });
    const result = applyRules(diagnosis);
    expect(result.matchedRules.map((r) => r.id)).toContain('R4-responsibility-overload');
    expect(result.actionHints.do_more.length).toBeGreaterThan(0);
  });

  test('命中：过度共情导致耗竭', () => {
    const diagnosis = baseDiagnosis({
      current_pattern: '情绪被拖走导致耗竭',
      top_strengths: [
        { name: '体谅', core_value: '共情', overuse_pattern: '吸收情绪', blind_spot: '疲惫' },
      ],
    });
    const result = applyRules(diagnosis);
    expect(result.matchedRules.map((r) => r.id)).toContain('R5-empathy-burnout');
    expect(result.actionHints.boundary.length).toBeGreaterThan(0);
  });

  test('命中：目标很多切换频繁无法推进', () => {
    const diagnosis = baseDiagnosis({
      current_pattern: '目标太多且频繁切换',
      top_strengths: [
        { name: '统筹', core_value: '资源协调', overuse_pattern: '扩张过度', blind_spot: '推进断裂' },
      ],
    });
    const result = applyRules(diagnosis);
    expect(result.matchedRules.map((r) => r.id)).toContain('R6-goal-switching');
    expect(result.actionHints.do_less.length).toBeGreaterThan(0);
  });

  test('命中：想掌控结果导致焦虑失眠', () => {
    const diagnosis = baseDiagnosis({
      current_pattern: '必须掌控结果导致失眠',
      top_strengths: [
        { name: '统率', core_value: '掌控', overuse_pattern: '控制过度', blind_spot: '焦虑' },
      ],
    });
    const result = applyRules(diagnosis);
    expect(result.matchedRules.map((r) => r.id)).toContain('R7-control-anxiety');
    expect(result.actionHints.check_rule.length).toBeGreaterThan(0);
  });

  test('命中：外界评价驱动导致自我否定', () => {
    const diagnosis = baseDiagnosis({
      current_pattern: '在意别人怎么看导致自我否定',
      top_strengths: [
        { name: '追求', core_value: '被认可', overuse_pattern: '依赖评价', blind_spot: '自我否定' },
      ],
    });
    const result = applyRules(diagnosis);
    expect(result.matchedRules.map((r) => r.id)).toContain('R8-external-validation');
    expect(result.actionHints.do_more.length).toBeGreaterThan(0);
  });

  test('未命中时不输出提示块', () => {
    const diagnosis = baseDiagnosis({
      current_pattern: '状态稳定，按计划推进',
      top_strengths: [
        { name: '学习', core_value: '成长', overuse_pattern: '无', blind_spot: '无' },
      ],
    });
    const result = applyRules(diagnosis);
    expect(result.matchedRules.length).toBe(0);
    expect(result.promptBlock).toBe('');
  });

  test('未命中时不生成动作建议', () => {
    const diagnosis = baseDiagnosis({
      current_pattern: '保持节奏',
      top_strengths: [
        { name: '专注', core_value: '聚焦', overuse_pattern: '无', blind_spot: '无' },
      ],
    });
    const result = applyRules(diagnosis);
    expect(result.actionHints.do_more.length).toBe(0);
    expect(result.actionHints.do_less.length).toBe(0);
    expect(result.actionHints.boundary.length).toBe(0);
    expect(result.actionHints.check_rule.length).toBe(0);
  });
});
