/**
 * 阶段 4：最终渲染（高质量模型）
 * 将诊断 JSON 转换为页面可渲染的内容
 */

import type { Stage3Output, Stage4Output, RenderTone } from './types';
import type { AIProviderConfig } from './types';
import { applyRules } from '../coach_rules/applyRules';

// ========== Prompt 模板 ==========

const STAGE4_SYSTEM_PROMPTS: Record<RenderTone['style'], string> = {
  professional: 'Professional coach tone. Output JSON only. Concise, authoritative.',
  conversational: 'Friendly coach tone. Output JSON only. Conversational, relatable.',
  direct: 'Direct action coach. Output JSON only. Brief, imperative sentences.',
  encouraging: 'Empowering coach. Output JSON only. Positive, uplifting.',
};

function buildStage4UserPrompt(
  diagnosis: Stage3Output,
  tone: RenderTone,
  ruleBlock?: string
): string {
  const detailLimit = {
    concise: 30,
    balanced: 60,
    detailed: 100,
  }[tone.detail_level];
  
  // 极简诊断摘要
  const summary = {
    profile: diagnosis.profile_summary.slice(0, 100),
    strengths: diagnosis.top_strengths.map(t => t.name).join(','),
    pattern: diagnosis.current_pattern.slice(0, 50),
    plans: diagnosis.leverage_plan.slice(0, 2),
    avoids: diagnosis.anti_pattern.slice(0, 2),
    habits: diagnosis.micro_habits_7d.slice(0, 3),
  };
  
  const ruleSection = ruleBlock ? `${ruleBlock}\n\n---\n\n` : '';

  return `${ruleSection}Diagnosis: ${JSON.stringify(summary)}
Tone: ${tone.style}, max ${detailLimit} chars/field

Output:
{
  "meta": {"generated_at": "ISO", "tone": ${JSON.stringify(tone)}, "word_count": 0},
  "sections": [
    {
      "type": "highlight",
      "content": {"title": "Title", "typewriter_texts": ["You are", "X"], "subtitle": "Subtitle"}
    },
    {
      "type": "diagnosis",
      "content": {
        "verdict_card": {"title": "Title", "verdict": "${summary.profile}", "confidence_level": "high"},
        "evidence_list": [{"claim": "From proof_points", "source_quote": "≤30char", "theme_badges": ["Theme"]}],
        "pivot_card": {"heading": "Heading", "content": "Content", "action_hint": "Hint"}
      }
    },
    {
      "type": "blindspot",
      "content": {"heading": "Blindspot", "anti_intuitive_statement": "Statement", "explanation": "Why", "watch_out_for": "When"}
    },
    {
      "type": "action_increase",
      "content": {"heading": "Increase", "core_conclusion": "Summary", "behaviors": [{"title": "Action", "description": "From leverage_plan", "target_theme": "Theme"}]}
    },
    {
      "type": "action_decrease",
      "content": {"heading": "Decrease", "behaviors": [{"title": "Avoid", "description": "From anti_pattern", "target_theme": "Theme"}]}
    },
    {
      "type": "micro_habits",
      "content": {"heading": "7-Day Micro Habits", "habits": ${JSON.stringify(diagnosis.micro_habits_7d)}}
    }
  ]
}

HARD STYLE CAP: No metaphors. No emotional reassurance. No teaching.`;
}

// ========== AI 调用 ==========

