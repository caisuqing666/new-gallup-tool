/**
 * 阶段 2：Chunk 抽取（低价模型）
 * 从单个 chunk 中提取结构化信息
 */

import type { Chunk, Stage2Output } from './types';
import type { AIProviderConfig } from './types';

// ========== Prompt 模板 ==========

const STAGE2_SYSTEM_PROMPT = `Extract structured data. Output JSON only. Quotes ≤30 chars.`;

function buildStage2UserPrompt(chunk: Chunk): string {
  const content = chunk.content.length > 1500 
    ? chunk.content.slice(0, 1500) + '...' 
    : chunk.content;
  
  return `Text [${chunk.section}]:
${content}

JSON:
{
  "themes": [{"theme_id":"T01","name":"Name","domain":"strategic_thinking","confidence":0.8}],
  "claims": [{"claim_id":"C01_01","theme_ref":"T01","statement":"text","evidence_quote":"≤30char"}],
  "recommendations": [{"rec_id":"R01_01","theme_ref":"T01","action":"do","category":"continue"}],
  "raw_quotes":["≤30char","quote2"]
}`;
}

// ========== AI 调用封装 ==========

async function callAI(
  config: AIProviderConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = config.timeout || 60000;

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    if (config.provider === 'anthropic') {
      return await callAnthropic(config, systemPrompt, userPrompt, controller.signal);
    } else if (config.provider === 'openai') {
      return await callOpenAI(config, systemPrompt, userPrompt, controller.signal);
    } else if (config.provider === 'zhipu') {
      return await callZhipu(config, systemPrompt, userPrompt, controller.signal);
    } else {
      return mockAIResponse();
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callAnthropic(
  config: AIProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  signal: AbortSignal
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      max_tokens: 1500,
      temperature: 0.2,
    }),
    signal,
  });
  
  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
  const data = await response.json();
  return data.content[0].text;
}

async function callOpenAI(
  config: AIProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  signal: AbortSignal
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      max_tokens: 1500,
      temperature: 0.2,
    }),
    signal,
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callZhipu(
  config: AIProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  signal: AbortSignal
): Promise<string> {
  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
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
      max_tokens: 1500,
      temperature: 0.2,
    }),
    signal,
  });

  if (!response.ok) throw new Error(`Zhipu API error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

function mockAIResponse(): string {
  return JSON.stringify({
    themes: [
      { theme_id: 'T01', name: '战略', domain: 'strategic_thinking', confidence: 0.8 },
    ],
    claims: [
      { claim_id: 'C01_01', theme_ref: 'T01', statement: '善于分析', evidence_quote: '测试' },
    ],
    recommendations: [
      { rec_id: 'R01_01', theme_ref: 'T01', action: '继续思考', category: 'continue' },
    ],
    raw_quotes: ['测试引用'],
  });
}

// ========== 主函数 ==========

export async function stage2_extractChunk(
  chunk: Chunk,
  config: AIProviderConfig
): Promise<Stage2Output> {
  const rawResponse = await callAI(
    config,
    STAGE2_SYSTEM_PROMPT,
    buildStage2UserPrompt(chunk)
  );
  
  let parsed: any;
  try {
    parsed = JSON.parse(rawResponse);
  } catch (e) {
    const match = rawResponse.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error(`Stage 2 parse failed: ${rawResponse.slice(0, 100)}`);
    }
  }
  
  const result: Stage2Output = {
    chunk_id: chunk.chunk_id,
    themes: parsed.themes || [],
    claims: parsed.claims || [],
    recommendations: parsed.recommendations || parsed.recs || [],
    raw_quotes: parsed.raw_quotes || parsed.quotes || [],
  };
  
  return result;
}

export async function stage2_extractAllChunks(
  chunks: Chunk[],
  config: AIProviderConfig,
  onProgress?: (_current: number, _total: number) => void
): Promise<Stage2Output[]> {
  const results: Stage2Output[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const result = await stage2_extractChunk(chunks[i], config);
    results.push(result);
    onProgress?.(i + 1, chunks.length);
  }
  
  return results;
}
