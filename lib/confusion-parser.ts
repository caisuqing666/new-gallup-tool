// 困惑解析器（Confusion Parser）
// 将用户的自由文本困惑解析为结构化的 ConfusionProfile
// 规则优先，保证稳定可测；AI 作为第二阶段润色

// ============ 类型定义 ============

/**
 * 问题类型枚举
 * 用于判定"这是一类什么样的困境"
 */
/* eslint-disable no-unused-vars */
export enum ProblemType {
  /** 方向迷茫：不知道做什么、换赛道、转型 */
  Direction = 'Direction',
  
  /** 边界过载：该不该接、无法拒绝、都我扛 */
  BoundaryOverload = 'BoundaryOverload',
  
  /** 关系抉择：要不要离开、继续合作、分手 */
  RelationshipExit = 'RelationshipExit',
  
  /** 决策瘫痪：想太多、信息不够、一直准备 */
  DecisionParalysis = 'DecisionParalysis',
  
  /** 优先级失焦：太多事、什么都重要、没进展 */
  PriorityFocus = 'PriorityFocus',
  
  /** 角色错位：不该我做、最后都我来、角色模糊 */
  RoleMisalignment = 'RoleMisalignment',
  
  /** 未识别：无法归类 */
  Unknown = 'Unknown',
}
/* eslint-enable no-unused-vars */

/**
 * 问题类型描述（供 prompt 使用）
 */
export const PROBLEM_TYPE_DESCRIPTIONS: Record<ProblemType, string> = {
  [ProblemType.Direction]: '方向迷茫——不知道该往哪走，缺乏清晰的目标',
  [ProblemType.BoundaryOverload]: '边界过载——无法拒绝，承担了不该承担的',
  [ProblemType.RelationshipExit]: '关系抉择——要不要继续某段关系或合作',
  [ProblemType.DecisionParalysis]: '决策瘫痪——想太多，迟迟无法行动',
  [ProblemType.PriorityFocus]: '优先级失焦——太多事，不知道先做哪个',
  [ProblemType.RoleMisalignment]: '角色错位——做了不该做的事，角色边界模糊',
  [ProblemType.Unknown]: '未识别——需要进一步了解',
};

/**
 * 困惑画像（结构化输出）
 */
export interface ConfusionProfile {
  // 原始输入
  raw: string;
  
  // 问题类型
  problemType: ProblemType;
  problemTypeConfidence: number;  // 0-1，判定置信度
  
  // 问题焦点：必须是一件事的判定句
  problemFocus: string;
  
  // 用户期望的结果（从表述中推断）
  desiredOutcome: string | null;
  
  // 隐藏代价（如果这么做，会付出什么）
  hiddenCost: string | null;
  
  // 抽取到的关键短语（用于建议中引用）
  keyPhrases: string[];
  
  // 匹配到的关键词（用于调试）
  matchedKeywords: string[];
}

// ============ 关键词词典 ============

/**
 * 问题类型关键词配置
 * priority: 优先级（数字越大优先级越高）
 * keywords: 关键词列表
 * phrases: 短语列表（比单个关键词更准确）
 */
interface ProblemTypeConfig {
  type: ProblemType;
  priority: number;
  keywords: string[];
  phrases: string[];
}

