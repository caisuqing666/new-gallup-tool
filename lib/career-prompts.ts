// 职业匹配 AI Prompt 构建
// 基于用户的 TOP5 优势，生成个性化的职业匹配建议

import { StrengthId } from './types';
import { getStrengthById, DOMAIN_NAMES } from './gallup-strengths';
import { getStrengthProfile } from './strength-profiles';
import { CareerMatchResult } from './types';

export interface CareerPromptResult {
  systemPrompt: string;
  userPrompt: string;
}

/**
 * 构建优势列表描述
 */
function buildStrengthDescription(strengths: StrengthId[]): string {
  return strengths
    .map((id, index) => {
      const strength = getStrengthById(id);
      const profile = getStrengthProfile(id);
      if (!strength) return `${index + 1}. ${id}`;

      const domainName = DOMAIN_NAMES[strength.domain] || strength.domain;
      const drive = profile?.drive || '未知';
      const cost = profile?.cost || '未知';
      const basement = profile?.basement || '未知';

      return `${index + 1}. ${strength.name} (${domainName}领域)
   - 驱动力：${drive}
   - 代价区：${cost}
   - 地下室：${basement}`;
    })
    .join('\n\n');
}

/**
 * 构建职业匹配 Prompt
 */
export function buildCareerMatchPrompt(strengths: StrengthId[]): CareerPromptResult {
  const strengthDescription = buildStrengthDescription(strengths);

  const systemPrompt = `你是一位盖洛普认证优势教练，专注于帮助用户将天赋优势转化为职业发展方向。

你的分析原则：
1. **优势驱动**：职业建议必须基于用户的具体优势组合，而非泛泛的职业描述
2. **能量视角**：区分"充能场景"和"耗能场景"，帮助用户选择可持续发展的职业路径
3. **组合效应**：分析多个优势之间的协同和张力，挖掘独特的职业优势
4. **落地可行**：建议具体、可执行，避免空泛的鼓励性语言
5. **风险提示**：指出每个职业选择可能的"地下室"风险

输出要求：
- 严格按照 JSON 格式输出
- 所有建议必须紧密结合用户的具体优势
- 使用"你"来称呼用户，让内容更有针对性
- 避免使用"加油"、"相信自己"等空洞鼓励`;

  const userPrompt = `请基于以下用户的 TOP5 优势，生成个性化的职业匹配分析。

## 用户的 TOP5 优势

${strengthDescription}

## 输出 JSON 结构

请严格按照以下结构输出（字段必须完整）：

{
  "topMatches": [
    {
      "careerId": "career-1",
      "careerName": "职业名称",
      "matchScore": 85,
      "matchReason": "基于你的优势组合，解释为什么这个职业适合你（必须具体提到用户的优势名称）",
      "strengthUsage": [
        {
          "strengthId": "优势ID",
          "usage": "这个优势在该职业中如何发挥（具体场景）"
        }
      ],
      "watchOut": "这个职业可能触发的地下室风险，以及如何避免"
    }
  ],
  "generalAdvice": {
    "coreStrengthToUse": "基于你的 TOP1 优势，给出职业选择的核心建议（必须提到具体优势名称）",
    "energyManagement": "基于你的优势组合，给出能量管理建议：什么工作环境充能/什么环境耗能",
    "growthDirection": "基于你的优势组合，给出长期职业发展建议"
  }
}

## 要求

1. topMatches 数组必须包含 3 个职业匹配
2. matchScore 范围 0-100，反映匹配程度
3. 每个职业的 strengthUsage 至少包含 2-3 个优势的使用说明
4. matchReason 和建议文本必须明确提到用户的具体优势名称
5. watchOut 要结合用户优势的"地下室"特征
6. 不要输出任何 JSON 以外的内容`;

  return { systemPrompt, userPrompt };
}

/**
 * 解析职业匹配 AI 响应
 */
export function parseCareerMatchResponse(content: string): CareerMatchResult {
  // 提取 JSON 内容
  const jsonText = extractJsonBlock(content);
  const parsed = JSON.parse(jsonText);

  // 验证必要字段
  if (!parsed.topMatches || !Array.isArray(parsed.topMatches)) {
    throw new Error('缺少 topMatches 字段');
  }
  if (!parsed.generalAdvice) {
    throw new Error('缺少 generalAdvice 字段');
  }

  return parsed as CareerMatchResult;
}

/**
 * 验证职业匹配结果
 */
export function isValidCareerMatchResult(result: CareerMatchResult): boolean {
  if (!result.topMatches || result.topMatches.length < 1) return false;
  if (!result.generalAdvice) return false;
  if (!result.generalAdvice.coreStrengthToUse) return false;
  if (!result.generalAdvice.energyManagement) return false;
  if (!result.generalAdvice.growthDirection) return false;

  for (const match of result.topMatches) {
    if (!match.careerName || !match.matchReason) return false;
    if (!match.strengthUsage || match.strengthUsage.length === 0) return false;
  }

  return true;
}

/**
 * 提取 JSON 块
 */
function extractJsonBlock(content: string): string {
  // 尝试提取 ```json ... ``` 块
  const fencedMatch = content.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  // 尝试直接提取 JSON 对象
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return content.slice(firstBrace, lastBrace + 1);
  }

  return content.trim();
}
