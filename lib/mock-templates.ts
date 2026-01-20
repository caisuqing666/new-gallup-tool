/**
 * Mock 模板库 - 按优势组合特征分类
 * 
 * 目的：解决 Mock 数据过于模板化的问题
 * 方案：根据优势组合的特征，路由到不同的内容生成器
 *       + 场景感知：同一优势在不同场景下有不同表现
 *       + 更多模板：13+ 个模板族，覆盖所有常见优势组合
 */

import { ExplainData, DecideData, PathDecision } from './types';
import { StrengthId } from './gallup-strengths';
import { ScenarioId } from './scenarios';

// ============================================================
// 优势组合特征识别
// ============================================================

export interface ComboFeature {
  domains: Set<string>;
  isMultiDomain: boolean;
  hasDomainConflict: boolean;
  executionRatio: number;
  relationshipRatio: number;
  strategicRatio: number;
  influenceRatio: number;
  isResponsibilityProne: boolean;
  isBoundaryProne: boolean;
  isOverthinkingProne: boolean;
  isDispersedProne: boolean;
}

export function analyzeComboFeatures(
  strengths: StrengthId[],
  profiles: Array<{ id: StrengthId; domain: string }>
): ComboFeature {
  const domains = new Set(profiles.map(p => p.domain));
  const total = profiles.length;
  
  const executionCount = profiles.filter(p => p.domain === 'executing').length;
  const relationshipCount = profiles.filter(p => p.domain === 'relating').length;
  const strategicCount = profiles.filter(p => p.domain === 'strategic-thinking').length;
  const influenceCount = profiles.filter(p => p.domain === 'influencing').length;
  
  const hasDomainConflict = 
    (domains.has('executing') && domains.has('relating')) ||
    (domains.has('strategic-thinking') && domains.has('executing'));
  
  return {
    domains,
    isMultiDomain: domains.size > 2,
    hasDomainConflict,
    executionRatio: executionCount / total,
    relationshipRatio: relationshipCount / total,
    strategicRatio: strategicCount / total,
    influenceRatio: influenceCount / total,
    isResponsibilityProne: strengths.some(s => ['responsibility', 'harmony', 'relator'].includes(s)),
    isBoundaryProne: strengths.some(s => ['harmony', 'empathy', 'developer'].includes(s)),
    isOverthinkingProne: strengths.some(s => ['analytical', 'strategic', 'learner', 'collection'].includes(s)),
    isDispersedProne: total > 3 && (strategicCount > 0 || influenceCount > 0),
  };
}

// ============================================================
// 场景感知系统
// ============================================================

export type ScenarioContext = 'work' | 'relationship' | 'decision' | 'transition' | 'efficiency' | 'communication';

const SCENARIO_MAPPING: Record<ScenarioId | string, ScenarioContext> = {
  'work-decision': 'work',
  'career-transition': 'transition',
  'relationship-conflict': 'relationship',
  'priority-management': 'efficiency',
  'communication-challenge': 'communication',
  'decision-paralysis': 'decision',
};

function getScenarioContext(scenario: ScenarioId | string): ScenarioContext {
  return SCENARIO_MAPPING[scenario] || 'work';
}

// ============================================================
// 模板库定义
// ============================================================

export const EXECUTION_DOMINANT_TEMPLATES = {
  explain: {
    strengthInteractionsPattern: (names: string[]) => 
      `当你的「${names[0]}」遇到「${names[1] || '其他执行力优势'}」，你会自动启动行动模式，几乎不给自己思考的空间。`,
    blindspotsPattern: (problemFocus: string) => 
      `你这组优势会让你误以为"立刻行动就能解决问题"，但其实在面对「${problemFocus}」时，真正的瓶颈可能不是行动力不足。`,
    summaryPattern: () => `你这组优势的核心模式：用行动代替思考。`,
  },
  decide: {
    pathDecisionLogic: (firstStrength: string, secondStrength: string) => 
      `基于你的「${firstStrength}×${secondStrength}」优势组合，你现在面临的是"行动太快导致频繁返工"的能量损耗。`,
  }
};

