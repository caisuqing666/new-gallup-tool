// 报告解读 AI Prompt
// 用于生成盖洛普报告的个性化解读
//
// ⚠️ DEPRECATED - 此文件已弃用
// ============================================================
// 所有 prompt 构建已迁移到 lib/prompts.ts 的 buildPrompt() 函数
// 请使用统一的入口：
//
//   import { buildPrompt } from '@/lib/prompts';
//
//   const { systemPrompt, userPrompt } = buildPrompt({
//     pathType: 'report-interpret',
//     params: { strengths, ocrText }
//   });
//
// 此文件保留仅用于向后兼容，未来版本将移除。
// ============================================================

import { StrengthId, ALL_STRENGTHS, DOMAIN_NAMES } from './gallup-strengths';
import { ReportInterpretResult } from './types';

/**
 * 构建报告解读的系统 Prompt
 */
export function buildReportInterpretPrompt(
  strengths: StrengthId[],
  ocrText?: string
): string {
  const strengthNames = strengths.join('、');
  
  return `你是资深的盖洛普认证教练，擅长解读盖洛普优势报告。

## 用户优势识别结果

用户的 TOP5 优势是：${strengthNames}

${ocrText ? `## OCR 识别文本\n${ocrText}\n` : ''}

## 解读任务

请基于用户的 TOP5 优势，生成一份通俗易懂、温暖有深度的个性化解读报告。

## 解读结构要求

请按照以下结构生成解读（JSON 格式）：

\`\`\`
{
  "personalLabel": {
    "label": "个人化标签（如"执行力优势者"）",
    "description": "对标签的解释（2-3句话）",
    "basedOn": ["优势1", "优势2", ...]
  },
  "summary": "一句话总结用户的优势组合（50-80字）",
  "strengthInterpretations": [
    {
      "name": "优势1名称",
      "domain": "领域",
      "whatItIs": "这是什么优势（通俗解释）",
      "yourStrength": "你的优势表现（用"你会..."句式）",
      "watchOut": "注意事项（地下室状态）",
      "bestWhen": ["场景1", "场景2", ...],
      "pairWith": ["搭配优势1", "搭配优势2"],
      "avoid": ["避免优势1", "避免优势2"]
    },
    ...
  ],
  "comboInterpretation": {
    "coreDrive": "核心驱动力描述",
    "potentialTraps": ["陷阱1", "陷阱2", ...],
    "synergies": ["协同1", "协同2", ...]
  },
  "domainAnalysis": [
    {
      "domain": "执行力",
      "count": 3,
      "percentage": 60,
      "characteristics": ["特征1", "特征2"]
    }
  ],
  "keyInsights": [
    "洞察1（用"你的..."句式）",
    "洞察2",
    ...
  ],
  "personalizedAdvice": "个性化建议（100-150字）"
}
\`\`\`

## 内容要求

### 1. 个人化标签
- 基于优势分布给出一个标签
- 说明这个标签的含义
- 列出支撑这个标签的优势

### 2. 一句话总结
- 用温暖的语言概括用户的优势组合
- 50-80 字
- 体现优势组合的独特性

### 3. 每个优势的解读
对于每个优势，包含：
- **whatItIs**: 通俗解释这是什么优势
- **yourStrength**: 用"你会..."句式描述优势表现
- **watchOut**: 说明地下室状态（优势被误用时的表现）
- **bestWhen**: 3-4 个最佳使用场景
- **pairWith**: 2-3 个搭配优势
- **avoid**: 2-3 个避免搭配的优势

### 4. 优势组合解读
- **coreDrive**: 描述这组优势的核心驱动力
- **potentialTraps**: 2-3 个潜在陷阱
- **synergies**: 2-3 个协同效应

### 5. 领域分布分析
- 列出用户的领域分布
- 计算百分比
- 列出每个领域的特征

### 6. 关键洞察
- 3-5 个关键洞察
- 用"你的..."句式
- 体现深度和个性化

### 7. 个性化建议
- 100-150 字的个性化建议
- 包含如何使用优势
- 提醒注意地下室状态

## 语言风格要求

- **温暖有深度**：既要让用户感到被理解，又要提供有价值的信息
- **通俗易懂**：避免术语，用简单直白的语言
- **避免说教**：不要用"你应该/必须"等说教式语言
- **个性化**：针对用户的具体优势组合，不是通用模板
- **正面引导**：强调优势的价值，而不是批评"短板"

## 质量检查清单

生成结果后，请检查：
- [ ] 每个优势都有"你会..."的具体描述
- [ ] 包含了地下室状态的警告
- [ ] 给出了搭配建议和避免建议
- [ ] 个人化标签准确反映优势组合特征
- [ ] 领域分布计算正确
- [ ] 关键洞察针对性强，不是泛泛而谈
- [ ] 个性化建议具体可操作

请生成完整的解读报告（JSON 格式）。`;
}

