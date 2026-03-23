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
import { createGenerateAIContext } from '../ai-context';
import { parseConfusion, ProblemType as ConfusionProblemType } from '../confusion-parser';
import { validateConfig } from '../config-validator';

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

/** 降级原因类型 */
export type FallbackReason = 'ai_disabled' | 'invalid_config' | 'ai_error' | 'schema_invalid';

/** 有效 Provider 类型 */
export type EffectiveProviderType = 'ai' | 'mock';

/** 生成结果 */
export interface GenerateResult {
  data: GallupResult;
  provider: ProviderConfig;
  metadata: {
    problemType: ProblemType;
    problemFocus: string;
    usedMockFallback: boolean;
    /** 降级原因 */
    fallbackReason: FallbackReason | null;
    /** AI 是否启用（配置层面） */
    aiEnabled: boolean;
    /** 实际生效的 Provider 类型 */
    effectiveProviderType: EffectiveProviderType;
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
  const aiContext = createGenerateAIContext({
    enableAI: true,
    ...(provider ? { provider } : {}),
  });

  return await generateResult(
    scenario,
    strengths,
    confusion,
    problemType,
    problemFocus,
    true,
    locale,
    aiContext
  );
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

  // 确定 Provider 和配置状态
  const config = validateConfig();
  const aiEnabled = config.config.aiEnabled && config.valid;
  if (config.config.aiEnabled && !config.valid) {
    console.warn('AI 配置无效，突破方案降级为 Mock', config.errors);
  }

  const defaultProvider: ProviderConfig = aiEnabled
    ? { type: 'ai', provider: config.config.aiProvider as ProviderConfig['provider'] }
    : { type: 'mock' };
  const effectiveProvider: ProviderConfig = provider || defaultProvider;

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

  // 初始化 metadata 字段
  let usedMockFallback = false;
  let fallbackReason: FallbackReason | null = null;
  let actualProviderType: EffectiveProviderType = 'mock';

  // 情况1：AI 未启用或配置无效 → ai_disabled / invalid_config
  if (!aiEnabled) {
    if (config.config.aiEnabled) {
      fallbackReason = 'invalid_config';
      console.warn('[action-plan] AI 配置无效，使用 Mock');
    } else {
      fallbackReason = 'ai_disabled';
      console.info('[action-plan] AI 未启用，使用 Mock');
    }
    const result = await generateWithMock(scenario, strengths, confusion, finalProblemType, finalProblemFocus, locale);
    return {
      data: result,
      provider: effectiveProvider,
      metadata: {
        problemType: finalProblemType,
        problemFocus: finalProblemFocus,
        usedMockFallback: true,
        fallbackReason,
        aiEnabled: false,
        effectiveProviderType: 'mock',
      },
    };
  }

  // 情况2：AI 启用且配置有效，尝试 AI 生成（最多重试1次）
  if (effectiveProvider.type === 'ai') {
    actualProviderType = 'ai';
    let result!: GallupResult;
    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
      attempt += 1;
      console.info(`[action-plan] AI 生成尝试 ${attempt}/${maxAttempts}`);

      try {
        result = await generateWithAI(scenario, strengths, confusion, finalProblemType, finalProblemFocus, effectiveProvider.provider, locale);

        // Schema 校验
        if (!isValidResultData(result)) {
          console.warn(`[action-plan] 第 ${attempt} 次尝试未通过 schema 校验`);
          if (attempt < maxAttempts) {
            console.info(`[action-plan] 准备第 ${attempt + 1} 次尝试...`);
            continue;
          }
          // 最后一次尝试仍失败，降级到 Mock
          console.warn('[action-plan] 所有尝试均未通过 schema 校验，降级到 Mock');
          result = await generateWithMock(scenario, strengths, confusion, finalProblemType, finalProblemFocus, locale);
          usedMockFallback = true;
          fallbackReason = 'schema_invalid';
          actualProviderType = 'mock';
          break;
        }

        // 成功：返回结果
        console.info(`[action-plan] 第 ${attempt} 次尝试成功`);
        return {
          data: result,
          provider: effectiveProvider,
          metadata: {
            problemType: finalProblemType,
            problemFocus: finalProblemFocus,
            usedMockFallback,
            fallbackReason,
            aiEnabled: true,
            effectiveProviderType: actualProviderType,
          },
        };
      } catch (error) {
        console.warn(`[action-plan] 第 ${attempt} 次尝试抛错:`, error);
        if (attempt < maxAttempts) {
          console.info(`[action-plan] 准备第 ${attempt + 1} 次尝试...`);
          continue;
        }
        // 最后一次尝试仍失败，降级到 Mock
        console.warn('[action-plan] 所有尝试均失败，降级到 Mock:', error);
        result = await generateWithMock(scenario, strengths, confusion, finalProblemType, finalProblemFocus, locale);
        usedMockFallback = true;
        fallbackReason = 'ai_error';
        actualProviderType = 'mock';
        break;
      }
    }

    // 最终 schema 校验（理论上上面已经保证 result 是有效的，但保留双重检查）
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
        fallbackReason,
        aiEnabled: true,
        effectiveProviderType: actualProviderType,
      },
    };
  }

  // 情况3：明确指定使用 Mock
  const result = await generateWithMock(scenario, strengths, confusion, finalProblemType, finalProblemFocus, locale);
  return {
    data: result,
    provider: effectiveProvider,
    metadata: {
      problemType: finalProblemType,
      problemFocus: finalProblemFocus,
      usedMockFallback: true,
      fallbackReason: 'ai_disabled',
      aiEnabled,
      effectiveProviderType: 'mock',
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
