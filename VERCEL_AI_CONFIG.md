# Vercel 环境 AI 配置指南

## 问题分析

在 Vercel 上部署后，应用经常降级到 Mock 数据，导致回答质量下降。本指南帮助你在 Vercel 环境中充分使用 AI 模型。

---

## 快速诊断

### 检查 AI 是否启用

访问应用的 `/api/check-config` 端点（如果已实现），或添加以下检查：

```typescript
// 在 app/api/debug/config/route.ts 中
export async function GET() {
  const { checkAIConfig } = await import('@/lib/ai-generate');
  return Response.json(checkAIConfig());
}
```

预期输出（启用的情况）：
```json
{
  "enabled": true,
  "provider": "anthropic",
  "hasApiKey": true,
  "model": "claude-3-5-sonnet-20241022"
}
```

---

## ✅ Vercel 部署清单

### 1. 环境变量配置（必须）

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `ENABLE_AI` | `true` | **最重要**：启用 AI 生成 |
| `AI_PROVIDER` | `anthropic` | 主 AI 提供商选择 |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Claude API Key |
| `ANTHROPIC_MODEL` | `claude-3-5-sonnet-20241022` | Claude 模型版本 |
| `API_TIMEOUT` | `90000` | API 超时时间（毫秒），建议 60-90 秒 |

**如何设置**：
1. 进入 Vercel 项目 → Settings → Environment Variables
2. 添加上述变量
3. 选择应用环境（Production / Preview / Development）
4. 点击「Deploy」重新部署

### 2. Claude API Key 获取