export const RELATIONSHIP_DOMINANT_TEMPLATES = {
  explain: {
    strengthInteractionsPattern: (names: string[]) => 
      `当你的「${names[0]}」遇到「${names[1] || '其他关系优势'}」，你会进入一个"了解-适应-妥协"的自动化流程。`,
    blindspotsPattern: (problemFocus: string) => 
      `在面对「${problemFocus}」时，你这组优势会让你误以为"充分理解对方就能找到双赢"。`,
    summaryPattern: () => `你这组优势的核心模式：用适应代替设立边界。`,
  },
  decide: {
    pathDecisionLogic: (firstStrength: string, secondStrength: string) => 
      `基于你的「${firstStrength}×${secondStrength}」优势组合，你现在面临的是"为了保持和谐而无限妥协"的能量损耗。`,
  }
};

export const STRATEGIC_DOMINANT_TEMPLATES = {
  explain: {
    strengthInteractionsPattern: (names: string[]) => 
      `当你的「${names[0]}」遇到「${names[1] || '其他战略优势'}」，你会进入一个"收集-分析-再收集"的循环。`,
    blindspotsPattern: (problemFocus: string) => 
      `你这组优势在面对「${problemFocus}」时会让你误以为"再多思考一会儿就能找到最优方案"。`,
    summaryPattern: () => `你这组优势的核心模式：用思考代替决策。`,
  },
  decide: {
    pathDecisionLogic: (firstStrength: string, secondStrength: string) => 
      `基于你的「${firstStrength}×${secondStrength}」优势组合，你面临的是"优势过度发散导致无法决策"的能量损耗。`,
  }
};

export const INFLUENCE_DOMINANT_TEMPLATES = {
  explain: {
    strengthInteractionsPattern: (names: string[]) => 
      `当你的「${names[0]}」遇到「${names[1] || '其他影响力优势'}」，你会自动切换到"影响和说服"模式。`,
    blindspotsPattern: (problemFocus: string) => 
      `你这组优势在面对「${problemFocus}」时会让你误以为"成功就在眼前，再推一把就能赢"。`,
    summaryPattern: () => `你这组优势的核心模式：用说服代替了思考。`,
  },
  decide: {
    pathDecisionLogic: (firstStrength: string, secondStrength: string) => 
      `基于你的「${firstStrength}×${secondStrength}」优势组合，你面临的是"优势过度激活导致后劲不足"的能量损耗。`,
  }
};

export const EXECUTION_RELATIONSHIP_HYBRID_TEMPLATES = {
  explain: {
    strengthInteractionsPattern: (names: string[]) => 
      `当你的「${names[0]}」遇到「${names[1]}」，你既能快速行动，又能照顾他人感受。`,
    blindspotsPattern: (problemFocus: string) => 
      `你这组优势在面对「${problemFocus}」时会让你误以为"我能同时满足效率和关系"。`,
    summaryPattern: () => `你这组优势的核心模式：被效率和感受之间的平衡困住了。`,
  },
  decide: {
    pathDecisionLogic: (firstStrength: string, secondStrength: string) => 
      `基于你的「${firstStrength}×${secondStrength}」优势组合，你现在面临的是"为了平衡而低效"的能量损耗。`,
  }
};

export const STRATEGIC_EXECUTION_HYBRID_TEMPLATES = {
  explain: {
    strengthInteractionsPattern: (names: string[]) => 
      `当你的「${names[0]}」遇到「${names[1]}」，你具备了完整的决策闭环：先思考，后行动。`,
    blindspotsPattern: (problemFocus: string) => 
      `在面对「${problemFocus}」时，你这组优势会让你误以为"最优方案来自充分思考加立刻行动"。`,
    summaryPattern: () => `你这组优势的核心模式：思考和行动的节奏不匹配。`,
  },
  decide: {
    pathDecisionLogic: (firstStrength: string, secondStrength: string) => 
      `基于你的「${firstStrength}×${secondStrength}」优势组合，你面临的是"为了完美而延迟"的能量损耗。`,
  }
};

export const RELATIONSHIP_STRATEGIC_HYBRID_TEMPLATES = {
  explain: {
    strengthInteractionsPattern: (names: string[]) => 
      `当你的「${names[0]}」遇到「${names[1]}」，你既有强大的共情能力，也有敏锐的战略眼光。`,
    blindspotsPattern: (problemFocus: string) => 
      `在面对「${problemFocus}」时，你这组优势会让你陷入过度分析。`,
    summaryPattern: () => `你这组优势的核心模式：用分析代替了单纯的陪伴。`,
  },
  decide: {
    pathDecisionLogic: (firstStrength: string, secondStrength: string) => 
      `基于你的「${firstStrength}×${secondStrength}」优势组合，你面临的是"过度理解导致无法行动"的能量损耗。`,
  }
};

