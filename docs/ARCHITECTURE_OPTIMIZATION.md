# 架构优化方案（可落地）

## 优化总览

| 优先级 | 优化项 | 工作量 | 收益 | 影响范围 |
|--------|--------|--------|------|---------|
| P0 | AI Provider 配置统一化 | 中 | 高 | 生产稳定性 |
| P0 | 避免 process.env 并发污染 | 中 | 高 | 生产稳定性 |
| P1 | 参数校验层统一化 | 中 | 中 | 代码质量 |
| P1 | 首屏 Bundle 优化 | 中 | 中 | 用户体验 |
| P2 | 目录结构重组 | 大 | 低 | 长期维护性 |
| P2 | Pipeline 文档对齐 | 小 | 低 | 开发体验 |

---

## 优化详情

### P0-1：AI Provider 配置统一化 → lib/ai-client.ts

**问题**：
- `lib/ai-generate.ts` 和 `app/api/guide/route.ts` 各自实现 getAIConfig、超时、错误处理
- 当 AI Provider 配置变更时，需要同步修改多处，容易遗漏或不一致

**收益**：
- 单一数据源（Single Source of Truth）
- 减少 bug 和配置漂移
- 新增 API 路由时零成本复用

**实施步骤**：

**第 1 步**：创建统一的 AI Client 抽象（`lib/ai-client.ts`）

```typescript
// lib/ai-client.ts - 新建
export interface AIClientConfig {
  provider: 'anthropic' | 'openai' | 'zhipu';
  timeout: number;
  retries: number;
  fallbackToMock: boolean;
}

export class AIClient {
  private config: AIClientConfig;
  private client: any; // Anthropic / OpenAI client

  constructor(config: AIClientConfig) {
    this.config = config;
    this.initializeClient();
  }

  private initializeClient() {
    // 初始化逻辑（从 lib/ai-generate.ts 迁移）
  }

  async generate(prompt: string, schema?: any): Promise<string> {
    // 统一的生成逻辑，包含超时/重试/错误处理
  }

  async parseWithRetry<T>(prompt: string, parser: (text: string) => T): Promise<T> {
    // 带重试的解析
  }
}

export function createAIClient(): AIClient {
  const config: AIClientConfig = {
    provider: (process.env.AI_PROVIDER as any) || 'anthropic',
    timeout: Number(process.env.AI_TIMEOUT || 30000),
    retries: Number(process.env.AI_RETRIES || 2),
    fallbackToMock: process.env.ENABLE_AI !== 'true',
  };
  return new AIClient(config);
}
```

**第 2 步**：迁移现有逻辑

- 从 `lib/ai-generate.ts` 提取 getAIConfig、超时配置 → `AIClient` 构造函数
- 从 `app/api/guide/route.ts` 提取错误处理逻辑 → `AIClient.generate()` 中

**第 3 步**：统一所有 API 路由的使用

```typescript
// app/api/generate/route.ts 改为
import { createAIClient } from '@/lib/ai-client';

export async function POST(req: Request) {
  const client = createAIClient();
  
  try {
    const result = await client.generate(prompt);
    return Response.json({ result });
  } catch (error) {
    return handleAIError(error); // 统一的错误处理
  }
}
```

**相关文件**：
- 修改：`lib/ai-generate.ts` → 保留为 backward-compat 层或删除
- 创建：`lib/ai-client.ts` （新增）
- 修改：`app/api/generate/route.ts`、`app/api/guide/route.ts` 等

**风险**：
- 需要完整的单元测试覆盖
- 迁移过程中要验证现有行为不变

---

### P0-2：避免 process.env 并发污染 → 显式传参或依赖注入

**问题**：
- `lib/services/action-plan.ts` 的 `generateWithAI()` 会直接修改 `process.env.ENABLE_AI` 和 `AI_PROVIDER`
- 在高并发下，不同请求会互相影响配置

**收益**：
- 消除并发 bug 的根源
- 便于测试（可 mock provider）
- 为服务端缓存和请求隔离做准备

**实施步骤**：

**第 1 步**：将 AI Provider 配置改为显式传参

```typescript
// 改前
export async function generateWithAI(input: GenerateInput) {
  process.env.ENABLE_AI = 'true'; // ❌ 污染全局
  process.env.AI_PROVIDER = 'zhipu';
  // ...
}

// 改后
export async function generateWithAI(
  input: GenerateInput,
  options?: { 
    provider?: 'anthropic' | 'openai' | 'zhipu';
    enableAI?: boolean;
  }
) {
  const provider = options?.provider || getDefaultProvider();
  const aiClient = createAIClient({ provider });
  // ...
}
```

**第 2 步**：审查所有调用方

查找 `generateWithAI` 的所有调用处（通常在 `app/api/*/route.ts`），改为显式传参。

**第 3 步**：验证测试

确保 parallel 请求不会相互影响。

**相关文件**：
- 修改：`lib/services/action-plan.ts`
- 修改：所有调用 `generateWithAI` 的路由（`app/api/*/route.ts`）

