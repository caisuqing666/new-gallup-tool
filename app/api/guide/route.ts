// 优势发挥指南 API 路由
// 根据用户选择的 TOP5 优势生成个性化的发挥指南

import { NextRequest, NextResponse } from 'next/server';
import { StrengthId } from '@/lib/types';
import {
  GuideRequestSchema,
  validateRequest,
  formatValidationError,
} from '@/lib/api-schemas';
import { generateStrengthGuide } from '@/lib/services/guide';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 使用 Zod 校验
    const validation = validateRequest(GuideRequestSchema, body);
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

    const result = await generateStrengthGuide(strengthIds);

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        usedMockFallback: result.usedMockFallback,
        fallbackReason: result.fallbackReason,
        processingTimeMs: Date.now() - startTime,
        provider: result.provider,
        version: '1.0.0',
        locale,
      },
    });

  } catch (error) {
    console.error('生成优势指南失败:', error);
    return NextResponse.json(
      { error: '生成优势指南失败，请稍后重试' },
      { status: 500 }
    );
  }
}