const PROBLEM_TYPE_CONFIGS: ProblemTypeConfig[] = [
  // 优先级 6：方向迷茫（最优先判定，因为是根本性问题）
  {
    type: ProblemType.Direction,
    priority: 6,
    keywords: ['转型', '赛道', '方向', '迷茫', '未来', '职业', '出路'],
    phrases: [
      '不知道做什么',
      '不知道该做什么',
      '换赛道',
      '换方向',
      '没方向',
      '找不到方向',
      '不知道往哪走',
      '不知道下一步',
      '职业转型',
      '人生方向',
      '何去何从',
      '该何去何从',
      '没有目标',
      '找不到目标',
      '不知道想要什么',
    ],
  },
  
  // 优先级 5：边界过载
  {
    type: ProblemType.BoundaryOverload,
    priority: 5,
    keywords: ['拒绝', '接', '扛', '内疚', '边界', '承担', '答应'],
    phrases: [
      '要不要接',
      '该不该接',
      '该不该拒绝',
      '不好意思拒绝',
      '无法拒绝',
      '说不出口',
      '都我扛',
      '都是我',
      '全是我',
      '一个人扛',
      '不该我做',
      '凭什么是我',
      '推不掉',
      '接不住',
      '背不动',
      '太多责任',
    ],
  },
  
  // 优先级 5：关系抉择
  {
    type: ProblemType.RelationshipExit,
    priority: 5,
    keywords: ['离开', '分手', '离职', '合作', '拉扯', '耗', '继续'],
    phrases: [
      '要不要离开',
      '该不该离开',
      '要不要分手',
      '要不要离职',
      '继续合作',
      '还要不要',
      '值不值得',
      '一直拉扯',
      '太耗了',
      '被消耗',
      '要不要断',
      '断不断',
      '走还是留',
      '留还是走',
      '要不要继续',
      '是否继续',
    ],
  },
  
  // 优先级 4：决策瘫痪
  {
    type: ProblemType.DecisionParalysis,
    priority: 4,
    keywords: ['犹豫', '纠结', '决定', '选择', '准备', '想太多'],
    phrases: [
      '想太多',
      '想不清楚',
      '想清楚再',
      '信息不够',
      '还不够',
      '迟迟不动',
      '一直准备',
      '还在准备',
      '下不了决心',
      '做不了决定',
      '无法决定',
      '选不出来',
      '反复纠结',
      '一直犹豫',
      '不敢决定',
      '怕选错',
      '万一选错',
    ],
  },
  
  // 优先级 4：优先级失焦
  {
    type: ProblemType.PriorityFocus,
    priority: 4,
    keywords: ['太多', '进展', '重要', '优先', '排序', '忙'],
    phrases: [
      '太多事',
      '事太多',
      '什么都重要',
      '都很重要',
      '没进展',
      '没有进展',
      '推不动',
      '做不完',
      '来不及',
      '顾不过来',
      '分身乏术',
      '哪个先',
      '先做哪个',
      '不知道先做什么',
      '排不上',
      '挤不出时间',
    ],
  },
  
  // 优先级 3：角色错位
  {
    type: ProblemType.RoleMisalignment,
    priority: 3,
    keywords: ['角色', '职责', '分工', '本来', '最后'],
    phrases: [
      '本来不该我做',
      '不是我的事',
      '最后都我来',
      '变成我的事',
      '角色不清',
      '职责不清',
      '边界模糊',
      '越界',
      '越俎代庖',
      '不该我管',
      '管太多',
      '做了不该做的',
    ],
  },
];

// ============ 问题焦点抽取规则 ============

/**
 * 判定句句式模板
 * 用于识别和抽取 problemFocus
 */
const FOCUS_PATTERNS: RegExp[] = [
  // "要不要 X" 句式
  /要不要(.{2,30})/,
  /该不该(.{2,30})/,
  /是否应该(.{2,30})/,
  /是否要(.{2,30})/,
  /是否继续(.{2,30})/,
  /是否停止(.{2,30})/,
  /是否放弃(.{2,30})/,
  
  // "选 A 还是 B" 句式
  /选(.{2,15})还是(.{2,15})/,
  /(.{2,15})还是(.{2,15})/,
  /是(.{2,15})还是(.{2,15})/,
  
  // "要 X 吗" 句式
  /要(.{2,20})吗/,
  /该(.{2,20})吗/,
  /能(.{2,20})吗/,
  
  // "X 还是 Y" 句式（更宽泛）
  /(.{2,20})还是(.{2,20})/,
  
  // "怎么 X" 句式（转化为判定句）
  /怎么(.{2,30})/,
  /如何(.{2,30})/,
];

/**
 * 问题焦点 fallback 模板
 * 当无法抽取时，根据 problemType 生成默认焦点
 */
