# 环境变量配置说明

## 快速开始

1. 复制环境变量模板：
```bash
cp .env.local.example .env.local
```

2. 编辑 `.env.local` 文件，填入你的 API Key

3. 启动开发服务器：
```bash
npm run dev
```

---

## 配置选项详解

### AI 服务配置

#### 启用 AI 生成
```bash
# 使用 AI 生成（需要 API Key）
ENABLE_AI=true

# 使用 Mock 数据（默认，无需 API Key）
ENABLE_AI=false
```

#### 选择 AI 提供商

通过 `AI_PROVIDER` 环境变量选择 AI 提供商（默认为 `zhipu`）。修改此变量后需要重启服务或重新部署：

**选项 1: 智谱 GLM**（默认推荐）
```bash
AI_PROVIDER=zhipu
ZHIPU_API_KEY=your_zhipu_api_key_here
```
获取 API Key：https://open.bigmodel.cn/usercenter/apikeys

**选项 2: MiniMax**
```bash
AI_PROVIDER=minimax
MINIMAX_API_KEY=your_minimax_api_key_here
MINIMAX_GROUP_ID=your_minimax_group_id_here
```
获取 API Key：https://platform.minimax.chat/

**选项 3: Anthropic Claude**
```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```
获取 API Key：https://console.anthropic.com/

**选项 4: OpenAI**
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```
获取 API Key：https://platform.openai.com/api-keys

**切换提供商示例**：
```bash
# 切换到 Anthropic Claude
AI_PROVIDER=anthropic

# 切换到 OpenAI
AI_PROVIDER=openai

# 回到默认的 Zhipu
AI_PROVIDER=zhipu
```

#### 模型选择

**Claude 模型**
```bash
# 详细版本（默认，15-20秒）
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# 快速版本（3-5秒）
ANTHROPIC_FAST_MODEL=claude-3-haiku-20250307

# 最强版本
ANTHROPIC_MODEL=claude-3-opus-20240229
```

**OpenAI 模型**
```bash
# 详细版本（默认，15-20秒）
OPENAI_MODEL=gpt-4o

# 快速版本（3-5秒）
OPENAI_FAST_MODEL=gpt-4o-mini
```

**智谱 GLM 模型**
```bash
# 详细版本（默认，15-20秒）
ZHIPU_MODEL=glm-4-plus

# 快速版本（3-5秒）
ZHIPU_FAST_MODEL=glm-4-flash

# 其他可选
ZHIPU_MODEL=glm-4
ZHIPU_MODEL=glm-4-air
```

**MiniMax 模型**
```bash
# 统一模型（快速和详细版本相同）
MINIMAX_MODEL=abab6.5-chat
```

#### 快速/详细模型切换

在 API 请求中使用 `useFastModel` 参数控制：

```bash
# 使用详细版本（默认，更长更全面的解读）
curl -X POST http://localhost:3000/api/interpret \
  -H "Content-Type: application/json" \
  -d '{"strengths": [...], "useFastModel": false}'

# 使用快速版本（更短更快的解读）
curl -X POST http://localhost:3000/api/interpret \
  -H "Content-Type: application/json" \
  -d '{"strengths": [...], "useFastModel": true}'
```

**性能对比**：
- 快速版本（useFastModel=true）：3-5秒，简洁回答
- 详细版本（useFastModel=false，默认）：15-20秒，深度分析

---

## 配置验证

运行配置检查：
```bash
npm run check-config
```

查看当前配置：
```bash
npm run config:info
```

---

## 常见问题

### Q: 如何在本地使用 Mock 数据？
A: 设置 `ENABLE_AI=false`（或不设置此变量）

### Q: AI 生成失败怎么办？
A: 系统会自动降级到 Mock 数据，确保功能正常

### Q: 如何切换 AI 提供商？
A: 修改 `AI_PROVIDER` 为 `zhipu`、`minimax`、`anthropic` 或 `openai`

### Q: API Key 会泄露吗？
A: `.env.local` 文件已在 `.gitignore` 中，不会被提交到 Git

---

## 安全提示

⚠️ **重要**：
- 永远不要将 `.env.local` 文件提交到版本控制
- 永远不要在代码中硬编码 API Key
- 定期轮换 API Key
- 使用生产环境的专用 API Key
