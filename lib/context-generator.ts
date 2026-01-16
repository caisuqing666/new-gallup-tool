// 上下文生成器
// 基于 ConfusionProfile + StrengthProfile + ComboEffect 生成个性化内容
// 这是 mock-data 和 AI 生成的统一数据源

import { StrengthId } from './gallup-strengths';
import { ScenarioId } from './scenarios';
import { GallupResult, ExplainData, DecideData, PathDecision } from './types';
import { parseConfusion, ConfusionProfile, ProblemType as ConfusionProblemType } from './confusion-parser';
import { getStrengthProfiles, StrengthProfile } from './strength-profiles';
import { getComboEffect, ComboEffect } from './combo-rules';
import { buildContextPack, ContextPack } from './prompts';

// ============ 类型定义 ============

/**
 * 完整的分析上下文
 */
export interface AnalysisContext {
  // 原始输入
  scenario: ScenarioId | string;
  strengthIds: StrengthId[];
  confusion: string;
  
  // 解析结果
  confusionProfile: ConfusionProfile;
  strengthProfiles: StrengthProfile[];
  comboEffect: ComboEffect;
  
  // 打包后的 Context Pack
  contextPack: ContextPack;
}

// ============ 核心分析函数 ============

/**
 * 构建完整的分析上下文
 */
export function buildAnalysisContext(
  scenario: ScenarioId | string,
  strengthIds: StrengthId[],
  confusion: string
): AnalysisContext {
  const confusionProfile = parseConfusion(confusion);
  const strengthProfiles = getStrengthProfiles(strengthIds);
  const comboEffect = getComboEffect(strengthIds);
  const contextPack = buildContextPack(strengthIds, confusion);
  
  return {
    scenario,
    strengthIds,
    confusion,
    confusionProfile,
    strengthProfiles,
    comboEffect,
    contextPack,
  };
}

// ============ 个性化内容生成 ============

/**
 * 基于上下文生成解释页内容
 */
export function generateExplainFromContext(ctx: AnalysisContext): ExplainData {
  const { confusionProfile, strengthProfiles, comboEffect } = ctx;
  
  // 1. 生成优势表现（基于 StrengthProfile 的 basement 和 cost）
  const strengthManifestations = strengthProfiles.slice(0, 3).map(profile => {
    // 根据问题类型选择描述角度
    const behavior = generateStrengthBehavior(profile, confusionProfile);
    return {
      strengthId: profile.name,
      behaviors: behavior,
    };
  });
  
  // 2. 生成优势互动（基于 ComboEffect）
  const strengthInteractions = generateInteractions(strengthProfiles, comboEffect, confusionProfile);
  
  // 3. 生成盲区（基于 ComboEffect.blindspots 和 traps）
  const blindspots = generateBlindspots(comboEffect, confusionProfile);
  
  // 4. 生成总结
  const summary = generateSummary(strengthProfiles, confusionProfile);
  
  return {
    strengthManifestations,
    strengthInteractions,
    blindspots,
    summary,
  };
}

/**
 * 基于上下文生成判定页内容
 */
export function generateDecideFromContext(ctx: AnalysisContext): DecideData {
  const { confusionProfile, strengthProfiles, comboEffect } = ctx;

  // 1. 生成路径判定
  const pathDecision = generatePathDecision(confusionProfile);

  // 2. 生成复述式理解句
  const reframedInsight = generateReframedInsight(confusionProfile);

  // 3. 生成路径逻辑推导（放在页面最上方）
  const pathLogic = generatePathLogic(strengthProfiles, confusionProfile, pathDecision);

  // 4. 生成判词（作为 pathReason 的补充说明）
  const pathReason = generateVerdict(strengthProfiles, confusionProfile);

  // 5. 生成"更应该做"（基于优势的 drive 和 bestUse）
  const doMore = generateDoMore(strengthProfiles, comboEffect, confusionProfile);

  // 6. 生成"更应该少做"（基于优势的 cost 和 basement）
  const doLess = generateDoLess(strengthProfiles, comboEffect, confusionProfile);

  // 7. 生成责任边界（基于 ComboEffect.topCorrection）
  const boundaries = generateBoundaries(comboEffect, confusionProfile);

  // 8. 生成判断规则
  const checkRule = generateCheckRule(strengthProfiles, confusionProfile);

  return {
    pathDecision,
    reframedInsight,
    problemFocus: confusionProfile.problemFocus || '要不要改变现状',
    pathLogic,
    pathReason,
    doMore,
    doLess,
    boundaries,
    checkRule,
  };
}

