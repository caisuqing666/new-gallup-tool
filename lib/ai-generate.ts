// AI 生成服务（统一入口）
// 解释页和判定页完全分离

import { ExplainData, DecideData, GallupResult } from './types';
import { ScenarioId, StrengthId, ProblemType, ProblemFocus } from './types';
import {
  buildPrompt,
  ExplainOutput,
  DecideOutput,
  buildContextPack,
  ContextPack,
  PROBLEM_LOCK_PROMPT,
} from './prompts';
import { generateMockResult } from './mock-data';
import { buildAnalysisContext, generateExplainFromContext, generateDecideFromContext } from './context-generator';
import {
  generateUnderstanding,
  type ConfusionUnderstanding,
  type UnderstandingInput,
} from './generate-understanding';

// ========================================
// 环境变量配置
// ========================================

// Feature flag：控制是否使用 AI（默认为 false，使用 Mock）
export const ENABLE_AI = process.env.ENABLE_AI === 'true' || process.env.NEXT_PUBLIC_ENABLE_AI === 'true';

// AI 提供商选择（anthropic、openai、zhipu 或 minimax）
const AI_PROVIDER = (process.env.AI_PROVIDER || 'anthropic') as 'anthropic' | 'openai' | 'zhipu' | 'minimax';

// AI API 配置
const getAIConfig = () => {
  const provider = AI_PROVIDER;

  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY 未配置。请在 .env.local 中设置 ANTHROPIC_API_KEY，或设置 ENABLE_AI=false 使用 Mock 数据');
    }

    return {
      endpoint: 'https://api.anthropic.com/v1/messages',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      apiKey,
      provider: 'anthropic' as const,
    };
  }

  if (provider === 'zhipu') {
    const apiKey = process.env.ZHIPU_API_KEY || process.env.GLMS_API_KEY;
    if (!apiKey) {
      throw new Error('ZHIPU_API_KEY 未配置。请在 .env.local 中设置 ZHIPU_API_KEY，或设置 ENABLE_AI=false 使用 Mock 数据');
    }

    return {
      endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: process.env.ZHIPU_MODEL || 'glm-4-plus',
      apiKey,
      provider: 'zhipu' as const,
    };
  }

  if (provider === 'minimax') {
    const apiKey = process.env.MINIMAX_API_KEY;
    const groupId = process.env.MINIMAX_GROUP_ID;
    if (!apiKey) {
      throw new Error('MINIMAX_API_KEY 未配置。请在 .env.local 中设置 MINIMAX_API_KEY，或设置 ENABLE_AI=false 使用 Mock 数据');
    }
    if (!groupId) {
      throw new Error('MINIMAX_GROUP_ID 未配置。请在 .env.local 中设置 MINIMAX_GROUP_ID');
    }

    return {
      endpoint: process.env.MINIMAX_ENDPOINT || 'https://api.minimax.chat/v1/text/chatcompletion_v2',
      model: process.env.MINIMAX_MODEL || 'abab6.5-chat',
      apiKey,
      groupId,
      provider: 'minimax' as const,
    };
  }

  // openai
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 未配置。请在 .env.local 中设置 OPENAI_API_KEY，或设置 ENABLE_AI=false 使用 Mock 数据');
  }

  return {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    apiKey,
    provider: 'openai' as const,
  };
};

// 获取超时配置
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || '60000', 10);

// ========================================
// AI 生成函数 - 解释页
// ========================================

async function generateExplainWithClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<ExplainData> {
  const config = getAIConfig();

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
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
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

    return parseExplainResponse(content);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${API_TIMEOUT}ms），请稍后重试`);
    }
    throw error;
  }
}

async function generateExplainWithOpenAI(
  systemPrompt: string,
  userPrompt: string
): Promise<ExplainData> {
  const config = getAIConfig();

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
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        response_format: { type: 'json_object' },
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

    return parseExplainResponse(content);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${API_TIMEOUT}ms），请稍后重试`);
    }
    throw error;
  }
}

// 解析解释页响应
function parseExplainResponse(content: string): ExplainData {
  try {
    const rawResult = JSON.parse(content) as ExplainOutput;
    return rawResult;
  } catch (e) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const rawResult = JSON.parse(jsonMatch[0]) as ExplainOutput;
      return rawResult;
    }
    throw new Error('AI 返回的解释页响应格式不正确，无法解析 JSON');
  }
}

// ========================================
// AI 生成函数 - 判定页
// ========================================