export const HIGH_RESPONSIBILITY_TEMPLATES = {
  explain: {
    strengthInteractionsPattern: (names: string[]) => 
      `当「${names[0]}」与「${names[1]}」与纪律结合，你变成了一个"可靠的机器"。`,
    blindspotsPattern: (problemFocus: string) => 
      `在面对「${problemFocus}」时，你这组优势会让你看不到：你的资源是有限的，而需要是无限的。`,
    summaryPattern: () => `你这组优势的核心模式：用过度承诺代替了有序的优先级。`,
  },
  decide: {
    pathDecisionLogic: (firstStrength: string, secondStrength: string) => 
      `基于你的「${firstStrength}×${secondStrength}×纪律」优势组合，你面临的是"承诺饱和导致质量下降"的能量损耗。`,
  }
};

export const PERFECTIONIST_TEMPLATES = {
  explain: {
    strengthInteractionsPattern: (names: string[]) => 
      `当「${names[0]}」与分析与责任结合，你就成了一个"标准执行官"。`,
    blindspotsPattern: (problemFocus: string) => 
      `在面对「${problemFocus}」时，你这组优势会让你看不到："好"和"完美"之间的区别。`,
    summaryPattern: () => `你这组优势的核心模式：用完美代替了"足够好"。`,
  },
  decide: {
    pathDecisionLogic: (firstStrength: string, secondStrength: string) => 
      `基于你的"完美×分析×责任"优势组合，你面临的是"追求完美而无法完成"的能量损耗。`,
  }
};

export const POPULARITY_TEMPLATES = {
  explain: {
    strengthInteractionsPattern: (names: string[]) => 
      `当"包容"与"交往"与"沟通"结合，你就成了一个"人情枢纽"。`,
    blindspotsPattern: (problemFocus: string) => 
      `在面对「${problemFocus}」时，你这组优势会让你陷入"无选择性的陪伴"。`,
    summaryPattern: () => `你这组优势的核心模式：用广泛的陪伴代替了深度的亲密。`,
  },
  decide: {
    pathDecisionLogic: (firstStrength: string, secondStrength: string) => 
      `基于你的"包容×交往×沟通"优势组合，你面临的是"能量分散导致无法深入"的能量损耗。`,
  }
};

export const BALANCED_MULTIDOMAIN_TEMPLATES = {
  explain: {
    strengthInteractionsPattern: (names: string[]) => 
      `你的这组优势来自不同领域，它们赋予你罕见的适应性——你既能快速执行，也能深度思考。`,
    blindspotsPattern: (problemFocus: string) => 
      `你的优势多样性让你误以为"我可以同时在多个方向发展"，但这导致每个方向都推进不彻底。`,
    summaryPattern: () => `你这组优势的核心模式：用多面手的灵活代替了某个方向的深度。`,
  },
  decide: {
    pathDecisionLogic: (firstStrength: string, secondStrength: string) => 
      `基于你的「${firstStrength}×${secondStrength}×...」多元优势组合，你面临的核心问题不是"我有什么优势"，而是"我要在哪个方向集中"。`,
  }
};

export const CONFLICTED_COMBO_TEMPLATES = {
  explain: {
    strengthInteractionsPattern: (names: string[]) => 
      `当你的「${names[0]}」遇到「${names[1]}」，这两个优势会互相拉扯。一个想"立刻行动"，另一个想"先想清楚"。`,
    blindspotsPattern: (problemFocus: string) => 
      `你会误以为这两个优势是"对立的"，需要选择其一。但实际上，真正的出路是学会让它们"顺序激活"。`,
    summaryPattern: () => `你这组优势的核心模式：优势之间互相拉扯，导致能量内耗。`,
  },
  decide: {
    pathDecisionLogic: (firstStrength: string, secondStrength: string) => 
      `基于你的「${firstStrength}×${secondStrength}」优势组合，这两个优势在表面上是冲突的，问题不是优势本身，而是使用方式。`,
  }
};