// ============ 内容生成辅助函数 ============

/**
 * 生成单个优势的行为描述
 */
function generateStrengthBehavior(profile: StrengthProfile, confusion: ConfusionProfile): string {
  const { problemType, problemFocus } = confusion;
  
  // 根据问题类型定制描述
  switch (problemType) {
    case ConfusionProblemType.BoundaryOverload:
      return `在面对「${problemFocus}」时，你的「${profile.drive}」驱动力让你难以拒绝。${profile.basement}——这正在消耗你。`;
      
    case ConfusionProblemType.DecisionParalysis:
      return `当你纠结于「${problemFocus}」时，你会${profile.basement.replace(/；/g, '。')}结果迟迟无法行动。`;
      
    case ConfusionProblemType.PriorityFocus:
      return `在「${problemFocus}」的压力下，你的「${profile.drive}」让你试图同时抓住所有。${profile.cost}——这让你更加分散。`;
      
    case ConfusionProblemType.Direction:
      return `当你思考「${problemFocus}」时，「${profile.drive}」让你${profile.basement}这让你更加迷茫。`;
      
    case ConfusionProblemType.RelationshipExit:
      return `在「${problemFocus}」的处境中，你的「${profile.drive}」让你${profile.basement}`;
      
    case ConfusionProblemType.RoleMisalignment:
      return `因为「${profile.drive}」，你在「${problemFocus}」时${profile.basement}`;
      
    default:
      return `你的「${profile.name}」优势在当前处境下：${profile.basement}`;
  }
}

/**
 * 生成优势互动描述
 */
function generateInteractions(
  profiles: StrengthProfile[],
  combo: ComboEffect,
  confusion: ConfusionProfile
): string {
  const names = profiles.map(p => p.name);
  const { problemFocus } = confusion;
  
  // 优先使用组合陷阱
  if (combo.traps.length > 0) {
    const trap = combo.traps[0];
    return `当你面对「${problemFocus}」时，你的「${names.slice(0, 2).join('」与「')}」组合触发了「${trap.name}」：${trap.symptom || ''}你陷入了这个循环，越用力越消耗。`;
  }

  // 其次使用组合冲突
  if (combo.conflicts.length > 0) {
    const conflict = combo.conflicts[0];
    return `在「${problemFocus}」时，你的「${names[0]}」和「${names[1] || names[0]}」产生了内在冲突：${conflict.description || conflict.name}你被撕裂在两种力量之间。`;
  }

  // 使用组合盲区
  if (combo.blindspots.length > 0) {
    const blindspot = combo.blindspots[0];
    return `这组优势在「${problemFocus}」时产生了盲区：${blindspot.symptom || blindspot.name}你可能没有意识到这一点。`;
  }
  
  // 默认描述
  return `当你的「${names[0]}」遇到「${names[1] || '其他优势'}」，它们在「${problemFocus}」时相互拉扯。一个想「${profiles[0]?.drive || '前进'}」，另一个想「${profiles[1]?.drive || '停下'}」，结果你在原地消耗。`;
}

/**
 * 生成盲区描述
 */
function generateBlindspots(combo: ComboEffect, confusion: ConfusionProfile): string {
  const { problemFocus } = confusion;

  if (combo.traps.length > 0) {
    const trap = combo.traps[0];
    return `你这组优势在「${problemFocus}」时会让你误以为「再用点力就能解决」，但其实你已经掉进了「${trap.name}」。问题不是你不够努力，而是用力的方式错了。`;
  }

  if (combo.blindspots.length > 0) {
    const blindspot = combo.blindspots[0];
    return `你这组优势的盲区是「${blindspot.name}」。在面对「${problemFocus}」时，${blindspot.symptom || '你可能看不到问题的真正所在'}。`;
  }

  return `你这组优势会让你误以为「${problemFocus}」需要更多准备或更多坚持，但其实问题可能出在使用优势的方式上。`;
}

