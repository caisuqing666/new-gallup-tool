# 架构优化执行计划（最终版）

**编制日期**: 2025-01-20  
**基于**: 架构师审查（已修正） + 设计师反馈  
**版本**: 1.0 - 可执行版本

---

## 执行摘要

基于两轮审查的共识，本计划包含：
- **必做项**（P0，4 周内完成）：修复 process.env 污染 + 参数校验统一化 + 文档对齐
- **数据驱动项**（P1，并行）：收集 bundle/性能数据，基于数据决策首屏优化
- **暂缓项**（Q2）：不做 AI Client 统一化、不做目录重组

**总工作量**: 约 15-20 个工程日
**团队分配**: 1-2 名后端工程师（主要）+ 1 名前端工程师（辅助）

---

## 第一阶段：数据收集（Day 1-2，可并行）

### 任务 1.1：Bundle 体积分析

**目标**: 确认首屏真实 JS 大小，评估代码分割的上限收益

**步骤**:

```bash
# 1. 安装 bundle analyzer
npm install --save-dev @next/bundle-analyzer

# 2. 修改 next.config.js
```

**修改文件**: `next.config.js`

```javascript
// 改前
const nextConfig = {};
module.exports = withNextIntl(nextConfig);

// 改后
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(withNextIntl(nextConfig));
```

**执行验证**:

```bash
# 3. 生成 bundle 分析报告
ANALYZE=true npm run build

# 4. 打开 .next/analyze/__bundle_analysis.html 查看可视化报告

# 期望输出：
# - 初始 JS 大小（gzip 前后）
# - tesseract.js 占比
# - 首屏必需 vs 非必需代码比例
```

**验收标准**:
- [ ] 输出文件 `.next/analyze/__bundle_analysis.html` 存在
- [ ] 能明确看到 tesseract.js 大小
- [ ] 记录下"首屏核心 bundle" vs "总 bundle" 的比例

**测试** (无需，这是数据收集)

---

### 任务 1.2：实际性能指标收集

**目标**: 了解真实的首屏加载时间、API 响应时间

**步骤**:

**1. 生产环境 Lighthouse 分析**

```bash
# 如果部署在 Vercel（推测基于 vercel.json）
# 在 Vercel Dashboard 中查看 Performance 标签
# 或使用本地 lighthouse
npm install --save-dev lighthouse

npx lighthouse https://your-deployment-url --view
```

**记录指标**:
- [ ] First Contentful Paint (FCP)
- [ ] Largest Contentful Paint (LCP)
- [ ] Time to Interactive (TTI)
- [ ] Total Blocking Time (TBT)

**2. API 响应时间分析**

检查最近的 API 调用日志（如果有 Sentry/DataDog）：

```
期望查看：
- /api/generate: P95 响应时间
- /api/guide: P95 响应时间
- /api/career: P95 响应时间
```

**如果没有日志系统**，可以在本地测试：

```bash
# 运行开发服务器
npm run dev

# 在另一个终端，使用 curl 测试
time curl -X POST http://localhost:3001/api/guide \
  -H "Content-Type: application/json" \
  -d '{"strengths": ["1", "2", "3"], "locale": "zh"}'

# 记录响应时间（应该包括 AI 调用时间）
```

**验收标准**:
- [ ] 记录 TTI / LCP 指标
- [ ] 记录 API P95 响应时间（至少测试一次）
- [ ] 创建 `docs/PERFORMANCE_BASELINE.md` 记录这些数据

---

### 任务 1.3：Vercel 压缩配置确认

**目标**: 确认 gzip 压缩是否已启用

**步骤**:

```bash
# 如果部署在 Vercel，查看 HTTP Response Headers
curl -I https://your-deployment-url/

# 期望看到:
# Content-Encoding: gzip
# Transfer-Encoding: chunked

# 或本地检查
npm run build

# 查看控制台输出，应该能看到：
# ✓ Route Size (compressed)
```

**验收标准**:
- [ ] 确认压缩已启用（或已在 Next.js 15 中默认启用）
- [ ] 记录压缩后的首屏 JS 大小

---

**任务 1.1-1.3 的关键输出**:

创建文件 `docs/PERFORMANCE_BASELINE.md`：

