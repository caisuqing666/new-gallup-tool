# 手动验证方法：AI 重试机制

## 方法1：观察日志（最简单）

运行 API 服务器并观察控制台日志：

```bash
cd /Users/caixiaopi/desktop/gallup-tool
npm run dev
```

在另一个终端发送请求：

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "work-decision",
    "strengths": ["focus", "responsibility"],
    "confusion": "工作太忙"
  }'
```

### 预期日志输出（如果有重试）：

```
[action-plan] AI 生成尝试 1/2
[action-plan] 第 1 次尝试抛错: [错误信息]
[action-plan] 准备第 2 次尝试...
[action-plan] AI 生成尝试 2/2
[action-plan] 第 2 次尝试成功
```

---

## 方法2：模拟网络不稳定（使用 proxy）

### 步骤1：启动一个间歇性失败的 proxy

```bash
# 使用 Toxiproxy 或类似工具模拟网络不稳定
# 这里提供一个简单的思路

# 安装
brew tap uyae/the-little-toxypi
brew install the-little-toxypi

# 启动 toxiproxy-server
toxiproxy-server
```

### 步骤2：配置 Node.js 使用 proxy

```bash
export HTTP_PROXY=http://localhost:8474
export HTTPS_PROXY=http://localhost:8474
npm run dev
```

---

## 方法3：代码注入验证（开发者模式）

在 `lib/services/action-plan.ts` 中临时添加测试代码：

```typescript
// 在 generateWithAI 函数内部临时添加
let callCount = 0;
const originalGenerate = generateWithAI;

// 临时替换 generateWithAI 用于测试
async function testGenerateWithAI(...args: any[]) {
  callCount++;
  console.log(`[TEST] generateWithAI 调用次数: ${callCount}`);

  if (callCount === 1) {
    console.log('[TEST] 第一次调用：模拟失败');
    throw new Error('TEST: 第一次失败');
  }

  console.log('[TEST] 第二次调用：允许通过');
  return originalGenerate(...args);
}
```

然后运行 API 请求，观察日志。

**注意：测试后记得删除测试代码！**

---

## 方法4：单元测试（Jest）

创建 `lib/services/__tests__/action-plan.retry.test.ts`：

```typescript
import { generateActionPlan } from '../action-plan';
import { generateResult } from '../../ai-generate';
import { jest } from '@jest/globals';

// Mock generateResult
jest.mock('../../ai-generate', () => ({
  generateResult: jest.fn(),
}));

describe('generateActionPlan retry mechanism', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retry once on AI failure', async () => {
    const { generateResult } = await import('../../ai-generate');

    // 第一次调用失败
    (generateResult as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    // 第二次调用成功
    (generateResult as jest.Mock).mockResolvedValueOnce({
      explain: { strengthManifestations: [], strengthInteractions: '', blindspots: '', summary: '' },
      decide: { pathDecision: 'narrow', reframedInsight: '', pathLogic: '', pathReason: '', doMore: [], doLess: [], boundaries: [], checkRule: '' },
    });

    const result = await generateActionPlan({
      scenario: 'work-decision',
      strengths: ['focus'],
      confusion: 'test',
    });

    // 验证调用了两次
    expect(generateResult).toHaveBeenCalledTimes(2);
  });
});
```

运行测试：

```bash
npm test -- action-plan.retry.test.ts
```

---

## 方法5：使用 TypeScript REPL（推荐）

```bash
cd /Users/caixiaopi/desktop/gallup-tool
npx tsx
```

在 REPL 中输入：

```typescript
// 导入模块
import { generateActionPlan } from './lib/services/action-plan';

// 监听 console.log
const originalLog = console.log;
console.log = (...args) => {
  originalLog(...args);
  // 将日志写入文件以便检查
  require('fs').appendFileSync('/tmp/retry-test.log', args.join(' ') + '\n');
};

// 设置 AI 启用但使用无效 Key（模拟失败）
process.env.ENABLE_AI = 'true';
process.env.ZHIPU_API_KEY = '';

// 运行测试
const result = await generateActionPlan({
  scenario: 'work-decision',
  strengths: ['focus'],
  confusion: 'test',
});

// 检查 metadata
console.log('Metadata:', result.metadata);
```

查看日志文件：

```bash
cat /tmp/retry-test.log | grep "尝试"
```

预期输出：

```
[action-plan] AI 生成尝试 1/2
[action-plan] 第 1 次尝试抛错: ...
[action-plan] 准备第 2 次尝试...
[action-plan] AI 生成尝试 2/2
[action-plan] 所有尝试均失败，降级到 Mock
```

---

## Diff 说明

### 修改文件
`lib/services/action-plan.ts`

### 修改范围
仅 `generateActionPlan()` 函数内的 `情况2：AI 启用且配置有效` 分支（约 40 行）

### 核心变更

**原逻辑：**
```typescript
try {
  result = await generateWithAI(...);
} catch (error) {
  // 直接降级到 Mock
}
```

**新逻辑：**
```typescript
let attempt = 0;
const maxAttempts = 2;

while (attempt < maxAttempts) {
  attempt += 1;
  try {
    result = await generateWithAI(...);
    if (isValidResultData(result)) {
      // 成功，返回
      return { ... };
    } else {
      // Schema 失败，继续下一次尝试
      continue;
    }
  } catch (error) {
    // 抛错，继续下一次尝试
    continue;
  }
}
// 两次都失败，降级到 Mock
```

### 保持不变

1. ✅ **metadata 语义**：`usedMockFallback`、`fallbackReason`、`aiEnabled`、`effectiveProviderType` 的含义完全不变
2. ✅ **prompt**：未修改任何 prompt 相关代码
3. ✅ **schema**：未修改 schema 校验逻辑
4. ✅ **mock 内容**：未修改 mock 数据生成逻辑
5. ✅ **降级原因**：`ai_error` / `schema_invalid` 的设置条件不变
