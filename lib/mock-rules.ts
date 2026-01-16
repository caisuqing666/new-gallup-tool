/**
 * Mock 规则判断（纯函数，可测试）
 *
 * 从 JSON 文件加载规则定义，实现配置与代码分离
 * 内容人员可以修改 JSON 文件来调整规则，无需改动代码
 */

import { ALL_STRENGTHS, StrengthId } from './gallup-strengths';
import { ScenarioId } from './scenarios';
import conflictRulesData from './data/conflict-rules.json';

// ============================================================
// 从 JSON 加载运行时数据
// ============================================================

/** 领域冲突矩阵 */
export const DOMAIN_CONFLICTS: Record<string, string[]> = conflictRulesData.domainConflicts;

/** 特殊优势冲突对 */
const SPECIFIC_CONFLICTS: Array<{ strength1: string; strength2: string }> =
  conflictRulesData.specificConflicts;

/** 典型案例关键词配置 */
const DEMO_CASE_KEYWORDS = {
  'info-overload': {
    confusion: conflictRulesData.demoCases['info-overload'].confusionKeywords,
    strengths: conflictRulesData.demoCases['info-overload'].strengthKeywords,
  },
  'responsibility-overload': {
    confusion: conflictRulesData.demoCases['responsibility-overload'].confusionKeywords,
    strengths: conflictRulesData.demoCases['responsibility-overload'].strengthKeywords,
  },
} as const;

/** 地下室触发条件 */
const BASEMENT_TRIGGERS = conflictRulesData.basementTriggers;

// ============================================================
// 纯函数：检测优势冲突
// ============================================================

/**
 * 检测优势冲突（"打架"）- 纯函数，可测试
 */
export function detectStrengthConflicts(
  strengthDetails: ReadonlyArray<(typeof ALL_STRENGTHS)[number]>
): string[] {
  const conflicts: string[] = [];

  // 检测不同领域的优势冲突
  for (let i = 0; i < strengthDetails.length; i++) {
    for (let j = i + 1; j < strengthDetails.length; j++) {
      const domain1 = strengthDetails[i].domain;
      const domain2 = strengthDetails[j].domain;

      // 检查是否在冲突矩阵中
      if (
        DOMAIN_CONFLICTS[domain1]?.includes(domain2) ||
        DOMAIN_CONFLICTS[domain2]?.includes(domain1)
      ) {
        conflicts.push(
          `「${strengthDetails[i].name}」与「${strengthDetails[j].name}」`
        );
      }
    }
  }

  // 检测特殊优势冲突对
  for (const { strength1, strength2 } of SPECIFIC_CONFLICTS) {
    const hasStrength1 = strengthDetails.some(s => s.id === strength1);
    const hasStrength2 = strengthDetails.some(s => s.id === strength2);

    if (hasStrength1 && hasStrength2) {
      const s1 = strengthDetails.find(s => s.id === strength1)!;
      const s2 = strengthDetails.find(s => s.id === strength2)!;

      // 避免重复添加
      if (!conflicts.some(c => c.includes(s1.name) && c.includes(s2.name))) {
        conflicts.push(`「${s1.name}」与「${s2.name}」`);
      }
    }
  }

  return conflicts.slice(0, 2); // 最多返回2个冲突
}

// ============================================================
// 纯函数：检测地下室状态
// ============================================================

/**
 * 检测优势是否掉进"地下室"（被过度使用或误用）- 纯函数，可测试
 */
export function detectBasementStrength(
  scenario: ScenarioId | string,
  strengthDetails: ReadonlyArray<(typeof ALL_STRENGTHS)[number]>,
  confusion: string
): string | undefined {
  if (strengthDetails.length === 0) {
    return undefined;
  }

  const confusionLower = confusion.toLowerCase();
  const firstStrength = strengthDetails[0];

  // 从 JSON 获取触发条件
  const triggers = BASEMENT_TRIGGERS[scenario as keyof typeof BASEMENT_TRIGGERS];

  if (triggers) {
    // 检查关键词触发
    const hasKeyword = triggers.keywords?.some(kw =>
      confusionLower.includes(kw.toLowerCase())
    );

    // 检查领域触发
    const domainStrengths = triggers.domains?.length
      ? strengthDetails.filter(s => (triggers.domains as readonly string[]).includes(s.domain))
      : [];

    if (hasKeyword && domainStrengths.length > 0) {
      return domainStrengths[0].name;
    }

    // 如果没有匹配的困惑关键词，但有领域匹配，也返回第一个匹配的优势
    if (domainStrengths.length > 0) {
      return domainStrengths[0].name;
    }
  }

  // 默认：第一个优势可能被过度使用
  return firstStrength.name;
}