```markdown
# 性能基线 (2025-01-20)

## Bundle 信息
- 初始 JS (gzip): XXX KB
- 首屏必需代码比例: XX%
- Tesseract.js 大小: XXX KB

## 性能指标 (Lighthouse)
- FCP: X.Xs
- LCP: X.Xs
- TTI: X.Xs

## API 响应时间 (P95)
- /api/generate: Xs
- /api/guide: Xs

## 压缩状态
- 已启用: ✓
- 默认压缩率: XX%
```

---

## 第二阶段：P0 必做项（Week 1）

### 任务 2.1：修复 process.env 污染

**难度**: ⭐⭐⭐ 中等  
**工作量**: 3-4 天  
**关键文件**: 6 个  

---

#### 第 2.1.1 步：创建 AIContext 对象

**新建文件**: `lib/ai-context.ts`

```typescript
/**
 * AI 上下文 - 替代 process.env 的全局污染
 * 每个请求都有自己的隔离上下文，避免并发问题
 */

export type AIProviderType = 'anthropic' | 'openai' | 'zhipu' | 'minimax';

export interface AIContext {
  enableAI: boolean;
  provider: AIProviderType;
  timeout: number;
  retryCount: number;
  apiKey?: string;
  model?: string;
}

/**
 * 从环境变量创建 AI 上下文
 * 不修改全局状态，只读取
 */
export function createAIContext(overrides?: Partial<AIContext>): AIContext {
  const provider = (process.env.AI_PROVIDER || 'anthropic') as AIProviderType;
  const enableAI = process.env.ENABLE_AI === 'true' || process.env.NEXT_PUBLIC_ENABLE_AI === 'true';

  return {
    enableAI,
    provider,
    timeout: parseInt(process.env.API_TIMEOUT || '60000', 10),
    retryCount: 2,
    ...overrides, // 允许覆盖
  };
}

/**
 * 为不同的路径创建专用上下文
 */
export function createGuideAIContext(overrides?: Partial<AIContext>): AIContext {
  // 指南的超时更短（Vercel Pro 限制）
  const baseTimeout = process.env.VERCEL ? 12000 : 55000;

  return createAIContext({
    timeout: baseTimeout,
    ...overrides,
  });
}

export function createGenerateAIContext(overrides?: Partial<AIContext>): AIContext {
  // 生成结果需要更长的超时（支持竞速）
  return createAIContext({
    timeout: parseInt(process.env.API_TIMEOUT || '60000', 10),
    ...overrides,
  });
}
```

**验收标准**:
- [ ] 文件已创建，无 TS 错误
- [ ] 包含三个工厂函数

**测试**:

```typescript
// lib/__tests__/ai-context.test.ts - 新建
import { createAIContext, createGuideAIContext } from '../ai-context';

describe('AIContext', () => {
  it('should create context from env vars without mutating process.env', () => {
    const originalEnv = { ...process.env };
    
    const ctx = createAIContext({ provider: 'zhipu' });
    
    expect(ctx.provider).toBe('zhipu');
    expect(process.env.AI_PROVIDER).toBe(originalEnv.AI_PROVIDER); // 未改变
  });

  it('guide context should have different timeout', () => {
    process.env.VERCEL = 'true';
    const guideCtx = createGuideAIContext();
    
    expect(guideCtx.timeout).toBe(12000);
  });
});
```

---

#### 第 2.1.2 步：修改 lib/ai-generate.ts

**改动**: 将函数改为接受 `AIContext` 参数

**文件**: `lib/ai-generate.ts`

**改动 1: 导入 AIContext**

```typescript
// 在文件顶部添加
import { AIContext, createGenerateAIContext } from './ai-context';
```

**改动 2: 修改 generateExplainWithClaude**

```typescript
// 改前
async function generateExplainWithClaude(
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal
): Promise<ExplainData> {
  const config = getAIConfig();  // ❌ 依赖全局 process.env
  // ...
}

// 改后
async function generateExplainWithClaude(
  systemPrompt: string,
  userPrompt: string,
  context: AIContext,
  signal?: AbortSignal
): Promise<ExplainData> {
  // ✅ 使用注入的上下文，不读 process.env
  const { controller, timeoutId, externalSignal, onAbort } = createAbortController(
    signal,
    context.timeout  // 使用上下文中的 timeout
  );
  // ...
}
```