export const DOMINANT_SHADOW_TEMPLATES = {
  explain: {
    strengthInteractionsPattern: (names: string[] | string, shadowNames?: string[]) => {
      const dominantName = Array.isArray(names) ? names[0] : names;
      const shadows = shadowNames || (Array.isArray(names) ? names.slice(1) : []);
      return `你的「${dominantName}」优势非常突出，它吸引了大部分注意力和能量。${shadows.length > 0 ? `你的其他优势（${shadows.join('、')}）却常常被这个强势优势的光芒所遮蔽。` : '你的其他优势也在，但常常被遮蔽。'}`;
    },
    blindspotsPattern: (problemFocus: string) => 
      `你在面对「${problemFocus}」时，会自动用你最强势的那个优势来回应，却忽视了这个问题可能需要你的其他优势。`,
    summaryPattern: (names: string[] | string) => {
      const dominantName = Array.isArray(names) ? names[0] : names;
      return `你这组优势的核心模式：被「${dominantName}」所定义，其他优势沉睡。`;
    },
  },
  decide: {
    pathDecisionLogic: (names: string[] | string, shadowNames?: string[]) => {
      const dominantName = Array.isArray(names) ? names[0] : names;
      const shadows = shadowNames || (Array.isArray(names) ? names.slice(1) : []);
      return `基于你的优势组合，「${dominantName}」非常突出，但这也意味着你可能在过度依赖它。你的「${shadows[0] || '其他优势'}」其实也很强，只是被掩盖了。`;
    },
  }
};

// ============================================================
// 模板选择路由
// ============================================================

export function selectTemplateFamily(
  strengths: StrengthId[],
  profiles: Array<{ id: StrengthId; domain: string }>,
  confusion: string,
  scenario?: ScenarioId | string
): keyof typeof TEMPLATE_FAMILIES {
  const features = analyzeComboFeatures(strengths, profiles);
  
  // 特殊组合检测（高优先级）
  const hasResponsibility = strengths.some(s => ['responsibility', 'achiever', 'discipline'].includes(s));
  const responsibilityCount = strengths.filter(s => ['responsibility', 'achiever', 'discipline', 'focus'].includes(s)).length;
  if (hasResponsibility && responsibilityCount >= 3) {
    return 'HIGH_RESPONSIBILITY';
  }
  
  const hasPerfectionism = strengths.some(s => ['perfectionism', 'developer'].includes(s));
  const hasAnalytical = strengths.some(s => ['analytical', 'strategic', 'learner'].includes(s));
  if (hasPerfectionism && hasAnalytical && hasResponsibility) {
    return 'PERFECTIONIST';
  }
  
  const hasPopularity = strengths.some(s => ['harmony', 'includer', 'communicator'].includes(s));
  const popularityCount = strengths.filter(s => ['harmony', 'includer', 'communicator', 'relator'].includes(s)).length;
  if (hasPopularity && popularityCount >= 3) {
    return 'POPULARITY';
  }
  
  // 混合型优势检测
  const hasExecution = features.executionRatio > 0.25;
  const hasRelationship = features.relationshipRatio > 0.25;
  const hasStrategic = features.strategicRatio > 0.25;
  
  if (hasExecution && hasRelationship && strengths.length <= 3) {
    return 'EXECUTION_RELATIONSHIP';
  }
  
  if (hasStrategic && hasExecution && !hasRelationship && strengths.length <= 3) {
    return 'STRATEGIC_EXECUTION';
  }
  
  if (hasRelationship && hasStrategic && !hasExecution && strengths.length <= 3) {
    return 'RELATIONSHIP_STRATEGIC';
  }
  
  // 冲突检测
  if (features.hasDomainConflict && strengths.length >= 2) {
    return 'CONFLICTED';
  }
  
  // 单一领域主导
  if (features.executionRatio > 0.5) {
    return 'EXECUTION';
  }
  
  if (features.relationshipRatio > 0.5) {
    return 'RELATIONSHIP';
  }
  
  if (features.strategicRatio > 0.5) {
    return 'STRATEGIC';
  }
  
  if (features.influenceRatio > 0.4) {
    return 'INFLUENCE';
  }
  
  // 均衡跨领域
  if (features.isMultiDomain && strengths.length >= 4) {
    return 'BALANCED';
  }
  
  // 主导-配角型
  const dominanceRatios = [
    features.executionRatio,
    features.relationshipRatio,
    features.strategicRatio,
    features.influenceRatio,
  ];
  const maxRatio = Math.max(...dominanceRatios);
  if (maxRatio > 0.4 && strengths.length >= 2) {
    return 'DOMINANT_SHADOW';
  }
  
  return 'BALANCED';
}

