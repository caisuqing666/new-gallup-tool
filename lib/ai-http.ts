import type { AIProviderType } from './ai-context';

export interface AIHttpConfig {
  endpoint: string;
  model: string;
  apiKey: string;
  provider: AIProviderType;
  groupId?: string;
}

export interface AIHttpRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature?: number;
  bodyOverrides?: Record<string, unknown>;
}

export interface AIHttpContext {
  timeoutMs: number;
  signal?: AbortSignal;
}

function getProviderLabel(provider: AIProviderType): string {
  switch (provider) {
    case 'anthropic':
      return 'Claude';
    case 'openai':
      return 'OpenAI';
    case 'minimax':
      return 'Minimax';
    case 'zhipu':
      return '智谱';
    default:
      return 'AI';
  }
}

function createAbortController(timeoutMs: number, externalSignal?: AbortSignal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onAbort);
    }
  }

  return {
    controller,
    timeoutId,
    externalSignal,
    onAbort,
  };
}

function cleanupAbortController(input: {
  timeoutId: ReturnType<typeof setTimeout>;
  externalSignal?: AbortSignal;
  onAbort: () => void;
}) {
  clearTimeout(input.timeoutId);
  if (input.externalSignal) {
    input.externalSignal.removeEventListener('abort', input.onAbort);
  }
}

function buildRequestBody(
  provider: AIProviderType,
  request: AIHttpRequest,
  model: string
) {
  if (provider === 'anthropic') {
    return {
      model,
      max_tokens: request.maxTokens,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.userPrompt }],
      ...request.bodyOverrides,
    };
  }

  return {
    model,
    messages: [
      { role: 'system', content: request.systemPrompt },
      { role: 'user', content: request.userPrompt },
    ],
    max_tokens: request.maxTokens,
    temperature: request.temperature,
    ...request.bodyOverrides,
  };
}

function buildHeaders(provider: AIProviderType, apiKey: string): Record<string, string> {
  if (!apiKey) {
    throw new Error('API key missing');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (provider === 'anthropic') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return headers;
}

function buildEndpoint(config: AIHttpConfig) {
  if (config.provider === 'minimax' && config.groupId) {
    return `${config.endpoint}?GroupId=${config.groupId}`;
  }
  return config.endpoint;
}

function extractContent(provider: AIProviderType, data: any): string {
  if (provider === 'anthropic') {
    return data.content?.[0]?.text || '';
  }
  return data.choices?.[0]?.message?.content || '';
}

export async function callAIProvider(
  config: AIHttpConfig,
  request: AIHttpRequest,
  context: AIHttpContext
): Promise<string> {
  const { controller, timeoutId, externalSignal, onAbort } = createAbortController(
    context.timeoutMs,
    context.signal
  );

  try {
    const response = await fetch(buildEndpoint(config), {
      method: 'POST',
      headers: buildHeaders(config.provider, config.apiKey),
      body: JSON.stringify(buildRequestBody(config.provider, request, config.model)),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${getProviderLabel(config.provider)} API 错误 (${response.status}): ${error}`);
    }

    const data = await response.json();
    return extractContent(config.provider, data);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI 请求超时（${context.timeoutMs}ms）`);
    }
    throw error;
  } finally {
    cleanupAbortController({ timeoutId, externalSignal, onAbort });
  }
}
