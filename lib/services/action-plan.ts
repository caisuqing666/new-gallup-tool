/**
 * 行动方案生成服务
 *
 * 负责生成盖洛普优势行动方案，支持多种 Provider：
 * - MockProvider: 使用预定义的 Mock 数据
 * - AIProvider: 使用 AI API 生成
 *
 * 此文件是业务逻辑的唯一入口，route.ts 只负责 HTTP 相关逻辑。
 */

import type { ScenarioId, StrengthId, ProblemFocus } from '../types';
import { ProblemType } from '../types';
import type { GallupResult } from '../schema';
import { isValidResultData } from '../schema';
import { generateResult } from '../ai-generate';
import { parseConfusion, ProblemType as ConfusionProblemType } from '../confusion-parser';

// ============================================================
// 类型定义
// ============================================================

/** Provider 类型 */
export type ProviderType = 'mock' | 'ai';

/** Provider 配置 */
export interface ProviderConfig {
  type: ProviderType;
  provider?: 'anthropic' | 'openai' | 'zhipu' | 'minimax';
}

/** 生成选项 */
export interface GenerateOptions {
  scenario: ScenarioId;
  strengths: StrengthId[];
  confusion: string;
  problemType?: ProblemType;
  problemFocus?: ProblemFocus;
  provider?: ProviderConfig;
  locale?: 'zh' | 'en';
}

/** 生成结果 */
export interface GenerateResult {
  data: GallupResult;
  provider: ProviderConfig;
  metadata: {
    problemType: ProblemType;
    problemFocus: string;
    usedMockFallback: boolean;
  };
}

// ============================================================
// Provider 实现
// ============================================================

/**
 * Mock Provider - 使用预定义数据
 */
async function generateWithMock(
  scenario: ScenarioId,
  strengths: StrengthId[],
  confusion: string,
  _problemType: ProblemType,
  _problemFocus: string,
  locale?: 'zh' | 'en'
): Promise<GallupResult> {
  // 动态导入 mock-data 以避免循环依赖
  const { generateMockResult } = await import('../mock-data');
  return generateMockResult(scenario, strengths, confusion, _problemType, _problemFocus, true, locale);
}

/**
 * AI Provider - 使用 AI API
 */
async function generateWithAI(
  scenario: ScenarioId,
  strengths: StrengthId[],
  confusion: string,
  problemType: ProblemType,
  problemFocus: string,
  provider: ProviderConfig['provider'],
  locale?: 'zh' | 'en'
): Promise<GallupResult> {
  // 设置环境变量以启用 AI
  const originalEnableAi = process.env.ENABLE_AI;
  process.env.ENABLE_AI = 'true';

  try {
    // 设置 AI 提供商
    if (provider) {
      process.env.AI_PROVIDER = provider;
    }

    return await generateResult(scenario, strengths, confusion, problemType, problemFocus, true, locale);
  } finally {
    // 恢复环境变量
    if (originalEnableAi !== undefined) {
      process.env.ENABLE_AI = originalEnableAi;
    } else {
      delete process.env.ENABLE_AI;
    }
  }
}

// ============================================================
// 问题类型映射
// ============================================================

/**
 * 映射 confusion-parser 的 ProblemType 到 types.ts 的 ProblemType
 */
function mapProblemType(confusionType: ConfusionProblemType): ProblemType {
  const typeMap: Record<ConfusionProblemType, ProblemType> = {
    [ConfusionProblemType.Direction]: ProblemType.DIRECTION_UNCERTAINTY,
    [ConfusionProblemType.BoundaryOverload]: ProblemType.BOUNDARY_OVERLOAD,
    [ConfusionProblemType.DecisionParalysis]: ProblemType.INFORMATION_PARALYSIS,
    [ConfusionProblemType.PriorityFocus]: ProblemType.EFFICIENCY_BOTTLENECK,
    [ConfusionProblemType.RoleMisalignment]: ProblemType.BOUNDARY_OVERLOAD,
    [ConfusionProblemType.RelationshipExit]: ProblemType.DIRECTION_UNCERTAINTY,
    [ConfusionProblemType.Unknown]: ProblemType.DIRECTION_UNCERTAINTY,
  };
  return typeMap[confusionType] || ProblemType.DIRECTION_UNCERTAINTY;
}

/**
 * 规范化问题焦点
 */