/**
 * 生成总结
 */
function generateSummary(profiles: StrengthProfile[], _confusion: ConfusionProfile): string {
  const firstProfile = profiles[0];
  const secondProfile = profiles[1];
  
  if (!firstProfile) {
    return '你的核心模式：用准备代替选择。';
  }
  
  // 从 drive 中提取关键词
  const drive1 = firstProfile.drive.split('，')[0];
  const drive2 = secondProfile?.drive.split('，')[0] || '选择';
  
  return `你这组优势的核心模式：用「${drive1}」代替「${drive2}」。`;
}

/**
 * 生成判词
 */
function generateVerdict(profiles: StrengthProfile[], confusion: ConfusionProfile): string {
  const { problemType } = confusion;
  const firstProfile = profiles[0];
  const secondProfile = profiles[1];
  
  if (!firstProfile || !secondProfile) {
    return '现在应该停止准备，开始选择。';
  }
  
  // 基于问题类型生成判词
  switch (problemType) {
    case ConfusionProblemType.BoundaryOverload:
      return `现在应该用「${secondProfile.name}」的「${secondProfile.drive.split('，')[0]}」替代「${firstProfile.name}」的「${firstProfile.cost.split('，')[0]}」，用边界替代承担。`;
      
    case ConfusionProblemType.DecisionParalysis:
      return `现在应该用「${secondProfile.name}」做出选择，停止用「${firstProfile.name}」继续准备。`;
      
    case ConfusionProblemType.PriorityFocus:
      return `现在应该用「${secondProfile.name}」收敛焦点，停止用「${firstProfile.name}」分散能量。`;
      
    case ConfusionProblemType.Direction:
      return `现在应该用「${secondProfile.name}」选定一个方向先走，停止用「${firstProfile.name}」继续探索。`;
      
    default:
      return `现在应该用「${secondProfile.name}」替代「${firstProfile.name}」，用选择替代准备。`;
  }
}

/**
 * 生成路径判定（枚举值）
 */
function generatePathDecision(confusion: ConfusionProfile): PathDecision {
  const { problemType } = confusion;

  // 基于问题类型生成路径判定
  switch (problemType) {
    case ConfusionProblemType.BoundaryOverload:
      return PathDecision.REFRAME;  // 需要结构性调整

    case ConfusionProblemType.DecisionParalysis:
      return PathDecision.NARROW;   // 需要阶段性收敛

    case ConfusionProblemType.PriorityFocus:
      return PathDecision.NARROW;   // 需要阶段性收敛

    case ConfusionProblemType.Direction:
      return PathDecision.NARROW;   // 需要阶段性收敛

    default:
      return PathDecision.NARROW;
  }
}

/**
 * 生成路径逻辑推导
 * 必须按照格式："基于你的 ×× 优势组合，在 ×× 情境下，继续使用原有模式会导致 ×× 能量损耗，所以此刻最优路径是 ××，并且在满足 ×× 条件时，可以直接行动。"
 */
