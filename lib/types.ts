// 核心类型定义

// 导入类型以便在接口中使用
import type { ScenarioId } from './scenarios';
import type { StrengthId } from './gallup-strengths';

// 重新导出类型以便其他文件使用
export type { Strength, StrengthId } from './gallup-strengths';
export type { Scenario, ScenarioId } from './scenarios';

// ============================================================
// 路径类型（PathId）- 4个入口路径
// ============================================================

/**
 * 路径类型枚举
 *
 * 定义了用户进入工具的4种路径：
 * - report-interpret: 报告解读（OCR上传）
 * - career-match: 职业匹配
 * - breakthrough: 突破方案（现有功能）
 * - strength-guide: 优势发挥指南
 */
export type PathId =
  | 'report-interpret'   // 我不太懂这份报告
  | 'career-match'       // 我想找到适合的职业方向
  | 'breakthrough'       // 我遇到了具体问题
  | 'strength-guide';    // 我想更好地发挥自己

/** 路径的中文名称映射 */
export const PATH_LABELS: Record<PathId, string> = {
  'report-interpret': '报告解读',
  'career-match': '职业匹配',
  'breakthrough': '突破方案',
  'strength-guide': '优势指南',
};

/** 路径的描述映射 */
export const PATH_DESCRIPTIONS: Record<PathId, { title: string; subtitle: string; icon: string }> = {
  'report-interpret': {
    title: '我不太懂这份报告',
    subtitle: '上传报告，获得通俗易懂的解读',
    icon: '📄',
  },
  'career-match': {
    title: '我想找到适合的职业方向',
    subtitle: '输入TOP5，发现最匹配的职业',
    icon: '🎯',
  },
  'breakthrough': {
    title: '我遇到了具体问题',
    subtitle: '用优势视角突破当前困境',
    icon: '🚀',
  },
  'strength-guide': {
    title: '我想更好地发挥自己',
    subtitle: '获得个性化的优势发挥指南',
    icon: '✨',
  },
};

// 从 prompts.ts 导入新类型
export type { ExplainOutput, DecideOutput } from './prompts';
export type { DecidePhaseAOutput, DecidePhaseBOutput } from './prompts';

// ============================================================
// 问题类型枚举（ProblemType）
// ============================================================

/**
 * 问题类型枚举
 *
 * 每个问题类型对应一类独特的优势-问题互动模式
 * Explain/Decide 必须严格遵守：只解决当前问题类型
 *
 * 【系统级硬约束】
 * - 在生成 Explain/Decide 之前，必须确定 problemType
 * - problemType 必须显式注入到 system prompt 中
 * - 所有生成逻辑必须假设"当前只允许解决这一类问题"
 */
/* eslint-disable no-unused-vars */
export enum ProblemType {
  /** P1: 方向不确定性 - 在多个选项中无法确定方向 */
  DIRECTION_UNCERTAINTY = 'P1',

  /** P2: 边界与责任过载 - 承担过多责任，无法说"不" */
  BOUNDARY_OVERLOAD = 'P2',

  /** P3: 信息过载与决策瘫痪 - 信息过多导致无法行动 */
  INFORMATION_PARALYSIS = 'P3',

  /** P4: 效率瓶颈与优先级混乱 - 多事并行，无法聚焦 */
  EFFICIENCY_BOTTLENECK = 'P4',
}
/* eslint-enable no-unused-vars */

/** 问题类型的中文名称映射 */
export const PROBLEM_TYPE_LABELS: Record<ProblemType, string> = {
  [ProblemType.DIRECTION_UNCERTAINTY]: '方向不确定性',
  [ProblemType.BOUNDARY_OVERLOAD]: '边界与责任过载',
  [ProblemType.INFORMATION_PARALYSIS]: '信息过载与决策瘫痪',
  [ProblemType.EFFICIENCY_BOTTLENECK]: '效率瓶颈与优先级混乱',
};

/** 问题类型的描述（用于 AI 理解） */
export const PROBLEM_TYPE_DESCRIPTIONS: Record<ProblemType, string> = {
  [ProblemType.DIRECTION_UNCERTAINTY]: '用户面临多个方向/选项，无法确定应该选择哪一个，核心困扰是"不确定哪个方向是对的"',
  [ProblemType.BOUNDARY_OVERLOAD]: '用户承担了过多的责任和期望，无法对他人说"不"，核心困扰是"事情太多，每件都想负责，结果把自己压垮"',
  [ProblemType.INFORMATION_PARALYSIS]: '用户收集了大量信息但无法做出决策，核心困扰是"信息越多越不知道怎么办"',
  [ProblemType.EFFICIENCY_BOTTLENECK]: '用户同时处理太多事情，无法确定优先级，核心困扰是"每件事都重要，但哪件都推进不彻底"',
};

