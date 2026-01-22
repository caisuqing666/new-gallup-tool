import { buildStrengthGuidePrompt, parseStrengthGuideResponse } from '@/lib/strength-guide-prompts';
import { generateMockGuideResult } from '@/lib/strength-guide';
import { isValidGuideResultData } from '@/lib/schema';
import { validateConfig } from '@/lib/config-validator';
import { createGuideAIContext, AIProviderType } from '@/lib/ai-context';
import { callAIProvider } from '@/lib/ai-http';
import type { StrengthGuideResult, StrengthId } from '@/lib/types';

type AIProvider = AIProviderType;

interface AIConfig {
  endpoint: string;
  model: string;
  apiKey: string;
  provider: AIProvider;
  groupId?: string;
}

function getAIConfig(provider: AIProvider): AIConfig {
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

  if (provider === 'openai') {
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

async function generateGuideWithAI(
  strengths: StrengthId[],
  provider: AIProvider
): Promise<StrengthGuideResult> {
  const { systemPrompt, userPrompt } = buildStrengthGuidePrompt(strengths);
  const config = getAIConfig(provider);
  const aiContext = createGuideAIContext();

  const content = await callAIProvider(
    config,
    {
      systemPrompt,
      userPrompt,
      maxTokens: 1800,
      temperature: 0.7,
    },
    { timeoutMs: aiContext.timeout }
  );
  return parseStrengthGuideResponse(content);
}

export interface GuideServiceResult {
  data: StrengthGuideResult;
  usedMockFallback: boolean;
  provider?: AIProvider;
  fallbackReason?: string;
}

export async function generateStrengthGuide(
  strengths: StrengthId[]
): Promise<GuideServiceResult> {
  const config = validateConfig();
  const aiEnabled = config.config.aiEnabled && config.valid;
  const minimaxReady = !!process.env.MINIMAX_API_KEY && !!process.env.MINIMAX_GROUP_ID;
  const provider = minimaxReady
    ? 'minimax'
    : ((config.config.aiProvider as AIProvider) || 'zhipu');

  console.log('[优势指南] 配置状态:', {
    aiEnabled: config.config.aiEnabled,
    valid: config.valid,
    errors: config.errors,
    aiProvider: config.config.aiProvider,
    hasApiKey: config.config.hasApiKey,
    model: config.config.model,
    finalAiEnabled: aiEnabled,
    envEnableAi: process.env.ENABLE_AI,
    envProvider: process.env.AI_PROVIDER,
  });

  if (config.config.aiEnabled && !config.valid) {
    console.warn('AI 配置无效，优势指南降级为 Mock', config.errors);
  }

  console.info('Guide provider selection', {
    aiEnabled,
    configValid: config.valid,
    minimaxReady,
    provider,
  });

  if (aiEnabled) {
    try {
      const guideData = await generateGuideWithAI(strengths, provider);

      if (!isValidGuideResultData(guideData)) {
        throw new Error('优势指南结果未通过 schema 校验');
      }

      return {
        data: guideData,
        usedMockFallback: false,
        provider,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isTimeout = errorMessage.includes('aborted') || errorMessage.includes('timeout');
      const aiError = isTimeout
        ? `AI 请求超时 (provider: ${provider})`
        : `AI 生成失败: ${errorMessage}`;
      console.warn('优势指南 AI 生成失败，降级为 Mock:', aiError);
      const mockData = generateMockGuideResult(strengths);
      if (!isValidGuideResultData(mockData)) {
        throw new Error('优势指南结果未通过 schema 校验');
      }
      return {
        data: mockData,
        usedMockFallback: true,
        provider,
        fallbackReason: aiError,
      };
    }
  }

  const mockData = generateMockGuideResult(strengths);
  if (!isValidGuideResultData(mockData)) {
    throw new Error('优势指南结果未通过 schema 校验');
  }
  return {
    data: mockData,
    usedMockFallback: true,
    provider,
    fallbackReason: aiEnabled ? 'AI 生成失败' : 'AI 未启用',
  };
}
