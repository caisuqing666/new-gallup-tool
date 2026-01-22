import { ReportInterpretResult, Top5StrengthsInput, StrengthId } from '@/lib/types';
import { ALL_STRENGTHS } from '@/lib/gallup-strengths';
import { generateMockReportResult } from '@/lib/mock-report';
import { buildPrompt } from '@/lib/prompts';
import { isValidReportResultData } from '@/lib/schema';
import { createInterpretAIContext, AIProviderType } from '@/lib/ai-context';
import { callAIProvider } from '@/lib/ai-http';
import { parseReportInterpretResponse, isValidReportInterpretResult } from '@/lib/report-interpret-prompts';

type AIProvider = AIProviderType;

interface AIConfig {
  endpoint: string;
  model: string;
  apiKey: string;
  provider: AIProvider;
  groupId?: string;
}

function getAIConfig(provider: AIProvider = 'zhipu', useFastModel: boolean = false): AIConfig {
  if (provider === 'zhipu') {
    const apiKey = process.env.ZHIPU_API_KEY || process.env.GLMS_API_KEY;
    if (!apiKey) {
      throw new Error('ZHIPU_API_KEY 未配置');
    }
    const model = useFastModel
      ? (process.env.ZHIPU_FAST_MODEL || 'glm-4-flash')
      : (process.env.ZHIPU_MODEL || 'glm-4-plus');
    return {
      endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model,
      apiKey,
      provider: 'zhipu',
    };
  }

  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY 未配置');
    }
    const model = useFastModel
      ? (process.env.ANTHROPIC_FAST_MODEL || 'claude-3-haiku-20250307')
      : (process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022');
    return {
      endpoint: 'https://api.anthropic.com/v1/messages',
      model,
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
    // Minimax 快速和详细模型相同
    const model = process.env.MINIMAX_MODEL || 'abab6.5-chat';
    return {
      endpoint: process.env.MINIMAX_ENDPOINT || 'https://api.minimax.chat/v1/text/chatcompletion_v2',
      model,
      apiKey,
      groupId,
      provider: 'minimax',
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 未配置');
  }
  const model = useFastModel
    ? (process.env.OPENAI_FAST_MODEL || 'gpt-4o-mini')
    : (process.env.OPENAI_MODEL || 'gpt-4o');
  return {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model,
    apiKey,
    provider: 'openai',
  };
}

async function generateWithProvider(
  provider: AIProvider,
  systemPrompt: string,
  userPrompt: string,
  strengths: StrengthId[],
  useFastModel: boolean = false
): Promise<ReportInterpretResult> {
  const config = getAIConfig(provider, useFastModel);
  const aiContext = createInterpretAIContext();
  const content = await callAIProvider(
    config,
    {
      systemPrompt,
      userPrompt,
      maxTokens: 2048,
      temperature: 0.7,
      bodyOverrides: provider === 'openai'
        ? { response_format: { type: 'json_object' } }
        : undefined,
    },
    { timeoutMs: aiContext.timeout }
  );

  const parsedResult = parseReportInterpretResponse(content, strengths);
  const labelMap: Record<AIProvider, string> = {
    zhipu: '智谱',
    anthropic: 'Claude',
    minimax: 'Minimax',
    openai: 'OpenAI',
  };
  if (!isValidReportInterpretResult(parsedResult)) {
    throw new Error(`${labelMap[provider]} 响应格式不完整`);
  }

  return parsedResult;
}

async function generateAiInterpretation(
  strengths: Top5StrengthsInput,
  provider: AIProvider = 'zhipu',
  useFastModel: boolean = false
): Promise<ReportInterpretResult> {
  const { systemPrompt, userPrompt } = buildPrompt({
    pathType: 'report-interpret',
    params: {
      strengths,
    },
  });

  console.info('🤖 调用 AI 生成报告解读...', {
    provider,
    model: useFastModel ? '快速版' : '详细版',
    strengths: strengths.join(', ')
  });

  return generateWithProvider(provider, systemPrompt, userPrompt, strengths, useFastModel);
}

interface GenerateResult {
  data: ReportInterpretResult;
  usedMockFallback: boolean;
  aiDurationMs: number | null;
}

interface StandardStrengthInput {
  rank: number;
  name: string;
  domain: string;
}

export async function generateReportInterpret(
  strengths: StandardStrengthInput[],
  useAi: boolean = true,
  provider: AIProvider = 'zhipu',
  useFastModel: boolean = false
): Promise<GenerateResult> {
  const enableAi = process.env.ENABLE_AI === 'true' && useAi;

  const strengthIds = strengths.map(s => {
    const strength = ALL_STRENGTHS.find(st => st.name === s.name);
    return (strength?.id || s.name) as StrengthId;
  });

  if (!enableAi) {
    console.info('📦 使用 Mock 数据生成报告解读');
    return {
      data: generateMockReportResult(strengthIds),
      usedMockFallback: true,
      aiDurationMs: null,
    };
  }

  try {
    const aiStartTime = Date.now();
    const result = await generateAiInterpretation(strengthIds, provider, useFastModel);
    const aiDurationMs = Date.now() - aiStartTime;

    return {
      data: result,
      usedMockFallback: false,
      aiDurationMs,
    };
  } catch (error) {
    console.warn('⚠️ AI 生成失败，降级到 Mock 数据:', error);
    return {
      data: generateMockReportResult(strengthIds),
      usedMockFallback: true,
      aiDurationMs: null,
    };
  }
}

export function ensureValidReportResult(
  strengths: StandardStrengthInput[],
  result: ReportInterpretResult
): { data: ReportInterpretResult; usedMockFallback: boolean; aiDurationMs: number | null } {
  if (isValidReportResultData(result)) {
    return { data: result, usedMockFallback: false, aiDurationMs: null };
  }

  console.warn('报告解读结果未通过 schema 校验，降级到 Mock 数据');
  const strengthIds = strengths.map(s => {
    const strength = ALL_STRENGTHS.find(st => st.name === s.name);
    return (strength?.id || s.name) as StrengthId;
  });
  const fallback = generateMockReportResult(strengthIds);

  return { data: fallback, usedMockFallback: true, aiDurationMs: null };
}