**改动 3: 修改 createAbortController**

```typescript
// 改前
function createAbortController(externalSignal?: AbortSignal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);  // ❌ 全局变量
  // ...
}

// 改后
function createAbortController(externalSignal?: AbortSignal, timeout: number = 60000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);  // ✅ 参数化
  // ...
}
```

**改动 4: 修改 generateResult 函数签名**

```typescript
// 改前
export async function generateResult(
  scenario: ScenarioId,
  strengths: StrengthId[],
  confusion: string,
  problemType: ProblemType,
  problemFocus: ProblemFocus,
  useAI: boolean = ENABLE_AI,
  locale: 'zh' | 'en' = 'zh'
): Promise<GallupResult> {
  const config = getAIConfig();  // ❌ 读全局
  // ...
  return await generateExplainWithClaude(...);  // ❌ 不传 context
}

// 改后
export async function generateResult(
  scenario: ScenarioId,
  strengths: StrengthId[],
  confusion: string,
  problemType: ProblemType,
  problemFocus: ProblemFocus,
  context?: AIContext,  // ✅ 可选参数
  locale: 'zh' | 'en' = 'zh'
): Promise<GallupResult> {
  // 如果没有传入 context，就创建默认的
  const aiContext = context || createGenerateAIContext({ enableAI: true });
  
  // ...
  return await generateExplainWithClaude(
    explainPrompt.systemPrompt,
    explainPrompt.userPrompt,
    aiContext,  // ✅ 传入 context
    signal
  );
}
```

**影响的函数列表**:
- [ ] `generateExplainWithClaude()` - 添加 context 参数
- [ ] `generateExplainWithOpenAI()` - 添加 context 参数
- [ ] `generateExplainWithZhipu()` - 添加 context 参数
- [ ] `generateExplainWithMinimax()` - 添加 context 参数
- [ ] `generateDecideWithClaude()` - 添加 context 参数
- [ ] `generateDecideWithOpenAI()` - 添加 context 参数
- [ ] `generateDecideWithZhipu()` - 添加 context 参数
- [ ] `generateDecideWithMinimax()` - 添加 context 参数
- [ ] `raceExplainZhipuMinimax()` - 添加 context 参数
- [ ] `raceDecideZhipuMinimax()` - 添加 context 参数
- [ ] `lockProblem()` - 添加 context 参数
- [ ] `generateResult()` - 添加 context 参数

**测试**:

```typescript
// lib/__tests__/ai-generate.test.ts 修改
describe('generateResult', () => {
  it('should use provided context instead of process.env', async () => {
    const context = createGenerateAIContext({
      provider: 'zhipu',
      enableAI: true,
    });

    // 修改 process.env（模拟其他线程污染）
    const originalProvider = process.env.AI_PROVIDER;
    process.env.AI_PROVIDER = 'openai';

    // 调用 generateResult，应该仍然用 zhipu
    const result = await generateResult(
      'work-decision',
      ['1', '2'],
      'test confusion',
      'P1',
      'focus',
      context  // ✅ 传入 context
    );

    expect(result).toBeDefined();
    expect(process.env.AI_PROVIDER).toBe('openai');  // process.env 未被修改

    process.env.AI_PROVIDER = originalProvider;
  });
});
```

**回归测试**:

运行现有测试，确保行为未变：

```bash
npm run test -- lib/ai-generate.test.ts
```

---

#### 第 2.1.3 步：修改 app/api/generate/route.ts

**文件**: `app/api/generate/route.ts`

**改动 1: 导入 AIContext**

```typescript
import { AIContext, createGenerateAIContext } from '@/lib/ai-context';
```

**改动 2: 移除 lib/services/action-plan.ts 的 process.env 污染**

```typescript
// 改前
const { explainData, decideData } = await Promise.all([
  generateExplainWithClaude(...),  // 调用时 process.env 可能被污染
]);

// 改后
const context = createGenerateAIContext();
const { explainData, decideData } = await Promise.all([
  generateExplainWithClaude(..., context),  // 明确传入 context
]);
```