// ============================================================
// 问题焦点（ProblemFocus）
// ============================================================

/**
 * 问题焦点类型
 *
 * ProblemFocus 是在 ProblemType 之下的具体问题焦点
 * 它由 AI 通过分析用户输入自动提取，是一句话的精准问题描述
 *
 * 【系统级硬约束】
 * - Decide 的所有判定必须针对具体的 problemFocus
 * - 如果换了 problemFocus，Decide 的输出必须不成立
 *
 * @example
 * // ProblemType = P2 边界与责任过载
 * // 可能的 ProblemFocus 示例：
 * - "如何在多方需求之间确定优先级？"
 * - "如何对他人说'不'而不感到内疚？"
 * - "如何在承担责任的同时保护自己？"
 */
export type ProblemFocus = string;

/**
 * 验证 ProblemFocus 是否有效
 *
 * 有效的 ProblemFocus 应该：
 * 1. 是一个问句或包含"如何/怎么/是否"等疑问词
 * 2. 与当前的 ProblemType 匹配
 * 3. 具体且可操作（不是泛泛而谈）
 */
export function isValidProblemFocus(focus: string): boolean {
  if (!focus || typeof focus !== 'string') {
    return false;
  }

  const trimmed = focus.trim();

  // 必须是一个问句或包含疑问意图
  const hasQuestionMark = trimmed.includes('？') || trimmed.includes('?');
  const hasQuestionWord = /如何|怎么|怎样|是否|能不能|应该|要不要/i.test(trimmed);

  // 必须有实质内容（至少 10 个字）
  const hasMinLength = trimmed.length >= 10;

  return hasMinLength && (hasQuestionMark || hasQuestionWord);
}

// ============================================================
// 路径决策枚举（PathDecision）
// ============================================================

/**
 * 路径决策枚举
 *
 * Decide 的核心输出不是行动列表，而是路径判定
 * 基于用户的能量结构（strengths）+ 当前处境（problemType + problemFocus）
 * 判断哪条路径是能量最优解
 *
 * 【产品灵魂】
 * 不是告诉用户"你是怎样的人"
 * 而是告诉他"以你这样的能量结构，在这个处境下，哪条路值得你走"
 *
 * 【核心判断标准】
 * - 这条路是否省能量（而不是榨干能量）
 * - 优势在这条路上是否被正向使用
 * - 是否具备可持续推进性
 */
/* eslint-disable no-unused-vars */
export enum PathDecision {
  /** Path A：继续投入（Double Down）- 优势被正向使用，能量被放大，外部阻力 */
  DOUBLE_DOWN = 'DoubleDown',

  /** Path B：结构性调整（Reframe）- 事情没错，但使用方式在榨能量，需换角色/边界/使用方式 */
  REFRAME = 'Reframe',

  /** Path C：阶段性收敛（Narrow）- 优势过度发散，能量被分散消耗，需缩小战场 */
  NARROW = 'Narrow',

  /** Path D：退出/放弃（Exit）- 优势长期处于代价区，继续投入只会放大消耗 */
  EXIT = 'Exit',
}
/* eslint-enable no-unused-vars */

/** 路径决策的中文名称映射 */
export const PATH_DECISION_LABELS: Record<PathDecision, string> = {
  [PathDecision.DOUBLE_DOWN]: '继续投入',
  [PathDecision.REFRAME]: '结构性调整',
  [PathDecision.NARROW]: '阶段性收敛',
  [PathDecision.EXIT]: '退出/放弃',
};

/** 路径决策的能量状态描述 */
export const PATH_DECISION_ENERGY_STATES: Record<PathDecision, string> = {
  [PathDecision.DOUBLE_DOWN]: '省能量 - 优势被正向使用，能量被放大',
  [PathDecision.REFRAME]: '当前榨能量 - 使用方式错了，需调整',
  [PathDecision.NARROW]: '分散消耗 - 优势过度发散，需收敛',
  [PathDecision.EXIT]: '代价区 - 长期榨干，继续投入放大消耗',
};

// ============================================================
// 表单数据类型
// ============================================================

export interface FormData {
  scenario?: ScenarioId;
  strengths: StrengthId[];
  confusion: string;
}

// ============================================================
// 解释页数据类型
// ============================================================

export interface ExplainData {
  // 单优势的现实表现
  strengthManifestations: Array<{
    strengthId: string;
    behaviors: string;
  }>;
  // 优势组合的相互作用
  strengthInteractions: string;
  // 这组组合常见的认知盲区
  blindspots: string;
  // 一句总结性说明
  summary: string;
}