const FOCUS_FALLBACK_TEMPLATES: Record<ProblemType, string> = {
  [ProblemType.Direction]: '要不要换一个方向',
  [ProblemType.BoundaryOverload]: '要不要继续承担这件事',
  [ProblemType.RelationshipExit]: '要不要继续这段关系',
  [ProblemType.DecisionParalysis]: '要不要现在就做决定',
  [ProblemType.PriorityFocus]: '要不要先放下其他事，只做一件',
  [ProblemType.RoleMisalignment]: '要不要把不属于我的事还回去',
  [ProblemType.Unknown]: '要不要改变现状',
};

// ============ 期望结果推断规则 ============

/**
 * 期望结果关键词配置
 */
interface DesiredOutcomeConfig {
  keywords: string[];
  outcome: string;
}

const DESIRED_OUTCOME_CONFIGS: DesiredOutcomeConfig[] = [
  { keywords: ['轻松', '放松', '解脱'], outcome: '从当前压力中解脱' },
  { keywords: ['清晰', '明确', '确定'], outcome: '获得清晰的方向' },
  { keywords: ['进展', '推进', '完成'], outcome: '看到实际的进展' },
  { keywords: ['平衡', '兼顾'], outcome: '在多件事之间找到平衡' },
  { keywords: ['边界', '拒绝'], outcome: '建立清晰的边界' },
  { keywords: ['离开', '退出', '放手'], outcome: '体面地退出' },
  { keywords: ['坚持', '继续', '突破'], outcome: '坚持下去并看到成果' },
  { keywords: ['安心', '踏实', '稳'], outcome: '感到安心和踏实' },
];

// ============ 隐藏代价推断规则 ============

/**
 * 隐藏代价配置
 * 根据 problemType 推断如果不改变会付出的代价
 */
const HIDDEN_COST_BY_TYPE: Record<ProblemType, string> = {
  [ProblemType.Direction]: '继续在错误的方向上消耗能量',
  [ProblemType.BoundaryOverload]: '继续被透支，直到彻底崩溃',
  [ProblemType.RelationshipExit]: '继续在这段关系中被消耗',
  [ProblemType.DecisionParalysis]: '错过最佳行动窗口',
  [ProblemType.PriorityFocus]: '忙碌但没有任何实质进展',
  [ProblemType.RoleMisalignment]: '继续做不属于你的事，失去自己的位置',
  [ProblemType.Unknown]: '维持现状带来的持续消耗',
};

// ============ 核心解析函数 ============

/**
 * 判定问题类型
 * 使用关键词词典 + 优先级规则
 */
function detectProblemType(text: string): {
  type: ProblemType;
  confidence: number;
  matchedKeywords: string[];
} {
  const normalizedText = text.toLowerCase();
  let bestMatch: {
    type: ProblemType;
    score: number;
    matchedKeywords: string[];
  } | null = null;
  
  for (const config of PROBLEM_TYPE_CONFIGS) {
    let score = 0;
    const matched: string[] = [];
    
    // 短语匹配（权重更高）
    for (const phrase of config.phrases) {
      if (normalizedText.includes(phrase.toLowerCase())) {
        score += 3 * config.priority;
        matched.push(phrase);
      }
    }
    
    // 关键词匹配
    for (const keyword of config.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        score += 1 * config.priority;
        if (!matched.includes(keyword)) {
          matched.push(keyword);
        }
      }
    }
    
    // 更新最佳匹配
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = {
        type: config.type,
        score,
        matchedKeywords: matched,
      };
    }
  }
  
  if (bestMatch) {
    // 计算置信度（基于匹配数量和分数）
    const maxPossibleScore = 30; // 估算的最大分数
    const confidence = Math.min(bestMatch.score / maxPossibleScore, 1);
    
    return {
      type: bestMatch.type,
      confidence,
      matchedKeywords: bestMatch.matchedKeywords,
    };
  }
  
  return {
    type: ProblemType.Unknown,
    confidence: 0,
    matchedKeywords: [],
  };
}