function normalizeProblemFocus(focus: string): string {
  const trimmed = focus.trim();
  if (!trimmed) return '';
  const hasQuestionWord = /如何|怎么|怎样|是否|能不能|应该|要不要/i.test(trimmed);
  let normalized = hasQuestionWord ? trimmed : `如何${trimmed}`;
  if (!/[？?]$/.test(normalized)) {
    normalized += '？';
  }
  if (normalized.length < 10) {
    normalized = `在当前情境下，${normalized.replace(/[？?]$/, '')}？`;
  }
  return normalized;
}

// ============================================================
// 主函数
// ============================================================

/**
 * 生成行动方案
 *
 * @param options - 生成选项
 * @returns 生成结果
 */
export async function generateActionPlan(options: GenerateOptions): Promise<GenerateResult> {
  const { scenario, strengths, confusion, problemType, problemFocus, provider, locale } = options;

  // 确定 Provider
  const effectiveProvider: ProviderConfig = provider || { type: 'mock' };

  // 解析困惑，提取问题类型和焦点
  let parsedProblem: ReturnType<typeof parseConfusion>;
  try {
    parsedProblem = parseConfusion(confusion.trim());
    console.info('✓ 已解析问题类型:', {
      problemType: parsedProblem.problemType,
      problemFocus: parsedProblem.problemFocus,
      confidence: parsedProblem.problemTypeConfidence,
    });
  } catch (error) {
    console.warn('困惑解析失败，使用默认值:', error);
    parsedProblem = {
      problemType: ConfusionProblemType.Unknown,
      problemFocus: '要不要改变现状',
      problemTypeConfidence: 0,
      raw: confusion.trim(),
      desiredOutcome: null,
      hiddenCost: null,
      keyPhrases: [],
      matchedKeywords: [],
    };
  }

  // 确定最终的问题类型和焦点
  const finalProblemType = problemType || mapProblemType(parsedProblem.problemType);
  const finalProblemFocus = problemFocus
    ? normalizeProblemFocus(problemFocus)
    : normalizeProblemFocus(parsedProblem.problemFocus);

  // 根据 Provider 选择生成方式
  let result: GallupResult;
  let usedMockFallback = false;

  if (effectiveProvider.type === 'mock') {
    result = await generateWithMock(scenario, strengths, confusion, finalProblemType, finalProblemFocus, locale);
  } else {
    try {
      result = await generateWithAI(scenario, strengths, confusion, finalProblemType, finalProblemFocus, effectiveProvider.provider, locale);
    } catch (error) {
      console.warn('AI 生成失败，降级到 Mock:', error);
      result = await generateWithMock(scenario, strengths, confusion, finalProblemType, finalProblemFocus, locale);
      usedMockFallback = true;
    }
  }

  if (!isValidResultData(result)) {
    console.warn('生成结果未通过 schema 校验，进行降级处理');
    if (effectiveProvider.type === 'ai') {
      result = await generateWithMock(scenario, strengths, confusion, finalProblemType, finalProblemFocus, locale);
      usedMockFallback = true;
    }
  }

  if (!isValidResultData(result)) {
    throw new Error('生成结果未通过 schema 校验');
  }

  return {
    data: result,
    provider: effectiveProvider,
    metadata: {
      problemType: finalProblemType,
      problemFocus: finalProblemFocus,
      usedMockFallback,
    },
  };
}

// ============================================================
// 便捷函数
// ============================================================

/**
 * 使用 Mock 数据生成行动方案
 */
export async function generateMockActionPlan(
  scenario: ScenarioId,
  strengths: StrengthId[],
  confusion: string,
  problemType?: ProblemType,
  problemFocus?: string
): Promise<GallupResult> {
  const result = await generateActionPlan({
    scenario,
    strengths,
    confusion,
    problemType,
    problemFocus: problemFocus as ProblemFocus,
    provider: { type: 'mock' },
  });
  return result.data;
}

/**
 * 使用 AI 生成行动方案
 */
export async function generateAIActionPlan(
  scenario: ScenarioId,
  strengths: StrengthId[],
  confusion: string,
  provider?: ProviderConfig['provider']
): Promise<GallupResult> {
  // 解析问题
  const parsed = parseConfusion(confusion.trim());
  const problemType = mapProblemType(parsed.problemType);
  const problemFocus = normalizeProblemFocus(parsed.problemFocus);

  const result = await generateActionPlan({
    scenario,
    strengths,
    confusion,
    problemType,
    problemFocus,
    provider: { type: 'ai', provider },
  });
  return result.data;
}