async function generateDecideWithClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<DecideOutput> {
  const config = getAIConfig();

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
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
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

    return parseDecideResponse(content);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${API_TIMEOUT}ms），请稍后重试`);
    }
    throw error;
  }
}

async function generateDecideWithOpenAI(
  systemPrompt: string,
  userPrompt: string
): Promise<DecideOutput> {
  const config = getAIConfig();

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
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        response_format: { type: 'json_object' },
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

    return parseDecideResponse(content);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${API_TIMEOUT}ms），请稍后重试`);
    }
    throw error;
  }
}

// 解析判定页响应
function parseDecideResponse(content: string): DecideOutput {
  try {
    const rawResult = JSON.parse(content) as DecideOutput;
    return rawResult;
  } catch (e) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const rawResult = JSON.parse(jsonMatch[0]) as DecideOutput;
      return rawResult;
    }
    throw new Error('AI 返回的判定页响应格式不正确，无法解析 JSON');
  }
}

// ========================================
// AI 生成函数 - Zhipu（智谱）
// ========================================

async function generateExplainWithZhipu(
  systemPrompt: string,
  userPrompt: string
): Promise<ExplainData> {
  const config = getAIConfig();

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
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Zhipu API 错误 (${response.status}): ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return parseExplainResponse(content);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${API_TIMEOUT}ms），请稍后重试`);
    }
    throw error;
  }
}

async function generateDecideWithZhipu(
  systemPrompt: string,
  userPrompt: string
): Promise<DecideOutput> {
  const config = getAIConfig();

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
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Zhipu API 错误 (${response.status}): ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return parseDecideResponse(content);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${API_TIMEOUT}ms），请稍后重试`);
    }
    throw error;
  }
}

// ========================================
// AI 生成函数 - Minimax
// ========================================

async function generateExplainWithMinimax(
  systemPrompt: string,
  userPrompt: string
): Promise<ExplainData> {
  const config = getAIConfig();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  // 构建带 GroupId 的完整 URL
  const fullUrl = `${config.endpoint}?GroupId=${(config as any).groupId}`;

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

    return parseExplainResponse(content);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${API_TIMEOUT}ms），请稍后重试`);
    }
    throw error;
  }
}

async function generateDecideWithMinimax(
  systemPrompt: string,
  userPrompt: string
): Promise<DecideOutput> {
  const config = getAIConfig();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  // 构建带 GroupId 的完整 URL
  const fullUrl = `${config.endpoint}?GroupId=${(config as any).groupId}`;

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

    return parseDecideResponse(content);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${API_TIMEOUT}ms），请稍后重试`);
    }
    throw error;
  }
}

// ========================================
// 问题锁定
// ========================================

/**
 * 锁定用户当前想解决的核心问题
 */
async function lockProblem(
  scenario: string,
  confusion: string,
  config: ReturnType<typeof getAIConfig>
): Promise<string> {
  const problemLockPrompt = `场景：${scenario}

用户描述的困惑：
${confusion}

请用一句话复述用户"此刻最想解决的问题"。`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    if (config.provider === 'anthropic') {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 500,
          system: PROBLEM_LOCK_PROMPT,
          messages: [
            {
              role: 'user',
              content: problemLockPrompt,
            },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API 错误 (${response.status}): ${error}`);
      }

      const data = await response.json();
      return data.content[0].text.trim();
    } else {
      // OpenAI
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: PROBLEM_LOCK_PROMPT,
            },
            {
              role: 'user',
              content: problemLockPrompt,
            },
          ],
          max_tokens: 500,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API 错误 (${response.status}): ${error}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${API_TIMEOUT}ms），请稍后重试`);
    }
    throw error;
  }
}

// ========================================
// 统一的生成入口
// ========================================

/**
 * 生成盖洛普优势分析结果
 * @param scenario - 场景 ID
 * @param strengths - 优势 ID 列表
 * @param confusion - 用户困惑描述
 * @param problemType - 问题类型（系统级硬约束）
 * @param problemFocus - 问题焦点（系统级硬约束，Decide 的双重锁定）
 * @param useAI - 是否使用 AI（默认使用环境变量配置）
 * @returns 生成的结果数据
 */