// ============================================================
// 判定页数据类型
// ============================================================

/**
 * 判定页数据类型
 *
 * 核心输出是路径判定（pathDecision），不是行动列表
 * 所有行动（doMore/doLess）必须与路径强绑定
 */
export interface DecideData {
  /** 路径决策枚举值（唯一核心输出） */
  pathDecision: PathDecision;

  /**
   * 问题焦点（判定对象）
   *
   * 本次判定针对的具体问题，将"路径判定"从宏观建议收束成具体决策点
   * 示例："如何在多方需求之间确定优先级？"
   */
  problemFocus: string;

  /**
   * 复述式理解句（高亮）
   *
   * 用更深一层的机制理解复述用户困惑
   * 禁止复用用户原话
   */
  reframedInsight?: string;

  /**
   * 路径选择逻辑推导（必须放在页面最上方）
   *
   * 【硬性要求】必须按照以下格式回答：
   * "基于你的 ×× 优势组合，在 ×× 情境下，
   * 继续使用原有模式会导致 ×× 能量损耗，
   * 所以此刻最优路径是 ××，
   * 并且在满足 ×× 条件时，可以直接行动。"
   *
   * 如果页面没有正面回答这个问题，则视为判定失败。
   *
   * 这部分必须明确呈现从"优势 × 情境"到"路径选择"的完整推导过程。
   */
  pathLogic: string;

  /**
   * 路径选择理由（补充说明）
   *
   * 解释为什么在 problemType + problemFocus + strengths 下，
   * 当前路径是能量最优解，其他路径会更耗能
   */
  pathReason: string;

  /**
   * 更应该做的事（与 pathDecision 强绑定）
   *
   * 表示"为了走好这条路径必须做的事"
   * 如果换一条路径仍然成立，则视为失败输出
   */
  doMore: Array<{
    action: string;
    timing: string;
    criteria: string;
    consequence: string;
  }>;

  /**
   * 更应该少做/不再做的事（与 pathDecision 强绑定）
   *
   * 表示"为了走好这条路径必须停止的事"
   * 如果换一条路径仍然成立，则视为失败输出
   */
  doLess: Array<{
    action: string;
    replacement: string;
    timing: string;
  }>;

  /**
   * 责任边界（与 pathDecision 强绑定）
   *
   * 表示"为了走好这条路径必须建立的边界"
   */
  boundaries: Array<{
    responsibleFor: string;
    notResponsibleFor: string;
  }>;

  /**
   * 用对力判断规则（路径版）
   *
   * 用户可以用这一条判断："我今天是否在走这条路径？"
   */
  checkRule: string;
}

// ============================================================
// 完整结果类型（用于兼容旧代码）
// 【DEPRECATED】仅 legacy 使用，禁止新业务使用
//
// 保留用于向后兼容，将在未来版本移除。
// 新业务请使用 ExplainData + DecideData + GallupResult
// ============================================================

/**
 * @deprecated 旧数据结构，请使用 ExplainData 和 DecideData 替代
 *
 * 此接口保留用于向后兼容，将在未来版本中移除。
 *
 * @example
 * // 旧用法（已废弃）
 * const data: ResultData = { highlight: '...', judgment: '...', ... };
 *
 * @example
 * // 新用法（推荐）
 * const result: GallupResult = {
 *   explain: { strengthManifestations: [...], ... },
 *   decide: { pathDecision: PathDecision.NARROW, ... }
 * };
 */
export interface ResultData {
  /** @deprecated 使用 ExplainData 替代 */
  highlight: string;
  /** @deprecated 使用 DecideData.pathLogic 或 DecideData.pathReason 替代 */
  judgment: string;
  /** @deprecated 使用 ExplainData.blindspots 替代 */
  blindspot: string;
  /** @deprecated 使用 DecideData.doMore 和 DecideData.doLess 替代 */
  actions: string[];
  /** @deprecated 使用 DecideData 中的各个字段替代 */
  advantageTips?: {
    reduce?: Array<{ strength: string; percentage: number; reason: string }>;
    increase?: Array<{ strength: string; percentage: number; reason: string }>;
    instruction: string;
  };
}

// ============================================================
// 新的统一输出类型
// ============================================================

export interface GallupResult {
  // 解释页内容
  explain: ExplainData;
  // 判定页内容
  decide: DecideData;
}

// ============================================================
// 优势发挥指南结果类型（StrengthGuideResult）
// ============================================================

/**
 * 单个优势的发挥指南
 */
