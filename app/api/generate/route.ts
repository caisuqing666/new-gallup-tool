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
import { ScenarioId, StrengthId, ProblemType } from '@/lib/types';
import {
  GenerateRequestSchema,
  validateRequest,
  formatValidationError,
} from '@/lib/api-schemas';
import { createGenerateAIContext } from '@/lib/ai-context';

// ============================================================
// API 路由处理器
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 使用 Zod 校验
    const validation = validateRequest(GenerateRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        formatValidationError(validation.errors),
        { status: 400 }
      );
    }

    const { scenario, strengths, confusion, problemType, problemFocus, locale } = validation.data;

    // 创建 AIContext（用于配置管理）
    const _context = createGenerateAIContext();

    // 调用 Service 生成结果
    const result = await runDiagnosis({
      path: 'breakthrough',
      scenario: scenario as ScenarioId,
      strengths: strengths as StrengthId[],
      confusion: confusion.trim(),
      problemType: problemType as ProblemType | undefined,
      problemFocus: problemFocus as string | undefined,
      provider: undefined,
      locale,
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
        locale,
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