/**
 * 解析 AI 响应
 */
export function parseReportInterpretResponse(
  content: string,
  strengths: StrengthId[] = []
): ReportInterpretResult {
  const raw = safeJsonParse(content);
  return repairReportInterpretResult(raw, strengths);
}

/**
 * 类型守卫：检查是否为有效的报告解读结果
 */
export function isValidReportInterpretResult(data: any): data is ReportInterpretResult {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.top5Strengths)) return false;
  if (!data.personalLabel || typeof data.personalLabel !== 'object') return false;
  if (typeof data.personalLabel.label !== 'string') return false;
  if (typeof data.summary !== 'string') return false;
  if (!Array.isArray(data.strengthInterpretations)) return false;
  if (!data.comboInterpretation || typeof data.comboInterpretation !== 'object') return false;
  if (!Array.isArray(data.domainAnalysis)) return false;
  if (!Array.isArray(data.keyInsights)) return false;
  if (!Array.isArray(data.suggestedPaths)) return false;
  if (typeof data.personalizedAdvice !== 'string') return false;
  return true;
}

function safeJsonParse(content: string): unknown {
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

  try {
    return JSON.parse(jsonString);
  } catch {
    try {
      const repaired = jsonString
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'");
      return JSON.parse(repaired);
    } catch (repairError) {
      console.error('解析报告解读响应失败:', repairError);
      return {};
    }
  }
}

function buildTop5Strengths(strengths: StrengthId[]): ReportInterpretResult['top5Strengths'] {
  return strengths.map((id, index) => {
    const info = ALL_STRENGTHS.find(s => s.id === id);
    return {
      rank: index + 1,
      name: info?.name || id,
      domain: info ? DOMAIN_NAMES[info.domain] : '未知领域',
    };
  });
}

function buildDomainAnalysis(strengths: StrengthId[]): ReportInterpretResult['domainAnalysis'] {
  const total = strengths.length || 1;
  const counts: Record<string, number> = {};

  strengths.forEach((id) => {
    const info = ALL_STRENGTHS.find(s => s.id === id);
    const domainKey = info?.domain || 'unknown';
    counts[domainKey] = (counts[domainKey] || 0) + 1;
  });

  return Object.entries(counts).map(([domainKey, count]) => ({
    domain: DOMAIN_NAMES[domainKey as keyof typeof DOMAIN_NAMES] || '未知领域',
    count,
    percentage: Math.round((count / total) * 100),
    characteristics: [],
  }));
}

function buildStrengthInterpretations(
  strengths: StrengthId[]
): ReportInterpretResult['strengthInterpretations'] {
  return strengths.map((id) => {
    const info = ALL_STRENGTHS.find(s => s.id === id);
    return {
      name: info?.name || id,
      domain: info ? DOMAIN_NAMES[info.domain] : '未知领域',
      whatItIs: '',
      yourStrength: '',
      watchOut: '',
      bestWhen: [],
      pairWith: [],
      avoid: [],
    };
  });
}

function normalizeTop5Strength(
  input: any,
  fallback: ReportInterpretResult['top5Strengths'][number]
): ReportInterpretResult['top5Strengths'][number] {
  const result = typeof input === 'object' && input ? input : {};
  return {
    rank: typeof result.rank === 'number' ? result.rank : fallback.rank,
    name: typeof result.name === 'string' ? result.name : fallback.name,
    domain: typeof result.domain === 'string' ? result.domain : fallback.domain,
  };
}

