/**
 * API 请求 Schema 定义
 * 
 * 使用 Zod 进行统一的参数校验和类型推导
 * 所有 API 路由都应该使用这些 schema 进行校验
 */

import { z } from 'zod';
import { VALID_STRENGTH_IDS } from './gallup-strengths';
import { isValidScenarioId } from './scenarios';

// ============================================================
// 通用 Schema
// ============================================================

const LocaleSchema = z
  .enum(['zh', 'en'])
  .optional()
  .default('zh')
  .describe('语言：中文 或 英文');

const StrengthIdSchema = z
  .string()
  .superRefine((id, ctx) => {
    if (!VALID_STRENGTH_IDS.includes(id as any)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '无效的优势 ID',
      });
    }
  });

const StrengthsArraySchema = z
  .array(StrengthIdSchema)
  .min(1, '至少选择 1 个优势')
  .max(5, '最多选择 5 个优势');

// ============================================================
// 突破方案 API Schema
// ============================================================

export const GenerateRequestSchema = z
  .object({
    scenario: z
      .string()
      .min(1, '场景不能为空')
      .max(100, '场景过长')
      .refine(
        (scenario) => isValidScenarioId(scenario),
        '无效的场景 ID'
      ),
    strengths: z
      .array(StrengthIdSchema)
      .min(3, '需要至少 3 个优势')
      .max(5, '最多 5 个优势'),
    confusion: z
      .string()
      .min(10, '困惑描述过短，至少 10 个字')
      .max(1000, '困惑描述过长'),
    problemType: z
      .enum(['P1', 'P2', 'P3', 'P4'])
      .optional()
      .describe('问题类型约束'),
    problemFocus: z
      .string()
      .optional()
      .describe('问题焦点约束'),
    locale: LocaleSchema,
  })
  .strict('不允许额外字段');

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

// ============================================================
// 优势指南 API Schema
// ============================================================

export const GuideRequestSchema = z
  .object({
    strengths: z
      .array(StrengthIdSchema)
      .min(3, '需要至少 3 个优势')
      .max(5, '最多 5 个优势'),
    locale: LocaleSchema,
  })
  .strict('不允许额外字段');

export type GuideRequest = z.infer<typeof GuideRequestSchema>;

// ============================================================
// 职业匹配 API Schema
// ============================================================

export const CareerRequestSchema = z
  .object({
    strengths: StrengthsArraySchema,
    locale: LocaleSchema,
  })
  .strict('不允许额外字段');

export type CareerRequest = z.infer<typeof CareerRequestSchema>;

// ============================================================
// 报告解读 API Schema
// ============================================================

const StrengthInfoSchema = z.object({
  rank: z
    .number()
    .int('排名必须是整数')
    .min(1, '排名最小为 1')
    .max(5, '排名最大为 5'),
  name: z.string().min(1, '优势名称不能为空'),
  domain: z.string().min(1, '领域不能为空'),
});

export const InterpretRequestSchema = z
  .object({
    strengths: z
      .array(StrengthInfoSchema)
      .min(1, '至少需要 1 个优势')
      .max(5, '最多 5 个优势'),
    useAi: z.boolean().optional().default(true),
    locale: LocaleSchema,
  })
  .strict('不允许额外字段');

export type InterpretRequest = z.infer<typeof InterpretRequestSchema>;

// ============================================================
// 统一的校验和错误处理工具
// ============================================================

/**
 * 校验 API 请求数据
 * 
 * @param schema Zod schema
 * @param data 待校验的数据
 * @returns 校验结果
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError['errors'] } {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * 将 Zod 校验错误转换为用户友好的 API 响应格式
 * 
 * @param errors Zod 错误列表
 * @returns 格式化的错误响应
 */
export function formatValidationError(errors: z.ZodError['errors']): {
  error: string;
  details: Array<{
    field: string;
    message: string;
  }>;
} {
  return {
    error: 'Request validation failed',
    details: errors.map((err) => ({
      field: err.path.length > 0 ? String(err.path.join('.')) : 'body',
      message: err.message,
    })),
  };
}

/**
 * 调试辅助：打印 schema 的所有字段定义
 */
export function debugSchema<T>(name: string, schema: z.ZodSchema<T>): void {
  console.debug(`[Schema Debug] ${name}:`, schema.description || schema);
}
