// 判词验证和降级服务
// 用于在 AI 生成后验证输出，确保符合判词库规则
//
// 【注意】此文件处理的是旧的判词库结构（judgment, highlight 字段）
// 新的系统使用 GallupResult（explain + decide），不再需要此验证器
// 保留此文件用于向后兼容，未来可能移除

import {
  validateDiagnosisOutput,
  getFallbackDiagnosis,
  type DiagnosisOutput,
  CORE_DIAGNOSIS_LABELS,
  ALL_FORBIDDEN_WORDS,
} from './verdict-rules';
import type { GallupResult } from './types';
import type { ResultData } from './schema';

/**
 * 验证并清理 AI 生成的诊断输出
 * 如果不符合规则，返回降级模板
 *
 * @deprecated 使用新的 explain + decide 结构，不再需要此验证器
 */
export function validateAndSanitizeDiagnosis(
  aiOutput: Partial<ResultData & DiagnosisOutput>
): ResultData {
  // 检查是否包含新的诊断结构
  if (aiOutput.diagnosis_label || aiOutput.verdict || aiOutput.experience || aiOutput.pivot) {
    const diagnosisOutput: DiagnosisOutput = {
      diagnosis_label: aiOutput.diagnosis_label || '',
      verdict: aiOutput.verdict || (aiOutput as Record<string, unknown>).judgment as string || '',
      experience: aiOutput.experience || '',
      pivot: aiOutput.pivot || '',
    };

    // 验证诊断输出
    const validation = validateDiagnosisOutput(diagnosisOutput);

    if (!validation.isValid) {
      console.warn('AI 输出不符合判词库规则，使用降级模板:', validation.errors);

      // 使用降级模板
      const fallback = getFallbackDiagnosis();

      // 保留其他有效字段，只替换诊断相关字段
      return {
        ...aiOutput,
        judgment: fallback.verdict,
      } as ResultData;
    }
  }

  // 额外检查：即使没有新的诊断结构，也要检查禁用词
  const allText = JSON.stringify(aiOutput);
  const foundForbiddenWords = ALL_FORBIDDEN_WORDS.filter(word => allText.includes(word));

  if (foundForbiddenWords.length > 0) {
    console.warn('AI 输出包含禁用词，使用降级模板:', foundForbiddenWords);
    const fallback = getFallbackDiagnosis();
    return {
      ...aiOutput,
      judgment: fallback.verdict,
    } as ResultData;
  }

  // 验证通过，返回原始输出
  return aiOutput as ResultData;
}

/**
 * 验证新的 GallupResult 结构
 *
 * @deprecated 新的 explain + decide 结构由各自的数据生成器保证格式
 */
export function validateGallupResult(result: GallupResult): boolean {
  // 验证 explain 结构
  if (!result.explain?.strengthManifestations?.length) {
    return false;
  }
  if (!result.explain?.strengthInteractions) {
    return false;
  }
  if (!result.explain?.blindspots) {
    return false;
  }
  if (!result.explain?.summary) {
    return false;
  }

  // 验证 decide 结构
  if (!result.decide?.pathDecision) {
    return false;
  }
  if (!result.decide?.pathLogic) {
    return false;
  }
  if (!result.decide?.pathReason) {
    return false;
  }
  if (!result.decide?.doMore?.length) {
    return false;
  }
  if (!result.decide?.doLess?.length) {
    return false;
  }

  return true;
}

/**
 * 检查文本中是否包含禁用词
 */
export function containsForbiddenWords(text: string): boolean {
  return ALL_FORBIDDEN_WORDS.some(word => text.includes(word));
}

/**
 * 检查诊断标签是否在白名单中
 */
export function isValidDiagnosisLabel(label: string): boolean {
  // 提取核心标签（去除"诊断结论："前缀和副标签）
  const coreLabel = label
    .replace(/^诊断结论[：:]\s*/, '')
    .split('·')[0]
    .trim();
  
  return CORE_DIAGNOSIS_LABELS.includes(coreLabel as any);
}