export async function generateResult(
  scenario: ScenarioId,
  strengths: StrengthId[],
  confusion: string,
  problemType: ProblemType,
  problemFocus: ProblemFocus,
  useAI: boolean = ENABLE_AI
): Promise<GallupResult> {
  // ═══════════════════════════════════════════════════════════
  // 第零步：构建 Context Pack（无论 AI 还是 Mock 都需要）
  // confusion-parser → strength-profiles → combo-rules → Context Pack
  // ═══════════════════════════════════════════════════════════
  let contextPack: ContextPack | undefined;
  try {
    contextPack = buildContextPack(strengths, confusion);
    console.info('✓ 已构建 Context Pack:', {
      problemType: contextPack.confusion.problemType,
      problemFocus: contextPack.confusion.problemFocus,
      strengths: contextPack.strengths.map(s => s.name),
      traps: contextPack.combo.traps.length,
      blindspots: contextPack.combo.blindspots.length,
    });
  } catch (error) {
    console.warn('Context Pack 构建失败，将使用原始参数:', error);
  }

  // 如果未启用 AI，直接使用 Mock（使用新的数据流管道）
  if (!useAI) {
    return generateMockResult(scenario, strengths, confusion, problemType, problemFocus, true);
  }

  // 检查 AI 配置
  let config: ReturnType<typeof getAIConfig>;
  try {
    config = getAIConfig();
  } catch (error) {
    console.warn('AI 配置错误，回退到 Mock:', error);
    return generateMockResult(scenario, strengths, confusion, problemType, problemFocus, true);
  }

  // AI 生成流程
  try {
    // 动态导入（减少初始包大小）
    const { ALL_STRENGTHS } = await import('./gallup-strengths');
    const { SCENARIOS } = await import('./scenarios');

    const strengthNames = strengths.map(id => {
      const strength = ALL_STRENGTHS.find(s => s.id === id);
      return strength?.name || id;
    });

    const scenarioTitle = SCENARIOS.find(s => s.id === scenario)?.title || scenario;

    // ═══════════════════════════════════════════════════════════
    // 第零步：生成理解层转译
    // 将用户的困惑，转译为「揭示内在控制机制」的结构化理解
    // ═══════════════════════════════════════════════════════════
    let confusionUnderstanding: ConfusionUnderstanding | undefined;
    try {
      const understandingInput: UnderstandingInput = {
        confusion,
        scenarioTitle,
      };
      // 默认使用智谱 GLM4
      confusionUnderstanding = await generateUnderstanding(understandingInput, 'zhipu');
      console.info('✓ 已生成理解层转译:', {
        coreBlock: confusionUnderstanding.coreBlock.substring(0, 40) + '...',
        decisionTension: confusionUnderstanding.decisionTension,
      });
    } catch (error) {
      console.warn('理解层转译生成失败，将继续使用基础流程:', error);
      // 理解层转译失败不影响后续流程
    }

    // 第一步：锁定"用户当前问题"（作为后续所有内容的"问题锚点"）
    let lockedProblem: string;
    try {
      lockedProblem = await lockProblem(scenarioTitle, confusion, config);
      console.info('✓ 已锁定用户当前问题:', lockedProblem);
    } catch (error) {
      console.warn('问题锁定失败，将直接使用用户原始描述:', error);
      // 如果有 Context Pack，使用解析后的 problemFocus
      lockedProblem = contextPack?.confusion.problemFocus || `用户问题：${confusion}`;
    }

    // 第二步：使用统一的 buildPrompt 函数构建 prompt
    // 这是唯一的 prompt 构建入口，确保所有路径使用一致的规范
    const explainPrompt = buildPrompt({
      pathType: 'breakthrough-explain',
      params: {
        strengths,
        confusion,
        problemType,
        problemFocus,
        contextPack,
      },
    });

    const decidePrompt = buildPrompt({
      pathType: 'breakthrough-decide',
      params: {
        strengths,
        confusion,
        problemType,
        problemFocus,
        contextPack,
        understanding: confusionUnderstanding,
      },
    });

    console.info(`✓ 已应用问题类型硬约束: ${problemType}`);
    console.info(`✓ 已应用问题焦点锁定: ${problemFocus}`);
    if (contextPack) {
      console.info('✓ 已注入 Context Pack 到系统 Prompt');
    }

    // 第四步：并行生成解释页和判定页
    const [explainData, decideData] = await Promise.all([
      (async () => {
        if (config.provider === 'anthropic') {
          try {
            return await generateExplainWithClaude(explainPrompt.systemPrompt, explainPrompt.userPrompt);
          } catch (claudeError) {
            console.warn('Claude API (解释页) 调用失败:', claudeError);
            // 尝试 OpenAI 备用
            const openaiKey = process.env.OPENAI_API_KEY;
            if (openaiKey) {
              console.info('尝试使用 OpenAI 作为备用方案（解释页）');
              return await generateExplainWithOpenAI(explainPrompt.systemPrompt, explainPrompt.userPrompt);
            }
            throw claudeError;
          }
        } else if (config.provider === 'zhipu') {
          return await generateExplainWithZhipu(explainPrompt.systemPrompt, explainPrompt.userPrompt);
        } else if (config.provider === 'minimax') {
          return await generateExplainWithMinimax(explainPrompt.systemPrompt, explainPrompt.userPrompt);
        } else {
          return await generateExplainWithOpenAI(explainPrompt.systemPrompt, explainPrompt.userPrompt);
        }
      })(),
      (async () => {
        if (config.provider === 'anthropic') {
          try {
            return await generateDecideWithClaude(decidePrompt.systemPrompt, decidePrompt.userPrompt);
          } catch (claudeError) {
            console.warn('Claude API (判定页) 调用失败:', claudeError);
            // 尝试 OpenAI 备用
            const openaiKey = process.env.OPENAI_API_KEY;
            if (openaiKey) {
              console.info('尝试使用 OpenAI 作为备用方案（判定页）');
              return await generateDecideWithOpenAI(decidePrompt.systemPrompt, decidePrompt.userPrompt);
            }
            throw claudeError;
          }
        } else if (config.provider === 'zhipu') {
          return await generateDecideWithZhipu(decidePrompt.systemPrompt, decidePrompt.userPrompt);
        } else if (config.provider === 'minimax') {
          return await generateDecideWithMinimax(decidePrompt.systemPrompt, decidePrompt.userPrompt);
        } else {
          return await generateDecideWithOpenAI(decidePrompt.systemPrompt, decidePrompt.userPrompt);
        }
      })(),
    ]);

    const ensuredReframedInsight = ensureReframedInsight({
      reframedInsight: decideData.reframedInsight,
      confusion,
      problemFocus,
      understanding: confusionUnderstanding,
    });

    if (ensuredReframedInsight) {
      decideData.reframedInsight = ensuredReframedInsight;
    }

    const ensuredExplainData = ensureExplainData({
      explainData,
      scenario,
      strengths,
      confusion,
      problemFocus: contextPack?.confusion.problemFocus || problemFocus,
    });

    const ensuredDecideData = ensureDecideData({
      decideData,
      scenario,
      strengths,
      strengthNames,
      confusion,
      problemFocus,
      understanding: confusionUnderstanding,
    });

    return {
      explain: ensuredExplainData,
      decide: ensuredDecideData,
    };
  } catch (error) {
    console.error('AI 生成失败，回退到 Mock:', error);
    return generateMockResult(scenario, strengths, confusion, problemType, problemFocus, true);
  }
}