export interface StrengthGuide {
  /** 优势ID */
  strengthId: string;
  /** 优势名称 */
  strengthName: string;
  /** 优势所属领域 */
  domain: 'executing' | 'influencing' | 'relationship' | 'strategic';
  /** 这个优势意味着什么（用"你会..."句式） */
  whatItMeans: string;
  /** 最佳发挥场景 */
  bestScenarios: string[];
  /** 日常应用建议 */
  dailyPractice: {
    morning: string;   // 早晨如何启动
    working: string;   // 工作中如何使用
    evening: string;   // 晚间如何恢复
  };
  /** 能量管理 */
  energyTips: {
    chargeWhen: string;  // 什么时候充能
    restWhen: string;    // 什么时候需要休息
  };
}

/**
 * 优势组合发挥建议
 */
export interface ComboGuide {
  /** 协同组合 */
  synergyPairs: Array<{
    strengths: [string, string];
    howToUse: string;
  }>;
  /** 需要平衡的组合 */
  tensionPairs: Array<{
    strengths: [string, string];
    howToBalance: string;
  }>;
}

/**
 * 本周行动建议
 */
export interface WeeklyAction {
  day: string;
  action: string;
  strengthUsed: string;
}

/**
 * 优势发挥指南完整结果
 */
export interface StrengthGuideResult {
  /** 个人化标签（如"深度执行者"） */
  personalLabel: {
    label: string;
    basedOn: string[];
    meaning: string;
  };
  /** 一句话总结"你是一个怎样的人" */
  oneLiner: string;
  /** 每个优势的发挥指南 */
  strengthGuides: StrengthGuide[];
  /** 组合发挥建议 */
  comboGuide: ComboGuide;
  /** 本周行动建议 */
  weeklyActions: WeeklyAction[];
}

// ============================================================
// 职业匹配结果类型（CareerMatchResult）- Phase 2
// ============================================================

/**
 * 职业匹配结果
 */
export interface CareerMatchResult {
  /** 最匹配的职业（TOP3） */
  topMatches: Array<{
    careerId: string;
    careerName: string;
    matchScore: number;
    matchReason: string;
    strengthUsage: Array<{
      strengthId: string;
      usage: string;
    }>;
    watchOut: string;
  }>;
  /** 通用职业建议 */
  generalAdvice: {
    coreStrengthToUse: string;
    energyManagement: string;
    growthDirection: string;
  };
}

// ============================================================
// 报告解读结果类型（ReportInterpretResult）- Phase 3
// ============================================================

/**
 * 单个优势解读
 */
export interface StrengthInterpretation {
  /** 优势名称 */
  name: string;
  /** 领域 */
  domain: string;
  /** 这是什么优势（通俗解释） */
  whatItIs: string;
  /** 你的优势表现（用"你会..."句式） */
  yourStrength: string;
  /** 注意事项（地下室状态） */
  watchOut: string;
  /** 最佳使用场景 */
  bestWhen: string[];
  /** 搭配建议 */
  pairWith: string[];
  /** 避免 */
  avoid: string[];
}

/**
 * 优势组合解读
 */
export interface ComboInterpretation {
  /** 核心驱动力 */
  coreDrive: string;
  /** 潜在陷阱 */
  potentialTraps: string[];
  /** 协同效应 */
  synergies: string[];
}

/**
 * 个人化标签
 */
export interface PersonalLabel {
  label: string;
  description: string;
  basedOn: string[];
}

/**
 * TOP5 优势输入类型
 * 用于报告解读 API
 */
export type Top5StrengthsInput = StrengthId[];

/**
 * 报告解读结果
 */
export interface ReportInterpretResult {
  /** TOP5 优势列表 */
  top5Strengths: Array<{
    rank: number;
    name: string;
    domain: string;
  }>;
  
  /** 个人化标签 */
  personalLabel: PersonalLabel;
  
  /** 一句话总结 */
  summary: string;
  
  /** 每个优势的解读 */
  strengthInterpretations: StrengthInterpretation[];
  
  /** 优势组合解读 */
  comboInterpretation: ComboInterpretation;
  
  /** 领域分布分析 */
  domainAnalysis: {
    domain: string;
    count: number;
    percentage: number;
    characteristics: string[];
  }[];
  
  /** 关键洞察 */
  keyInsights: string[];
  
  /** 建议的下一步路径 */
  suggestedPaths: Array<{
    path: 'breakthrough' | 'career-match' | 'strength-guide';
    title: string;
    reason: string;
  }>;
  
  /** AI 生成的个性化建议 */
  personalizedAdvice: string;
}