// ============================================================
// 纯函数：检测典型案例
// ============================================================

type DemoCaseType = 'info-overload' | 'responsibility-overload' | null;

/**
 * 检测是否为典型案例 - 纯函数，可测试
 */
export function isDemoCase(
  confusion: string,
  strengths: string[]
): DemoCaseType {
  const confusionLower = confusion.toLowerCase();
  const strengthIds = strengths.map(s => s.toLowerCase());

  // 检测"信息黑洞"典型案例
  const infoOverload = DEMO_CASE_KEYWORDS['info-overload'];
  const hasInfoConfusion = infoOverload.confusion.some(keyword =>
    confusionLower.includes(keyword)
  );
  const hasInfoStrength = infoOverload.strengths.some(strength =>
    strengthIds.includes(strength.toLowerCase())
  );

  if (hasInfoConfusion && hasInfoStrength) {
    return 'info-overload';
  }

  // 检测"责任过载"典型案例
  const responsibilityOverload = DEMO_CASE_KEYWORDS['responsibility-overload'];
  const hasRespConfusion = responsibilityOverload.confusion.some(keyword =>
    confusionLower.includes(keyword)
  );
  const hasRespStrength = responsibilityOverload.strengths.some(strength =>
    strengthIds.includes(strength.toLowerCase())
  );

  if (hasRespConfusion && hasRespStrength) {
    return 'responsibility-overload';
  }

  return null;
}

// ============================================================
// 纯函数：优势详情
// ============================================================

/**
 * 根据优势 ID 获取优势详情 - 纯函数，可测试
 */
export function getStrengthDetails(
  strengthIds: (StrengthId | string)[]
): ReadonlyArray<(typeof ALL_STRENGTHS)[number]> {
  return strengthIds
    .slice(0, 5)
    .map(id => ALL_STRENGTHS.find(s => s.id === id) || ALL_STRENGTHS.find(s => s.name === id))
    .filter((s): s is typeof ALL_STRENGTHS[number] => s !== undefined);
}

/**
 * 获取优势名称列表 - 纯函数，可测试
 */
export function getStrengthNames(
  strengthDetails: ReadonlyArray<(typeof ALL_STRENGTHS)[number]>
): string[] {
  return strengthDetails.map(s => s.name);
}

// ============================================================
// 纯函数：生成优势锦囊
// ============================================================

/**
 * 生成优势锦囊（旋钮调节式建议）- 纯函数，可测试
 */