function generatePathLogic(
  profiles: StrengthProfile[],
  confusion: ConfusionProfile,
  pathDecision: PathDecision
): string {
  const { problemType } = confusion;
  const firstProfile = profiles[0];
  const secondProfile = profiles[1];
  const firstStrength = firstProfile?.name || '责任';
  const secondStrength = secondProfile?.name || '战略';

  // 路径判定名称映射
  const pathDecisionNames: Record<PathDecision, string> = {
    [PathDecision.DOUBLE_DOWN]: '继续投入（DoubleDown）',
    [PathDecision.REFRAME]: '结构性调整（Reframe）',
    [PathDecision.NARROW]: '阶段性收敛（Narrow）',
    [PathDecision.EXIT]: '退出/放弃（Exit）',
  };

  // 基于问题类型生成 pathLogic
  switch (problemType) {
    case ConfusionProblemType.BoundaryOverload:
      return `基于你的「${firstStrength}×${secondStrength}」优势组合，在「边界与责任过载」的情境下，继续使用原有模式会导致「用"${firstStrength}"过度承担所有责任，掉入该优势的代价区，长期被榨干能量」的能量损耗，所以此刻最优路径是「${pathDecisionNames[pathDecision]}」，并且在满足「用"${secondStrength}"重新定义角色和边界，在保持投入的同时改变使用优势的方式」条件时，可以直接行动。`;

    case ConfusionProblemType.DecisionParalysis:
      return `基于你的「${firstStrength}×${secondStrength}」优势组合，在「信息过载与决策瘫痪」的情境下，继续使用原有模式会导致「优势在多个方向上同时激活，能量被分散消耗，每件事都推进不彻底」的能量损耗，所以此刻最优路径是「${pathDecisionNames[pathDecision]}」，并且在满足「选定一件事并推进到底，其他的明确说'不'」条件时，可以直接行动。`;

    case ConfusionProblemType.PriorityFocus:
      return `基于你的「${firstStrength}×${secondStrength}」优势组合，在「效率瓶颈与优先级混乱」的情境下，继续使用原有模式会导致「优势过度发散，能量被分散消耗，每件事都推进不彻底」的能量损耗，所以此刻最优路径是「${pathDecisionNames[pathDecision]}」，并且在满足「用"${secondStrength}"优势选定一件事并推进到底，其他的明确放弃」条件时，可以直接行动。`;

    case ConfusionProblemType.Direction:
      return `基于你的「${firstStrength}×${secondStrength}」优势组合，在「方向不确定性」的情境下，继续使用原有模式会导致「用"${firstStrength}"继续探索和准备，而"${secondStrength}"无法启动」的能量损耗，所以此刻最优路径是「${pathDecisionNames[pathDecision]}」，并且在满足「用"${secondStrength}"选定一个方向先走，停止用"${firstStrength}"继续探索」条件时，可以直接行动。`;

    default:
      return `基于你的「${firstStrength}×${secondStrength}」优势组合，在当前情境下，继续使用原有模式会导致「优势过度发散，能量被分散消耗」的能量损耗，所以此刻最优路径是「${pathDecisionNames[pathDecision]}」，并且在满足「用"${secondStrength}"优势选定一件事并推进到底」条件时，可以直接行动。`;
  }
}

/**
 * 生成"更应该做"
 */
function generateDoMore(
  profiles: StrengthProfile[],
  combo: ComboEffect,
  confusion: ConfusionProfile
): Array<{ action: string; timing: string; criteria: string; consequence: string }> {
  const { problemFocus, keyPhrases } = confusion;
  const actions: Array<{ action: string; timing: string; criteria: string; consequence: string }> = [];
  
  // 基于每个优势的 reframe 生成建议
  profiles.slice(0, 3).forEach((profile, index) => {
    const timing = index === 0 ? '今天下班前' : index === 1 ? '明天上午' : '本周内';
    
    // 引用用户困惑中的关键词
    const focusRef = keyPhrases.length > 0 ? `「${keyPhrases[0]}」` : `「${problemFocus.slice(0, 10)}」`;
    
    actions.push({
      action: `用「${profile.name}」优势的正向能力（${profile.drive.split('，')[0]}）来处理${focusRef}`,
      timing,
      criteria: profile.reframe,
      consequence: `否则，你会继续${profile.basement.split('；')[0]}，能量持续消耗。`,
    });
  });
  
  // 如果有纠偏建议，添加到第一条
  if (combo.corrections && combo.corrections.length > 0) {
    const topCorrection = combo.corrections[0];
    actions[0] = {
      action: topCorrection.action,
      timing: '立即',
      criteria: topCorrection.boundary,
      consequence: `否则，${topCorrection.insight.replace('你的', '你会继续')}`,
    };
  }
  
  return actions.slice(0, 3);
}

/**
 * 生成"更应该少做"
 */
