// 理解层转译 - AI 生成函数
// 支持智谱GLM4、Anthropic Claude、OpenAI
//
// ============================================================
// 统一 Prompt 构建入口
// ============================================================
// 所有 prompt 构建必须通过 buildPrompt() 函数
// 禁止在其他文件中直接拼接 prompt 字符串
// ============================================================

import {
  ConfusionUnderstanding,
  UnderstandingInput,
} from './understanding-layer';
import {
  buildPrompt,
} from './prompts';
import {
  parseUnderstandingResponse,
} from './understanding-prompts';
import {
  UNDERSTANDING_QA_SYSTEM_PROMPT,
  quickQACheck,
  buildQAPrompt,
  parseQAResponse,
  type UnderstandingQAResult,
} from './understanding-qa';

// 重新导出类型，供外部使用
export type { ConfusionUnderstanding, UnderstandingInput };

// ========================================
// AI 提供商配置
// ========================================

type AIProvider = 'anthropic' | 'openai' | 'zhipu';

interface AIConfig {
  endpoint: string;
  model: string;
  apiKey: string;
  provider: AIProvider;
}

/**
 * 获取 AI 配置
 */
function getAIConfig(provider: AIProvider = 'zhipu'): AIConfig {
  // 智谱 GLM4（默认）
  if (provider === 'zhipu') {
    const apiKey = process.env.ZHIPU_API_KEY || process.env.GLMS_API_KEY;
    if (!apiKey) {
      throw new Error('ZHIPU_API_KEY 未配置。请在 .env.local 中设置 ZHIPU_API_KEY');
    }

    return {
      endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: process.env.ZHIPU_MODEL || 'glm-4-plus',
      apiKey,
      provider: 'zhipu',
    };
  }

  // Anthropic Claude
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

  // OpenAI
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

// ========================================
// AI 调用函数
// ========================================

const API_TIMEOUT = 60000; // 60秒超时

/**
 * 使用智谱 GLM4 生成理解层转译
 */
async function generateWithZhipu(
  systemPrompt: string,
  userPrompt: string
): Promise<ConfusionUnderstanding> {
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
        max_tokens: 4096,
        temperature: 0.2,
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

    return parseUnderstandingResponse(content);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${API_TIMEOUT}ms），请稍后重试`);
    }
    throw error;
  }
}

/**
 * 使用 Anthropic Claude 生成理解层转译
 */
async function generateWithClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<ConfusionUnderstanding> {
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
        max_tokens: 4096,
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

    return parseUnderstandingResponse(content);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${API_TIMEOUT}ms），请稍后重试`);
    }
    throw error;
  }
}

/**
 * 使用 OpenAI 生成理解层转译
 */