**验收标准**:
- [ ] route.ts 中不再调用 lib/services/action-plan.ts 的 generateWithAI()
- [ ] 或者 generateWithAI() 改为接受 context 参数

---

#### 第 2.1.4 步：修改 app/api/guide/route.ts

**文件**: `app/api/guide/route.ts`

**改动**: 使用 `createGuideAIContext()` 替代硬编码的 `getAIConfig()`

```typescript
// 改前
export async function POST(request: NextRequest) {
  const config = getAIConfig(provider);  // ❌ 每次都计算，且依赖 env
  const guideData = await generateGuideWithAI(strengthIds, provider);
}

// 改后
import { createGuideAIContext } from '@/lib/ai-context';

export async function POST(request: NextRequest) {
  const context = createGuideAIContext();
  // 使用 context 而非重复计算 config
  const guideData = await generateGuideWithAI(strengthIds, context);
}
```

**验收标准**:
- [ ] 移除 route.ts 中的 `getAIConfig()` 函数
- [ ] 使用 `createGuideAIContext()`

---

#### 第 2.1.5 步：修改其他 API 路由

**文件**: 
- `app/api/career/route.ts`
- `app/api/interpret/route.ts`
- `app/api/ocr/route.ts`（如果有 AI 调用）

**改动**: 同样应用 2.1.4 的模式

---

#### 第 2.1.6 步：删除过时的 process.env 修改代码

**文件**: `lib/services/action-plan.ts`

```typescript
// 删除这些行
process.env.ENABLE_AI = 'true';
process.env.AI_PROVIDER = provider;
// ... 恢复代码
process.env.ENABLE_AI = originalEnableAi;
process.env.AI_PROVIDER = originalProvider;

// 改为
const context = createAIContext({ provider });
await generateWithAI(input, context);
```

---

**任务 2.1 的验收清单**:

- [ ] `lib/ai-context.ts` 已创建
- [ ] `lib/ai-generate.ts` 所有函数都接受 `AIContext` 参数
- [ ] `createAbortController()` 接受 timeout 参数
- [ ] `app/api/generate/route.ts` 已修改
- [ ] `app/api/guide/route.ts` 已修改
- [ ] `app/api/career/route.ts` 已修改
- [ ] `app/api/interpret/route.ts` 已修改
- [ ] `lib/services/action-plan.ts` 已清理
- [ ] 所有单元测试通过: `npm run test`
- [ ] 本地开发环境验证: `npm run dev` 正常运行
- [ ] 所有高并发场景的 mock 测试通过

**风险评分**: 🟡 中等（会改变函数签名，需要完整回归测试）

**回滚计划**: 使用 git 快照，`git revert` 如果出现问题

---

### 任务 2.2：参数校验层统一化（Zod）

**难度**: ⭐⭐ 简单  
**工作量**: 2-3 天  
**关键文件**: 8 个  

---

#### 第 2.2.1 步：安装 Zod

```bash
npm install zod
```

**验收**: 
- [ ] `package.json` 中有 `"zod": "^x.x.x"`

---

#### 第 2.2.2 步：创建统一的 Schema 定义

**新建文件**: `lib/api-schemas.ts`

