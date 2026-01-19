import { NextRequest, NextResponse } from 'next/server';
import { ReportInterpretResult, Top5StrengthsInput, StrengthId } from '@/lib/types';
import { ALL_STRENGTHS } from '@/lib/gallup-strengths';
import { generateMockReportResult } from '@/lib/mock-report';
import { buildPrompt } from '@/lib/prompts';
import { isValidReportResultData } from '@/lib/schema';
import { Locale } from '@/i18n/config';

// 重新导出类型，供内部使用
import { parseReportInterpretResponse, isValidReportInterpretResult } from '@/lib/report-interpret-prompts';

// ========================================
// 类型定义
// ========================================

// 简化的优势输入格式（从前端传入）
interface SimplifiedStrength {
  id: StrengthId;
}

// 完整的优势输入格式（兼容旧接口）
interface FullStrength {
  rank: number;
  name: string;
  domain: string;
}

interface InterpretRequest {
  strengths?: SimplifiedStrength[] | FullStrength[] | StrengthId[];
  useAi?: boolean;
  provider?: 'zhipu' | 'anthropic' | 'openai' | 'minimax';
  locale?: unknown;  // 语言: 'zh' 或 'en'
}

interface InterpretResponse {
  success: boolean;
  data?: ReportInterpretResult;
  error?: string;
}

type AIProvider = 'anthropic' | 'openai' | 'zhipu' | 'minimax';

interface AIConfig {
  endpoint: string;
  model: string;
  apiKey: string;
  provider: AIProvider;
  groupId?: string;
}

// ========================================
// AI 提供商配置
// ========================================

function getAIConfig(provider: AIProvider = 'zhipu'): AIConfig {
  if (provider === 'zhipu') {
    const apiKey = process.env.ZHIPU_API_KEY || process.env.GLMS_API_KEY;
    if (!apiKey) {
      throw new Error('ZHIPU_API_KEY 未配置');
    }
    return {
      endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: process.env.ZHIPU_MODEL || 'glm-4-plus',
      apiKey,
      provider: 'zhipu',
    };
  }

  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY 未配置');
    }
    return {
      endpoint: 'https://api.anthropic.com/v1/messages',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      apiKey,
      provider: 'anthropic',
    };
  }

  if (provider === 'minimax') {
    const apiKey = process.env.MINIMAX_API_KEY;
    const groupId = process.env.MINIMAX_GROUP_ID;
    if (!apiKey) {
      throw new Error('MINIMAX_API_KEY 未配置');
    }
    if (!groupId) {
      throw new Error('MINIMAX_GROUP_ID 未配置');
    }
    return {
      endpoint: process.env.MINIMAX_ENDPOINT || 'https://api.minimax.chat/v1/text/chatcompletion_v2',
      model: process.env.MINIMAX_MODEL || 'abab6.5-chat',
      apiKey,
      groupId,
      provider: 'minimax',
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 未配置');
  }
  return {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    apiKey,
    provider: 'openai',
  };
}

const API_TIMEOUT = 120000;

// ========================================
// AI 生成函数
// ========================================

async function generateWithZhipu(
  systemPrompt: string,
  userPrompt: string,
  strengths: StrengthId[]
): Promise<ReportInterpretResult> {
  const config = getAIConfig('zhipu');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`智谱 API 错误 (${response.status}): ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const parsedResult = parseReportInterpretResponse(content, strengths);
    if (!isValidReportInterpretResult(parsedResult)) {
      throw new Error('智谱响应格式不完整');
    }

    return parsedResult;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${API_TIMEOUT}ms）`);
    }
    throw error;
  }
}

async function generateWithClaude(
  systemPrompt: string,
  userPrompt: string,
  strengths: StrengthId[]
): Promise<ReportInterpretResult> {
  const config = getAIConfig('anthropic');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API 错误 (${response.status}): ${error}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    const parsedResult = parseReportInterpretResponse(content, strengths);
    if (!isValidReportInterpretResult(parsedResult)) {
      throw new Error('Claude 响应格式不完整');
    }

    return parsedResult;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${API_TIMEOUT}ms）`);
    }
    throw error;
  }
}

async function generateWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
  strengths: StrengthId[]
): Promise<ReportInterpretResult> {
  const config = getAIConfig('openai');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2048,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API 错误 (${response.status}): ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const parsedResult = parseReportInterpretResponse(content, strengths);
    if (!isValidReportInterpretResult(parsedResult)) {
      throw new Error('OpenAI 响应格式不完整');
    }

    return parsedResult;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${API_TIMEOUT}ms）`);
    }
    throw error;
  }
}

async function generateAiInterpretation(
  strengths: Top5StrengthsInput,
  provider: AIProvider = 'zhipu'
): Promise<ReportInterpretResult> {
  // 使用统一的 buildPrompt 函数构建 prompt
  const { systemPrompt, userPrompt } = buildPrompt({
    pathType: 'report-interpret',
    params: {
      strengths,
    },
  });

  console.info('🤖 调用 AI 生成报告解读...', {
    provider,
    strengths: strengths.join(', ')
  });

  if (provider === 'zhipu') {
    return await generateWithZhipu(systemPrompt, userPrompt, strengths);
  } else if (provider === 'anthropic') {
    return await generateWithClaude(systemPrompt, userPrompt, strengths);
  } else if (provider === 'minimax') {
    return await generateWithMinimax(systemPrompt, userPrompt, strengths);
  } else {
    return await generateWithOpenAI(systemPrompt, userPrompt, strengths);
  }
}