**风险**：
- 需要验证所有调用处都正确传参
- 可能影响现有的 feature flag 逻辑

---

### P1-1：参数校验层统一化 → Zod Schema

**问题**：
- 每个 API route 都手写校验（`app/api/generate/route.ts` 等）
- 错误格式不统一，某些路由漏检校验
- 新增字段时需要在多处修改

**收益**：
- 减少 bug（特别是类型不匹配）
- 错误消息格式一致
- 便于文档生成和客户端类型生成

**实施步骤**：

**第 1 步**：定义统一的 Zod Schema（`lib/schemas.ts`）

```typescript
// lib/schemas.ts - 新建或扩展
import { z } from 'zod';

export const GenerateRequestSchema = z.object({
  scenario: z.string().min(10).max(500),
  strengths: z.array(z.string()).min(1).max(5),
  confusion: z.string().min(10).max(1000),
});

export const CareerMatchRequestSchema = z.object({
  strengths: z.array(z.string()).min(1).max(5),
});

// ... 为每个 API 路由定义 schema

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
export type CareerMatchRequest = z.infer<typeof CareerMatchRequestSchema>;
```

**第 2 步**：创建统一的校验中间件（`lib/middleware/validate.ts`）

```typescript
// lib/middleware/validate.ts - 新建
export function validateRequest<T>(schema: z.Schema<T>) {
  return async (req: Request): Promise<{ data: T; error?: Response }> => {
    try {
      const body = await req.json();
      const data = schema.parse(body);
      return { data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          data: null as any,
          error: Response.json(
            {
              error: 'Validation failed',
              details: error.errors,
            },
            { status: 400 }
          ),
        };
      }
      throw error;
    }
  };
}
```

**第 3 步**：在所有 API 路由中使用

```typescript
// app/api/generate/route.ts - 改为
import { validateRequest } from '@/lib/middleware/validate';
import { GenerateRequestSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  const { data, error } = await validateRequest(GenerateRequestSchema)(req);
  if (error) return error;

  // 安全使用 data
  const result = await generateLogic(data);
  return Response.json(result);
}
```

**相关文件**：
- 创建：`lib/schemas.ts`（新增）
- 创建：`lib/middleware/validate.ts`（新增）
- 修改：所有 `app/api/*/route.ts`

**工作量**：中（需要写 schema + 迁移所有路由）

---

### P1-2：首屏 Bundle 优化 → 代码分割 + 延迟加载

**问题**：
- `app/[locale]/page.tsx` 是全量 client 组件，所有步骤页面（landing、scenario、strengths、result 等）一次性打包
- OCR/Tesseract 库体积大，但只有少数用户用到
- 初始化时加载所有步骤的逻辑和组件

**收益**：
- 首屏 JS 体积 ↓ 30-50%
- 首屏加载时间 ↓ 1-2s
- 用户体验改善

**实施步骤**：

**第 1 步**：将步骤组件拆为动态加载

```typescript
// app/[locale]/page.tsx - 改为
'use client';

import dynamic from 'next/dynamic';
import { useStepMachine } from '@/app/hooks/useStepMachine';

const LandingStep = dynamic(() => import('@/app/components/LandingStep'));
const ScenarioStep = dynamic(() => import('@/app/components/ScenarioStep'));
const StrengthsStep = dynamic(() => import('@/app/components/StrengthsStep'));
const InputStep = dynamic(() => import('@/app/components/InputStep'));
const ResultStep = dynamic(() => import('@/app/components/ResultStep'));

// OCR 步骤专项优化
const OCRStep = dynamic(
  () => import('@/app/components/OCRStep'),
  { loading: () => <div>加载中...</div> }
);

export default function Page() {
  const { currentStep, state } = useStepMachine();

  const stepComponents = {
    landing: <LandingStep />,
    scenario: <ScenarioStep />,
    strengths: <StrengthsStep />,
    input: <InputStep />,
    'ocr-upload': <OCRStep />, // 仅在需要时加载 Tesseract
    result: <ResultStep />,
  };

  return <main>{stepComponents[currentStep]}</main>;
}
```

**第 2 步**：将非交互部分改为 Server Components

```typescript
// app/components/ResultStep.tsx - 改为
// 不需要 'use client' 标记的部分下沉到服务端

export default async function ResultStep({ result }: { result: GallupResult }) {
  // 服务端渲染静态内容
  return (
    <div>
      <ExplainSection explain={result.explain} />
      <DecideSection decide={result.decide} />
    </div>
  );
}
```

**第 3 步**：分离 OCR 库

```typescript
// lib/ocr/tesseract-loader.ts - 新建（延迟加载）
export async function loadTesseract() {
  const { Tesseract } = await import('tesseract.js');
  return Tesseract;
}

// app/components/OCRStep.tsx - 改为
'use client';

import { loadTesseract } from '@/lib/ocr/tesseract-loader';

export default function OCRStep() {
  useEffect(() => {
    // 仅在用户进入此步骤时才加载 Tesseract
    loadTesseract().then(ocr => {
      // 初始化 OCR
    });
  }, []);

  return <div>{/* OCR UI */}</div>;
}
```