export function generateAdvantageTips(
  scenario: ScenarioId | string,
  strengthDetails: ReadonlyArray<(typeof ALL_STRENGTHS)[number]>,
  strengthNames: string[],
  strengthBasement: string | undefined,
  _strengthConflicts: string[],
  _confusion: string
): {
  reduce?: Array<{ strength: string; percentage: number; reason: string }>;
  increase?: Array<{ strength: string; percentage: number; reason: string }>;
  instruction: string;
} {
  const reduce: Array<{ strength: string; percentage: number; reason: string }> = [];
  const increase: Array<{ strength: string; percentage: number; reason: string }> = [];

  // 工作决策场景
  if (scenario === 'work-decision') {
    const executingStrengths = strengthDetails.filter(s => s.domain === 'executing');
    if (executingStrengths.length > 0 && strengthBasement) {
      reduce.push({
        strength: strengthBasement,
        percentage: 50,
        reason: '你现在用力的方式，正在拖累你。需要调整使用方式',
      });
    }

    const strategicStrengths = strengthDetails.filter(s => s.domain === 'strategic');
    if (strategicStrengths.length > 0) {
      increase.push({
        strength: strategicStrengths[0].name,
        percentage: 80,
        reason: '需要战略思维来重新定义优先级',
      });
    } else if (strengthDetails.length > 1) {
      increase.push({
        strength: strengthNames[1] || '战略',
        percentage: 75,
        reason: '需要战略优势来分析优先级',
      });
    }
  } else if (scenario === 'efficiency') {
    // 效率场景
    if (strengthBasement) {
      reduce.push({
        strength: strengthBasement,
        percentage: 60,
        reason: '被过度使用导致效率低下',
      });
    }

    const focusStrengths = strengthDetails.filter(s => s.id === 'focus');
    if (focusStrengths.length > 0) {
      increase.push({
        strength: '专注',
        percentage: 90,
        reason: '专注优势能帮你聚焦核心任务',
      });
    } else if (strengthDetails.length > 1) {
      increase.push({
        strength: strengthNames[1] || '专注',
        percentage: 85,
        reason: '需要聚焦核心任务',
      });
    }
  } else if (scenario === 'communication') {
    // 沟通场景
    if (strengthBasement && strengthBasement !== '沟通') {
      reduce.push({
        strength: strengthBasement,
        percentage: 40,
        reason: '在沟通中被误用',
      });
    }

    const analyticalStrengths = strengthDetails.filter(s => s.domain === 'strategic');
    if (analyticalStrengths.length > 0) {
      increase.push({
        strength: analyticalStrengths[0].name,
        percentage: 80,
        reason: '用分析优势在沟通前写好逻辑大纲',
      });
    } else if (strengthDetails.length > 2) {
      increase.push({
        strength: strengthNames[2] || '分析',
        percentage: 70,
        reason: '用现有优势重新定义沟通方式',
      });
    }
  } else if (scenario === 'career-transition') {
    // 职业转换场景
    if (strengthDetails.length > 0) {
      reduce.push({
        strength: strengthNames[0],
        percentage: 30,
        reason: '需要为战略思维让出空间',
      });
    }

    const strategicStrengths = strengthDetails.filter(s => s.domain === 'strategic');
    if (strategicStrengths.length > 0) {
      increase.push({
        strength: strategicStrengths[0].name,
        percentage: 90,
        reason: '需要战略思维分析赛道选择',
      });
    } else if (strengthDetails.length > 1) {
      increase.push({
        strength: strengthNames[1] || '战略',
        percentage: 85,
        reason: '用战略优势分析哪个赛道能让现有优势发挥最大价值',
      });
    }
  }

  // 默认处理
  if (reduce.length === 0 && increase.length === 0) {
    if (strengthBasement && strengthDetails.length > 1) {
      reduce.push({
        strength: strengthBasement,
        percentage: 50,
        reason: '你现在用力的方式，正在拖累你。需要调整使用方式',
      });
      increase.push({
        strength: strengthNames[1] || '战略',
        percentage: 80,
        reason: '需要这个优势来重新定义问题',
      });
    } else if (strengthDetails.length >= 2) {
      reduce.push({
        strength: strengthNames[0],
        percentage: 40,
        reason: '被过度使用',
      });
      increase.push({
        strength: strengthNames[1],
        percentage: 70,
        reason: '需要发挥更大作用',
      });
    }
  }

  // 生成调节指令
  const reduceText = reduce
    .map(r => `把你的「${r.strength}」优势关掉 ${r.percentage}%`)
    .join('，');
  const increaseText = increase
    .map(i => `把「${i.strength}」优势调高 ${i.percentage}%`)
    .join('，');

  let instruction = '';
  if (reduce.length > 0 && increase.length > 0) {
    instruction = `${reduceText}，${increaseText}。`;
  } else if (reduce.length > 0) {
    instruction = `${reduceText}。`;
  } else if (increase.length > 0) {
    instruction = `${increaseText}。`;
  }

  return {
    reduce: reduce.length > 0 ? reduce : undefined,
    increase: increase.length > 0 ? increase : undefined,
    instruction,
  };
}

// 导出版本信息
export const RULES_VERSION = conflictRulesData.version;
export const RULES_LAST_UPDATED = conflictRulesData.lastUpdated;
