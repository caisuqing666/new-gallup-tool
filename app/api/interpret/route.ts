import { NextRequest, NextResponse } from 'next/server';
import { ReportInterpretResult } from '@/lib/types';
import { isValidReportResultData } from '@/lib/schema';
import {
  InterpretRequestSchema,
  validateRequest,
  formatValidationError,
} from '@/lib/api-schemas';
import { generateReportInterpret, ensureValidReportResult } from '@/lib/services/interpret';

interface InterpretResponseMetadata {
  /** AI 生成是否降级到 Mock 数据 */
  usedMockFallback: boolean;
  /** API 端点总耗时（毫秒） */
  processingTimeMs: number;
  /** AI 调用耗时（毫秒），仅当 usedMockFallback=false 时有值，否则为 null */
  aiDurationMs: number | null;
  /** API 版本号 */
  version: string;
  /** 响应语言 */
  locale: string;
  /** 使用的 AI 提供商 */
  provider: string;
  /** 是否使用快速模型 */
  useFastModel: boolean;
}



interface InterpretResponse {
  success: boolean;
  data?: ReportInterpretResult;
  error?: string;
  metadata?: InterpretResponseMetadata;
}

interface StandardStrengthInput {
  rank: number;
  name: string;
  domain: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<InterpretResponse>> {
  try {
    const body = await request.json();

    // 使用 Zod 校验
    const validation = validateRequest(InterpretRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: formatValidationError(validation.errors).error },
        { status: 400 }
      );
    }

    const { strengths, useAi = true, useFastModel = false, locale = 'zh' } = validation.data;

    const normalizedStrengths: StandardStrengthInput[] = strengths.map((s, index) => ({
      rank: s.rank || index + 1,
      name: s.name,
      domain: s.domain || '未知领域',
    }));

    // 从环境变量读取 AI_PROVIDER，默认为 'zhipu'
    const provider = (process.env.AI_PROVIDER || 'zhipu') as any;

    console.info('📊 生成报告解读', {
      locale,
      provider,
      useFastModel,
      strengths: normalizedStrengths.map(s => s.name).join(', ')
    });

    const startTime = Date.now();
    let { data: result, usedMockFallback, aiDurationMs } = await generateReportInterpret(
      normalizedStrengths,
      useAi,
      provider,
      useFastModel
    );

    // 当 AI 结果未通过校验时，降级到 Mock 并重置 aiDurationMs
    // 这确保混合状态不会误导监控（Mock 数据不应该关联 AI 耗时）
    if (!isValidReportResultData(result)) {
      const fallback = ensureValidReportResult(normalizedStrengths, result);
      result = fallback.data;
      usedMockFallback = fallback.usedMockFallback;
      aiDurationMs = fallback.aiDurationMs; // 重置为 null，与 Mock 状态对齐
    }

    if (!isValidReportResultData(result)) {
      return NextResponse.json(
        { success: false, error: '报告解读结果格式错误' },
        { status: 500 }
      );
    }

    /**
     * 监控指标说明：
     * 
     * 1. usedMockFallback (boolean)
     *    - true: 使用了 Mock 数据（AI 生成失败或被禁用）
     *    - false: 使用了真实的 AI 生成数据
     *    用途：计算 AI 可用率 = (1 - fallback_count / total_count)
     * 
     * 2. aiDurationMs (number | null)
     *    - number: AI 调用耗时（毫秒），仅当 usedMockFallback=false 时有值
     *    - null: 未调用 AI（Mock 模式或生成失败）
     *    用途：监控 AI 响应时间，衡量性能
     * 
     * 3. processingTimeMs (number)
     *    - API 端点总耗时（毫秒），包括参数验证、数据处理等
     *    用途：监控整体 API 性能
     * 
     * 推荐监控规则：
     * - 可用率: sum(usedMockFallback==false) / total_requests
     * - AI 性能: avg(aiDurationMs) where usedMockFallback==false
     * - 快速版本性能: avg(aiDurationMs) where useFastModel==true (预期 3-5秒)
     * - 详细版本性能: avg(aiDurationMs) where useFastModel==false (预期 15-20秒)
     */
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        usedMockFallback,
        processingTimeMs: Date.now() - startTime,
        aiDurationMs,
        version: '1.0.0',
        locale,
        provider,
        useFastModel,
      },
    });

  } catch (error) {
    console.error('❌ 报告解读 API 错误:', error);
    const errorMessage = error instanceof Error ? error.message : '生成解读时发生错误';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
