import { generateMockCareerResult } from '@/lib/mock-career';
import { isValidCareerResultData } from '@/lib/schema';
import { validateConfig } from '@/lib/config-validator';
import type { CareerMatchResult, StrengthId } from '@/lib/types';
import { buildCareerMatchPrompt, parseCareerMatchResponse, isValidCareerMatchResult } from '@/lib/career-prompts';
import { createCareerAIContext, AIProviderType } from '@/lib/ai-context';
import { callAIProvider } from '@/lib/ai-http';

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

async function generateCareerWithAI(
  strengths: StrengthId[],
  provider: AIProvider
): Promise<CareerMatchResult> {
  const { systemPrompt, userPrompt } = buildCareerMatchPrompt(strengths);
  const config = getAIConfig(provider);
  const aiContext = createCareerAIContext();

  const content = await callAIProvider(
    config,
    {
      systemPrompt,
      userPrompt,
      maxTokens: 2000,
      temperature: 0.7,
    },
    { timeoutMs: aiContext.timeout }
  );
  return parseCareerMatchResponse(content);
}

export interface CareerServiceResult {
  data: CareerMatchResult;
  usedMockFallback: boolean;
}

export async function generateCareerMatch(
  strengths: StrengthId[]
): Promise<CareerServiceResult> {
  const config = validateConfig();
  const aiEnabled = config.config.aiEnabled && config.valid;
  const strengthIds = strengths;

  console.info('📊 职业匹配 AI 配置状态:', {
    aiEnabled: config.config.aiEnabled,
    configValid: config.valid,
    provider: config.config.aiProvider,
    hasApiKey: config.config.hasApiKey,
    errors: config.errors,
    warnings: config.warnings,
  });

  if (config.config.aiEnabled && !config.valid) {
    console.warn('❌ AI 配置无效，职业匹配降级为 Mock', config.errors);
  }

  if (!config.config.aiEnabled) {
    console.info('ℹ️ AI 未启用 (ENABLE_AI != true)，使用 Mock 数据');
  }

  if (aiEnabled) {
    try {
      const provider = (config.config.aiProvider as AIProvider) || 'zhipu';
      console.info('🤖 调用 AI 生成职业匹配...', {
        provider,
        strengths: strengthIds.join(', '),
      });

      const careerData = await generateCareerWithAI(strengthIds, provider);

      if (!isValidCareerMatchResult(careerData)) {
        throw new Error('职业匹配结果未通过校验');
      }

      return {
        data: careerData,
        usedMockFallback: false,
      };
    } catch (error) {
      console.error('❌ 职业匹配 AI 生成失败，降级为 Mock:', error);
    }
  }

  console.info('📝 使用 Mock 数据生成职业匹配结果');
  const careerData = generateMockCareerResult(strengths);
  if (!isValidCareerResultData(careerData)) {
    throw new Error('职业匹配结果未通过 schema 校验');
  }

  return {
    data: careerData,
    usedMockFallback: true,
  };
}