async function callAI(
  config: AIProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<string> {
  const controller = new AbortController();
  const timeout = config.timeout || 60000;

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
          max_tokens: 3000,
          temperature,
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
          max_tokens: 3000,
          temperature,
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
          max_tokens: 3000,
          temperature,
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

function mockAIResponse(defaultTone: RenderTone = { style: 'professional', detail_level: 'balanced', language: 'zh-CN' }): string {
  return JSON.stringify({
    meta: {
      generated_at: new Date().toISOString(),
      tone: defaultTone,
      word_count: 500,
    },
    sections: [
      {
        type: 'highlight',
        content: {
          title: '你的优势诊断',
          typewriter_texts: ['你是', '战略思维者'],
          subtitle: '发现你的核心优势',
        },
      },
      {
        type: 'diagnosis',
        content: {
          verdict_card: {
            title: '核心诊断',
            verdict: '你是以战略思维为核心的优势系统',
            confidence_level: 'high',
          },
          evidence_list: [],
          pivot_card: {
            heading: '关键转折',
            content: '需要平衡思考与行动',
            action_hint: '从思考转向执行',
          },
        },
      },
      {
        type: 'micro_habits',
        content: {
          heading: '7天微习惯',
          habits: [
            '第1天：设定30分钟信息收集上限',
            '第2天：凭直觉选择午餐，不纠结'
          ],
        },
      },
    ],
  });
}

// ========== 强稳定模式：Fallback 结构 ==========

/**
 * 生成完整的 fallback JSON
 * 确保：任何情况下都能返回前端可渲染的完整结构
 */
function getFallbackStage4Output(diagnosis: Stage3Output, tone: RenderTone): Stage4Output {
  const strengths = diagnosis.top_strengths.map(s => s.name);
  const primaryStrength = strengths[0] || '优势';
  const secondaryStrength = strengths[1] || primaryStrength;

  return {
    meta: {
      generated_at: new Date().toISOString(),
      tone,
      word_count: 0,
    },
    sections: [
      {
        type: 'highlight',
        content: {
          title: '你的优势诊断',
          typewriter_texts: ['你是', `${primaryStrength}者`],
          subtitle: '基于你的优势生成行动方案',
        },
      },
      {
        type: 'diagnosis',
        content: {
          verdict_card: {
            title: '核心诊断',
            verdict: diagnosis.profile_summary || `你是以${primaryStrength}为核心的优势系统`,
            confidence_level: 'high',
          },
          evidence_list: diagnosis.proof_points.slice(0, 3).map((proof, i) => ({
            claim: `证据 ${i + 1}`,
            source_quote: proof.slice(0, 30),
            theme_badges: [primaryStrength],
          })),
          pivot_card: {
            heading: '关键转折',
            content: diagnosis.current_pattern || '需要平衡优势的使用',
            action_hint: '从思考转向行动',
          },
        },
      },
      {
        type: 'blindspot',
        content: {
          heading: '盲区提醒',
          anti_intuitive_statement: '过度依赖优势可能成为限制',
          explanation: `${primaryStrength}让你擅长思考，但可能导致行动迟缓`,
          watch_out_for: '在需要快速决策时陷入过度分析',
        },
      },
      {
        type: 'action_increase',
        content: {
          heading: '增加的行为',
          core_conclusion: `更多发挥你的${primaryStrength}优势`,
          behaviors: diagnosis.leverage_plan.slice(0, 3).map((plan, i) => ({
            title: `行动建议 ${i + 1}`,
            description: plan,
            target_theme: primaryStrength,
          })),
        },
      },
      {
        type: 'action_decrease',
        content: {
          heading: '减少的行为',
          behaviors: diagnosis.anti_pattern.slice(0, 2).map((pattern, i) => ({
            title: `避免 ${i + 1}`,
            description: pattern,
            target_theme: secondaryStrength,
          })),
        },
      },
      {
        type: 'micro_habits',
        content: {
          heading: '7天微习惯',
          habits: diagnosis.micro_habits_7d.length > 0
            ? diagnosis.micro_habits_7d
            : [
                '第1天：设定明确的行动目标',
                '第2天：在优势领域投入1小时',
                '第3天：记录一个优势应用的例子',
              ],
        },
      },
    ],
  };
}

/**
 * 验证并修复 Stage4Output
 * 确保所有必需字段都存在
 */
function validateAndFixStage4Output(output: unknown, diagnosis: Stage3Output, tone: RenderTone): Stage4Output {
  if (!output || typeof output !== 'object') {
    return getFallbackStage4Output(diagnosis, tone);
  }

  const obj = output as Record<string, unknown>;

  // 检查是否有 meta
  if (!obj.meta || typeof obj.meta !== 'object') {
    return getFallbackStage4Output(diagnosis, tone);
  }

  // 检查是否有 sections 且是数组
  if (!Array.isArray(obj.sections)) {
    return getFallbackStage4Output(diagnosis, tone);
  }

  // 检查 sections 是否为空
  if (obj.sections.length === 0) {
    return getFallbackStage4Output(diagnosis, tone);
  }

  // 基本结构验证通过，通过 unknown 转换后返回
  return obj as unknown as Stage4Output;
}

// ========== 主函数 ==========

export async function stage4_render(
  diagnosis: Stage3Output,
  config: AIProviderConfig,
  tone: RenderTone,
  temperature?: number
): Promise<Stage4Output> {
  // 先生成 fallback（强稳定模式：始终有保底方案）
  const fallbackOutput = getFallbackStage4Output(diagnosis, tone);

  try {
    const systemPrompt = STAGE4_SYSTEM_PROMPTS[tone.style];
    const { promptBlock } = applyRules(diagnosis);
    const userPrompt = buildStage4UserPrompt(diagnosis, tone, promptBlock);

    const rawResponse = await callAI(config, systemPrompt, userPrompt, temperature);

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      // 尝试提取 JSON 片段
      const match = rawResponse.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        // JSON 解析完全失败，使用 fallback
        console.warn('[Stage4] JSON parse failed, using fallback:', rawResponse.slice(0, 100));
        return fallbackOutput;
      }
    }

    // 验证并修复输出
    return validateAndFixStage4Output(parsed, diagnosis, tone);
  } catch (error) {
    // 任何异常都返回 fallback
    console.error('[Stage4] Error occurred, using fallback:', error);
    return fallbackOutput;
  }
}
