/**
 * AI 上下文对象
 * 
 * 替代直接修改 process.env 的全局污染方式
 * 每个请求都有自己的隔离上下文，避免高并发下的相互影响
 * 
 * 使用示例：
 * ```
 * const context = createAIContext({ provider: 'zhipu' });
 * const result = await generateResult(..., context);
 * ```
 */

export type AIProviderType = 'anthropic' | 'openai' | 'zhipu' | 'minimax';

/**
 * AI 请求的执行上下文
 * 包含所有与 AI 调用相关的配置，避免依赖全局 process.env
 */
export interface AIContext {
  /** 是否启用 AI（false 则降级使用 Mock） */
  enableAI: boolean;

  /** AI 服务提供商 */
  provider: AIProviderType;

  /** 单次请求的超时时间（毫秒） */
  timeout: number;

  /** 失败重试次数 */
  retryCount: number;

  /** API 密钥（可选，如果需要显式传递） */
  apiKey?: string;

  /** 模型名称（可选，如果需要显式传递） */
  model?: string;
}

/**
 * 从环境变量创建 AI 上下文
 * 
 * 注意：此函数只读取 process.env，不修改全局状态
 * 
 * @param overrides 可选的配置覆盖
 * @returns 隔离的 AI 上下文对象
 */
export function createAIContext(overrides?: Partial<AIContext>): AIContext {
  const provider = (process.env.AI_PROVIDER || 'anthropic') as AIProviderType;
  const enableAI = process.env.ENABLE_AI === 'true' || process.env.NEXT_PUBLIC_ENABLE_AI === 'true';

  return {
    enableAI,
    provider,
    timeout: parseInt(process.env.API_TIMEOUT || '60000', 10),
    retryCount: 2,
    ...overrides, // 允许覆盖任何配置
  };
}

/**
 * 为优势指南 API 创建专用上下文
 * 
 * 指南任务相对轻量级，应该使用更短的超时时间，以便快速降级到 Mock
 * 在 Vercel Pro 上的函数超时限制为 60s，但我们应该更激进地降级
 * 
 * @param overrides 可选的配置覆盖
 * @returns 指南 API 专用的 AI 上下文
 */
export function createGuideAIContext(overrides?: Partial<AIContext>): AIContext {
  // Vercel 环境下使用更短的超时时间
  const baseTimeout = process.env.VERCEL ? 12000 : 55000;

  return createAIContext({
    timeout: baseTimeout,
    ...overrides,
  });
}

/**
 * 为生成结果 API 创建专用上下文
 * 
 * 生成突破方案的任务更复杂，可能涉及竞速（Zhipu vs Minimax）
 * 需要更长的超时时间
 * 
 * @param overrides 可选的配置覆盖
 * @returns 生成 API 专用的 AI 上下文
 */
export function createGenerateAIContext(overrides?: Partial<AIContext>): AIContext {
  return createAIContext({
    timeout: parseInt(process.env.API_TIMEOUT || '60000', 10),
    ...overrides,
  });
}

/**
 * 为职业匹配 API 创建专用上下文
 * 
 * @param overrides 可选的配置覆盖
 * @returns 职业匹配 API 专用的 AI 上下文
 */
export function createCareerAIContext(overrides?: Partial<AIContext>): AIContext {
  return createAIContext({
    timeout: parseInt(process.env.API_TIMEOUT || '55000', 10),
    ...overrides,
  });
}

/**
 * 为报告解读 API 创建专用上下文
 * 
 * @param overrides 可选的配置覆盖
 * @returns 报告解读 API 专用的 AI 上下文
 */
export function createInterpretAIContext(overrides?: Partial<AIContext>): AIContext {
  return createAIContext({
    timeout: parseInt(process.env.API_TIMEOUT || '55000', 10),
    ...overrides,
  });
}

/**
 * 调试辅助：检查当前的 AI 配置
 */
export function debugAIContext(): AIContext {
  const context = createAIContext();
  console.debug('[AIContext Debug]', {
    enableAI: context.enableAI,
    provider: context.provider,
    timeout: context.timeout,
    retryCount: context.retryCount,
  });
  return context;
}
