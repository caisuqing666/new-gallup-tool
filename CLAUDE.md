# CLAUDE.md (Project: gallup-tool)

> Extends `~/.claude/CLAUDE.md` (Global).

## Role

**Strengths-Based AI Coach & Lead Developer**
- 专长：CliftonStrengths 解读、优势教练逻辑、AI 辅助决策工具设计
- 核心原则：生成的内容须具备教练深度，而非泛泛的优势罗列

## Skill 索引

| 领域 | Skill | 触发关键字 |
|------|-------|------------|
| Strengths-Based Development（基于优势的发展） | `/gallup-coaching-logic` | 报告, 教练, 优势解读, 决策, PathDecision |

### 核心禁止事项

- ❌ **禁止硬编码**：API Keys、港美股投资端点、个人财务数据不得写入代码，一律用环境变量（参照 `.env.local`）
- ❌ **禁止过度封装**：保持代码简洁，优先 Next.js / React 原生功能，不引入无必要的第三方库
- ❌ **禁止空洞输出**：AI 生成内容必须有教练深度，禁止使用模板化、无个性的优势描述

---

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

盖洛普优势分析工具 - 基于 CliftonStrengths 的 AI 驱动决策辅助应用。用户选择场景、优势、描述困惑后，系统生成"解释页"（理解发生了什么）和"判定页"（现在该怎么做）两部分内容。

## 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器 (localhost:3000)

# 构建和检查
npm run build            # 生产构建
npm run lint             # ESLint 检查

# 测试
npm run test             # 运行 Jest 测试
npm run test:watch       # 监视模式
npm run test -- path/to/test.ts  # 运行单个测试文件

# 工具脚本
npm run check-config     # 检查 AI 配置状态
npm run pipeline:example # 运行流水线示例
```

## 核心架构

### 四路径系统

应用通过 `PathId` 定义四条用户路径：
- **report-interpret**: 报告解读（OCR上传，Phase 3）
- **career-match**: 职业匹配（Phase 2）
- **breakthrough**: 突破方案（核心功能，场景+优势+困惑）
- **strength-guide**: 优势发挥指南

每条路径有独立的步骤流程配置（见 `lib/path-config.ts` 的 `PATH_FLOWS`）。

### 数据流

```
用户输入 (场景 + 优势 + 困惑)
    ↓
API Route (/api/generate, /api/career, /api/guide, /api/interpret)
    ↓
confusion-parser → 解析问题类型(ProblemType) + 问题焦点(problemFocus)
    ↓
Context Pack 构建 (strength-profiles + combo-rules)
    ↓
AI 生成 / Mock 降级
    ↓
路径特定结果 (GallupResult / CareerMatchResult / StrengthGuideResult / ReportInterpretResult)
```

### 核心类型 (`lib/types.ts`)

**问题与路径类型**：
- **ProblemType**: P1(方向不确定) / P2(边界过载) / P3(信息瘫痪) / P4(效率瓶颈)
- **PathDecision**: DoubleDown / Reframe / Narrow / Exit - 路径判定的四种结果
- **PathId**: 四条用户路径的标识符

**结果类型**：
- **GallupResult**: `{ explain: ExplainData, decide: DecideData }` - 突破方案结果
- **ExplainData**: 优势行为表现、组合互动、盲区、总结
- **DecideData**: 路径判定、pathLogic、doMore/doLess、责任边界
- **CareerMatchResult**: 职业匹配结果（TOP3 + 通用建议）
- **StrengthGuideResult**: 优势发挥指南（个人化标签 + 每个优势的指南）
- **ReportInterpretResult**: 报告解读结果（TOP5优势 + 组合解读）

### 状态管理 (`app/hooks/useStepMachine.ts`)

使用 useReducer 实现的状态机，根据路径动态变化步骤：
- **breakthrough**: landing → path-selection → scenario → strengths → input → loading → result
- **career-match**: landing → path-selection → strengths → loading → career-result
- **strength-guide**: landing → path-selection → strengths → loading → guide-result
- **report-interpret**: landing → path-selection → ocr-upload → loading → report-result

表单数据持久化到 localStorage，结果不持久化。

### AI 生成层 (`lib/ai-generate.ts`)

支持三种 AI Provider：
- Anthropic Claude（推荐）
- OpenAI GPT-4o
- 智谱 GLM4（理解层转译默认使用）

通过 `ENABLE_AI` 环境变量控制启用/禁用，禁用时自动降级到 Mock 数据。

### Prompt 系统 (`lib/prompts.ts`)

- **Context Pack**: 整合困惑分析 + 优势画像 + 组合效应，注入到系统 prompt
- **双重锁定约束**: problemType + problemFocus 约束所有输出
- **Explain Prompt**: 只负责"理解发生了什么"
- **Decide Prompt**: 只负责"现在该怎么做"（路径判定）

### 关键文件

| 文件 | 职责 |
|------|------|
| `lib/confusion-parser.ts` | 解析用户困惑，提取 problemType/problemFocus |
| `lib/strength-profiles.ts` | 34 个优势的能量画像（驱动力/代价区/地下室） |
| `lib/combo-rules.ts` | 优势组合的陷阱/盲区/放大效应 |
| `lib/context-generator.ts` | Mock 降级时的结构化内容生成 |
| `lib/understanding-layer.ts` | 理解层转译（智谱 GLM4） |
| `lib/path-config.ts` | 四路径流程配置 |
| `app/hooks/useStepMachine.ts` | 状态机核心逻辑 |

## 环境配置

复制 `.env.local.example` 为 `.env.local`：

```bash
ENABLE_AI=true                    # 启用 AI（false 使用 Mock）
AI_PROVIDER=anthropic             # anthropic / openai
ANTHROPIC_API_KEY=sk-...
OPENAI_API_KEY=sk-...             # 备用
ZHIPU_API_KEY=...                 # 理解层转译
```

## 代码规范

- 路径别名：`@/*` 映射到项目根目录
- 组件使用 `'use client'` 标记客户端组件
- 类型优先从 `lib/types.ts` 导入
- AI prompt 修改需同步更新 Mock 数据结构
- 新增路径需在 `lib/path-config.ts` 的 `PATH_FLOWS` 中配置流程

## 多路径开发指南

### 添加新路径时

1. 在 `lib/types.ts` 中添加 `PathId` 类型
2. 在 `lib/path-config.ts` 的 `PATH_FLOWS` 中配置流程
3. 在 `app/hooks/useStepMachine.ts` 中添加对应的 action 处理
4. 在 `app/page.tsx` 中添加对应的步骤渲染
5. 创建对应的 API Route（`app/api/{path}/route.ts`）
6. 创建对应的结果页组件（`app/components/*ResultPage.tsx`）
