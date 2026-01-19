// 优势发挥指南 API 路由
// 根据用户选择的 TOP5 优势生成个性化的发挥指南

import { NextRequest, NextResponse } from 'next/server';
import { generateMockGuideResult } from '@/lib/strength-guide';
import { isValidGuideResultData } from '@/lib/schema';
import { StrengthGuideResult, StrengthId } from '@/lib/types';
import { buildStrengthGuidePrompt, parseStrengthGuideResponse } from '@/lib/strength-guide-prompts';
import { validateConfig } from '@/lib/config-validator';
import { Locale } from '@/i18n/config';

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

// Vercel Serverless 函数超时限制：Hobby 10s，Pro 60s
// 在 Vercel 上缩短超时时间，避免平台强制超时导致 504。
const API_TIMEOUT = (() => {
  const envTimeout = Number(process.env.AI_TIMEOUT_MS);
  if (Number.isFinite(envTimeout) && envTimeout > 0) {
    return envTimeout;
  }
  return process.env.VERCEL ? 8000 : 55000;
})();

async function generateGuideWithAI(
  strengths: StrengthId[],
  provider: AIProvider
): Promise<StrengthGuideResult> {
  const { systemPrompt, userPrompt } = buildStrengthGuidePrompt(strengths);
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
          max_tokens: 1800,
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
      return parseStrengthGuideResponse(content);
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
          max_tokens: 1800,
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
      return parseStrengthGuideResponse(content);
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
          max_tokens: 1800,
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
      return parseStrengthGuideResponse(content);
    }

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 1800,
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
    return parseStrengthGuideResponse(content);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strengths, locale } = body;

    // 验证 locale 参数
    const currentLocale = (locale as Locale | undefined) || 'zh';
    if (typeof currentLocale !== 'string' || !['zh', 'en'].includes(currentLocale)) {
      return NextResponse.json(
        { error: 'locale 必须是 "zh" 或 "en"' },
        { status: 400 }
      );
    }

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

    // 详细日志：输出配置状态
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

    let aiError: string | undefined;
    const provider = (config.config.aiProvider as AIProvider) || 'zhipu';

    if (aiEnabled) {

      try {
        const guideData = await generateGuideWithAI(strengthIds, provider);

        if (!isValidGuideResultData(guideData)) {
          throw new Error('优势指南结果未通过 schema 校验');
        }

        return NextResponse.json({
          success: true,
          data: guideData,
          metadata: {
            usedMockFallback: false,
            processingTimeMs: Date.now() - startTime,
            provider,
            version: '1.0.0',
            locale: currentLocale,
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isTimeout = errorMessage.includes('aborted') || errorMessage.includes('timeout');
        aiError = isTimeout
          ? `AI 请求超时 (provider: ${provider})`
          : `AI 生成失败: ${errorMessage}`;
        console.warn('优势指南 AI 生成失败，降级为 Mock:', aiError);

        // 超时也降级为 Mock，避免 Vercel 平台返回 504
      }
    }

    const guideData = generateMockGuideResult(strengthIds);
    if (!isValidGuideResultData(guideData)) {
      console.error('优势指南结果未通过 schema 校验');
      return NextResponse.json(
        { error: '优势指南结果格式错误' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: guideData,
      metadata: {
        usedMockFallback: true,
        fallbackReason: aiError || (aiEnabled ? 'AI 生成失败' : 'AI 未启用'),
        processingTimeMs: Date.now() - startTime,
        version: '1.0.0',
        locale: currentLocale,
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