```typescript
import { z } from 'zod';

// ========== 突破方案 API ==========

export const GenerateRequestSchema = z.object({
  scenario: z.string()
    .min(1, '场景不能为空')
    .max(100, '场景过长'),
  strengths: z.array(z.string())
    .min(1, '至少选择 1 个优势')
    .max(5, '最多选择 5 个优势'),
  confusion: z.string()
    .min(10, '困惑描述过短，至少 10 个字')
    .max(1000, '困惑描述过长'),
  locale: z.enum(['zh', 'en']).optional().default('zh'),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

// ========== 优势指南 API ==========

export const GuideRequestSchema = z.object({
  strengths: z.array(z.string())
    .min(3, '需要至少 3 个优势')
    .max(5, '最多 5 个优势'),
  locale: z.enum(['zh', 'en']).optional().default('zh'),
});

export type GuideRequest = z.infer<typeof GuideRequestSchema>;

// ========== 职业匹配 API ==========

export const CareerRequestSchema = z.object({
  strengths: z.array(z.string())
    .min(1, '至少选择 1 个优势')
    .max(5, '最多选择 5 个优势'),
  locale: z.enum(['zh', 'en']).optional().default('zh'),
});

export type CareerRequest = z.infer<typeof CareerRequestSchema>;

// ========== 报告解读 API ==========

export const InterpretRequestSchema = z.object({
  strengths: z.array(z.object({
    rank: z.number().int().min(1).max(5),
    name: z.string(),
    domain: z.string(),
  })),
  useAi: z.boolean().optional().default(true),
  locale: z.enum(['zh', 'en']).optional().default('zh'),
});

export type InterpretRequest = z.infer<typeof InterpretRequestSchema>;

// ========== 统一的校验辅助函数 ==========

/**
 * 通用的 API 请求校验和错误处理
 */
export function validateRequest<T>(
  schema: z.Schema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError['errors'] } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * 将 Zod 错误转换为用户友好的 API 响应
 */
export function formatValidationError(errors: z.ZodError['errors']): {
  error: string;
  details: Array<{ field: string; message: string }>;
} {
  return {
    error: 'Request validation failed',
    details: errors.map(err => ({
      field: String(err.path.join('.')),
      message: err.message,
    })),
  };
}
```

**验收标准**:
- [ ] 文件已创建，无 TS 错误
- [ ] 包含 4 个 Request Schema
- [ ] 包含 `validateRequest()` 和 `formatValidationError()` 工具函数

**测试**:

```typescript
// lib/__tests__/api-schemas.test.ts - 新建
import { GenerateRequestSchema, validateRequest } from '../api-schemas';

describe('API Schemas', () => {
  it('should validate generate request correctly', () => {
    const validData = {
      scenario: 'work-decision',
      strengths: ['1', '2', '3'],
      confusion: 'I am confused about my career path',
      locale: 'zh',
    };

    const result = validateRequest(GenerateRequestSchema, validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid generate request', () => {
    const invalidData = {
      scenario: 'x',  // 太短
      strengths: [],  // 空数组
      confusion: 'short',  // 太短
    };

    const result = validateRequest(GenerateRequestSchema, invalidData);
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(3);
  });
});
```

---

#### 第 2.2.3 步：修改 app/api/generate/route.ts

**文件**: `app/api/generate/route.ts`

**改动**:

```typescript
import { GenerateRequestSchema, validateRequest, formatValidationError } from '@/lib/api-schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 使用统一的校验
    const validation = validateRequest(GenerateRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        formatValidationError(validation.errors),
        { status: 400 }
      );
    }

    const { scenario, strengths, confusion, locale } = validation.data;

    // ... 后续逻辑不变
    const result = await generateResult(scenario, strengths, confusion, ...);
    return NextResponse.json({ success: true, data: result, ... });

  } catch (error) {
    // 统一的错误处理
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**删除**:

```typescript
// ❌ 删除这些手写的校验代码
if (!strengths || !Array.isArray(strengths)) {
  return NextResponse.json(...);
}
if (strengths.length < 1 || strengths.length > 5) {
  return NextResponse.json(...);
}
```

---

#### 第 2.2.4 步：修改其他 API 路由

**文件**:
- `app/api/guide/route.ts` - 使用 `GuideRequestSchema`
- `app/api/career/route.ts` - 使用 `CareerRequestSchema`
- `app/api/interpret/route.ts` - 使用 `InterpretRequestSchema`

**改动**: 同样应用 2.2.3 的模式

---

**任务 2.2 的验收清单**:

- [ ] `lib/api-schemas.ts` 已创建
- [ ] 4 个 Schema 都定义好了
- [ ] `validateRequest()` 和 `formatValidationError()` 已实现
- [ ] `app/api/generate/route.ts` 已更新
- [ ] `app/api/guide/route.ts` 已更新
- [ ] `app/api/career/route.ts` 已更新
- [ ] `app/api/interpret/route.ts` 已更新
- [ ] 所有单元测试通过: `npm run test -- lib/api-schemas.test.ts`
- [ ] 手动测试: 发送无效数据到各个 API，确保返回格式一致
- [ ] 无回归: 现有的有效请求仍然可以正常处理

**风险评分**: 🟢 低（仅添加验证层，不改变业务逻辑）

---

### 任务 2.3：文档对齐

**难度**: ⭐ 极简  
**工作量**: 0.5 天  

---

#### 第 2.3.1 步：重命名 lib/legacy-pipeline 为 lib/pipeline

```bash
# 在项目根目录执行
mv lib/legacy-pipeline lib/pipeline
```

**验证**:
- [ ] 目录已重命名
- [ ] `ls lib/pipeline` 返回文件列表

---

#### 第 2.3.2 步：更新导入路径

```bash
# 查找所有引用 legacy-pipeline 的地方
grep -r "legacy-pipeline" . --include="*.ts" --include="*.js" --include="*.mjs"

