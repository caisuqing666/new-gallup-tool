import { StrengthGuideResult, StrengthId } from './types';
import { DOMAIN_NAMES, getStrengthById } from './gallup-strengths';
import { getStrengthProfile } from './strength-profiles';

export interface StrengthGuidePromptResult {
  systemPrompt: string;
  userPrompt: string;
}

function buildStrengthList(strengths: StrengthId[]): string {
  return strengths
    .map((id, index) => {
      const strength = getStrengthById(id);
      const profile = getStrengthProfile(id);
      if (!strength) return `${index + 1}. ${id}`;

      const domainName = DOMAIN_NAMES[strength.domain] || strength.domain;
      const drive = profile?.drive || '未知';
      const cost = profile?.cost || '未知';
      const basement = profile?.basement || '未知';

      return `${index + 1}. **${strength.name}** (id: ${id}, ${domainName}领域)
   - 驱动力：${drive}
   - 代价区：${cost}
   - 地下室：${basement}`;
    })
    .join('\n\n');
}

export function buildStrengthGuidePrompt(strengths: StrengthId[]): StrengthGuidePromptResult {
  const strengthList = buildStrengthList(strengths);
  const systemPrompt = `你是盖洛普认证优势教练，专注于帮助用户将天赋优势转化为可执行的日常行动。

你的分析原则：
1. **优势驱动**：所有建议必须基于用户的具体优势特征（驱动力、代价区、地下室）
2. **能量视角**：区分"充能场景"和"耗能场景"，帮助用户管理能量
3. **组合效应**：分析多个优势之间的协同和张力
4. **落地可行**：建议具体、可执行，避免空泛的鼓励性语言
5. **风险提示**：结合"地下室"特征，指出潜在风险

输出必须是严格 JSON，不要包含多余文本或 Markdown。`;

  const userPrompt = `请基于以下用户的优势列表，生成「优势发挥指南」。

## 用户的优势（按重要性排序）

${strengthList}

## 输出 JSON 结构

{
  "personalLabel": {
    "label": "个性化标签（基于优势组合的独特定位）",
    "basedOn": ["优势名称1", "优势名称2"],
    "meaning": "标签含义（必须结合用户具体优势的驱动力来解释）"
  },
  "oneLiner": "一句话总结（必须提到用户的具体优势名称，不超过30字）",
  "strengthGuides": [
    {
      "strengthId": "strength-id",
      "strengthName": "优势名称",
      "domain": "executing|influencing|relationship|strategic",
      "whatItMeans": "用 你会... 句式，结合该优势的驱动力描述",
      "bestScenarios": ["场景1（具体）", "场景2（具体）", "场景3（具体）"],
      "dailyPractice": {
        "morning": "早晨如何启动该优势（具体行动）",
        "working": "工作中如何使用该优势（具体场景）",
        "evening": "晚间如何恢复能量（结合代价区）"
      },
      "energyTips": {
        "chargeWhen": "什么场景让你充能（基于驱动力）",
        "restWhen": "什么信号说明需要休息（基于代价区和地下室）"
      }
    }
  ],
  "comboGuide": {
    "synergyPairs": [
      {
        "strengths": ["优势A", "优势B"],
        "howToUse": "这两个优势如何协同发挥（具体场景）"
      }
    ],
    "tensionPairs": [
      {
        "strengths": ["优势A", "优势B"],
        "howToBalance": "这两个优势可能的冲突及如何平衡"
      }
    ]
  },
  "weeklyActions": [
    { "day": "周一", "action": "具体行动建议", "strengthUsed": "使用的优势名称" }
  ]
}

## 要求

1. **strengthGuides 数量**：必须等于输入优势数量，顺序一致
2. **strengthId**：必须使用输入中的 id
3. **domain**：必须是输入中对应优势的领域
4. **whatItMeans**：必须结合该优势的"驱动力"特征描述
5. **dailyPractice.evening**：必须结合"代价区"特征给出恢复建议
6. **energyTips.restWhen**：必须结合"地下室"特征给出预警信号
7. **comboGuide**：必须分析用户实际拥有的优势之间的关系
8. **weeklyActions**：5条，覆盖一周，每条都要用到用户的具体优势
9. **禁止空泛**：不要使用"加油"、"相信自己"等空洞鼓励`;

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

function repairJsonText(input: string): string {
  const text = input.replace(/^\uFEFF/, '');
  let output = '';
  let inString = false;
  let escaped = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const next = text[i + 1];

    if (!inString && char === '/' && next === '/') {
      i += 2;
      while (i < text.length && text[i] !== '\n') {
        i += 1;
      }
      continue;
    }

    if (!inString && char === '/' && next === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) {
        i += 1;
      }
      i += 2;
      continue;
    }

    if (!inString && (char === '，' || char === '、')) {
      output += ',';
      i += 1;
      continue;
    }

    if (!inString && (char === '：' || char === '；')) {
      output += char === '：' ? ':' : ',';
      i += 1;
      continue;
    }

    if (!inString && char === ',') {
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) {
        j += 1;
      }
      if (text[j] === '}' || text[j] === ']') {
        i += 1;
        continue;
      }
    }

    output += char;

    if (char === '"' && !escaped) {
      inString = !inString;
    }

    if (char === '\\' && !escaped) {
      escaped = true;
    } else {
      escaped = false;
    }

    i += 1;
  }

  return output.trim();
}

export function parseStrengthGuideResponse(content: string): StrengthGuideResult {
  const jsonText = extractJsonBlock(content);
  try {
    return JSON.parse(jsonText) as StrengthGuideResult;
  } catch (error) {
    const repairedText = repairJsonText(jsonText);
    try {
      return JSON.parse(repairedText) as StrengthGuideResult;
    } catch (repairError) {
      const previewLimit = 1200;
      const jsonPreview = jsonText.slice(0, previewLimit);
      const repairedPreview = repairedText.slice(0, previewLimit);
      console.warn('优势指南 JSON 解析失败原文预览:', jsonPreview);
      console.warn('优势指南 JSON 修复后预览:', repairedPreview);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const repairMessage = repairError instanceof Error ? repairError.message : String(repairError);
      throw new Error(`优势指南 JSON 解析失败: ${errorMessage}; 修复后仍失败: ${repairMessage}`);
    }
  }
}
