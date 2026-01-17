# 盖洛普教练判断规则层

本规则层用于“约束与补强”生成结果，强化教练式判断与取舍，不改动 Stage3Output schema 和 UI。

## 使用方式

- 规则集中在 `lib/coach_rules/rules.ts`。
- 应用入口在 `lib/coach_rules/applyRules.ts`，并在 `lib/legacy-pipeline/stage4-render.ts` 的 prompt 中注入。
- 未命中规则时，不改变现有逻辑，仅保留原诊断提示。

## 新增规则步骤

1. 在 `lib/coach_rules/rules.ts` 新增一条规则，字段必须齐全：  
   `id`、`when`、`because`、`conclude`、`do_more`、`do_less`、`boundary`、`check_rule`、`anti_misjudge`。
2. `when.patterns` 放入可触发的文字特征（从诊断摘要或模式描述中匹配）。
3. `when.strengths` 放入相关优势名称（中英文都可）。
4. `because` 只写“判断依据”，不引用书籍原文，不扩展成解释文。
5. 保持“判断清晰、结论负责、行动导向”，避免安抚性语句。

## 写测试

测试在 `__tests__/coach_rules.test.ts`。

新增规则后至少添加 1 个测试：
- 构造 `Stage3Output`，在 `current_pattern` 写入触发关键词；
- `top_strengths` 加入对应优势名称；
- 断言 `applyRules()` 命中规则且 `actionHints` 不为空。

## 运行测试

```bash
npm run test __tests__/coach_rules.test.ts
```