function generateDoLess(
  profiles: StrengthProfile[],
  combo: ComboEffect,
  _confusion: ConfusionProfile
): Array<{ action: string; replacement: string; timing: string }> {
  const actions: Array<{ action: string; replacement: string; timing: string }> = [];
  
  // 基于每个优势的 cost/basement 生成"少做"
  profiles.slice(0, 3).forEach((profile, index) => {
    const timing = index === 0 ? '从下一个任务开始' : index === 1 ? '立即' : '从今天开始';
    
    actions.push({
      action: `不再${profile.cost}`,
      replacement: profile.reframe,
      timing,
    });
  });
  
  // 如果有组合陷阱，替换第一条
  if (combo.traps.length > 0) {
    const trap = combo.traps[0];
    const topCorrection = combo.corrections?.[0];

    actions[0] = {
      action: `不再陷入「${trap.name}」——${trap.symptom || ''}`,
      replacement: topCorrection?.action || profiles[1]?.reframe || '用另一种方式使用优势',
      timing: '立即',
    };
  }
  
  return actions.slice(0, 3);
}

/**
 * 生成责任边界
 */
function generateBoundaries(
  combo: ComboEffect,
  _confusion: ConfusionProfile
): Array<{ responsibleFor: string; notResponsibleFor: string }> {
  const boundaries: Array<{ responsibleFor: string; notResponsibleFor: string }> = [];
  
  // 基于纠偏建议生成边界
  if (combo.corrections && combo.corrections.length > 0) {
    const topCorrection = combo.corrections[0];
    boundaries.push({
      responsibleFor: topCorrection.boundary.replace('负责', '').replace('，不负责', ''),
      notResponsibleFor: topCorrection.boundary.split('不负责')[1] || '所有人的期待',
    });
  }
  
  // 基于问题类型添加默认边界
  boundaries.push({
    responsibleFor: '做出当前最优决策并推进',
    notResponsibleFor: '证明决策是"完美的"',
  });
  
  boundaries.push({
    responsibleFor: '用优势发挥最大价值',
    notResponsibleFor: '补齐所有短板',
  });
  
  return boundaries.slice(0, 3);
}

/**
 * 生成判断规则
 */
function generateCheckRule(profiles: StrengthProfile[], confusion: ConfusionProfile): string {
  const { problemFocus } = confusion;
  const firstProfile = profiles[0];
  
  if (!firstProfile) {
    return '判断标准：今天是否做出了一个决定并推进到底。';
  }
  
  return `判断标准：今天是否用「${firstProfile.name}」的正向能力（${firstProfile.drive.split('，')[0]}）推进了「${problemFocus.slice(0, 15)}」。`;
}

/**
 * 生成复述式理解句
 */
function generateReframedInsight(confusion: ConfusionProfile): string {
  const { problemType, problemFocus } = confusion;

  switch (problemType) {
    case ConfusionProblemType.DecisionParalysis:
      return '你并不是不想行动，而是一直在等一个“足够确定”的信号，结果每一次犹豫都把行动往后推。';
    case ConfusionProblemType.BoundaryOverload:
      return '你并不是不想拒绝，而是把“负责”当成唯一正确的回应，结果每一次答应都把边界往后退。';
    case ConfusionProblemType.PriorityFocus:
      return '你不是没能力，而是把所有事都当成必须同时推进的目标，结果精力被切碎。';
    case ConfusionProblemType.Direction:
      return '你不是没有方向，而是把“再多看一点”当成安全感，结果方向一直无法落地。';
    case ConfusionProblemType.RelationshipExit:
      return '你不是不想离开，而是害怕做出会让别人失望的选择，结果把自己困在消耗里。';
    case ConfusionProblemType.RoleMisalignment:
      return '你不是做不好，而是一直在替不该由你承担的角色兜底，结果真正该做的事没有开始。';
    default:
      return `你不是不想改变，而是把“再等等”当成稳妥，结果在「${problemFocus.slice(0, 10)}」上一直拖延。`;
  }
}

// ============ 统一入口 ============

/**
 * 基于上下文生成完整结果
 */
export function generateResultFromContext(ctx: AnalysisContext): GallupResult {
  return {
    explain: generateExplainFromContext(ctx),
    decide: generateDecideFromContext(ctx),
  };
}

/**
 * 一步生成（便捷函数）
 */
export function generatePersonalizedResult(
  scenario: ScenarioId | string,
  strengthIds: StrengthId[],
  confusion: string
): { result: GallupResult; context: AnalysisContext } {
  const context = buildAnalysisContext(scenario, strengthIds, confusion);
  const result = generateResultFromContext(context);
  return { result, context };
}
