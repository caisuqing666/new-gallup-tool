// 职业匹配 API 路由
// 根据用户选择的 TOP5 优势生成职业匹配分析

import { NextRequest, NextResponse } from 'next/server';
import { StrengthId } from '@/lib/types';
import {
  CareerRequestSchema,
  validateRequest,
  formatValidationError,
} from '@/lib/api-schemas';
import { generateCareerMatch } from '@/lib/services/career';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 使用 Zod 校验
    const validation = validateRequest(CareerRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        formatValidationError(validation.errors),
        { status: 400 }
      );
    }

    const { strengths, locale } = validation.data;

    // 检查是否启用 AI
    const startTime = Date.now();
    const strengthIds = strengths as StrengthId[];

    const result = await generateCareerMatch(strengthIds);

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        usedMockFallback: result.usedMockFallback,
        processingTimeMs: Date.now() - startTime,
        version: '1.0.0',
        locale,
      },
    });

  } catch (error) {
    console.error('生成职业匹配失败:', error);
    return NextResponse.json(
      { error: '生成职业匹配失败，请稍后重试' },
      { status: 500 }
    );
  }
}