# 应该能找到这些文件：
# - docs/PIPELINE.md
# - scripts/example-pipeline.mjs
# - 可能还有其他引用
```

**修改这些文件**:

**文件**: `docs/PIPELINE.md`

```markdown
# 改前
参考 `lib/legacy-pipeline/` 了解详情。

# 改后
参考 `lib/pipeline/` 了解详情。
```

**文件**: `scripts/example-pipeline.mjs`

```javascript
// 改前
import { Foo } from '../lib/legacy-pipeline/index.mjs';

// 改后
import { Foo } from '../lib/pipeline/index.mjs';
```

---

#### 第 2.3.3 步：验证导入路径

```bash
# 运行脚本，确保导入正常
npm run pipeline:example

# 应该能输出预期结果，无 "cannot find module" 错误
```

---

**任务 2.3 的验收清单**:

- [ ] `lib/pipeline/` 目录存在
- [ ] `lib/legacy-pipeline/` 不存在
- [ ] `docs/PIPELINE.md` 已更新
- [ ] `scripts/example-pipeline.mjs` 已更新
- [ ] `npm run pipeline:example` 正常运行
- [ ] 构建成功: `npm run build`

**风险评分**: 🟢 无风险

---

## 第三阶段：集成测试和验证（Week 2）

### 任务 3.1：完整的端到端测试

**目标**: 确保 P0 修改不会导致现有功能破裂

---

#### 第 3.1.1 步：单元测试

```bash
# 运行所有单元测试
npm run test

# 期望: 所有测试通过
# 如果有失败，修复直到全部通过
```

**检查清单**:
- [ ] `lib/ai-context.test.ts` - 新增测试通过
- [ ] `lib/api-schemas.test.ts` - 新增测试通过
- [ ] 所有 route 相关的 test 通过
- [ ] 代码覆盖率 >80%（如果有 coverage 要求）

---

#### 第 3.1.2 步：本地集成测试

**步骤 1**: 启动开发服务器

```bash
npm run dev
```

**步骤 2**: 测试各个 API 路由

```bash
# 1. 测试突破方案 API - 有效请求
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "work-decision",
    "strengths": ["1", "2", "3"],
    "confusion": "I am very confused about what to do next in my career"
  }'

# 期望: 返回生成的结果（或 mock 数据）

# 2. 测试无效请求
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "x",
    "strengths": [],
    "confusion": "short"
  }'

# 期望: 返回 400 错误，包含详细的校验错误信息

# 3. 类似测试其他 API
# - /api/guide
# - /api/career
# - /api/interpret
```

**验收标准**:
- [ ] 有效请求返回正确的响应结构
- [ ] 无效请求返回 400 + 详细错误信息
- [ ] 错误格式一致（所有 API）

---

#### 第 3.1.3 步：并发测试

**目的**: 验证 AIContext 解决了 process.env 污染

**新建文件**: `lib/__tests__/concurrent.test.ts`

```typescript
import { createAIContext, createGuideAIContext } from '../ai-context';
import { generateResult } from '../ai-generate';

