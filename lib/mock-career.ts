// 职业匹配 Mock 数据生成器
// 基于用户选择的 TOP5 优势，生成职业匹配分析

import { StrengthId } from './gallup-strengths';
import { CareerMatchResult } from './types';
import { getTopCareerMatches, getBestMatchByCategory } from './career-matcher';
import { getCategoryName } from './career-data';

/**
 * 生成职业匹配 Mock 数据
 * @param strengthIds 用户选择的 TOP5 优势 ID 列表
 * @returns 职业匹配结果
 */
export function generateMockCareerResult(strengthIds: string[]): CareerMatchResult {
  // 使用匹配算法计算 TOP 匹配
  const topMatches = getTopCareerMatches(strengthIds as StrengthId[], 3);

  // 如果匹配结果不足 3 个，返回基础建议
  if (topMatches.length < 3) {
    return generateBasicCareerResult(strengthIds);
  }

  // 格式化 TOP 匹配结果
  const formattedMatches = topMatches.map((match) => ({
    careerId: match.career.id,
    careerName: match.career.name,
    matchScore: match.matchScore,
    matchReason: match.matchReason,
    strengthUsage: match.strengthUsage.map((item) => ({
      strengthId: item.strengthId,
      usage: item.usage,
    })),
    watchOut: match.watchOut,
  }));

  // 生成通用职业建议
  const generalAdvice = generateGeneralAdvice(strengthIds as StrengthId[]);

  return {
    topMatches: formattedMatches,
    generalAdvice,
  };
}

/**
 * 生成通用职业建议
 */
function generateGeneralAdvice(
  userStrengths: StrengthId[]
): CareerMatchResult['generalAdvice'] {
  // 分析优势组合特征
  const coreStrengthToUse = userStrengths[0] || '优势';
  const energyManagement = generateEnergyManagementAdvice(userStrengths);
  const growthDirection = generateGrowthDirectionAdvice(userStrengths);

  return {
    coreStrengthToUse: `在职业选择中，优先考虑能够充分发挥你的"${coreStrengthToUse}"优势的岗位。这个优势是你的核心能量来源，用它来驱动你的职业发展会让你更有成就感和满足感。`,
    energyManagement: energyManagement,
    growthDirection,
  };
}

/**
 * 生成能量管理建议
 */
function generateEnergyManagementAdvice(_userStrengths: StrengthId[]): string {
  // 根据优势组合生成能量管理建议
  const adviceTemplates: string[] = [
    '在职业选择时，优先选择那些让你能够"做自己擅长的事"的工作环境，而不是需要你长期扮演"不擅长角色"的岗位。',
    '注意识别工作中的"能量消耗点"和"能量充电点"，尽量增加前者、减少后者，保持长期的职业可持续性。',
    '你的优势组合在某些场景下会"省能量"，在其他场景下会"榨能量"，学会识别这种差异，做出明智的职业选择。',
    '在职业发展中，不要试图"补短板"，而是要让你的"长板"越来越长，在专业领域建立不可替代的价值。',
  ];

  return adviceTemplates.join(' ');
}

/**
 * 生成成长方向建议
 */
function generateGrowthDirectionAdvice(userStrengths: StrengthId[]): string {
  // 获取各分类的最佳匹配
  const bestByCategory = getBestMatchByCategory(userStrengths);
  const validCategories = Object.entries(bestByCategory)
    .filter(([_, match]) => match !== null && match.matchScore >= 50)
    .map(([category, _]) => category);

  if (validCategories.length === 0) {
    return '你的优势组合较为独特，建议多方向探索，找到最适合自己的职业发展路径。不要过早限定自己，保持开放心态尝试不同的可能性。';
  }

  const categoryNames = validCategories.map((c) => getCategoryName(c as any));
  const topCategory = validCategories[0];

  const directionAdvice = {
    technology: '技术类职业很适合你的优势组合，可以考虑向技术专家、产品经理、数据科学家等方向发展。你的逻辑思维和学习能力在这些领域会得到充分发挥。',
    business: '商业类职业很适合你的优势组合，可以考虑向市场营销、销售、商业分析等方向发展。你的沟通能力和竞争意识在这些领域会得到充分发挥。',
    creative: '创意类职业很适合你的优势组合，可以考虑向UX设计、内容创作、品牌策划等方向发展。你的创意能力和表达能力在这些领域会得到充分发挥。',
    service: '服务类职业很适合你的优势组合，可以考虑向咨询、客户成功、人力资源等方向发展。你的同理心和理解力在这些领域会得到充分发挥。',
    education: '教育类职业很适合你的优势组合，可以考虑向教师、企业培训、教育咨询等方向发展。你的培养他人的热情和能力在这些领域会得到充分发挥。',
    healthcare: '医疗健康类职业很适合你的优势组合，可以考虑向医生、心理咨询师、健康管理师等方向发展。你的治愈欲和责任感在这些领域会得到充分发挥。',
    leadership: '领导管理类职业很适合你的优势组合，可以考虑向团队领导、创业者、项目经理等方向发展。你的决策能力和责任感在这些领域会得到充分发挥。',
    operations: '运营执行类职业很适合你的优势组合，可以考虑向运营经理、项目经理、供应链管理等方向发展。你的执行力和组织能力在这些领域会得到充分发挥。',
  };

  return (
    directionAdvice[topCategory as keyof typeof directionAdvice] ||
    `你的优势组合在${categoryNames.join('、')}等领域都有较好的发展潜力。建议选择其中你最有热情的方向深入发展，而不是分散精力。`
  );
}

/**
 * 生成基础职业结果（当匹配结果不足时）
 */
function generateBasicCareerResult(strengthIds: string[]): CareerMatchResult {
  return {
    topMatches: [
      {
        careerId: 'general',
        careerName: '需要进一步探索',
        matchScore: 50,
        matchReason: '你的优势组合较为独特，建议尝试不同的职业方向来找到最匹配的选择。在探索过程中，关注哪些工作让你"有能量"，哪些工作让你"被榨干"，这将帮助你找到正确的方向。',
        strengthUsage: [],
        watchOut: '不要急于做出职业决定，给自己时间探索不同的可能性。',
      },
    ],
    generalAdvice: generateGeneralAdvice(strengthIds as StrengthId[]),
  };
}
