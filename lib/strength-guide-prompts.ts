import { StrengthGuideResult, StrengthId } from './types';
import { DOMAIN_NAMES, getStrengthById } from './gallup-strengths';

export interface StrengthGuidePromptResult {
  systemPrompt: string;
  userPrompt: string;
}

function buildStrengthList(strengths: StrengthId[]): string {
  return strengths
    .map((id, index) => {
      const strength = getStrengthById(id);
      const name = strength?.name || id;
      const domain = strength?.domain ? DOMAIN_NAMES[strength.domain] : '未知领域';
      return `${index + 1}. ${name} (id: ${id}, 领域: ${domain})`;
    })
    .join('\n');
}

export function buildStrengthGuidePrompt(strengths: StrengthId[]): StrengthGuidePromptResult {
  const strengthList = buildStrengthList(strengths);
  const systemPrompt = `你是盖洛普认证优势教练，擅长把优势转化为可执行的日常建议。
输出必须是严格 JSON，不要包含多余文本或 Markdown。`;

  const userPrompt = `请基于以下优势列表生成「优势发挥指南」。

优势列表（按顺序）：
${strengthList}

输出 JSON 结构如下（字段必须完整）：
{
  "personalLabel": {
    "label": "个性化标签",
    "basedOn": ["优势名称1", "优势名称2"],
    "meaning": "标签含义（1-2句）"
  },
  "oneLiner": "一句话总结（不超过25字）",
  "strengthGuides": [
    {
      "strengthId": "strength-id",
      "strengthName": "优势名称",
      "whatItMeans": "用“你会...”句式",
      "bestScenarios": ["场景1", "场景2", "场景3"],
      "dailyPractice": {
        "morning": "早晨建议",
        "working": "工作中建议",
        "evening": "晚间建议"
      },
      "energyTips": {
        "chargeWhen": "何时充能",
        "restWhen": "何时休息"
      }
    }
  ],
  "comboGuide": {
    "synergyPairs": [
      {
        "strengths": ["优势A", "优势B"],
        "howToUse": "如何协同使用（1句）"
      }
    ],
    "tensionPairs": [
      {
        "strengths": ["优势A", "优势B"],
        "howToBalance": "如何平衡（1句）"
      }
    ]
  },
  "weeklyActions": [
    { "day": "周一", "action": "行动建议", "strengthUsed": "使用的优势" },
    { "day": "周二", "action": "行动建议", "strengthUsed": "使用的优势" },
    { "day": "周三", "action": "行动建议", "strengthUsed": "使用的优势" },
    { "day": "周四", "action": "行动建议", "strengthUsed": "使用的优势" },
    { "day": "周五", "action": "行动建议", "strengthUsed": "使用的优势" }
  ]
}

要求：
- strengthGuides 的条目数量等于输入优势数量，顺序一致。
- strengthId 必须使用输入中的 id。
- 文本具体、可执行，避免空泛。
- weeklyActions 5-7 条，覆盖一周的节奏即可。`;

  return { systemPrompt, userPrompt };
}

function extractJsonBlock(content: string): string {
  const fencedMatch = content.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return content.slice(firstBrace, lastBrace + 1);
  }
  return content.trim();
}

export function parseStrengthGuideResponse(content: string): StrengthGuideResult {
  const jsonText = extractJsonBlock(content);
  return JSON.parse(jsonText) as StrengthGuideResult;
}