/**
 * 抽取问题焦点
 * 使用句式模板匹配
 */
function extractProblemFocus(text: string, problemType: ProblemType): string {
  const rawText = text;
  // 尝试用句式模板抽取
  for (const pattern of FOCUS_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // 根据匹配结果构造判定句
      if (match.length === 3) {
        // "选 A 还是 B" 句式
        return `选${match[1].trim()}还是${match[2].trim()}`;
      } else if (match.length === 2) {
        const extracted = match[1].trim();
        // 确保是合理的长度
        if (extracted.length >= 2 && extracted.length <= 30) {
          // 如果原句已经是判定句式，直接返回
          if (match[0].startsWith('要不要') || match[0].startsWith('该不该')) {
            return refineProblemFocus(rawText, match[0].trim(), problemType);
          }
          // 否则转化为判定句
          return refineProblemFocus(rawText, `要不要${extracted}`, problemType);
        }
      }
    }
  }
  
  // 尝试从问句中抽取
  const questionMatch = text.match(/[？?]([^？?。！!]*)[？?。！!]?$/);
  if (questionMatch && questionMatch[1].length >= 4) {
    const question = questionMatch[1].trim();
    // 如果已经是判定句式
    if (question.match(/^(要不要|该不该|是否)/)) {
      return refineProblemFocus(rawText, question, problemType);
    }
    // 转化为判定句
    return refineProblemFocus(rawText, `要不要${question.replace(/^(我|你|他|她|它)/, '')}`, problemType);
  }
  
  // Fallback：压缩原文为判定句
  return refineProblemFocus(rawText, compressToFocus(text, problemType), problemType);
}

/**
 * 将原文压缩为判定句（fallback）
 */
function compressToFocus(text: string, problemType: ProblemType): string {
  // 提取核心动作词
  const actionPatterns = [
    /想(要)?(.{2,15})/,
    /准备(.{2,15})/,
    /打算(.{2,15})/,
    /考虑(.{2,15})/,
    /纠结(.{2,15})/,
  ];
  
  for (const pattern of actionPatterns) {
    const match = text.match(pattern);
    if (match) {
      const action = match[match.length - 1].trim();
      if (action.length >= 2 && action.length <= 15) {
        return `要不要${action}`;
      }
    }
  }
  
  // 使用类型默认模板
  return FOCUS_FALLBACK_TEMPLATES[problemType];
}

function refineProblemFocus(rawText: string, focus: string, problemType: ProblemType): string {
  const trimmed = focus.trim();
  if (!trimmed.startsWith('要不要')) {
    return trimmed;
  }

  const decisionVerbs = ['换', '辞职', '离开', '继续', '留', '跳槽', '转', '退出'];
  const hasDecisionVerb = decisionVerbs.some(verb => trimmed.includes(verb));
  if (hasDecisionVerb) {
    return trimmed;
  }

  const workKeywords = ['工作', '岗位', '公司', '职业', '事业'];
  const workSignals = ['很累', '太累', '没有产出', '没产出', '无产出', '没结果', '没成长', '不产出', '没价值'];
  const hasWorkContext = workKeywords.some(keyword => rawText.includes(keyword));
  const hasWorkSignal = workSignals.some(signal => rawText.includes(signal));

  if (hasWorkContext && hasWorkSignal) {
    return '要不要换工作';
  }

  if (problemType === ProblemType.RelationshipExit && rawText.includes('关系')) {
    return '要不要离开这段关系';
  }

  if (problemType === ProblemType.Direction && hasWorkContext) {
    return '要不要继续这份工作';
  }

  return trimmed;
}

/**
 * 提取关键短语（用于建议中引用）
 */
