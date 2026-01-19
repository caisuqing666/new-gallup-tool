/**
 * 行动方案生成 API 路由
 *
 * 只负责：
 * 1. 参数校验
 * 2. 调用 Service
 * 3. 返回响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { runDiagnosis } from '@/lib/diagnosis/runner';
import type { ProviderConfig } from '@/lib/services/action-plan';
import { ScenarioId, StrengthId, ProblemType, isValidProblemFocus } from '@/lib/types';
import { isValidScenarioId, isValidScenarioIdForLocale } from '@/lib/scenarios';
import { VALID_STRENGTH_IDS } from '@/lib/gallup-strengths';
import { Locale } from '@/i18n/config';

// ============================================================
// 请求类型定义
// ============================================================

interface GenerateRequest {
  scenario?: unknown;
  strengths?: unknown;
  confusion?: unknown;
  problemType?: unknown;
  problemFocus?: unknown;
  provider?: ProviderConfig;
  locale?: unknown;  // 语言: 'zh' 或 'en'
}

// ============================================================
// 参数校验
// ============================================================

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateLocale(locale: unknown): ValidationResult {
  if (locale === undefined || locale === null) {
    return { valid: true }; // 可选参数，默认为 'zh'
  }
  if (typeof locale !== 'string') {
    return { valid: false, error: 'locale 必须是字符串' };
  }
  if (!['zh', 'en'].includes(locale)) {
    return { valid: false, error: 'locale 必须是 "zh" 或 "en"' };
  }
  return { valid: true };
}

function validateScenario(scenario: unknown, locale: Locale = 'zh'): ValidationResult {
  if (!scenario || typeof scenario !== 'string' || !scenario.trim()) {
    return { valid: false, error: '场景 ID 是必需的' };
  }
  // 使用多语言验证函数，支持指定语言的场景 ID
  if (!isValidScenarioIdForLocale(scenario, locale)) {
    return { valid: false, error: '无效的场景 ID' };
  }
  return { valid: true };
}

function validateStrengths(strengths: unknown): ValidationResult {
  if (!strengths || !Array.isArray(strengths)) {
    return { valid: false, error: 'strengths 必须是一个数组' };
  }
  if (strengths.length < 3 || strengths.length > 5) {
    return { valid: false, error: '请选择 3-5 个优势' };
  }
  for (const s of strengths) {
    if (typeof s !== 'string') {
      return { valid: false, error: '每个优势必须是字符串 ID' };
    }
    if (!VALID_STRENGTH_IDS.includes(s as StrengthId)) {
      return { valid: false, error: `无效的优势 ID: ${s}` };
    }
  }
  return { valid: true };
}

function validateConfusion(confusion: unknown): ValidationResult {
  if (!confusion || typeof confusion !== 'string' || !confusion.trim()) {
    return { valid: false, error: '请输入你的困惑' };
  }
  if (confusion.length < 10) {
    return { valid: false, error: '困惑描述至少需要 10 个字符' };
  }
  return { valid: true };
}

function validateProblemType(problemType: unknown): ValidationResult {
  if (problemType === undefined || problemType === null) {
    return { valid: true }; // 可选参数
  }
  const validTypes = Object.values(ProblemType);
  if (!validTypes.includes(problemType as ProblemType)) {
    return { valid: false, error: '无效的问题类型' };
  }
  return { valid: true };
}

function validateProblemFocus(problemFocus: unknown, _confusion: string): ValidationResult {
  if (problemFocus === undefined || problemFocus === null) {
    return { valid: true }; // 可选参数
  }
  if (typeof problemFocus !== 'string') {
    return { valid: false, error: 'problemFocus 必须是字符串' };
  }
  if (!isValidProblemFocus(problemFocus)) {
    return {
      valid: false,
      error: '无效的问题焦点，应该是一个问句或包含"如何/怎么/是否"等疑问词',
    };
  }
  return { valid: true };
}

function validateProvider(provider: unknown): ValidationResult {
  if (provider === undefined || provider === null) {
    return { valid: true }; // 可选参数
  }
  if (typeof provider !== 'object') {
    return { valid: false, error: 'provider 必须是对象' };
  }
  const p = provider as ProviderConfig;
  if (!['mock', 'ai'].includes(p.type)) {
    return { valid: false, error: 'provider.type 必须是 "mock" 或 "ai"' };
  }
  if (p.provider && !['anthropic', 'openai', 'zhipu', 'minimax'].includes(p.provider)) {
    return { valid: false, error: '无效的 AI provider' };
  }
  return { valid: true };
}

// ============================================================
// API 路由处理器
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();

    // 确定 locale，优先级: 请求体 > 默认 'zh'
    const locale = (body.locale as Locale | undefined) || 'zh';

    // 校验参数
    const localeValidation = validateLocale(body.locale);
    if (!localeValidation.valid) {
      return NextResponse.json(
        { error: localeValidation.error },
        { status: 400 }
      );
    }

    const validations = [
      validateScenario(body.scenario, locale),
      validateStrengths(body.strengths),
      validateConfusion(body.confusion),
      validateProblemType(body.problemType),
      validateProblemFocus(body.problemFocus, body.confusion as string),
      validateProvider(body.provider),
    ];

    const firstError = validations.find(v => !v.valid);
    if (firstError) {
      return NextResponse.json(
        { error: firstError.error },
        { status: 400 }
      );
    }

    // 调用 Service 生成结果
    const result = await runDiagnosis({
      path: 'breakthrough',
      scenario: body.scenario as ScenarioId,
      strengths: body.strengths as StrengthId[],
      confusion: (body.confusion as string).trim(),
      problemType: body.problemType as ProblemType | undefined,
      problemFocus: body.problemFocus as string | undefined,
      provider: body.provider,
      locale, // 传递语言参数
    });

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        problemType: result.metadata.problemType,
        problemFocus: result.metadata.problemFocus,
        provider: result.provider.type,
        aiProvider: result.provider.provider,
        usedMockFallback: result.metadata.usedMockFallback,
        locale, // 返回使用的语言
      },
    });

  } catch (error) {
    console.error('Error in generate route:', error);

    // 处理特定错误类型
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: '请求体格式错误' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // 服务端错误，返回详细信息（开发环境）
      const isDev = process.env.NODE_ENV !== 'production';
      return NextResponse.json(
        {
          error: '生成方案时发生错误',
          ...(isDev && { details: error.message }),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '生成方案时发生未知错误' },
      { status: 500 }
    );
  }
}

// ============================================================
// 健康检查端点
// ============================================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'action-plan',
    timestamp: new Date().toISOString(),
  });
}