describe('Concurrent AI Context', () => {
  it('should not cross-pollinate contexts in concurrent requests', async () => {
    const contexts = [
      createAIContext({ provider: 'zhipu' }),
      createAIContext({ provider: 'openai' }),
      createAIContext({ provider: 'anthropic' }),
    ];

    // 模拟并发调用
    const promises = contexts.map((ctx, index) =>
      generateResult(
        'work-decision',
        ['1', '2', '3'],
        'test confusion',
        'P1',
        'focus',
        ctx
      ).catch(() => `Request ${index} completed`)
    );

    const results = await Promise.all(promises);
    
    // 验证没有 process.env 被修改
    expect(process.env.AI_PROVIDER).not.toBe('zhipu');
    expect(process.env.AI_PROVIDER).not.toBe('openai');
    
    expect(results).toHaveLength(3);
  });
});
```

**运行测试**:

```bash
npm run test -- concurrent.test.ts
```

**验收标准**:
- [ ] 并发测试通过
- [ ] 所有上下文保持隔离

---

### 任务 3.2：生产前检查

**文件**: 创建 `DEPLOYMENT_CHECKLIST.md`

```markdown
# 部署前检查清单

## 代码质量
- [ ] npm run lint 通过（无错误）
- [ ] npm run test 全部通过
- [ ] npm run build 成功
- [ ] 无 TypeScript 错误
- [ ] 代码审查通过

## 功能验证
- [ ] /api/generate 工作正常
- [ ] /api/guide 工作正常
- [ ] /api/career 工作正常
- [ ] /api/interpret 工作正常
- [ ] 错误响应格式统一
- [ ] Mock 降级正常工作

## 性能
- [ ] Bundle 大小无明显增加（<5% 增长）
- [ ] 本地开发启动时间 <10s
- [ ] 构建时间 <2 分钟

## 文档
- [ ] CHANGELOG.md 已更新
- [ ] docs/ARCHITECTURE_REVIEW_STRICT.md 已更新
- [ ] docs/EXECUTION_PLAN.md 已更新

## 回滚计划
- [ ] 回滚分支已测试: git checkout <previous-stable>
- [ ] Vercel 部署预览已验证
- [ ] 所有环境变量正确设置
```

---

**任务 3.1-3.2 的验收清单**:

- [ ] 所有单元测试通过
- [ ] 本地集成测试通过
- [ ] 并发测试通过
- [ ] 构建成功
- [ ] 无 TypeScript 错误
- [ ] 部署前检查清单已确认

**风险评分**: 🟡 中等（这是最后的防线）

---

## 第四阶段：性能数据分析与决策（Week 2-3，并行）

### 任务 4.1：数据分析和决策

**输入**: 第一阶段收集的数据

**分析过程**:

基于 `docs/PERFORMANCE_BASELINE.md` 中的数据：

```
如果 Bundle (gzip) < 100KB:
  → 代码分割没必要，优先级改为 P4
  → 继续优化压缩和缓存策略

如果 TTI > 3s 且 API P95 < 1s:
  → 首屏 JS 加载是主要瓶颈
  → 优先级升高到 P1
  → 优化代码分割 + 预加载策略

如果 TTI 正常但 API P95 > 2s:
  → API 是真正的瓶颈
  → 首屏分割没用
  → 优先级改为 P4
  → 建议改进 API 缓存策略

如果 Tesseract.js 占比 < 10%:
  → 单独分割 OCR 收益有限
  → 建议合并代码，专注其他优化
```

**输出**: `docs/PERFORMANCE_DECISION.md`

```markdown
# 性能优化决策 (基于数据)

## 收集日期
2025-01-20

## 关键指标
- Bundle (gzip): XXX KB
- TTI: XXX s
- API P95: XXX s
- Tesseract 占比: XXX%

## 决策

### 代码分割
优先级: P4 (暂缓)
原因: [根据实际数据填写]

### 其他建议
- [根据分析填写]
```

**验收标准**:
- [ ] `docs/PERFORMANCE_DECISION.md` 已生成
- [ ] 决策有数据支撑，而非猜测
- [ ] 决策已与团队讨论通过

---

## 第五阶段：部署和验证（Week 4）

### 任务 5.1：分支管理和 PR

**步骤**:

```bash
# 1. 创建特性分支
git checkout -b feat/architecture-optimization-phase-1

# 2. 确保本地所有改动都已提交
git status
git add .
git commit -m "feat: 修复 process.env 并发污染、参数校验统一化、文档对齐

- 创建 AIContext 替代 process.env 全局修改
- 使用 Zod 统一参数校验层
- 重命名 lib/legacy-pipeline 为 lib/pipeline
- 所有 API 路由错误格式统一

Closes #XXX"

# 3. 推送到远程
git push origin feat/architecture-optimization-phase-1