function extractKeyPhrases(text: string): string[] {
  const phrases: string[] = [];
  
  // 提取引号内容
  const quotedMatches = text.match(/[""「」『』]([^""「」『』]+)[""「」『』]/g);
  if (quotedMatches) {
    phrases.push(...quotedMatches.map(m => m.replace(/[""「」『』]/g, '')));
  }
  
  // 提取"XX的事"
  const thingMatches = text.match(/[^，。、；：！？\s]{2,10}的事/g);
  if (thingMatches) {
    phrases.push(...thingMatches);
  }
  
  // 提取"那个XX"
  const thatMatches = text.match(/那个[^，。、；：！？\s]{2,10}/g);
  if (thatMatches) {
    phrases.push(...thatMatches);
  }
  
  // 提取"这件XX"
  const thisMatches = text.match(/这件[^，。、；：！？\s]{2,10}/g);
  if (thisMatches) {
    phrases.push(...thisMatches);
  }
  
  // 去重
  return Array.from(new Set(phrases)).slice(0, 5);
}

/**
 * 推断期望结果
 */
function inferDesiredOutcome(text: string, problemType: ProblemType): string | null {
  const normalizedText = text.toLowerCase();
  
  // 从关键词配置中匹配
  for (const config of DESIRED_OUTCOME_CONFIGS) {
    for (const keyword of config.keywords) {
      if (normalizedText.includes(keyword)) {
        return config.outcome;
      }
    }
  }
  
  // 根据问题类型推断默认期望
  const defaultOutcomes: Record<ProblemType, string> = {
    [ProblemType.Direction]: '找到清晰的方向',
    [ProblemType.BoundaryOverload]: '能够说"不"并感到释然',
    [ProblemType.RelationshipExit]: '做出不后悔的决定',
    [ProblemType.DecisionParalysis]: '能够行动起来',
    [ProblemType.PriorityFocus]: '知道先做哪一件',
    [ProblemType.RoleMisalignment]: '回到自己该在的位置',
    [ProblemType.Unknown]: '改变当前困境',
  };
  
  return defaultOutcomes[problemType];
}

/**
 * 推断隐藏代价
 */
function inferHiddenCost(problemType: ProblemType, _text: string): string {
  return HIDDEN_COST_BY_TYPE[problemType];
}

// ============ 主函数 ============

/**
 * 解析用户困惑
 * @param confusion 用户输入的困惑文本
 * @returns 结构化的困惑画像
 */
export function parseConfusion(confusion: string): ConfusionProfile {
  // 预处理：去除首尾空白
  const raw = confusion.trim();
  
  // 1. 判定问题类型
  const { type, confidence, matchedKeywords } = detectProblemType(raw);
  
  // 2. 抽取问题焦点
  const problemFocus = extractProblemFocus(raw, type);
  
  // 3. 提取关键短语
  const keyPhrases = extractKeyPhrases(raw);
  
  // 4. 推断期望结果
  const desiredOutcome = inferDesiredOutcome(raw, type);
  
  // 5. 推断隐藏代价
  const hiddenCost = inferHiddenCost(type, raw);
  
  return {
    raw,
    problemType: type,
    problemTypeConfidence: confidence,
    problemFocus,
    desiredOutcome,
    hiddenCost,
    keyPhrases,
    matchedKeywords,
  };
}

// ============ Prompt 格式化 ============

/**
 * 格式化为 prompt 友好的文本
 */
export function formatConfusionForPrompt(profile: ConfusionProfile): string {
  return `## 用户困惑分析

**原始输入**：${profile.raw}

**问题类型**：${PROBLEM_TYPE_DESCRIPTIONS[profile.problemType]}（置信度: ${Math.round(profile.problemTypeConfidence * 100)}%）

**问题焦点**：${profile.problemFocus}

**期望结果**：${profile.desiredOutcome || '未识别'}

**隐藏代价**：如果不改变，${profile.hiddenCost}

**关键短语**：${profile.keyPhrases.length > 0 ? profile.keyPhrases.join('、') : '无'}`;
}

/**
 * 获取简短的问题描述（用于结果页）
 */
export function getShortProblemDescription(profile: ConfusionProfile): string {
  return `${PROBLEM_TYPE_DESCRIPTIONS[profile.problemType].split('——')[0]}：${profile.problemFocus}`;
}
