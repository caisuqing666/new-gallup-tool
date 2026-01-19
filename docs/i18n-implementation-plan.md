# 盖洛普优势分析工具 - 中英双语国际化实施计划

## 项目概况

| 指标 | 数值 |
|------|------|
| 需翻译中文内容 | ~15,000-20,000 字 |
| UI 组件 | 20 个 |
| 优势数据 | 34 条（每条 200-300 字描述） |
| 场景数据 | 4 条 |
| 组合规则 | 30+ 条 |
| Prompt 文件 | 5 个（~3,000 行） |
| 预计总工期 | 30-50 工作日 |

---

## 技术方案选型

### 推荐方案：next-intl + 分层数据结构

```
┌─────────────────────────────────────────────────────────┐
│                      前端 UI 层                          │
│              next-intl (路由 + 组件翻译)                  │
├─────────────────────────────────────────────────────────┤
│                      数据层                              │
│         JSON 多语言文件 + TypeScript Record              │
├─────────────────────────────────────────────────────────┤
│                    Prompt 层                             │
│            按语言加载不同 prompt 模板                      │
├─────────────────────────────────────────────────────────┤
│                   AI 生成层                              │
│          语言参数传递 + 多语言 prompt 优化                 │
└─────────────────────────────────────────────────────────┘
```

### 路由策略

采用 **子路径方案**：
- 中文：`/zh/...` (默认)
- 英文：`/en/...`

---

## 分阶段实施计划

### 第一阶段：基础设施搭建（3-5 天）

#### 1.1 安装和配置 next-intl

```bash
npm install next-intl
```

#### 1.2 创建目录结构

```
├── messages/
│   ├── zh.json          # 中文 UI 翻译
│   └── en.json          # 英文 UI 翻译
├── i18n/
│   ├── config.ts        # 语言配置
│   ├── request.ts       # 请求处理
│   └── navigation.ts    # 导航辅助
├── app/
│   └── [locale]/        # 国际化路由
│       ├── layout.tsx
│       └── page.tsx
```

#### 1.3 配置文件创建

**i18n/config.ts**
```typescript
export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh';

export const localeNames: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
};
```

**middleware.ts**
```typescript
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // 默认语言不显示前缀
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

#### 1.4 交付物
- [ ] next-intl 配置完成
- [ ] 路由结构迁移到 `[locale]`
- [ ] 语言切换组件
- [ ] 中英文 JSON 骨架文件

---

### 第二阶段：UI 层国际化（5-7 天）

#### 2.1 翻译文件结构

**messages/zh.json**
```json
{
  "common": {
    "loading": "加载中...",
    "error": "出错了",
    "retry": "重试",
    "back": "返回",
    "next": "下一步",
    "submit": "提交"
  },
  "landing": {
    "title": "发现你的优势密码",
    "subtitle": "基于盖洛普 CliftonStrengths 的 AI 决策辅助工具",
    "cta": "开始探索"
  },
  "paths": {
    "breakthrough": {
      "title": "突破方案",
      "subtitle": "当你面临困境，不知如何选择"
    },
    "careerMatch": {
      "title": "职业匹配",
      "subtitle": "发现最适合你优势的职业方向"
    },
    "strengthGuide": {
      "title": "优势指南",
      "subtitle": "了解如何在日常中发挥优势"
    },
    "reportInterpret": {
      "title": "报告解读",
      "subtitle": "上传你的盖洛普报告获取解读"
    }
  },
  "strengths": {
    "selectTitle": "选择你的 TOP5 优势",
    "selectHint": "请选择 3-5 个你最突出的优势",
    "domains": {
      "executing": "执行力",
      "influencing": "影响力",
      "relationship": "关系建立",
      "strategic": "战略思维"
    }
  },
  "result": {
    "explainTitle": "理解发生了什么",
    "decideTitle": "现在该怎么做",
    "pathDecision": {
      "doubleDown": "继续投入",
      "reframe": "结构性调整",
      "narrow": "阶段性收敛",
      "exit": "退出/放弃"
    }
  }
}
```

**messages/en.json**
```json
{
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Retry",
    "back": "Back",
    "next": "Next",
    "submit": "Submit"
  },
  "landing": {
    "title": "Discover Your Strength Code",
    "subtitle": "AI-powered decision support based on Gallup CliftonStrengths",
    "cta": "Start Exploring"
  },
  "paths": {
    "breakthrough": {
      "title": "Breakthrough Solution",
      "subtitle": "When you're stuck and don't know what to choose"
    },
    "careerMatch": {
      "title": "Career Match",
      "subtitle": "Find careers that fit your strengths"
    },
    "strengthGuide": {
      "title": "Strength Guide",
      "subtitle": "Learn to leverage your strengths daily"
    },
    "reportInterpret": {
      "title": "Report Interpretation",
      "subtitle": "Upload your Gallup report for insights"
    }
  }
}
```

#### 2.2 组件改造示例

**改造前**
```tsx
<h1>发现你的优势密码</h1>
<p>基于盖洛普 CliftonStrengths 的 AI 决策辅助工具</p>
<button>开始探索</button>
```

**改造后**
```tsx
import { useTranslations } from 'next-intl';