# 4. 创建 PR，等待审查
```

---

### 任务 5.2：Vercel 部署

**步骤**:

1. **预览部署** (自动触发)
   - [ ] Vercel 自动生成预览 URL
   - [ ] 在预览环境测试所有 API
   - [ ] 检查性能指标

2. **代码审查** (由团队成员)
   - [ ] 至少 1 名审查者同意
   - [ ] 所有反馈已解决

3. **主分支部署** (合并后自动)
   - [ ] PR 合并到 main
   - [ ] Vercel 自动部署
   - [ ] 生产环境健康检查

---

### 任务 5.3：生产环境监控

**步骤**:

```bash
# 1. 设置监控告警（如果有 Sentry/DataDog）
# 2. 观察 24 小时，确保无错误波动

期望监控项：
- API 错误率（应该无变化）
- API 响应时间（应该无明显变化）
- 日志中 AIContext 相关错误（应该为 0）
```

---

**任务 5.1-5.3 的验收清单**:

- [ ] PR 已创建并合并
- [ ] 预览环境测试通过
- [ ] 生产环境部署成功
- [ ] 24h 无新的错误
- [ ] 性能指标稳定

---

## 总体时间表

```
Week 1 (Day 1-5):
├─ Day 1-2: 数据收集 (1.1, 1.2, 1.3)
├─ Day 2-3: process.env 修复 (2.1)
├─ Day 3-4: Zod 参数校验 (2.2)
└─ Day 5: 文档对齐 (2.3) + 集成测试 (3.1)

Week 2 (Day 6-10):
├─ Day 6: 完整测试验证 (3.1, 3.2)
├─ Day 7-8: 性能数据分析 (4.1)
├─ Day 9: PR 审查和调整
└─ Day 10: 部署到生产

Week 3+ (Day 11-):
├─ 监控和问题修复
└─ Q2 规划：目录重组、首屏优化等
```

---

## 风险和回滚

### 高风险点

1. **process.env 修改** (难度⭐⭐⭐)
   - 风险: 破坏现有功能
   - 回滚: `git revert <commit-hash>`
   - 时间: <5 分钟

2. **参数校验改动** (难度⭐⭐)
   - 风险: 某些 API 调用被意外拒绝
   - 回滚: `git revert <commit-hash>`
   - 时间: <5 分钟

### 中等风险点

- Bundle 大小增加（Zod 增加 ~10KB）

### 低风险点

- 文档和重命名

### 回滚计划

如果在生产环境出现问题：

```bash
# 1. 立即回滚
git revert <last-commit-hash>
git push origin main

# 2. Vercel 会自动部署回滚版本

# 3. 验证生产恢复正常
curl https://your-domain/api/generate

# 4. 分析问题，准备修复
```

---

## 成功的定义

✅ **P0 完成标准**:

- 所有单元测试通过（无降低覆盖率）
- 所有 E2E 测试通过
- 生产环境 24h 无新错误
- API 响应时间无明显变化（±5%）
- Bundle 大小增加 <10%

✅ **质量标准**:

- 代码通过 ESLint
- TypeScript 无错误
- PR 代码审查通过
- 文档已更新

---

## 附录：常见问题和解决

### Q1: 如何测试 AIContext 的隔离性？

A: 运行 `concurrent.test.ts`，模拟多个并发请求，确保它们不会相互影响。

### Q2: Zod 会不会影响性能？

A: 运行 bundle analyzer 检查。Zod 的运行时开销很小（通常 <1ms），但会增加 ~10KB bundle。

### Q3: 回滚后能再次部署吗？

A: 可以。修复问题后创建新 commit，再次推送。Vercel 会重新部署。

### Q4: 需要通知用户吗？

A: 这次修改是内部优化，对用户无感知，无需通知。

---

## 签核

**计划编制人**: Architecture Team  
**审核人**: Design + Engineering Lead  
**批准日期**: 2025-01-20  
**实施期限**: Week 1-4, 2025

---

## 后续跟进

- [ ] Week 4 末：评估 P0 完成度
- [ ] Week 5：开始 P1 性能优化（如数据支持）
- [ ] Q2：评估 P2 项目（目录重组、首屏分割）
