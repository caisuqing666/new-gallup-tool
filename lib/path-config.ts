// 路径流程配置
// 定义每条路径的步骤序列和验证规则

import { PathId } from './types';

// ============================================================
// 步骤类型定义
// ============================================================

/**
 * 扩展的步骤类型
 * 在原有步骤基础上，增加各路径专属的步骤
 */
export type Step =
  // 通用步骤
  | 'landing'       // 首页落地页
  | 'path-selection' // 路径选择页（4入口卡片）
  | 'strengths'     // 优势选择
  | 'input'        // 困惑输入（仅 breakthrough 路径）
  | 'loading'      // 加载中
  | 'result'       // 突破方案结果（breakthrough 路径）
  // 报告解读专用（Phase 3）
  | 'ocr-upload'
  | 'report-result'
  // 职业匹配专用（Phase 2）
  | 'career-result'
  // 优势指南专用
  | 'guide-result';

// ============================================================
// 路径流程配置
// ============================================================

/**
 * 路径流程配置接口
 */
export interface PathFlowConfig {
  /** 路径包含的步骤序列 */
  steps: Step[];
  /** 是否需要选择优势 */
  requiresStrengths: boolean;
  /** 是否需要输入困惑 */
  requiresConfusion: boolean;
  /** 是否需要选择场景（仅 breakthrough） */
  requiresScenario: boolean;
  /** 结果页步骤名称 */
  resultStep: Step;
}

/**
 * 所有路径的流程配置
 */
export const PATH_FLOWS: Record<PathId, PathFlowConfig> = {
  // 报告解读（Phase 3 实现）
  'report-interpret': {
    steps: ['landing', 'path-selection', 'ocr-upload', 'loading', 'report-result'],
    requiresStrengths: false,  // OCR 自动识别
    requiresConfusion: false,
    requiresScenario: false,
    resultStep: 'report-result',
  },

  // 职业匹配（Phase 2 实现）
  'career-match': {
    steps: ['landing', 'path-selection', 'strengths', 'loading', 'career-result'],
    requiresStrengths: true,
    requiresConfusion: false,
    requiresScenario: false,
    resultStep: 'career-result',
  },

  // 突破方案（现有功能）
  'breakthrough': {
    steps: ['landing', 'path-selection', 'strengths', 'input', 'loading', 'result'],
    requiresStrengths: true,
    requiresConfusion: true,
    requiresScenario: true,
    resultStep: 'result',
  },

  // 优势指南
  'strength-guide': {
    steps: ['landing', 'path-selection', 'strengths', 'loading', 'guide-result'],
    requiresStrengths: true,
    requiresConfusion: false,
    requiresScenario: false,
    resultStep: 'guide-result',
  },
};

// ============================================================
// 路径工具函数
// ============================================================

/**
 * 获取路径的下一步
 */
export function getNextStep(path: PathId, currentStep: Step): Step | null {
  const flow = PATH_FLOWS[path];
  const currentIndex = flow.steps.indexOf(currentStep);

  if (currentIndex === -1 || currentIndex >= flow.steps.length - 1) {
    return null;
  }

  return flow.steps[currentIndex + 1];
}

/**
 * 获取路径的上一步
 */
export function getPreviousStep(path: PathId, currentStep: Step): Step | null {
  const flow = PATH_FLOWS[path];
  const currentIndex = flow.steps.indexOf(currentStep);

  if (currentIndex <= 0) {
    return null;
  }

  const previousStep = flow.steps[currentIndex - 1];

  // 特殊处理：如果上一步是 loading，返回 loading 的上一步
  // 这样可以从结果页直接返回到选择页，而不是卡在 loading
  if (previousStep === 'loading' && currentIndex > 1) {
    return flow.steps[currentIndex - 2];
  }

  return previousStep;
}

/**
 * 判断是否为结果页步骤
 */
export function isResultStep(path: PathId, step: Step): boolean {
  return PATH_FLOWS[path].resultStep === step;
}

/**
 * 获取从优势选择页的下一步
 * 不同路径有不同的下一步
 */
export function getStepAfterStrengths(path: PathId): Step {
  switch (path) {
    case 'breakthrough':
      return 'input';  // 需要输入困惑
    case 'career-match':
    case 'strength-guide':
      return 'loading';  // 直接生成
    default:
      return 'loading';
  }
}

/**
 * 判断步骤是否属于某个路径
 */
export function isStepInPath(path: PathId, step: Step): boolean {
  return PATH_FLOWS[path].steps.includes(step);
}

/**
 * 获取路径的所有可用路径列表（用于首页展示）
 */
export function getAvailablePaths(): PathId[] {
  // Phase 1 只开放 breakthrough 和 strength-guide
  // Phase 2 增加 career-match
  // Phase 3 增加 report-interpret
  return ['breakthrough', 'strength-guide', 'career-match', 'report-interpret'];
}

/**
 * 判断路径是否已实现
 */
export function isPathImplemented(path: PathId): boolean {
  switch (path) {
    case 'breakthrough':
    case 'strength-guide':
    case 'career-match':
    case 'report-interpret':
      return true;
    default:
      return false;
  }
}
