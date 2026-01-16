/**
 * 统一 API Schema 和类型定义
 *
 * 本文件是项目类型的唯一权威来源：
 * - API 响应格式
 * - Mock 数据格式
 * - 前端渲染数据
 *
 * 【使用方式】
 * - 从 types.ts 导入核心类型定义
 * - 从 schema.ts 统一导出给前端使用
 * - 前端页面应从此文件导入 ResultData 等类型
 *
 * 【推荐导入方式】
 *   // 突破方案结果
 *   import type { ResultData } from '@/lib/schema';
 *
 *   // 优势指南结果
 *   import type { GuideResultData } from '@/lib/schema';
 *
 *   // 职业匹配结果
 *   import type { CareerResultData } from '@/lib/schema';
 *
 *   // 报告解读结果
 *   import type { ReportResultData } from '@/lib/schema';
 */

import type {
  PathId,
  ScenarioId,
  StrengthId,
  ProblemType,
  ProblemFocus,
  PathDecision,
  FormData,
  ExplainData,
  DecideData,
  GallupResult,
  StrengthGuideResult,
  CareerMatchResult,
  ReportInterpretResult,
} from './types';

// 重新导出所有类型（方便统一导入）
export type {
  PathId,
  ScenarioId,
  StrengthId,
  ProblemType,
  ProblemFocus,
  PathDecision,
  FormData,
  ExplainData,
  DecideData,
  GallupResult,
  StrengthGuideResult,
  CareerMatchResult,
  ReportInterpretResult,
};

// ============================================================
// API 响应包装类型
// ============================================================

/**
 * API 响应元数据
 */
export interface ApiResponseMetadata {
  /** 是否使用了 Mock 降级（AI 不可用时） */
  usedMockFallback: boolean;
  /** 处理耗时（毫秒） */
  processingTimeMs?: number;
  /** 请求 ID（用于日志追踪） */
  requestId?: string;
  /** API 版本 */
  version?: string;
}

/**
 * 统一 API 响应格式
 *
 * 【协议规范】
 * - 成功响应：{ success: true, data: T, metadata?: ApiResponseMetadata }
 * - 错误响应：{ success: false, error: string, details?: string }
 *
 * 【使用示例】
 *   const response = await fetch('/api/generate', {
 *     method: 'POST',
 *     body: JSON.stringify(input),
 *   });
 *   const { success, data, metadata } = await response.json();
 *   if (success && metadata?.usedMockFallback) {
 *     console.log('使用了模拟数据');
 *   }
 */
export interface ApiResponse<T> {
  /** 成功标志 */
  success: true;
  /** 业务数据 */
  data: T;
  /** 响应元数据（可选） */
  metadata?: ApiResponseMetadata;
}

/**
 * API 错误响应
 */
export interface ApiError {
  /** 成功标志 */
  success: false;
  /** 错误信息（用户友好） */
  error: string;
  /** 错误详情（调试用，可选） */
  details?: string;
}

/**
 * 统一的 API 响应类型（联合类型）
 */
export type UnifiedApiResponse<T> = ApiResponse<T> | ApiError;

// ============================================================
// 统一的 ResultData 类型（前端直接使用）
// ============================================================

export type ResultData = GallupResult & {
  scenario?: string;
  strengths?: string[];
  isMock?: boolean;
};

export type GuideResultData = StrengthGuideResult & {
  strengths?: string[];
  isMock?: boolean;
};

export type CareerResultData = CareerMatchResult & {
  strengths?: string[];
  isMock?: boolean;
};

export type ReportResultData = ReportInterpretResult & {
  strengths?: string[];
  isMock?: boolean;
};

// ============================================================
// 类型守卫（运行时校验）
// ============================================================

/**
 * 检查是否为成功的 API 响应
 */
export function isApiResponse<T>(response: unknown): response is ApiResponse<T> {
  if (!response || typeof response !== 'object') return false;
  const r = response as Record<string, unknown>;
  return r.success === true && 'data' in r && r.data !== undefined;
}

/**
 * 检查是否为 API 错误响应
 */
export function isApiError(response: unknown): response is ApiError {
  if (!response || typeof response !== 'object') return false;
  const r = response as Record<string, unknown>;
  return r.success === false && typeof r.error === 'string';
}

/**
 * 检查响应中是否使用了 Mock 降级
 */
export function hasMockFallback(response: unknown): boolean {
  if (!isApiResponse(response)) return false;
  return response.metadata?.usedMockFallback ?? false;
}

export function isValidResultData(data: unknown): data is ResultData {
  if (!data || typeof data !== 'object') return false;
  const result = data as Record<string, unknown>;
  if ('explain' in result) {
    const explain = result.explain as Record<string, unknown>;
    if (!explain || typeof explain !== 'object' || !('strengthManifestations' in explain)) return false;
  }
  if ('decide' in result) {
    const decide = result.decide as Record<string, unknown>;
    if (!decide || typeof decide !== 'object' || !('pathDecision' in decide)) return false;
  }
  return true;
}

export function extractResultData(data: unknown): ResultData | null {
  if (isValidResultData(data)) {
    return data;
  }
  console.warn('[schema] 无效的 ResultData:', data);
  return null;
}
