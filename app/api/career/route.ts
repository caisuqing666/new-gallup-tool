// 职业匹配 API 路由
// 根据用户选择的 TOP5 优势生成职业匹配分析

import { NextRequest, NextResponse } from 'next/server';
import { generateMockCareerResult } from '@/lib/mock-career';
import { isValidCareerResultData } from '@/lib/schema';
import { validateConfig } from '@/lib/config-validator';
import { CareerMatchResult, StrengthId } from '@/lib/types';
import {
  buildCareerMatchPrompt,
  parseCareerMatchResponse,
  isValidCareerMatchResult,
} from '@/lib/career-prompts';

type AIProvider = 'anthropic' | 'openai' | 'zhipu' | 'minimax';

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

const API_TIMEOUT = 120000;

async function generateCareerWithAI(
  strengths: StrengthId[],
  provider: AIProvider
): Promise<CareerMatchResult> {
  const { systemPrompt, userPrompt } = buildCareerMatchPrompt(strengths);
  const config = getAIConfig(provider);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    if (config.provider === 'zhipu') {
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
          max_tokens: 2000,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`智谱 API 错误 (${response.status}): ${error}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      return parseCareerMatchResponse(content);
    }

    if (config.provider === 'minimax') {
      const fullUrl = `${config.endpoint}?GroupId=${config.groupId}`;
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
          max_tokens: 2000,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Minimax API 错误 (${response.status}): ${error}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      return parseCareerMatchResponse(content);
    }

    if (config.provider === 'openai') {
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
          max_tokens: 2000,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API 错误 (${response.status}): ${error}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      return parseCareerMatchResponse(content);
    }

    // Anthropic Claude
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API 错误 (${response.status}): ${error}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    return parseCareerMatchResponse(content);
  } finally {
    clearTimeout(timeoutId);
  }
}

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
    const startTime = Date.now();
    const config = validateConfig();
    const aiEnabled = config.config.aiEnabled && config.valid;
    const strengthIds = strengths as StrengthId[];

    // 详细日志：帮助诊断 AI 配置状态
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

        return NextResponse.json({
          success: true,
          data: careerData,
          metadata: {
            usedMockFallback: false,
            processingTimeMs: Date.now() - startTime,
            version: '1.0.0',
          },
        });
      } catch (error) {
        console.error('❌ 职业匹配 AI 生成失败，降级为 Mock:', error);
      }
    }

    // 生成 Mock 数据
    console.info('📝 使用 Mock 数据生成职业匹配结果');
    const careerData = generateMockCareerResult(strengths);
    if (!isValidCareerResultData(careerData)) {
      console.error('职业匹配结果未通过 schema 校验');
      return NextResponse.json(
        { error: '职业匹配结果格式错误' },
        { status: 500 }
      );
    }

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