async function generateWithOpenAI(
  systemPrompt: string,
  userPrompt: string
): Promise<ConfusionUnderstanding> {
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
        max_tokens: 4096,
        temperature: 0.2,
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

    return parseUnderstandingResponse(content);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${API_TIMEOUT}ms），请稍后重试`);
    }
    throw error;
  }
}

// ========================================
// 统一生成入口
// ========================================

/**
 * 生成理解层转译
 *
 * @param input - 理解层转译输入
 * @param provider - AI 提供商（默认使用智谱 zhipu）
 * @returns 理解层转译结果
 */
export async function generateUnderstanding(
  input: UnderstandingInput,
  provider: AIProvider = 'zhipu'
): Promise<ConfusionUnderstanding> {
  // 使用统一的 buildPrompt 函数构建 prompt
  const { systemPrompt, userPrompt } = buildPrompt({
    pathType: 'understanding-translate',
    params: {
      strengths: [], // 理解层转译不需要优势
      confusion: input.confusion,
      scenarioTitle: input.scenarioTitle,
    },
  });

  console.info('开始生成理解层转译...', {
    provider,
    confusionLength: input.confusion.length,
  });

  try {
    let result: ConfusionUnderstanding;

    if (provider === 'zhipu') {
      result = await generateWithZhipu(systemPrompt, userPrompt);
    } else if (provider === 'anthropic') {
      result = await generateWithClaude(systemPrompt, userPrompt);
    } else {
      result = await generateWithOpenAI(systemPrompt, userPrompt);
    }

    console.info('✓ 理解层转译生成成功:', {
      coreBlock: result.coreBlock.substring(0, 50) + '...',
      decisionTension: result.decisionTension,
    });

    return result;
  } catch {
    console.error('理解层转译生成失败:', error);
    throw error;
  }
}

// ========================================
// Mock 数据（用于测试）
// ========================================

/**
 * 生成 Mock 理解层转译
 */
export function generateMockUnderstanding(
  input: UnderstandingInput
): ConfusionUnderstanding {
  const confusion = input.confusion.toLowerCase();

  // 根据关键词生成 Mock 数据
  if (confusion.includes('信息') || confusion.includes('搜集') || confusion.includes('不确定')) {
    return {
      coreBlock: '行动被"必须足够确定才允许开始"的内部标准阻断',
      falseStrategy: '用"收集更多信息"替代"做出不确定的选择"',
      hiddenCost: '在"准备—验证—再准备"的循环中，时间被消耗，选择并未推进。新的信息不断带来新的变量，确定性永远无法达到行动的阈值。',
      decisionTension: '追求确定 vs 必须选择',
    };
  }

  if (confusion.includes('忙') || confusion.includes('多') || confusion.includes('拒绝')) {
    return {
      coreBlock: '行动被"不能让别人失望"的恐惧锚定在无限制的承诺中',
      falseStrategy: '用"对所有事负责"替代"选择什么最重要"',
      hiddenCost: '在"接活—忙不过来—继续接活"的循环中，能量被分散，核心目标零进展。每增加一个新的承诺，对自己真正重要的目标就又推迟了一步。',
      decisionTension: '对所有事负责 vs 对真正重要的目标负责',
    };
  }

  if (confusion.includes('完美') || confusion.includes('优化') || confusion.includes('不够好')) {
    return {
      coreBlock: '行动被"如果做错就证明我不够好"的自我价值绑定冻结',
      falseStrategy: '用"反复优化"替代"接受够好并推进"',
      hiddenCost: '在"优化已经够好的东西"的过程中，80%的时间投入只换取了最后5%的提升。真正的推进从未开始，因为"足够好"的标准总是在移动。',
      decisionTension: '追求完美 vs 推进到底',
    };
  }

  // 默认 Mock 数据
  return {
    coreBlock: '行动被"必须找到正确答案"的内部标准阻断',
    falseStrategy: '用"继续思考"替代"做出选择"',
    hiddenCost: '在"思考—再思考"的循环中，时间被消耗，真正的推进从未开始。',
    decisionTension: '追求正确 vs 必须选择',
  };
}

// ========================================
// 配置检查
// ========================================

/**
 * 检查 AI 配置
 */
export function checkUnderstandingAIConfig(provider: AIProvider = 'zhipu'): {
  enabled: boolean;
  provider: string;
  hasApiKey: boolean;
  model?: string;
} {
  try {
    const config = getAIConfig(provider);
    return {
      enabled: true,
      provider: config.provider,
      hasApiKey: !!config.apiKey,
      model: config.model,
    };
  } catch {
    return {
      enabled: false,
      provider,
      hasApiKey: false,
    };
  }
}

// ========================================
// QA 自检集成
// ========================================

/**
 * 生成理解层转译（带 QA 自检）
 *
 * @param input - 理解层转译输入
 * @param options - 选项
 * @returns 理解层转译结果 + QA 结果
 */
export async function generateUnderstandingWithQA(
  input: UnderstandingInput,
  options: {
    provider?: AIProvider;
    skipQA?: boolean;  // 跳过 QA 检查（默认 false）
    qaOnFailure?: boolean;  // QA 不通过时是否重试（默认 false）
  } = {}
): Promise<{
  understanding: ConfusionUnderstanding;
  qaResult?: UnderstandingQAResult;
}> {
  const { provider = 'zhipu', skipQA = false, qaOnFailure = false } = options;

  // 第一步：生成理解层转译
  let understanding = await generateUnderstanding(input, provider);

  // 如果跳过 QA，直接返回
  if (skipQA) {
    return { understanding };
  }

  // 第二步：快速本地 QA 检查
  const qaResult = quickQACheck(input.confusion, understanding);

  console.info('✓ QA 自检完成:', {
    passed: qaResult.passed,
    failedChecks: qaResult.checks.filter(c => !c.passed).map(c => c.name),
  });

  // 如果 QA 不通过且启用了失败重试，尝试用 AI 深度检查并重新生成
  if (!qaResult.passed && qaOnFailure) {
    console.warn('QA 自检不通过，尝试 AI 深度检查并重新生成...');

    try {
      const aiQAResult = await performAIQA(input, understanding, provider);

      if (!aiQAResult.passed) {
        // AI QA 也不通过，记录但仍然返回结果
        console.error('AI 深度检查也不通过:', aiQAResult.evaluation);
        return { understanding, qaResult: aiQAResult };
      }

      // AI QA 通过了
      return { understanding, qaResult: aiQAResult };
    } catch (error) {
      console.error('AI 深度检查失败，使用本地 QA 结果:', error);
      return { understanding, qaResult };
    }
  }

  return { understanding, qaResult };
}

/**
 * 执行 AI 深度 QA 检查
 */
async function performAIQA(
  input: UnderstandingInput,
  understanding: ConfusionUnderstanding,
  provider: AIProvider
): Promise<UnderstandingQAResult> {
  const config = getAIConfig(provider);
  const userPrompt = buildQAPrompt({
    userConfusion: input.confusion,
    understanding,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    let content: string;

    if (provider === 'zhipu') {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: UNDERSTANDING_QA_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 2048,
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`智谱 API 错误 (${response.status}): ${error}`);
      }

      const data = await response.json();
      content = data.choices[0].message.content;
    } else if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 2048,
          system: UNDERSTANDING_QA_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API 错误 (${response.status}): ${error}`);
      }

      const data = await response.json();
      content = data.content[0].text;
    } else {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: UNDERSTANDING_QA_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 2048,
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API 错误 (${response.status}): ${error}`);
      }

      const data = await response.json();
      content = data.choices[0].message.content;
    }

    clearTimeout(timeoutId);
    return parseQAResponse(content);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI QA 请求超时（${API_TIMEOUT}ms）`);
    }
    throw error;
  }
}

// 重新导出 QA 相关类型和 Prompt（供外部使用）
export { UNDERSTANDING_QA_SYSTEM_PROMPT } from './understanding-qa';
export type { UnderstandingQAResult, QACheck, UnderstandingQAInput } from './understanding-qa';