function normalizeInterpretation(
  input: any,
  fallback: ReportInterpretResult['strengthInterpretations'][number]
): ReportInterpretResult['strengthInterpretations'][number] {
  const result = typeof input === 'object' && input ? input : {};
  return {
    name: typeof result.name === 'string' ? result.name : fallback.name,
    domain: typeof result.domain === 'string' ? result.domain : fallback.domain,
    whatItIs: typeof result.whatItIs === 'string' ? result.whatItIs : '',
    yourStrength: typeof result.yourStrength === 'string' ? result.yourStrength : '',
    watchOut: typeof result.watchOut === 'string' ? result.watchOut : '',
    bestWhen: Array.isArray(result.bestWhen) ? result.bestWhen : [],
    pairWith: Array.isArray(result.pairWith) ? result.pairWith : [],
    avoid: Array.isArray(result.avoid) ? result.avoid : [],
  };
}

function repairReportInterpretResult(raw: unknown, strengths: StrengthId[]): ReportInterpretResult {
  const source = (raw && typeof raw === 'object' && 'data' in (raw as any))
    ? (raw as any).data
    : (raw as any);
  const base = (source && typeof source === 'object') ? (source as any) : {};

  const fallbackTop5 = buildTop5Strengths(strengths);
  const fallbackInterpretations = buildStrengthInterpretations(strengths);

  const top5Strengths = Array.isArray(base.top5Strengths) && base.top5Strengths.length > 0
    ? fallbackTop5.map((fallback, index) => normalizeTop5Strength(base.top5Strengths[index], fallback))
    : fallbackTop5;

  const personalLabel = typeof base.personalLabel === 'object' && base.personalLabel
    ? {
        label: typeof base.personalLabel.label === 'string' ? base.personalLabel.label : '你的优势标签',
        description: typeof base.personalLabel.description === 'string' ? base.personalLabel.description : '',
        basedOn: Array.isArray(base.personalLabel.basedOn) ? base.personalLabel.basedOn : top5Strengths.map((s: any) => s.name),
      }
    : {
        label: '你的优势标签',
        description: '',
        basedOn: top5Strengths.map((s: any) => s.name),
      };

  const strengthInterpretations = Array.isArray(base.strengthInterpretations) && base.strengthInterpretations.length > 0
    ? fallbackInterpretations.map((fallback, index) =>
        normalizeInterpretation(base.strengthInterpretations[index], fallback)
      )
    : fallbackInterpretations;

  const comboInterpretation = typeof base.comboInterpretation === 'object' && base.comboInterpretation
    ? {
        coreDrive: typeof base.comboInterpretation.coreDrive === 'string' ? base.comboInterpretation.coreDrive : '',
        potentialTraps: Array.isArray(base.comboInterpretation.potentialTraps) ? base.comboInterpretation.potentialTraps : [],
        synergies: Array.isArray(base.comboInterpretation.synergies) ? base.comboInterpretation.synergies : [],
      }
    : { coreDrive: '', potentialTraps: [], synergies: [] };

  const domainAnalysis = Array.isArray(base.domainAnalysis) && base.domainAnalysis.length > 0
    ? base.domainAnalysis
    : buildDomainAnalysis(strengths);

  const suggestedPaths = Array.isArray(base.suggestedPaths) && base.suggestedPaths.length > 0
    ? base.suggestedPaths
    : [
        { path: 'breakthrough', title: '突破方案', reason: '用优势梳理当前困惑' },
        { path: 'career-match', title: '职业匹配', reason: '探索更适合的方向' },
        { path: 'strength-guide', title: '优势指南', reason: '把优势转化为可执行行动' },
      ];

  return {
    top5Strengths,
    personalLabel,
    summary: typeof base.summary === 'string' ? base.summary : '',
    strengthInterpretations,
    comboInterpretation,
    domainAnalysis,
    keyInsights: Array.isArray(base.keyInsights) ? base.keyInsights : [],
    suggestedPaths,
    personalizedAdvice: typeof base.personalizedAdvice === 'string' ? base.personalizedAdvice : '',
  };
}
