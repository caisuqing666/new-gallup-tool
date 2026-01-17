import type { Stage3Output } from '../legacy-pipeline/types';
import { COACH_RULES, CoachRule } from './rules';

export interface AppliedRulesResult {
  matchedRules: CoachRule[];
  actionHints: {
    do_more: string[];
    do_less: string[];
    boundary: string[];
    check_rule: string[];
  };
  promptBlock: string;
}

function normalize(text: string): string {
  return text.toLowerCase();
}

function buildSearchText(diagnosis: Stage3Output): string {
  const parts = [
    diagnosis.profile_summary,
    diagnosis.current_pattern,
    ...diagnosis.leverage_plan,
    ...diagnosis.anti_pattern,
    ...diagnosis.micro_habits_7d,
    ...diagnosis.proof_points,
    ...diagnosis.top_strengths.map((s) => s.name),
    ...diagnosis.top_strengths.map((s) => s.core_value),
    ...diagnosis.top_strengths.map((s) => s.overuse_pattern),
    ...diagnosis.top_strengths.map((s) => s.blind_spot),
  ];
  return normalize(parts.filter(Boolean).join('\n'));
}

function buildStrengthText(diagnosis: Stage3Output): string {
  return normalize(diagnosis.top_strengths.map((s) => s.name).join(' '));
}

function countHits(text: string, keywords: string[]): number {
  let count = 0;
  for (const keyword of keywords) {
    if (!keyword) {
      continue;
    }
    if (text.includes(normalize(keyword))) {
      count += 1;
    }
  }
  return count;
}

function isRuleMatched(rule: CoachRule, diagnosis: Stage3Output): boolean {
  const text = buildSearchText(diagnosis);
  const strengths = buildStrengthText(diagnosis);

  const patternHits = countHits(text, rule.when.patterns);
  const strengthHits = countHits(strengths, rule.when.strengths);

  const patternThreshold = rule.when.patterns.length <= 4 ? 1 : 2;
  const meetsPattern = patternHits >= patternThreshold;
  const meetsStrength = rule.when.strengths.length === 0 || strengthHits >= 1;

  return meetsPattern && meetsStrength;
}

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    if (!item) {
      continue;
    }
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

function formatPromptBlock(rules: CoachRule[]): string {
  if (rules.length === 0) {
    return '';
  }

  const lines: string[] = [
    '## 【教练判断规则（硬约束）】',
    '你是盖洛普全球认证优势教练（GCC），判断清晰、结论负责、行动导向。',
    '不做心理咨询式安抚，不做内容作者式扩写。',
    '若命中规则，优先按规则下结论；未命中则保持原诊断逻辑。',
    '',
  ];

  rules.forEach((rule, index) => {
    lines.push(`### 规则 ${index + 1}: ${rule.id}`);
    lines.push(`触发：${rule.when.trigger}`);
    lines.push(`诊断：${rule.because.diagnosis}`);
    lines.push(`结论：${rule.conclude}`);
    lines.push(`应做：${rule.do_more.join('；')}`);
    lines.push(`少做：${rule.do_less.join('；')}`);
    lines.push(`边界：${rule.boundary.join('；')}`);
    lines.push(`核验：${rule.check_rule}`);
    lines.push(`排除误判：${rule.anti_misjudge.join('；')}`);
    lines.push('');
  });

  return lines.join('\n').trim();
}

export function applyRules(diagnosis: Stage3Output): AppliedRulesResult {
  const matchedRules = COACH_RULES.filter((rule) => isRuleMatched(rule, diagnosis));

  const actionHints = {
    do_more: unique(matchedRules.flatMap((rule) => rule.do_more)),
    do_less: unique(matchedRules.flatMap((rule) => rule.do_less)),
    boundary: unique(matchedRules.flatMap((rule) => rule.boundary)),
    check_rule: unique(matchedRules.map((rule) => rule.check_rule)),
  };

  return {
    matchedRules,
    actionHints,
    promptBlock: formatPromptBlock(matchedRules),
  };
}
