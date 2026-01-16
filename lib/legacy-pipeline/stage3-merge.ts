/**
 * 阶段 3：全局诊断归并（中等模型）
 * 将所有 chunk 的提取结果合并为统一诊断
 */

import type { Stage2Output, Stage3Output } from './types';
import type { AIProviderConfig } from './types';

// ========== Prompt 模板 ==========

const STAGE3_SYSTEM_PROMPT = `Merge text analysis into diagnosis. Output JSON only. Exact fields required.`;

function buildStage3UserPrompt(extractions: Stage2Output[]): string {
  // 提取关键信息，不重复原始文本
  const allThemes = new Map<string, {name: string, count: number}>();
  const allClaims: string[] = [];
  const allRecs: string[] = [];
  const allQuotes: string[] = [];
  
  for (const ext of extractions) {
    for (const t of ext.themes) {
      const key = t.name;
      if (allThemes.has(key)) {
        allThemes.get(key)!.count++;
      } else {
        allThemes.set(key, {name: t.name, count: 1});
      }
    }
    for (const c of ext.claims) {
      allClaims.push(c.statement);
    }
    for (const r of ext.recommendations) {
      allRecs.push(r.action);
    }
    for (const q of ext.raw_quotes) {
      if (q.length <= 30) allQuotes.push(q);
    }
  }
  
  const topThemes = Array.from(allThemes.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(e => e[1].name)
    .join(', ');
  
  // 极简输入摘要
  const inputSummary = {
    themes_found: Array.from(allThemes.keys()).length,
    top_themes: topThemes,
    claims_count: allClaims.length,
    recs_count: allRecs.length,
    quotes_sample: allQuotes.slice(0, 3)
  };
  
  return `Input: ${JSON.stringify(inputSummary)}

Output exact structure:
{
  "profile_summary": "2-3 sentences. First: core trait. Second: current tension. Optional third: direction.",
  "top_strengths": [
    {"name": "Theme", "core_value": "value", "overuse_pattern": "pattern", "blind_spot": "spot"}
  ],
  "current_pattern": "1-2 sentences",
  "leverage_plan": ["action1", "action2", "action3"],
  "anti_pattern": ["avoid1", "avoid2"],
  "micro_habits_7d": ["day1", "day2", "day3"],
  "proof_points": ["evidence1", "evidence2"]
}

CRITICAL: proof_points must be verbatim or lightly paraphrased from the original Gallup report. Do NOT invent new evidence.`;
}

// ========== AI 调用 ==========

async function callAI(
  config: AIProviderConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = config.timeout || 90000;

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    if (config.provider === 'anthropic') {
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
          max_tokens: 2000,
          temperature: 0.5,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
      const data = await response.json();
      return data.content[0].text;
    } else if (config.provider === 'openai') {
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
          max_tokens: 2000,
          temperature: 0.5,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
      const data = await response.json();
      return data.choices[0].message.content;
    } else if (config.provider === 'zhipu') {
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
          max_tokens: 2000,
          temperature: 0.5,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Zhipu API error: ${response.status}`);
      const data = await response.json();
      return data.choices[0].message.content;
    } else {
      return mockAIResponse();
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

function mockAIResponse(): string {
  return JSON.stringify({
    profile_summary: '以战略思维为核心。倾向过度分析而延迟决策，需平衡思考与行动。',
    top_strengths: [
      { name: '战略思维', core_value: '通过识别模式预见未来', overuse_pattern: '过度分析导致延迟', blind_spot: '忽视即时行动' },
      { name: '分析', core_value: '用证据支撑决策', overuse_pattern: '陷入细节', blind_spot: '过度怀疑直觉' }
    ],
    current_pattern: '倾向收集大量信息后做决定。',
    leverage_plan: ['设定信息收集时限', '每周快速决策日', '与行动型同事合作'],
    anti_pattern: ['避免无休止找信息', '避免过度分析延迟行动'],
    micro_habits_7d: ['Day1: 设30分钟上限', 'Day2: 凭直觉选午餐', 'Day3: 会议首发言'],
    proof_points: ['常被问"如果怎样"', '朋友求见解', '擅长识别风险']
  });
}

// ========== 验证函数 ==========

function validateStage3Output(data: unknown): data is Stage3Output {
  if (typeof data !== 'object' || data === null) return false;
  
  const obj = data as Record<string, unknown>;
  
  const requiredFields = [
    'profile_summary',
    'top_strengths',
    'current_pattern',
    'leverage_plan',
    'anti_pattern',
    'micro_habits_7d',
    'proof_points'
  ];
  
  for (const field of requiredFields) {
    if (!(field in obj)) {
      throw new Error(`Missing field: ${field}`);
    }
  }
  
  const allowedFields = new Set(requiredFields);
  for (const field of Object.keys(obj)) {
    if (!allowedFields.has(field)) {
      throw new Error(`Unexpected field: ${field}`);
    }
  }
  
  if (typeof obj.profile_summary !== 'string') throw new Error('profile_summary type');
  if (!Array.isArray(obj.top_strengths)) throw new Error('top_strengths type');
  if (typeof obj.current_pattern !== 'string') throw new Error('current_pattern type');
  if (!Array.isArray(obj.leverage_plan)) throw new Error('leverage_plan type');
  if (!Array.isArray(obj.anti_pattern)) throw new Error('anti_pattern type');
  if (!Array.isArray(obj.micro_habits_7d)) throw new Error('micro_habits_7d type');
  if (!Array.isArray(obj.proof_points)) throw new Error('proof_points type');
  
  for (const s of obj.top_strengths) {
    if (typeof s !== 'object' || s === null) throw new Error('top_strength item type');
    const item = s as Record<string, unknown>;
    if (typeof item.name !== 'string') throw new Error('top_strength.name type');
    if (typeof item.core_value !== 'string') throw new Error('top_strength.core_value type');
    if (typeof item.overuse_pattern !== 'string') throw new Error('top_strength.overuse_pattern type');
    if (typeof item.blind_spot !== 'string') throw new Error('top_strength.blind_spot type');
  }
  
  return true;
}

// ========== 主函数 ==========

export async function stage3_mergeDiagnosis(
  extractions: Stage2Output[],
  config: AIProviderConfig
): Promise<Stage3Output> {
  const rawResponse = await callAI(
    config,
    STAGE3_SYSTEM_PROMPT,
    buildStage3UserPrompt(extractions)
  );
  
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch (e) {
    const match = rawResponse.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error(`Stage 3 parse failed: ${rawResponse.slice(0, 100)}`);
    }
  }
  
  if (!validateStage3Output(parsed)) {
    throw new Error('Stage 3 validation failed');
  }
  
  return parsed;
}