export function LandingPage() {
  const t = useTranslations('landing');

  return (
    <>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
      <button>{t('cta')}</button>
    </>
  );
}
```

#### 2.3 需改造的组件清单

| 组件 | 文件路径 | 预估文本量 | 优先级 |
|------|----------|-----------|--------|
| LandingPage | `components/LandingPage.tsx` | 10+ | P0 |
| PathSelectionPage | `components/PathSelectionPage.tsx` | 15+ | P0 |
| StrengthsPage | `components/StrengthsPage.tsx` | 20+ | P0 |
| ScenarioPage | `components/ScenarioPage.tsx` | 15+ | P0 |
| InputPage | `components/InputPage.tsx` | 10+ | P0 |
| LoadingPage | `components/LoadingPage.tsx` | 5+ | P1 |
| ResultPage | `components/ResultPage.tsx` | 30+ | P0 |
| GuideResultPage | `components/GuideResultPage.tsx` | 25+ | P0 |
| CareerResultPage | `components/CareerResultPage.tsx` | 20+ | P1 |
| Toast | `components/Toast.tsx` | 5+ | P2 |

#### 2.4 交付物
- [ ] 所有 UI 组件完成 i18n 改造
- [ ] 中英文 JSON 翻译文件完成
- [ ] 语言切换功能可用
- [ ] 所有页面双语可访问

---

### 第三阶段：数据层国际化（7-10 天）

#### 3.1 优势数据多语言化

**当前结构** (`lib/gallup-strengths.ts`)
```typescript
export const STRENGTHS = [
  { id: 'achiever', name: '成就', domain: 'executing' },
  // ...
];
```

**目标结构** (`lib/i18n/strengths.ts`)
```typescript
import { Locale } from '@/i18n/config';

export interface StrengthI18n {
  id: StrengthId;
  domain: Domain;
  names: Record<Locale, string>;
}

export const STRENGTHS_I18N: StrengthI18n[] = [
  {
    id: 'achiever',
    domain: 'executing',
    names: { zh: '成就', en: 'Achiever' }
  },
  {
    id: 'activator',
    domain: 'influencing',
    names: { zh: '行动', en: 'Activator' }
  },
  // ... 34 个优势
];

export function getStrengthName(id: StrengthId, locale: Locale): string {
  const strength = STRENGTHS_I18N.find(s => s.id === id);
  return strength?.names[locale] ?? id;
}
```

#### 3.2 优势画像多语言化

**文件**: `lib/i18n/strength-profiles/`

```
lib/i18n/strength-profiles/
├── zh/
│   ├── achiever.json
│   ├── activator.json
│   └── ... (34 个文件)
├── en/
│   ├── achiever.json
│   ├── activator.json
│   └── ... (34 个文件)
└── index.ts
```

**单个优势画像结构** (`en/achiever.json`)
```json
{
  "id": "achiever",
  "name": "Achiever",
  "drive": "Internal motor that demands constant productivity",
  "cost": "Difficulty resting; self-worth tied to output",
  "basement": "Workaholic tendencies; burnout risk",
  "bestUse": "Goal-driven projects with clear milestones",
  "reframe": "Define 'enough' before starting each day",
  "energySignal": {
    "charging": "Checking items off your list",
    "draining": "Unfinished tasks at day's end"
  }
}
```

#### 3.3 场景数据多语言化

**文件**: `lib/data/scenarios/`

```
lib/data/scenarios/
├── zh.json
└── en.json
```

**en.json**
```json
{
  "version": "1.0.0",
  "scenarios": [
    {
      "id": "work-decision",
      "title": "Too many tasks, don't know what to prioritize",
      "description": "You're juggling multiple projects but can't decide what comes first",
      "keywords": ["decision", "priority", "multitasking"],
      "typicalProblemType": "EFFICIENCY_BOTTLENECK"
    }
  ]
}
```

#### 3.4 组合规则多语言化

**文件**: `lib/i18n/combo-rules/`

```typescript
// lib/i18n/combo-rules/index.ts
export interface ComboRuleI18n {
  id: string;
  strengths: [StrengthId, StrengthId];
  trap: Record<Locale, string>;
  blindspot: Record<Locale, string>;
  amplification: Record<Locale, string>;
}
```

#### 3.5 交付物
- [ ] 34 个优势名称双语
- [ ] 34 个优势画像双语（~10,000 字翻译）
- [ ] 4 个场景双语
- [ ] 30+ 组合规则双语
- [ ] 类型标签映射双语 (PathDecision, ProblemType 等)

---

### 第四阶段：Prompt 系统国际化（10-15 天）

#### 4.1 Prompt 模板分离

**目录结构**
```
lib/prompts/
├── zh/
│   ├── system-explain.ts    # 解释页系统 prompt
│   ├── system-decide.ts     # 判定页系统 prompt
│   ├── user-template.ts     # 用户 prompt 模板
│   ├── strength-guide.ts    # 优势指南 prompt
│   └── career-match.ts      # 职业匹配 prompt
├── en/
│   ├── system-explain.ts
│   ├── system-decide.ts
│   ├── user-template.ts
│   ├── strength-guide.ts
│   └── career-match.ts
└── index.ts                  # 统一导出
```

#### 4.2 Prompt 加载器

```typescript
// lib/prompts/index.ts
import { Locale } from '@/i18n/config';