1. 访问 [console.anthropic.com](https://console.anthropic.com)
2. 登录或创建账户
3. 进入 API Keys 页面
4. 创建新 API Key
5. 复制到 `ANTHROPIC_API_KEY` 环境变量

⚠️ **安全提示**：
- 绝不要在代码中硬编码 API Key
- 环境变量只存储在 Vercel 中，不会推送到 Git
- 定期轮换 API Key

### 3. 备用方案配置（可选但推荐）

如果 Claude API 暂时不可用，配置 OpenAI 作为备用：

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

代码会自动尝试：
1. 首先使用 Claude（`AI_PROVIDER=anthropic`）
2. 如果失败，自动降级到 OpenAI
3. 如果都失败，才降级到 Mock

---

## 🔍 常见问题排查

### 问题：配置了 API Key，仍然看到 Mock 数据

**检查项**：

1. **确认 API Key 有效**
   ```bash
   # 测试 Claude API
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: YOUR_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":100,"messages":[{"role":"user","content":"Hi"}]}'
   ```

2. **检查 API 配额**
   - 访问 [console.anthropic.com/dashboard/usage](https://console.anthropic.com/dashboard/usage)
   - 确保有可用的余额

3. **查看 Vercel 日志**
   - 进入 Vercel 项目 → Deployments → 最新部署 → Logs
   - 搜索 `AI 生成失败` 或 `API 错误`

4. **检查网络问题**
   - Claude API 是否可访问（某些地区可能需要代理）
   - 确认 Vercel 的出站连接未被限制

### 问题：API 请求超时

**解决方案**：

在环境变量中增加 `API_TIMEOUT`：

```
API_TIMEOUT=120000  # 120 秒（默认 60 秒）
```

然后重新部署。

### 问题：看到错误日志 `ANTHROPIC_API_KEY 未配置`

**解决方案**：

1. 确认环境变量已添加到 Vercel
2. 检查变量名是否正确（区分大小写）
3. 重新部署（Vercel 在添加新环境变量后需要重新部署生效）

---

## 📊 成本估算

### Anthropic Claude 定价

- **输入**：$3 / 100 万 tokens
- **输出**：$15 / 100 万 tokens

### 典型场景成本

| 场景 | 平均 Tokens | 成本 |
|------|-----------|------|
| 单次突破方案生成 | 3,000-5,000 | $0.04-0.10 |
| 单次报告解读 | 2,000-3,000 | $0.03-0.05 |
| 月 1,000 次使用 | - | $30-100 |

💡 **成本优化建议**：
- 使用 Claude 3.5 Sonnet（而非 Opus），速度快 2 倍，成本低 75%
- 增加 Mock 缓存策略（相同输入复用 AI 输出）
- 在非关键路径使用 Mock（如预览页面）

---

## 🚀 性能调优

### 1. 并行生成解释页和判定页

两个页面可以并行生成，而非串行。代码已经实现（ai-generate.ts:510）：

```typescript
const [explainData, decideData] = await Promise.all([
  generateExplainWithClaude(...),
  generateDecideWithClaude(...),
]);
```

### 2. 启用竞速模式（如有多个 AI 提供商）

如果配置了 Minimax 或智谱 GLM，启用竞速：

```env
AI_RACE_PROVIDERS=true      # 启用竞速模式
AI_RACE_HEDGE_MS=500        # 延迟 500ms 启动备选方案
```

这样可以利用多个 AI 的速度优势，选择最快的结果。

### 3. 降低日志级别

在 Vercel 生产环境中，可以减少日志输出来加速：

```env
LOG_LEVEL=warn              # 只输出警告和错误
```

---

## 📈 监控和告警

### 推荐的监控指标

1. **AI 调用成功率**
   - 每日记录 AI 成功 vs 降级次数
   - 目标：>95% 成功率

2. **API 响应时间**
   - 记录 p50 / p95 / p99 响应时间
   - 目标：<10 秒完成解释页 + 判定页

3. **API 成本**
   - 每日 token 消耗
   - 每月成本趋势

4. **错误率**
   - API 返回 401（API Key 无效）
   - API 返回 429（速率限制）
   - API 超时（>90 秒）

### Vercel 日志查询示例

```bash
# 查看所有 AI 相关日志
vercel logs --follow | grep -i "AI\|API\|anthropic"

# 查看特定部署的日志
vercel logs --function api-generate
```

---

## 🔐 安全最佳实践

1. **定期轮换 API Key**
   - 建议每 3 个月轮换一次
   - 在 console.anthropic.com 中生成新 Key
   - 更新 Vercel 环境变量
   - 删除旧 Key

2. **使用 Vercel 的 Secrets**
   - 不要在 .env 文件中存储 API Key
   - 只在 Vercel UI 中配置

3. **监控异常使用**
   - 定期查看 API 使用量
   - 如有异常峰值，立即检查日志
   - 考虑设置 API 配额上限

4. **隐藏敏感信息**
   - 生产环境日志不输出完整 API Key
   - 错误信息中不暴露 API 细节

---

## ✨ 验证 AI 集成成功

### 测试步骤

1. **本地测试**
   ```bash
   ENABLE_AI=true npm run dev
   # 访问应用，进行一次完整流程
   # 检查浏览器控制台，确认调用了 AI
   ```

2. **Vercel 生产环境验证**
   ```bash
   # 部署后
   # 1. 访问应用
   # 2. 进行一次完整流程
   # 3. 检查 Vercel Logs 是否有 ✓ AI 生成成功 日志
   ```

3. **检查输出质量**
   - 对比 Mock 和 AI 生成的内容
   - AI 内容应该：
     - 更具体、更个性化
     - 直接引用用户输入的内容
     - 避免通用建议

---

## 📞 获取帮助

如果遇到问题：

1. **查看日志**
   - Vercel Dashboard → Logs → 搜索错误
   - 完整错误信息会帮助诊断问题

2. **检查 API 状态**
   - [Anthropic Status](https://status.anthropic.com/)
   - [OpenAI Status](https://status.openai.com/)

3. **验证配置**
   - 复制本指南的快速诊断代码
   - 确认 `checkAIConfig()` 返回正确值

4. **社区支持**
   - Anthropic Discord: https://discord.gg/anthropic
   - 查看 API 文档: https://docs.anthropic.com

---

## 🎯 下一步

✅ **已完成** AI 环境配置
⬜ 考虑：增加 Mock 缓存策略
⬜ 考虑：实现 API 成本监控
⬜ 考虑：A/B 测试 Mock vs AI 质量

---

**最后更新**：2026-01-20
**对应代码版本**：ai-generate.ts (phase/4-multilingual-mock-data)