interface GenerateResult {
  data: ReportInterpretResult;
  usedMockFallback: boolean;
}

/**
 * 标准优势输入格式（包含排名和领域信息）
 */
interface StandardStrengthInput {
  rank: number;
  name: string;
  domain: string;
}

async function generateReportInterpret(
  strengths: StandardStrengthInput[],
  useAi: boolean = true,
  provider: AIProvider = 'zhipu'
): Promise<GenerateResult> {
  const enableAi = process.env.ENABLE_AI === 'true' && useAi;

  // 转换为 StrengthId[] 供 mock 函数使用
  const strengthIds = strengths.map(s => {
    // 从 name 反查 id
    const strength = ALL_STRENGTHS.find(st => st.name === s.name);
    return (strength?.id || s.name) as StrengthId;
  });

  if (!enableAi) {
    console.info('📦 使用 Mock 数据生成报告解读');
    return {
      data: generateMockReportResult(strengthIds),
      usedMockFallback: true,
    };
  }

  try {
    return {
      data: await generateAiInterpretation(strengthIds, provider),
      usedMockFallback: false,
    };
  } catch (error) {
    console.warn('⚠️ AI 生成失败，降级到 Mock 数据:', error);
    return {
      data: generateMockReportResult(strengthIds),
      usedMockFallback: true,
    };
  }
}

// ========================================
// API 路由处理器
// ========================================

/**
 * 将输入转换为标准格式
 */
function normalizeStrengths(
  input: SimplifiedStrength[] | FullStrength[] | StrengthId[]
): StandardStrengthInput[] {
  // 如果已经是简单字符串数组
  if (input.length > 0 && typeof input[0] === 'string') {
    const strengthIds = input as StrengthId[];
    return strengthIds.map((id, index) => {
      const strength = ALL_STRENGTHS.find(s => s.id === id);
      return {
        rank: index + 1,
        name: strength?.name || id,
        domain: strength?.domain || '未知领域',
      };
    });
  }

  // 如果是完整格式 {rank, name, domain}
  if (input.length > 0 && 'rank' in (input[0] as object)) {
    return (input as FullStrength[]).map((s, index) => ({
      rank: s.rank || index + 1,
      name: s.name,
      domain: s.domain || '未知领域',
    }));
  }

  // 如果是简化格式 {id}
  return (input as SimplifiedStrength[]).map((s, index) => {
    const strength = ALL_STRENGTHS.find(st => st.id === s.id);
    return {
      rank: index + 1,
      name: strength?.name || s.id,
      domain: strength?.domain || '未知领域',
    };
  });
}

export async function POST(request: NextRequest): Promise<NextResponse<InterpretResponse>> {
  try {
    const body: InterpretRequest = await request.json();
    const { strengths, useAi = true, provider = 'zhipu', locale } = body;

    // 验证 locale 参数
    const currentLocale = (locale as Locale | undefined) || 'zh';
    if (typeof currentLocale !== 'string' || !['zh', 'en'].includes(currentLocale)) {
      return NextResponse.json(
        { success: false, error: 'locale 必须是 "zh" 或 "en"' },
        { status: 400 }
      );
    }

    // 验证优势列表
    if (!strengths || !Array.isArray(strengths)) {
      return NextResponse.json(
        { success: false, error: '优势列表格式错误' },
        { status: 400 }
      );
    }

    if (strengths.length < 3 || strengths.length > 5) {
      return NextResponse.json(
        { success: false, error: '请提供 3-5 个优势' },
        { status: 400 }
      );
    }

    // 转换为标准格式
    const normalizedStrengths = normalizeStrengths(strengths);

    // 生成解读结果
    console.info('📊 生成报告解读', {
      provider,
      locale: currentLocale,
      strengths: normalizedStrengths.map(s => s.name).join(', ')
    });

    let { data: result, usedMockFallback } = await generateReportInterpret(normalizedStrengths, useAi, provider);
    const startTime = Date.now();

    if (!isValidReportResultData(result)) {
      console.warn('报告解读结果未通过 schema 校验，降级到 Mock 数据');
      const strengthIds = normalizedStrengths.map(s => {
        const strength = ALL_STRENGTHS.find(st => st.name === s.name);
        return (strength?.id || s.name) as StrengthId;
      });
      result = generateMockReportResult(strengthIds);
      usedMockFallback = true;
    }

    if (!isValidReportResultData(result)) {
      return NextResponse.json(
        { success: false, error: '报告解读结果格式错误' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        usedMockFallback,
        processingTimeMs: Date.now() - startTime,
        version: '1.0.0',
        locale: currentLocale,
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
async function generateWithMinimax(
  systemPrompt: string,
  userPrompt: string,
  strengths: StrengthId[]
): Promise<ReportInterpretResult> {
  const config = getAIConfig('minimax');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  // 构建带 GroupId 的完整 URL
  const fullUrl = `${config.endpoint}?GroupId=${config.groupId}`;

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Minimax API 错误 (${response.status}): ${error}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? '';

    const parsedResult = parseReportInterpretResponse(content, strengths);
    if (!isValidReportInterpretResult(parsedResult)) {
      throw new Error('Minimax 响应格式不完整');
    }

    return parsedResult;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${API_TIMEOUT}ms）`);
    }
    throw error;
  }
}