export async function loadPrompts(locale: Locale) {
  const prompts = await import(`./prompts/${locale}`);
  return {
    systemExplain: prompts.SYSTEM_EXPLAIN_PROMPT,
    systemDecide: prompts.SYSTEM_DECIDE_PROMPT,
    userTemplate: prompts.USER_PROMPT_TEMPLATE,
    // ...
  };
}
```

#### 4.3 Context Pack 多语言构建

```typescript
// lib/context-generator.ts
export function buildContextPack(
  confusion: string,
  strengths: StrengthId[],
  locale: Locale
): ContextPack {
  const strengthProfiles = strengths.map(id =>
    getStrengthProfile(id, locale)  // 按语言加载
  );

  const comboRules = getComboRules(strengths, locale);

  return {
    confusion: parseConfusion(confusion, locale),
    strengths: strengthProfiles,
    combo: comboRules,
  };
}
```

#### 4.4 英文 Prompt 编写要点

| 中文概念 | 英文翻译建议 | 说明 |
|---------|-------------|------|
| 路径判定 | Path Decision | 保持专业术语感 |
| 继续投入 | Double Down | 保留原英文术语 |
| 结构性调整 | Reframe | 保留原英文术语 |
| 阶段性收敛 | Narrow Focus | 直译 |
| 退出/放弃 | Strategic Exit | 更积极的表述 |
| 驱动力 | Core Drive | - |
| 代价区 | Cost Zone | - |
| 地下室 | Basement State | 盖洛普官方术语 |
| 盲区 | Blind Spot | - |
| 能量信号 | Energy Signal | - |

#### 4.5 交付物
- [ ] 中文 prompt 重构为模块化
- [ ] 英文 prompt 完整翻译
- [ ] Context Pack 多语言支持
- [ ] API 路由支持 locale 参数

---

### 第五阶段：AI 生成内容国际化（15-20 天）

#### 5.1 困惑解析器多语言

**当前问题**：`confusion-parser.ts` 使用硬编码中文关键词

**解决方案**：

```typescript
// lib/i18n/confusion-keywords.ts
export const PROBLEM_KEYWORDS: Record<ProblemType, Record<Locale, string[]>> = {
  [ProblemType.DIRECTION_UNCERTAINTY]: {
    zh: ['方向', '不确定', '迷茫', '选择', '纠结'],
    en: ['direction', 'uncertain', 'lost', 'choice', 'torn'],
  },
  [ProblemType.BOUNDARY_OVERLOAD]: {
    zh: ['边界', '责任', '太多', '承担', '压力'],
    en: ['boundary', 'responsibility', 'overload', 'burden', 'pressure'],
  },
  // ...
};
```

```typescript
// lib/confusion-parser.ts (改造后)
export function parseConfusion(
  text: string,
  locale: Locale
): ConfusionAnalysis {
  const keywords = PROBLEM_KEYWORDS[locale];
  // 使用对应语言的关键词进行匹配
}
```

#### 5.2 API 路由改造

```typescript
// app/api/guide/route.ts
export async function POST(request: NextRequest) {
  const { strengths, locale = 'zh' } = await request.json();

  // 1. 加载对应语言的 prompt
  const prompts = await loadPrompts(locale);

  // 2. 构建对应语言的 Context Pack
  const contextPack = buildContextPack(strengths, locale);

  // 3. 调用 AI（prompt 中指定输出语言）
  const result = await generateWithAI(prompts, contextPack, locale);

  return NextResponse.json({ data: result, locale });
}
```

#### 5.3 前端 API 调用改造

```typescript
// app/hooks/useGenerate.ts
import { useLocale } from 'next-intl';

