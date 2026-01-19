# 第3阶段数据层国际化 - 详细实现方案

## 目录
1. [第1步：优势基础数据](#第1步优势基础数据多语言化)
2. [第2步：优势画像](#第2步优势画像多语言化)
3. [第3步：场景数据](#第3步场景数据多语言化)
4. [第4步：组合规则](#第4步组合规则多语言化)
5. [方案对比与权衡](#方案对比与权衡)
6. [风险评估](#风险评估)

---

## 第1步：优势基础数据多语言化

### 现状分析

```typescript
// 现有 lib/gallup-strengths.ts
export const ALL_STRENGTHS = [
  { id: 'focus', name: '专注', domain: 'executing' as const },
  { id: 'belief', name: '信仰', domain: 'executing' as const },
  // ... 32 more
] as const;
```

**问题**：
- ❌ name 字段硬编码中文
- ❌ UI 从 next-intl 获取翻译，和数据源不一致
- ❌ 后端无法获取多语言优势名称

---

### 方案1：嵌入式多语言（推荐✅）

**优点**：
- ✅ 类型安全
- ✅ 减少文件数量
- ✅ 数据内聚性强
- ✅ 向后兼容

**缺点**：
- ❌ 文件会变大（但仍 < 10KB）

```typescript
// lib/gallup-strengths.ts

import { Locale } from '@/i18n/config';

export const ALL_STRENGTHS = [
  { id: 'focus', domain: 'executing' as const },
  { id: 'belief', domain: 'executing' as const },
  // ... 不再包含 name 字段
] as const;

// ✨ 新增多语言名称映射
export const STRENGTH_NAMES: Record<Locale, Record<StrengthId, string>> = {
  zh: {
    focus: '专注',
    belief: '信仰',
    consistency: '公平',
    deliberative: '审慎',
    achiever: '成就',
    restorative: '排难',
    discipline: '纪律',
    arranger: '统筹',
    responsibility: '责任',
    woo: '取悦',
    maximizer: '完美',
    communication: '沟通',
    competition: '竞争',
    command: '统率',
    'self-assurance': '自信',
    activator: '行动',
    significance: '追求',
    individualization: '个别',
    relator: '交往',
    developer: '伯乐',
    empathy: '体谅',
    connectedness: '关联',
    include: '包容',
    harmony: '和谐',
    positivity: '积极',
    adaptability: '适应',
    analytical: '分析',
    futuristic: '前瞻',
    context: '回顾',
    learner: '学习',
    intellection: '思维',
    strategic: '战略',
    input: '搜集',
    ideation: '理念',
  },
  en: {
    focus: 'Focus',
    belief: 'Belief',
    consistency: 'Consistency',
    deliberative: 'Deliberative',
    achiever: 'Achiever',
    restorative: 'Restorative',
    discipline: 'Discipline',
    arranger: 'Arranger',
    responsibility: 'Responsibility',
    woo: 'Woo',
    maximizer: 'Maximizer',
    communication: 'Communication',
    competition: 'Competition',
    command: 'Command',
    'self-assurance': 'Self-Assurance',
    activator: 'Activator',
    significance: 'Significance',
    individualization: 'Individualization',
    relator: 'Relator',
    developer: 'Developer',
    empathy: 'Empathy',
    connectedness: 'Connectedness',
    include: 'Inclusion',
    harmony: 'Harmony',
    positivity: 'Positivity',
    adaptability: 'Adaptability',
    analytical: 'Analytical',
    futuristic: 'Futuristic',
    context: 'Context',
    learner: 'Learner',
    intellection: 'Intellection',
    strategic: 'Strategic',
    input: 'Input',
    ideation: 'Ideation',
  },
};

// ✨ 新增辅助函数
export function getStrengthName(
  id: StrengthId,
  locale: Locale = 'zh'
): string {
  return STRENGTH_NAMES[locale]?.[id] ?? STRENGTH_NAMES.zh[id] ?? id;
}

// ✨ 获取优势对象（带名称）
export function getStrengthWithName(
  id: StrengthId,
  locale: Locale = 'zh'
): Strength & { name: string } {
  const strength = getStrengthById(id);
  if (!strength) return null;
  return {
    ...strength,
    name: getStrengthName(id, locale),
  };
}

// ✨ 批量获取（供后端使用）
export function getStrengthsByLocale(
  locale: Locale = 'zh'
): Array<Strength & { name: string }> {
  return ALL_STRENGTHS.map(s => ({
    ...s,
    name: getStrengthName(s.id, locale),
  }));
}
```

**迁移影响**：
```typescript
// ❌ 现有代码依然工作（ALL_STRENGTHS.map(s => s.name) 会 break）
// 需要改为
const strengths = ALL_STRENGTHS.map(s => ({
  ...s,
  name: getStrengthName(s.id, locale)
}));
```

**改动范围**：
- [ ] lib/gallup-strengths.ts
- [ ] 需要找出所有使用 ALL_STRENGTHS.name 的地方

---

### 方案2：分离式多语言（备选）

```typescript
// lib/gallup-strengths.ts - 保持原样，不改动

// lib/i18n/strength-names.ts - 新文件
import { StrengthId } from '@/lib/gallup-strengths';
import { Locale } from '@/i18n/config';

export const STRENGTH_NAMES: Record<Locale, Record<StrengthId, string>> = {
  zh: { /* ... */ },
  en: { /* ... */ },
};

export function getStrengthName(id: StrengthId, locale: Locale): string {
  return STRENGTH_NAMES[locale]?.[id] ?? STRENGTH_NAMES.zh[id];
}
```

**优点**：
- ✅ 现有代码零改动
- ✅ 完全向后兼容

**缺点**：
- ❌ 多一个文件
- ❌ 需要 import 两个地方

---

### 推荐方案：方案1 + 向后兼容处理

```typescript
// lib/gallup-strengths.ts

// 保留原有的 name 字段，但标记为 deprecated
export const ALL_STRENGTHS_LEGACY = [
  { id: 'focus', name: '专注', domain: 'executing' as const },
  // ...
] as const;

// 新的结构（不含 name）
export const ALL_STRENGTHS = ALL_STRENGTHS_LEGACY.map(s => {
  const { name, ...rest } = s;
  return rest;
});

// 多语言名称
export const STRENGTH_NAMES: Record<Locale, Record<StrengthId, string>> = { /* ... */ };

// 辅助函数（推荐使用）
export function getStrengthName(id: StrengthId, locale: Locale = 'zh'): string {
  return STRENGTH_NAMES[locale]?.[id] ?? STRENGTH_NAMES.zh[id] ?? id;
}

// 为了兼容，保持旧 API（但指向新数据）
export function getAllStrengthsWithNames(locale: Locale = 'zh') {
  return ALL_STRENGTHS.map(s => ({
    ...s,
    name: getStrengthName(s.id, locale),
  }));
}
```

**改动复杂度**：⭐⭐ (2/5)

---

## 第2步：优势画像多语言化

### 现状分析

```typescript
// lib/strength-profiles.ts (~800 行)
export const STRENGTH_PROFILES: Record<StrengthId, StrengthProfile> = {
  focus: {
    id: 'focus',
    name: '专注',          // ❌ 硬编码中文
    domain: 'executing',
    drive: '锁定目标，排除干扰',  // ❌ 硬编码中文
    cost: '错过周边机会，显得固执', // ❌ 硬编码中文
    basement: '只盯着一件事，无法处理突发状况；对\"不相关\"的事缺乏耐心',
    bestUse: '需要深度工作、长期坚持的任务',
    reframe: '不是放弃专注，而是重新定义\"什么值得专注\"',
    energySignal: {
      charging: '在一件事上持续推进，感到心流状态',
      draining: '被迫同时处理多件事，感到烦躁和分裂',
    },
  },
  // ... 33 more
};
```

**翻译工作量**：
- 34 个优势 × 7 个字段 × 平均 50 字 = 12,000 字
- 工作量：3-5 小时

---

### 方案1：新建多语言文件（推荐✅）

```typescript
// lib/i18n/strength-profiles.ts （新文件，~1600 行）

import { Locale } from '@/i18n/config';
import { StrengthId, StrengthProfile } from '@/lib/types';

export const STRENGTH_PROFILES_I18N: Record<
  Locale,
  Record<StrengthId, StrengthProfile>
> = {
  zh: {
    focus: {
      id: 'focus',
      name: '专注',
      domain: 'executing',
      drive: '锁定目标，排除干扰',
      cost: '错过周边机会，显得固执',
      basement: '只盯着一件事，无法处理突发状况；对"不相关"的事缺乏耐心',
      bestUse: '需要深度工作、长期坚持的任务',
      reframe: '不是放弃专注，而是重新定义"什么值得专注"',
      energySignal: {
        charging: '在一件事上持续推进，感到心流状态',
        draining: '被迫同时处理多件事，感到烦躁和分裂',
      },
    },
    belief: { /* ... */ },
    // ... 32 more
  },
  
  en: {
    focus: {
      id: 'focus',
      name: 'Focus',
      domain: 'executing',
      drive: 'Lock onto target, exclude distractions',
      cost: 'Miss peripheral opportunities, appear inflexible',
      basement: 'Fixated on one thing, unable to handle emergencies; impatient with "unrelated" matters',
      bestUse: 'Tasks requiring deep work and long-term persistence',
      reframe: 'Not about abandoning focus, but redefining "what deserves focus"',
      energySignal: {
        charging: 'Sustained progress on one task, experiencing flow state',
        draining: 'Forced to handle multiple things simultaneously, feeling scattered and irritated',
      },
    },
    belief: { /* ... */ },
    // ... 32 more
  },
};

// 辅助函数
export function getStrengthProfile(
  id: StrengthId,
  locale: Locale = 'zh'
): StrengthProfile | undefined {
  return STRENGTH_PROFILES_I18N[locale]?.[id];
}

export function getStrengthProfiles(
  ids: StrengthId[],
  locale: Locale = 'zh'
): StrengthProfile[] {
  return ids
    .map(id => getStrengthProfile(id, locale))
    .filter((p): p is StrengthProfile => p !== undefined);
}

export function formatProfileForPrompt(
  profile: StrengthProfile,
  locale: Locale = 'zh'
): string {
  const labels = {
    zh: {
      drive: '驱动力',
      cost: '代价区',
      basement: '地下室',
      bestUse: '最佳使用',
      reframe: '调整建议',
      charging: '充能信号',
      draining: '耗能信号',
    },
    en: {
      drive: 'Core Drive',
      cost: 'Cost Zone',
      basement: 'Basement State',
      bestUse: 'Best Use',
      reframe: 'Reframing Tip',
      charging: 'Charging Signal',
      draining: 'Draining Signal',
    },
  };
  
  const label = labels[locale];
  return `【${profile.name}】
- ${label.drive}：${profile.drive}
- ${label.cost}：${profile.cost}
- ${label.basement}：${profile.basement}
- ${label.bestUse}：${profile.bestUse}
- ${label.reframe}：${profile.reframe}
- ${label.charging}：${profile.energySignal.charging}
- ${label.draining}：${profile.energySignal.draining}`;
}
```

**优点**：
- ✅ 现有 lib/strength-profiles.ts 保持不变（作为中文版本）
- ✅ 完全向后兼容
- ✅ 新代码可逐步迁移

**缺点**：
- ❌ 文件变大（~1600 行）
- ❌ 重复定义结构

**改动复杂度**：⭐ (1/5)

---

### 方案2：共享结构，分离翻译

```typescript
// lib/i18n/strength-profiles/
├── _schema.ts      // 结构定义
├── zh.ts           // 中文数据
└── en.ts           // 英文数据

// _schema.ts
export interface StrengthProfileFields {
  drive: string;
  cost: string;
  basement: string;
  bestUse: string;
  reframe: string;
  energySignal: {
    charging: string;
    draining: string;
  };
}

// zh.ts
export const STRENGTH_PROFILES_ZH: Record<StrengthId, StrengthProfileFields> = {
  focus: { /* ... */ },
  // ...
};

// en.ts
export const STRENGTH_PROFILES_EN: Record<StrengthId, StrengthProfileFields> = {
  focus: { /* ... */ },
  // ...
};

// index.ts
export const STRENGTH_PROFILES_I18N: Record<
  Locale,
  Record<StrengthId, StrengthProfileFields>
> = {
  zh: STRENGTH_PROFILES_ZH,
  en: STRENGTH_PROFILES_EN,
};
```

**优点**：
- ✅ 文件模块化
- ✅ 易于维护
- ✅ 易于并行翻译

**缺点**：
- ❌ 文件数量增加（从 1 变成 3）
- ❌ 需要创建 i18n/strength-profiles/ 目录

**改动复杂度**：⭐⭐ (2/5)

---

### 推荐：方案1 + 迁移策略

**阶段1**：创建 lib/i18n/strength-profiles.ts
- 新代码使用 getStrengthProfile(id, locale)
- 旧代码仍用 STRENGTH_PROFILES（来自 lib/strength-profiles.ts）

**阶段2**：逐步迁移
- 后端 API 改为使用 getStrengthProfile(id, locale)
- 前端通过 locale context 传递语言参数

---

## 第3步：场景数据多语言化

### 现状分析

```json
// lib/data/scenarios.json
{
  "scenarios": [
    {
      "id": "work-decision",
      "title": "手头事太多，不知道该先保哪一个",
      "description": "你同时承担多个任务或项目，但不知道如何确定优先级",
      "keywords": ["决策", "选择", "优先", "多任务", "并行"],
      "typicalProblemType": "EFFICIENCY_BOTTLENECK"
    },
    // ... 3 more
  ],
  "version": "1.0.0"
}
```

**翻译工作量**：
- 4 个场景 × 4 字段 × 平均 20 字 = 320 字
- 工作量：30 分钟

---

### 推荐方案：分离 JSON 文件

```typescript
// lib/data/scenarios/
├── zh.json  (现有)
└── en.json  (新建)

// lib/scenarios.ts (修改现有)

import { Locale } from '@/i18n/config';

export interface Scenario {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  typicalProblemType: string;
}

// ✨ 异步加载（支持多语言）
export async function getScenarios(locale: Locale = 'zh'): Promise<Scenario[]> {
  const data = await import(`./data/scenarios/${locale}.json`);
  return data.default.scenarios;
}

// ✨ 同步获取单个场景（需要预加载数据）
const SCENARIOS_ZH = require('./data/scenarios/zh.json').scenarios as Scenario[];
const SCENARIOS_EN = require('./data/scenarios/en.json').scenarios as Scenario[];

const SCENARIOS_I18N: Record<Locale, Scenario[]> = {
  zh: SCENARIOS_ZH,
  en: SCENARIOS_EN,
};

export function getScenario(
  id: string,
  locale: Locale = 'zh'
): Scenario | undefined {
  return SCENARIOS_I18N[locale]?.find(s => s.id === id);
}

export function getAllScenarios(locale: Locale = 'zh'): Scenario[] {
  return SCENARIOS_I18N[locale];
}
```

**en.json 内容示例**：
```json
{
  "scenarios": [
    {
      "id": "work-decision",
      "title": "Too many tasks, unsure which to prioritize",
      "description": "You're juggling multiple tasks or projects but don't know how to prioritize",
      "keywords": ["decision", "choice", "priority", "multitasking", "parallel"],
      "typicalProblemType": "EFFICIENCY_BOTTLENECK"
    },
    {
      "id": "career-transition",
      "title": "Considering a career change but unclear on strengths",
      "description": "You're thinking about switching careers but unsure how your strengths apply to the new field",
      "keywords": ["transition", "career", "direction", "new field", "pivot"],
      "typicalProblemType": "DIRECTION_UNCERTAINTY"
    },
    {
      "id": "efficiency",
      "title": "Exhausted every day but productivity isn't improving",
      "description": "You feel you're putting in significant effort but the results aren't showing",
      "keywords": ["efficiency", "exhausted", "overextended", "effort", "output"],
      "typicalProblemType": "EFFICIENCY_BOTTLENECK"
    },
    {
      "id": "communication",
      "title": "Communication is draining; feeling misunderstood",
      "description": "You struggle with communication and often feel people don't understand you",
      "keywords": ["communication", "understanding", "expression", "others", "draining"],
      "typicalProblemType": "BOUNDARY_OVERLOAD"
    }
  ],
  "version": "1.0.0",
  "lastUpdated": "2024-01-20"
}
```

**改动复杂度**：⭐ (1/5)

**向后兼容**：✅ 完全兼容（使用默认参数 locale='zh'）

---

## 第4步：组合规则多语言化

### 现状分析

```typescript
// lib/combo-rules.ts (~600 行)
export const COMBO_RULES: ComboRule[] = [
  {
    id: 'responsibility-harmony-trap',
    trigger: { requires: ['responsibility', 'harmony'] },
    type: 'trap',
    weight: 9,
    effect: {
      name: '无限承担循环',           // ❌ 硬编码中文
      description: '责任让你接住所有事，和谐让你无法拒绝',
      symptom: '事情越来越多，但从来不说"不"',
    },
    correction: {
      insight: '你的"责任+和谐"组合在制造一个陷阱...',
      action: '用和谐的方式设计"温和拒绝"话术...',
      boundary: '负责你选定的事，不负责所有人的期待',
    },
  },
  // ... 30+ more
];
```

**翻译工作量**：
- 30+ 条规则 × 6 字段 × 平均 40 字 = 7,200 字
- 工作量：2-3 小时

---

### 方案1：嵌入式多语言（推荐✅）

```typescript
// lib/combo-rules.ts (修改现有)

import { Locale } from '@/i18n/config';

// ✨ 修改接口定义
export interface ComboRuleI18n extends Omit<ComboRule, 'effect' | 'correction'> {
  effect: {
    name: Record<Locale, string>;
    description: Record<Locale, string>;
    symptom: Record<Locale, string>;
  };
  correction: {
    insight: Record<Locale, string>;
    action: Record<Locale, string>;
    boundary: Record<Locale, string>;
  };
}

// ✨ 修改数据结构
export const COMBO_RULES: ComboRuleI18n[] = [
  {
    id: 'responsibility-harmony-trap',
    trigger: { requires: ['responsibility', 'harmony'] },
    type: 'trap',
    weight: 9,
    effect: {
      name: {
        zh: '无限承担循环',
        en: 'Endless Commitment Cycle',
      },
      description: {
        zh: '责任让你接住所有事，和谐让你无法拒绝',
        en: 'Responsibility makes you accept everything, Harmony makes you unable to refuse',
      },
      symptom: {
        zh: '事情越来越多，但从来不说"不"',
        en: 'More and more tasks, but you never say "no"',
      },
    },
    correction: {
      insight: {
        zh: '你的"责任+和谐"组合在制造一个陷阱：为了避免冲突而承担一切',
        en: 'Your "Responsibility + Harmony" creates a trap: taking on everything to avoid conflict',
      },
      action: {
        zh: '用和谐的方式设计"温和拒绝"话术，而不是用责任接住所有',
        en: 'Design "gentle refusal" scripts using Harmony, rather than accepting everything through Responsibility',
      },
      boundary: {
        zh: '负责你选定的事，不负责所有人的期待',
        en: 'Responsible for your chosen tasks, not for everyone\'s expectations',
      },
    },
  },
  // ... more rules
];

// ✨ 修改合并函数
export interface ComboEffect {
  amplifications: Array<{
    name: string;
    description: string;
    weight: number;
  }>;
  // ... 其他字段
}

export function getComboEffect(
  userStrengths: StrengthId[],
  locale: Locale = 'zh'
): ComboEffect {
  const matchedRules = getMatchedRules(userStrengths);
  return mergeToComboEffect(matchedRules, locale);
}

function mergeToComboEffect(
  rules: ComboRuleI18n[],
  locale: Locale = 'zh'
): ComboEffect {
  const effect: ComboEffect = {
    amplifications: [],
    blindspots: [],
    conflicts: [],
    traps: [],
    corrections: [],
  };

  const seenEffects = new Set<string>();
  const seenCorrections = new Set<string>();

  for (const rule of rules) {
    const effectKey = `${rule.type}:${rule.effect.name[locale]}`;

    if (seenEffects.has(effectKey)) continue;
    seenEffects.add(effectKey);

    switch (rule.type) {
      case 'amplify':
        effect.amplifications.push({
          name: rule.effect.name[locale],
          description: rule.effect.description[locale],
          weight: rule.weight,
        });
        break;
      case 'blindspot':
        effect.blindspots.push({
          name: rule.effect.name[locale],
          symptom: rule.effect.symptom[locale],
          weight: rule.weight,
        });
        break;
      case 'conflict':
        effect.conflicts.push({
          name: rule.effect.name[locale],
          description: rule.effect.description[locale],
          weight: rule.weight,
        });
        break;
      case 'trap':
        effect.traps.push({
          name: rule.effect.name[locale],
          symptom: rule.effect.symptom[locale],
          weight: rule.weight,
        });
        break;
    }

    const correctionKey = rule.correction.action[locale];
    if (!seenCorrections.has(correctionKey)) {
      seenCorrections.add(correctionKey);
      effect.corrections.push({
        insight: rule.correction.insight[locale],
        action: rule.correction.action[locale],
        boundary: rule.correction.boundary[locale],
        weight: rule.weight,
      });
    }
  }

  // 排序和截断
  effect.amplifications.sort((a, b) => b.weight - a.weight);
  effect.blindspots.sort((a, b) => b.weight - a.weight);
  effect.conflicts.sort((a, b) => b.weight - a.weight);
  effect.traps.sort((a, b) => b.weight - a.weight);
  effect.corrections.sort((a, b) => b.weight - a.weight).slice(0, 3);

  return effect;
}

export function formatComboEffectForPrompt(
  effect: ComboEffect,
  locale: Locale = 'zh'
): string {
  const labels = {
    zh: {
      amplification: '【组合放大效应】',
      trap: '【组合陷阱】',
      blindspot: '【组合盲区】',
      conflict: '【组合冲突】',
      correction: '【纠偏建议】',
    },
    en: {
      amplification: '【Synergy Effects】',
      trap: '【Combination Traps】',
      blindspot: '【Blind Spots】',
      conflict: '【Internal Conflicts】',
      correction: '【Correction Tips】',
    },
  };

  const label = labels[locale];
  const sections: string[] = [];

  if (effect.amplifications.length > 0) {
    sections.push(
      `${label.amplification}\n${effect.amplifications.map(a => `- ${a.name}：${a.description}`).join('\n')}`
    );
  }

  if (effect.traps.length > 0) {
    sections.push(
      `${label.trap}\n${effect.traps.map(t => `- ${t.name}：${t.symptom}`).join('\n')}`
    );
  }

  if (effect.blindspots.length > 0) {
    sections.push(
      `${label.blindspot}\n${effect.blindspots.map(b => `- ${b.name}：${b.symptom}`).join('\n')}`
    );
  }

  if (effect.conflicts.length > 0) {
    sections.push(
      `${label.conflict}\n${effect.conflicts.map(c => `- ${c.name}：${c.description}`).join('\n')}`
    );
  }

  if (effect.corrections.length > 0) {
    sections.push(
      `${label.correction}\n${effect.corrections.map((c, i) => `${i + 1}. ${c.insight}\n   ${c.action}\n   ${c.boundary}`).join('\n')}`
    );
  }

  return sections.join('\n\n');
}
```

**优点**：
- ✅ 数据内聚性强
- ✅ 易于维护（修改规则时同时修改所有语言）
- ✅ 类型安全

**缺点**：
- ❌ 文件变大（~1200 行）
- ❌ 重复结构

**改动复杂度**：⭐⭐⭐ (3/5)

---

### 方案2：分离 JSON 文件

```typescript
// lib/i18n/combo-rules/
├── _schema.ts       // 接口定义
├── zh.ts            // 中文规则
└── en.ts            // 英文规则

// 优点：易于管理大量文本
// 缺点：结构重复，逻辑分散
```

**改动复杂度**：⭐⭐ (2/5)

---

## 方案对比与权衡

### 数据量统计

| 步骤 | 文件数 | 代码行数 | 翻译字数 | 工作量 |
|------|--------|---------|---------|--------|
| 第1步 | 0 新增 | +100 | 0 | 30 分钟 |
| 第2步 | 1 新增 | +1600 | 12,000 | 3-5 小时 |
| 第3步 | 1 新增 | +50 | 320 | 30 分钟 |
| 第4步 | 0 新增 | +400 | 7,200 | 2-3 小时 |
| **总计** | **2 新增** | **+2,150** | **19,520** | **6-12 小时** |

### 方案复杂度对比

| 方案 | 复杂度 | 向后兼容 | 文件数 | 推荐度 |
|------|--------|----------|--------|--------|
| 第1步-方案1 | ⭐⭐ | ✅ | 0 | ⭐⭐⭐⭐⭐ |
| 第2步-方案1 | ⭐ | ✅ | 1 | ⭐⭐⭐⭐⭐ |
| 第2步-方案2 | ⭐⭐ | ✅ | 3 | ⭐⭐⭐ |
| 第3步-推荐 | ⭐ | ✅ | 1 | ⭐⭐⭐⭐⭐ |
| 第4步-方案1 | ⭐⭐⭐ | ✅ | 0 | ⭐⭐⭐⭐ |
| 第4步-方案2 | ⭐⭐ | ✅ | 3 | ⭐⭐⭐ |

---

## 风险评估

### 风险1：数据字段不完整

**风险等级**：🟡 中等

**表现**：某些语言的字段为空或缺失

**缓解措施**：
- [ ] 在合并函数中添加 fallback 逻辑：`locale || 'zh'`
- [ ] 在构建时验证所有字段完整性
- [ ] 单元测试覆盖所有优势 × 所有字段 × 所有语言

```typescript
// 添加验证函数
export function validateStrengthProfilesI18n(): string[] {
  const errors: string[] = [];
  const locales: Locale[] = ['zh', 'en'];

  for (const locale of locales) {
    for (const strengthId of VALID_STRENGTH_IDS) {
      const profile = STRENGTH_PROFILES_I18N[locale]?.[strengthId];
      if (!profile) {
        errors.push(`Missing profile for ${strengthId} in locale ${locale}`);
      }
    }
  }

  return errors;
}
```

---

### 风险2：性能问题

**风险等级**：🟢 低（对第3阶段）

**表现**：加载大型 JSON 或对象导致性能下降

**缓解措施**：
- [ ] 第1步、第3步影响极小（字符串映射、JSON）
- [ ] 第2步、第4步可能增加 bundle size
  - 压缩后 impact < 50KB
  - 考虑 tree-shaking

```typescript
// lib/i18n/strength-profiles.ts
// 标记为 Tree-shakeable
export const STRENGTH_PROFILES_EN: Record<StrengthId, StrengthProfile> = { /* ... */ };
export const STRENGTH_PROFILES_ZH: Record<StrengthId, StrengthProfile> = { /* ... */ };

// 只在需要时导入
import { STRENGTH_PROFILES_EN } from '@/lib/i18n/strength-profiles';
```

---

### 风险3：API 兼容性

**风险等级**：🟡 中等

**表现**：后端 API 调用返回中文，前端无法使用

**缓解措施**：
- [ ] 第4阶段（AI 生成层国际化）才真正需要考虑
- [ ] 第3阶段只是数据准备，不涉及 API 改动

---

## 优先级建议

### **立即启动**（第3阶段第1周）
1. ✅ **第1步**：优势基础数据多语言化（方案1）
2. ✅ **第3步**：场景数据多语言化（分离 JSON）
3. ⚙️ **第2步 - 第一部分**：创建 lib/i18n/strength-profiles.ts 空框架

### **第2周启动**（翻译资源到位后）
4. ⏳ **第2步**：优势画像多语言化（方案1）
5. ⏳ **第4步**：组合规则多语言化（方案1）

### **第3周**
6. 🧪 单元测试覆盖
7. 🔗 数据流集成测试

---

## 下一步确认

请确认以下问题：

1. **第1步**：接受方案1（嵌入式多语言）吗？
2. **第2步**：接受方案1（新建多语言文件）吗？
3. **第3步**：接受分离 JSON 方案吗？
4. **第4步**：接受方案1（嵌入式多语言）吗？
5. **翻译资源**：你自己做翻译还是需要 AI 辅助验证？

---

## 总结表

| 步骤 | 推荐方案 | 复杂度 | 工作量 | 向后兼容 |
|------|---------|--------|--------|----------|
| 第1步 | 方案1 | ⭐⭐ | 30分钟 | ✅ |
| 第2步 | 方案1 | ⭐ | 3-5小时 | ✅ |
| 第3步 | 分离JSON | ⭐ | 30分钟 | ✅ |
| 第4步 | 方案1 | ⭐⭐⭐ | 2-3小时 | ✅ |
| **总计** | - | - | **6-12小时** | **✅** |