**相关文件**：
- 修改：`app/[locale]/page.tsx`
- 修改：所有步骤组件（逐步下沉为 Server Components）
- 修改：`app/components/` 目录结构

**工作量**：中

**收益量化**：
- 首屏 JS: 600KB → 300KB（预计）
- 首屏加载时间: 3s → 1.5s（假设带宽 1Mbps）

---

### P2-1：目录结构重组 → Feature-based 分层

**问题**：
- `components/` 为空但 `app/components/` 混合了页面组件、共享组件、legacy 代码
- 难以区分哪些是可复用的、哪些是废弃的
- 新加入开发者容易搞不清结构

**收益**：
- 清晰的代码边界
- 便于新需求快速定位文件
- 为单体应用拆分微应用做准备

**实施步骤**：

**第 1 步**：定义新的目录结构

```
app/
├── components/              # 共享组件层（顶层 UI 组件）
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   └── Layout/
│       ├── Header.tsx
│       └── Sidebar.tsx
│
├── features/                # 业务特性层（按四路径分组）
│   ├── breakthrough/        # 突破方案路径
│   │   ├── components/
│   │   │   ├── ScenarioStep.tsx
│   │   │   ├── StrengthsStep.tsx
│   │   │   └── ResultPage.tsx
│   │   ├── hooks/
│   │   │   └── useBreakthroughLogic.ts
│   │   └── types.ts
│   │
│   ├── career-match/        # 职业匹配路径
│   ├── strength-guide/      # 优势指南路径
│   └── report-interpret/    # 报告解读路径
│
└── legacy/                  # 过渡区（标记为待迁移）
    ├── README.md            # 说明哪些代码需要迁移
    └── deprecated-components/
```

**第 2 步**：制定迁移计划

```markdown
# legacy/ 迁移计划

## 目标
- [x] 所有 legacy 代码标记 @deprecated
- [ ] 2025-02-28: 迁移 LegacyComponent1 → features/breakthrough/
- [ ] 2025-03-15: 删除 legacy/
```

**第 3 步**：逐步迁移（不要一次性大改）

- Week 1：新代码都按 feature-based 结构编写
- Week 2-3：逐个迁移 legacy 代码到 features/
- Week 4：删除 legacy/

**相关文件**：
- 创建新目录结构
- 修改导入路径（可用 codemod 工具自动化）

**工作量**：大（但可分阶段）

**建议**：P2 优先级，可在闲时进行

---

### P2-2：Pipeline 文档对齐 → 统一命名

**问题**：
- `docs/PIPELINE.md` 文档引用 `lib/pipeline`
- 实际代码在 `lib/legacy-pipeline/`
- `scripts/example-pipeline.mjs` 中的引用过时

**收益**：
- 文档与代码一致
- 新手入门更顺利

**实施步骤**：

**选项 A**：重新命名为 `lib/pipeline`（推荐）

```bash
mv lib/legacy-pipeline lib/pipeline
```

然后更新所有导入：
```bash
sed -i 's/from.*legacy-pipeline/from "@\/lib\/pipeline"/g' **/*.ts
```

**选项 B**：更新文档指向 `lib/legacy-pipeline`

```markdown
# docs/PIPELINE.md 改为

参考 `lib/legacy-pipeline/README.md` 了解详情。
```

**相关文件**：
- 修改：`docs/PIPELINE.md`
- 修改：`scripts/example-pipeline.mjs`
- 修改或重命名：`lib/legacy-pipeline/` → `lib/pipeline/`

**工作量**：小

---

## 实施时间表

### 第 1 周（P0 项）
- [ ] 创建 `lib/ai-client.ts`，统一 AI Provider 配置
- [ ] 消除 `process.env` 污染，改为显式传参
- [ ] 验证测试通过，无回归

### 第 2-3 周（P1 项）
- [ ] 定义 Zod Schema，迁移所有 API 路由参数校验
- [ ] 实施首屏代码分割，优化 OCR 组件加载

### 第 4+ 周（P2 项）
- [ ] 重组目录结构，迁移 legacy 代码
- [ ] 对齐 Pipeline 文档

---

## 回滚计划

每个优化都应有测试覆盖：

```bash
# 通过 npm run test 验证
npm run test -- lib/ai-client.ts
npm run test -- app/api/generate/route.ts

# 通过 npm run build 检查 bundle 大小
npm run build
```

如果出现问题，可通过 git revert 快速回滚。

---

## 预期收益总结

| 优化项 | 稳定性 | 性能 | 开发效率 |
|--------|--------|------|---------|
| AI Client 统一化 | ↑↑ | - | ↑ |
| 避免 process.env 污染 | ↑↑ | - | ↑ |
| 参数校验统一化 | ↑ | - | ↑ |
| 首屏代码分割 | - | ↑↑ | - |
| 目录结构重组 | - | - | ↑↑ |
| 文档对齐 | - | - | ↑ |