// ========================================
// 导出
// ========================================

export { buildUserPrompt };

const REFRAIN_WORDS = /应该|需要|建议|不如/;
const REQUIRED_STRUCTURE = /你并不是.{1,24}而是.{1,32}结果.{1,32}/;
const EXPLAIN_BANNED_PHRASES = [
  '过度依赖这个优势',
  '当前场景中用力过猛',
  '反而形成阻碍',
  '换成另一个人也成立',
];
const GENERIC_BANNED_PHRASES = [
  '加油',
  '别焦虑',
  '放轻松',
  '慢慢来',
  '保持积极',
  '保持乐观',
  '多想一想',
  '提升自己',
  '调整心态',
  '继续努力',
  '坚持下去',
  '好好沟通',
  '换个角度想',
  '不要太在意',
];
const ENERGY_KEYWORDS = ['驱动力', '代价区', '地下室', '能量', '消耗', '榨干'];

function normalizeTextForOverlap(text: string): string {
  return text.replace(/[\s，。！？、,.!?;:;"'“”‘’（）()【】\[\]…—-]/g, '');
}

function hasSubstringOverlap(base: string, target: string, minLength: number): boolean {
  if (base.length < minLength || target.length < minLength) return false;
  for (let i = 0; i <= base.length - minLength; i += 1) {
    const slice = base.slice(i, i + minLength);
    if (target.includes(slice)) return true;
  }
  return false;
}

function isReframedInsightValid(insight: string, confusion: string): boolean {
  const trimmed = insight.trim();
  if (!trimmed) return false;
  if (trimmed.length < 24 || trimmed.length > 60) return false;
  if (REFRAIN_WORDS.test(trimmed)) return false;
  if (!trimmed.includes('你并不是')) return false;
  if (!REQUIRED_STRUCTURE.test(trimmed)) return false;

  const normalizedInsight = normalizeTextForOverlap(trimmed);
  const normalizedConfusion = normalizeTextForOverlap(confusion);
  if (hasSubstringOverlap(normalizedConfusion, normalizedInsight, 4)) return false;

  return true;
}

function buildInsightFromUnderstanding(understanding: ConfusionUnderstanding): string {
  const coreBlock = understanding.coreBlock.replace(/^行动被/, '').replace(/阻断$/, '');
  const hiddenCost = understanding.hiddenCost.split('。')[0] || understanding.hiddenCost;
  return `你并不是不想行动，而是行动被“${coreBlock}”卡住，结果${hiddenCost.replace(/^在/, '')}。`;
}

function buildInsightFromFocus(problemFocus: string): string {
  return `你并不是不想推进，而是把“再等等”当成稳妥，结果在「${problemFocus.slice(0, 12)}」上一直拖延。`;
}

function ensureReframedInsight(input: {
  reframedInsight?: string;
  confusion: string;
  problemFocus: string;
  understanding?: ConfusionUnderstanding;
}): string | undefined {
  const { reframedInsight, confusion, problemFocus, understanding } = input;

  if (reframedInsight && isReframedInsightValid(reframedInsight, confusion)) {
    return reframedInsight;
  }

  if (understanding) {
    const fromUnderstanding = buildInsightFromUnderstanding(understanding);
    if (isReframedInsightValid(fromUnderstanding, confusion)) {
      return fromUnderstanding;
    }
  }

  const fromFocus = buildInsightFromFocus(problemFocus);
  if (isReframedInsightValid(fromFocus, confusion)) {
    return fromFocus;
  }

  return undefined;
}

function normalizeExplainText(text: string): string {
  return text.replace(/[\s，。！？、,.!?;:;"'“”‘’（）()【】\[\]…—-]/g, '');
}

function containsProblemFocus(text: string, problemFocus: string): boolean {
  if (!problemFocus) return true;
  return normalizeExplainText(text).includes(normalizeExplainText(problemFocus));
}

function hasBannedPhrase(text: string): boolean {
  return EXPLAIN_BANNED_PHRASES.some(phrase => text.includes(phrase));
}

function hasGenericPhrase(text: string): boolean {
  return GENERIC_BANNED_PHRASES.some(phrase => text.includes(phrase));
}

function hasEnergyKeyword(text: string): boolean {
  return ENERGY_KEYWORDS.some(keyword => text.includes(keyword));
}

function hasStrengthName(text: string, strengthNames: string[]): boolean {
  return strengthNames.some(name => name && text.includes(name));
}

function isExplainDataValid(input: {
  explainData: ExplainData;
  problemFocus: string;
}): boolean {
  const { explainData, problemFocus } = input;

  if (!explainData || !Array.isArray(explainData.strengthManifestations)) return false;
  if (explainData.strengthManifestations.length < 1) return false;
  if (!explainData.strengthInteractions || explainData.strengthInteractions.length < 12) return false;
  if (!explainData.blindspots || explainData.blindspots.length < 12) return false;
  if (!explainData.summary || explainData.summary.length < 8) return false;

  const normalizedBehaviors = new Set<string>();
  let focusHit = false;

  for (const item of explainData.strengthManifestations) {
    if (!item?.strengthId || !item?.behaviors) return false;
    if (item.behaviors.length < 18) return false;
    if (hasBannedPhrase(item.behaviors)) return false;
    if (hasGenericPhrase(item.behaviors)) return false;
    const normalized = normalizeExplainText(item.behaviors);
    if (normalizedBehaviors.has(normalized)) return false;
    normalizedBehaviors.add(normalized);
    if (containsProblemFocus(item.behaviors, problemFocus)) {
      focusHit = true;
    }
  }

  if (!focusHit) {
    const combined = `${explainData.strengthInteractions} ${explainData.blindspots} ${explainData.summary}`;
    focusHit = containsProblemFocus(combined, problemFocus);
  }

  const combinedText = `${explainData.strengthInteractions} ${explainData.blindspots} ${explainData.summary}`;
  if (hasGenericPhrase(combinedText)) return false;
  if (!hasEnergyKeyword(combinedText)) return false;

  return focusHit;
}

function ensureExplainData(input: {
  explainData: ExplainData;
  scenario: ScenarioId;
  strengths: StrengthId[];
  confusion: string;
  problemFocus: string;
}): ExplainData {
  const { explainData, scenario, strengths, confusion, problemFocus } = input;

  if (isExplainDataValid({ explainData, problemFocus })) {
    return explainData;
  }

  console.warn('解释页输出未通过质量检查，改用结构化生成。');
  const ctx = buildAnalysisContext(scenario, strengths, confusion);
  return generateExplainFromContext(ctx);
}

function isDecideDataValid(input: {
  decideData: DecideOutput;
  problemFocus: string;
  strengthNames: string[];
  understanding?: ConfusionUnderstanding;
}): boolean {
  const { decideData, problemFocus, strengthNames, understanding } = input;
  if (!decideData?.pathDecision) return false;
  if (!decideData?.pathLogic || decideData.pathLogic.length < 20) return false;
  if (!decideData?.pathReason || decideData.pathReason.length < 16) return false;
  if (!Array.isArray(decideData.doMore) || decideData.doMore.length < 1) return false;
  if (!Array.isArray(decideData.doLess) || decideData.doLess.length < 1) return false;
  if (!Array.isArray(decideData.boundaries) || decideData.boundaries.length < 1) return false;
  if (!decideData.checkRule || decideData.checkRule.length < 10) return false;

  const combined = [
    decideData.pathLogic,
    decideData.pathReason,
    decideData.checkRule,
    ...decideData.doMore.map(item => item.action),
    ...decideData.doLess.map(item => item.action),
  ].join(' ');

  if (!containsProblemFocus(combined, problemFocus)) return false;
  if (!hasStrengthName(decideData.pathLogic, strengthNames)) return false;
  if (!hasStrengthName(decideData.pathReason, strengthNames)) return false;
  if (!hasStrengthName(combined, strengthNames)) return false;
  if (hasGenericPhrase(combined)) return false;
  if (!hasEnergyKeyword(combined)) return false;

  if (understanding) {
    const understandingFields = [
      understanding.coreBlock,
      understanding.falseStrategy,
      understanding.hiddenCost,
      understanding.decisionTension,
    ];
    const hasUnderstanding = understandingFields.every(field => field && combined.includes(field));
    if (!hasUnderstanding) return false;
  }

  return true;
}

function ensureDecideData(input: {
  decideData: DecideOutput;
  scenario: ScenarioId;
  strengths: StrengthId[];
  strengthNames: string[];
  confusion: string;
  problemFocus: string;
  understanding?: ConfusionUnderstanding;
}): DecideData {
  const { decideData, scenario, strengths, strengthNames, confusion, problemFocus, understanding } = input;

  if (isDecideDataValid({ decideData, problemFocus, strengthNames, understanding })) {
    return {
      ...decideData,
      problemFocus,
      doMore: decideData.doMore.slice(0, 2),
      doLess: decideData.doLess.slice(0, 2),
      boundaries: decideData.boundaries.slice(0, 2),
    };
  }

  console.warn('判定页输出未通过质量检查，改用结构化生成。', {
    problemFocus,
    strengths: strengthNames,
  });
  const ctx = buildAnalysisContext(scenario, strengths, confusion);
  const fallback = generateDecideFromContext(ctx);
  return {
    ...fallback,
    doMore: fallback.doMore.slice(0, 2),
    doLess: fallback.doLess.slice(0, 2),
    boundaries: fallback.boundaries.slice(0, 2),
  };
}

/**
 * 构建用户 Prompt
 */
function buildUserPrompt(
  strengthNames: string[],
  scenarioTitle: string,
  confusion: string,
  lockedProblem: string
): string {
  return `我的盖洛普优势：${strengthNames.join('、')}

当前场景：${scenarioTitle}

我的困惑：${confusion}

我最想解决的问题：${lockedProblem}`;
}

// 导出配置检查函数（用于调试）
export function checkAIConfig(): {
  enabled: boolean;
  provider?: string;
  hasApiKey?: boolean;
  model?: string;
} {
  const enabled = ENABLE_AI;

  if (!enabled) {
    return { enabled: false };
  }

  const provider = AI_PROVIDER;
  const hasApiKey = provider === 'anthropic'
    ? !!process.env.ANTHROPIC_API_KEY
    : !!process.env.OPENAI_API_KEY;

  const model = provider === 'anthropic'
    ? process.env.ANTHROPIC_MODEL
    : process.env.OPENAI_MODEL;

  return {
    enabled: true,
    provider,
    hasApiKey,
    model,
  };
}
