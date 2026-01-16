// 职业匹配 API 路由
// 根据用户选择的 TOP5 优势生成职业匹配分析

import { NextRequest, NextResponse } from 'next/server';
import { generateMockCareerResult } from '@/lib/mock-career';
import { validateConfig } from '@/lib/config-validator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strengths } = body;

    // 参数校验
    if (!strengths || !Array.isArray(strengths)) {
      return NextResponse.json(
        { error: '请提供有效的优势列表' },
        { status: 400 }
      );
    }

    if (strengths.length < 3 || strengths.length > 5) {
      return NextResponse.json(
        { error: '请选择 3-5 个优势' },
        { status: 400 }
      );
    }

    // 检查是否启用 AI
    const config = validateConfig();
    const aiEnabled = config.config.aiEnabled;

    if (aiEnabled) {
      // TODO: 这里可以接入真实的 AI API 生成个性化的职业匹配
      // 目前先使用 Mock 数据
      console.log('AI 已启用，但职业匹配功能暂未接入 AI，使用 Mock 数据');
    }

    // 生成 Mock 数据
    const careerData = generateMockCareerResult(strengths);
    const startTime = Date.now();

    return NextResponse.json({
      success: true,
      data: careerData,
      metadata: {
        usedMockFallback: true,
        processingTimeMs: Date.now() - startTime,
        version: '1.0.0',
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