// ============================================================
// 场景感知的内容调整
// ============================================================

export function adaptContentForScenario(
  content: string,
  scenario: ScenarioId | string,
  templateFamily: keyof typeof TEMPLATE_FAMILIES
): string {
  const scenarioContext = getScenarioContext(scenario);
  
  const adjustments: Record<ScenarioContext, Record<string, string>> = {
    'work': {
      '陷入消耗': '在工作压力下陷入消耗',
      '能量被分散': '精力被多个项目分散',
      '无法专注': '无法在工作上集中注意力',
    },
    'relationship': {
      '陷入消耗': '在关系维护中陷入消耗',
      '能量被分散': '感情被多个人分散',
      '无法专注': '无法在最重要的人身上投入',
    },
    'decision': {
      '陷入消耗': '在决策过程中陷入消耗',
      '能量被分散': '注意力被多个选项分散',
      '无法专注': '无法锁定一个决策方向',
    },
    'transition': {
      '陷入消耗': '在转变过程中陷入消耗',
      '能量被分散': '资源被多个可能的方向分散',
      '无法专注': '无法在新方向上集中资源',
    },
    'efficiency': {
      '陷入消耗': '在效率追求中陷入消耗',
      '能量被分散': '时间被多个任务分散',
      '无法专注': '无法在核心任务上投入足够时间',
    },
    'communication': {
      '陷入消耗': '在沟通过程中陷入消耗',
      '能量被分散': '注意力被多个沟通对象分散',
      '无法专注': '无法深入理解某一个人的真实想法',
    },
  };
  
  let adjustedContent = content;
  const scenarioAdjustments = adjustments[scenarioContext];
  
  for (const [oldPhrase, newPhrase] of Object.entries(scenarioAdjustments)) {
    adjustedContent = adjustedContent.replace(
      new RegExp(oldPhrase, 'g'),
      newPhrase
    );
  }
  
  return adjustedContent;
}

// ============================================================
// 模板族导出
// ============================================================

export const TEMPLATE_FAMILIES = {
  'EXECUTION': EXECUTION_DOMINANT_TEMPLATES,
  'RELATIONSHIP': RELATIONSHIP_DOMINANT_TEMPLATES,
  'STRATEGIC': STRATEGIC_DOMINANT_TEMPLATES,
  'INFLUENCE': INFLUENCE_DOMINANT_TEMPLATES,
  'EXECUTION_RELATIONSHIP': EXECUTION_RELATIONSHIP_HYBRID_TEMPLATES,
  'STRATEGIC_EXECUTION': STRATEGIC_EXECUTION_HYBRID_TEMPLATES,
  'RELATIONSHIP_STRATEGIC': RELATIONSHIP_STRATEGIC_HYBRID_TEMPLATES,
  'HIGH_RESPONSIBILITY': HIGH_RESPONSIBILITY_TEMPLATES,
  'PERFECTIONIST': PERFECTIONIST_TEMPLATES,
  'POPULARITY': POPULARITY_TEMPLATES,
  'BALANCED': BALANCED_MULTIDOMAIN_TEMPLATES,
  'CONFLICTED': CONFLICTED_COMBO_TEMPLATES,
  'DOMINANT_SHADOW': DOMINANT_SHADOW_TEMPLATES,
} as const;

export type TemplateFamilyKey = keyof typeof TEMPLATE_FAMILIES;

export { getScenarioContext };

export function describeComboFeature(features: ComboFeature): string {
  return `
优势组合分析：
- 跨领域：${features.isMultiDomain ? '是' : '否'}
- 领域冲突：${features.hasDomainConflict ? '是' : '否'}
- 执行力占比：${(features.executionRatio * 100).toFixed(0)}%
- 关系占比：${(features.relationshipRatio * 100).toFixed(0)}%
- 战略占比：${(features.strategicRatio * 100).toFixed(0)}%
- 影响力占比：${(features.influenceRatio * 100).toFixed(0)}%
- 责任过载倾向：${features.isResponsibilityProne ? '高' : '低'}
- 边界混乱倾向：${features.isBoundaryProne ? '高' : '低'}
- 过度思考倾向：${features.isOverthinkingProne ? '高' : '低'}
- 能量分散倾向：${features.isDispersedProne ? '高' : '低'}
  `;
}