export function useGenerate() {
  const locale = useLocale();

  const generate = async (data: GenerateInput) => {
    const response = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ ...data, locale }),
    });
    return response.json();
  };

  return { generate };
}
```

#### 5.4 AI 输出质量保障

**测试用例**：
- [ ] 中文输入 → 中文输出
- [ ] 英文输入 → 英文输出
- [ ] 混合输入处理
- [ ] 专业术语一致性
- [ ] 输出格式稳定性

**A/B 测试**：
- 对比中英文 prompt 的输出质量
- 调优温度参数 (temperature)
- 确定最优 token 限制

#### 5.5 交付物
- [ ] 困惑解析器支持中英文
- [ ] 所有 API 路由支持 locale 参数
- [ ] 英文 AI 输出质量达标
- [ ] 端到端测试通过

---

## 风险与缓解措施

### 风险 1：英文 Prompt 效果不佳
- **概率**：中等
- **影响**：高
- **缓解**：
  - 使用 Claude/GPT-4 等对英文优化更好的模型
  - 增加英文 few-shot 示例
  - 考虑混合策略（中文生成 + AI 翻译）

### 风险 2：翻译工作量超预期
- **概率**：中等
- **影响**：中等
- **缓解**：
  - 优先翻译核心流程
  - 使用 AI 辅助翻译 + 人工校对
  - 分批发布（先 UI，后数据，再 Prompt）

### 风险 3：类型系统重构复杂
- **概率**：低
- **影响**：中等
- **缓解**：
  - 保持向后兼容
  - 使用 TypeScript 严格类型检查
  - 增量迁移，非一次性重构

---

## 里程碑与验收标准

| 阶段 | 里程碑 | 验收标准 | 预计完成 |
|------|--------|----------|----------|
| 1 | 基础设施 | 语言切换可用，路由正常 | 第 1 周 |
| 2 | UI 国际化 | 所有页面双语可访问 | 第 2 周 |
| 3 | 数据国际化 | 优势/场景显示双语 | 第 4 周 |
| 4 | Prompt 国际化 | API 支持双语参数 | 第 6 周 |
| 5 | AI 生成国际化 | 端到端双语流程 | 第 8 周 |

---

## 附录：34 个优势中英对照表

| ID | 中文名 | English | 领域 |
|----|--------|---------|------|
| achiever | 成就 | Achiever | 执行力 |
| activator | 行动 | Activator | 影响力 |
| adaptability | 适应 | Adaptability | 关系建立 |
| analytical | 分析 | Analytical | 战略思维 |
| arranger | 统筹 | Arranger | 执行力 |
| belief | 信仰 | Belief | 执行力 |
| command | 统率 | Command | 影响力 |
| communication | 沟通 | Communication | 影响力 |
| competition | 竞争 | Competition | 影响力 |
| connectedness | 关联 | Connectedness | 关系建立 |
| consistency | 公平 | Consistency | 执行力 |
| context | 回顾 | Context | 战略思维 |
| deliberative | 审慎 | Deliberative | 执行力 |
| developer | 伯乐 | Developer | 关系建立 |
| discipline | 纪律 | Discipline | 执行力 |
| empathy | 体谅 | Empathy | 关系建立 |
| focus | 专注 | Focus | 执行力 |
| futuristic | 前瞻 | Futuristic | 战略思维 |
| harmony | 和谐 | Harmony | 关系建立 |
| ideation | 理念 | Ideation | 战略思维 |
| includer | 包容 | Includer | 关系建立 |
| individualization | 个别 | Individualization | 关系建立 |
| input | 搜集 | Input | 战略思维 |
| intellection | 思维 | Intellection | 战略思维 |
| learner | 学习 | Learner | 战略思维 |
| maximizer | 完美 | Maximizer | 影响力 |
| positivity | 积极 | Positivity | 关系建立 |
| relator | 交往 | Relator | 关系建立 |
| responsibility | 责任 | Responsibility | 执行力 |
| restorative | 排难 | Restorative | 执行力 |
| self-assurance | 自信 | Self-Assurance | 影响力 |
| significance | 追求 | Significance | 影响力 |
| strategic | 战略 | Strategic | 战略思维 |
| woo | 取悦 | Woo | 影响力 |

---

## 下一步行动

1. **确认技术方案**：评审本文档，确定是否采用 next-intl
2. **创建分支**：`feature/i18n-support`
3. **启动第一阶段**：安装依赖，搭建基础设施
4. **组建翻译资源**：确定翻译人员或 AI 辅助翻译流程
