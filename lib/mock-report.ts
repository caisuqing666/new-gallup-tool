// 报告解读 Mock 数据生成器
// Phase 3: 报告解读功能
// 用于 OCR 识别盖洛普报告后生成个性化解读

import { ReportInterpretResult, StrengthId } from './types';
import { ALL_STRENGTHS, DOMAIN_NAMES } from './gallup-strengths';

/**
 * 优势画像数据（用于生成解读）
 */
const STRENGTH_PROFILES: Record<string, {
  whatItIs: string;
  yourStrength: string;
  watchOut: string;
  bestWhen: string[];
  pairWith: string[];
  avoid: string[];
}> = {
  // 执行力
  '专注': {
    whatItIs: '专注让你能够在一段时间内排除干扰，全神贯注于一件事',
    yourStrength: '你会盯着一件事做到底，其他事很难插进来。别人叫你你都听不见',
    watchOut: '在需要多任务并行的环境中，你的"专注"可能变成"固执"',
    bestWhen: ['需要深度工作', '长期项目', '复杂任务', '需要细节时'],
    pairWith: ['前瞻', '战略', '纪律'],
    avoid: ['适应', '搜集', '理念'],
  },
  '成就': {
    whatItIs: '成就是你的内在驱动力，让你每天都想完成任务并获得满足感',
    yourStrength: '你会自动设定每日目标，不完成任务就睡不着觉',
    watchOut: '你永不满足，容易过度工作，难以享受已完成的成果',
    bestWhen: ['需要高产出', '目标驱动', '自我激励', '量化管理'],
    pairWith: ['纪律', '责任', '排难'],
    avoid: ['适应', '和谐', '体谅'],
  },
  '责任': {
    whatItIs: '责任让你对他人的承诺负责，说到做到是你的底线',
    yourStrength: '你会默认所有事都"不能出错、不能放手"，别人一求助你就答应',
    watchOut: '过度承担责任，无法拒绝，把所有人的期待都接住',
    bestWhen: ['需要可靠执行', '建立信任', '领导团队', '关键任务'],
    pairWith: ['战略', '公平', '专注'],
    avoid: ['适应', '和谐', '包容'],
  },
  '纪律': {
    whatItIs: '纪律让你建立秩序和结构，按计划执行，不喜欢意外',
    yourStrength: '你会为每件事制定时间表和流程，按计划执行让你安心',
    watchOut: '计划被打乱时会崩溃，难以应对突发变化',
    bestWhen: ['需要稳定执行', '长期项目', '重复性任务', '流程管理'],
    pairWith: ['成就', '专注', '公平'],
    avoid: ['适应', '理念', '行动'],
  },
  '排难': {
    whatItIs: '排难让你天生能发现问题所在，并享受解决问题的过程',
    yourStrength: '你会自动看到"这里有问题"，并忍不住想去修复它',
    watchOut: '只看到问题，忽略已有的好，对"没问题"感到无聊',
    bestWhen: ['诊断问题', '修复系统', '故障排查', '持续改进'],
    pairWith: ['学习', '分析', '搜集'],
    avoid: ['积极', '和谐', '信仰'],
  },
  '统筹': {
    whatItIs: '统筹让你擅长优化资源配置，协调多方任务和资源',
    yourStrength: '你会同时管理 5 件事以上，不断调整以找到最优配置',
    watchOut: '过度调整，无法接受"够好了"，总是想再优化',
    bestWhen: ['项目管理', '资源协调', '复杂任务', '动态调整'],
    pairWith: ['责任', '公平', '行动'],
    avoid: ['专注', '纪律', '审慎'],
  },
  '信仰': {
    whatItIs: '信仰让你为意义而行动，只做你认为有价值的事',
    yourStrength: '你会寻找"值得长期投入"的方向，没有意义的事很难坚持',
    watchOut: '难以接受与价值观冲突的任务，用价值观评判他人',
    bestWhen: ['需要内在动力', '长期坚持', '价值观驱动', '使命感'],
    pairWith: ['专注', '前瞻', '责任'],
    avoid: ['适应', '公平', '取悦'],
  },
  '公平': {
    whatItIs: '公平让你确保规则对所有人一致，讨厌特殊待遇',
    yourStrength: '你会建立标准流程，确保每个人都被平等对待',
    watchOut: '过度追求一致，缺乏灵活性，难以处理例外',
    bestWhen: ['建立标准', '确保公平', '流程管理', '规则制定'],
    pairWith: ['责任', '纪律', '统筹'],
    avoid: ['个别', '适应', '行动'],
  },
  '审慎': {
    whatItIs: '审慎让你降低风险，在行动前仔细评估所有可能性',
    yourStrength: '你会看到所有可能出错的地方，提前规避风险',
    watchOut: '过度分析导致行动瘫痪，用"还没想清楚"逃避决策',
    bestWhen: ['风险评估', '重要决策', '安全检查', '周全考虑'],
    pairWith: ['分析', '战略', '学习'],
    avoid: ['行动', '适应', '积极'],
  },
  // 影响力
  '沟通': {
    whatItIs: '沟通让你擅长用语言传递想法，让他人理解你的意图',
    yourStrength: '你会把复杂的事情说清楚，但可能说得太多，听得太少',
    watchOut: '说得太多，听得太少，可能误解对方是否理解',
    bestWhen: ['演讲写作', '说服他人', '解释说明', '传递信息'],
    pairWith: ['统率', '个别', '积极'],
    avoid: ['搜集', '学习', '思维'],
  },
  '竞争': {
    whatItIs: '竞争让你想要赢，通过与他人的比较来衡量自己的进步',
    yourStrength: '你会把一切变成比赛，需要排名和对手来激发自己',
    watchOut: '把队友当对手，输不起，用"赢"定义自我价值',
    bestWhen: ['有排名场景', '需要激励', '目标导向', '业绩压力'],
    pairWith: ['成就', '行动', '追求'],
    avoid: ['和谐', '体谅', '适应'],
  },
  '统率': {
    whatItIs: '统率让你掌控局面，在混乱中快速做出决策并带领他人',
    yourStrength: '你会果断指挥，无法容忍无序状态，不喜欢被忽视',
    watchOut: '显得强势，压制他人，无法接受不同意见',
    bestWhen: ['危机处理', '快速决策', '带领团队', '需要权威'],
    pairWith: ['自信', '行动', '责任'],
    avoid: ['和谐', '体谅', '公平'],
  },
  '自信': {
    whatItIs: '自信让你相信自己的判断和能力，在不确定中做出决策',
    yourStrength: '你会坚持自己的判断，即使面对质疑也不动摇',
    watchOut: '显得自大，难以接受反馈，把"我觉得"当作"事实"',
    bestWhen: ['不确定性决策', '坚持立场', '独立判断', '抗压能力强'],
    pairWith: ['统率', '战略', '追求'],
    avoid: ['学习', '搜集', '审慎'],
  },
  '行动': {
    whatItIs: '行动让你立即开始，用行动推动进展，讨厌等待',
    yourStrength: '你会把想法变成行动，现在就做，不要等',
    watchOut: '冲动行事，缺乏计划，用"先动起来"逃避思考',
    bestWhen: ['打破僵局', '快速启动', '从0到1', '需要进展'],
    pairWith: ['成就', '竞争', '统率'],
    avoid: ['审慎', '学习', '思维'],
  },
  '完美': {
    whatItIs: '完美让你追求卓越，从好到更好，不接受平庸',
    yourStrength: '你会把事情从好变成卓越，但无法接受"够好了"',
    watchOut: '永不满足，过度打磨，用"还不够好"拖延交付',
    bestWhen: ['精益求精', '打磨细节', '质量提升', '追求卓越'],
    pairWith: ['专注', '学习', '成就'],
    avoid: ['适应', '行动', '包容'],
  },
  '追求': {
    whatItIs: '追求让你渴望被认可，希望自己的工作产生影响力',
    yourStrength: '你会想让别人看到你的成就，没有掌声就缺乏动力',
    watchOut: '过度在意他人评价，没有掌声就没有动力',
    bestWhen: ['展示成果', '获得认可', '产生影响', '需要曝光'],
    pairWith: ['统率', '沟通', '竞争'],
    avoid: ['学习', '回顾', '专注'],
  },
  '取悦': {
    whatItIs: '取悦让你擅长结识新人，建立广泛的人际关系',
    yourStrength: '你会主动与陌生人打招呼，享受初次见面的过程',
    watchOut: '关系广而不深，难以维持深层关系',
    bestWhen: ['破冰', '拓展人脉', '结识新客户', '社交场合'],
    pairWith: ['沟通', '积极', '追求'],
    avoid: ['学习', '思维', '回顾'],
  },
  // 关系建立
  '体谅': {
    whatItIs: '体谅让你能感受到他人的情绪，理解他们的处境',
    yourStrength: '你会自动感知别人的感受，像情绪海绵一样吸收情绪',
    watchOut: '被他人情绪淹没，边界模糊，无法拒绝情绪求助',
    bestWhen: ['情感支持', '理解他人', '团队氛围', '客户关系'],
    pairWith: ['个别', '交往', '积极'],
    avoid: ['竞争', '统率', '行动'],
  },
  '和谐': {
    whatItIs: '和谐让你避免冲突，寻找共识，维持和平',
    yourStrength: '你会自动调解矛盾，避免正面冲突，用妥协换取和平',
    watchOut: '逃避必要的冲突，无法坚持立场，用"没冲突"等于"关系好"',
    bestWhen: ['调解矛盾', '建立共识', '团队和谐', '降低摩擦'],
    pairWith: ['体谅', '包容', '适应'],
    avoid: ['竞争', '统率', '排难'],
  },
  '包容': {
    whatItIs: '包容让你想让每个人都被接纳，不愿意排除任何人',
    yourStrength: '你会努力让边缘的人也参与进来，很难说"你不适合"',
    watchOut: '无法排除不合适的人，把"包容"变成"没有标准"',
    bestWhen: ['建立归属感', '整合多元', '团队建设', '广泛参与'],
    pairWith: ['和谐', '体谅', '积极'],
    avoid: ['完美', '竞争', '责任'],
  },
  '交往': {
    whatItIs: '交往让你深化关系，与亲密的人建立深层连接',
    yourStrength: '你会与少数人建立深厚关系，只在舒适圈里深度交流',
    watchOut: '圈子小，难以拓展，用"深度"逃避"广度"',
    bestWhen: ['建立信任', '深度合作', '长期关系', '亲密连接'],
    pairWith: ['体谅', '个别', '伯乐'],
    avoid: ['取悦', '适应', '搜集'],
  },
  '个别': {
    whatItIs: '个别让你看到每个人的独特之处，进行个性化服务',
    yourStrength: '你会发现每个人的不同，为不同人定制不同方案',
    watchOut: '难以标准化，效率低，无法接受"一刀切"',
    bestWhen: ['因人施策', '个性化服务', '定制化', '一对一'],
    pairWith: ['体谅', '交往', '学习'],
    avoid: ['公平', '纪律', '统筹'],
  },
  '积极': {
    whatItIs: '积极让你传递正能量，用热情感染他人',
    yourStrength: '你会自动看到光明面，用积极情绪带动团队氛围',
    watchOut: '回避负面情绪，无法处理悲伤和失望',
    bestWhen: ['激励团队', '营造氛围', '提振士气', '情绪管理'],
    pairWith: ['取悦', '沟通', '追求'],
    avoid: ['排难', '体谅', '回顾'],
  },
  '适应': {
    whatItIs: '适应让你顺应变化，活在当下，灵活应对',
    yourStrength: '你会根据外界变化不断调整，随机应变，不执着于计划',
    watchOut: '缺乏长期规划，被动应对，用"没计划"当成"灵活"',
    bestWhen: ['应对变化', '处理突发', '灵活调整', '快速响应'],
    pairWith: ['和谐', '体谅', '积极'],
    avoid: ['纪律', '责任', '前瞻'],
  },
  '伯乐': {
    whatItIs: '伯乐让你看到他人潜力，享受帮助他人成长的过程',
    yourStrength: '你会看到别人的潜力，投入精力培养他们',
    watchOut: '过度投入他人，忽略自己，被"烂泥扶不上墙"消耗',
    bestWhen: ['培养人才', '辅导他人', '团队发展', '人力资源'],
    pairWith: ['个别', '交往', '体谅'],
    avoid: ['成就', '竞争', '完美'],
  },
  '关联': {
    whatItIs: '关联让你看到事物之间的联系，构建整体图景',
    yourStrength: '你会发现意外的联系，用"相信"替代"验证"',
    watchOut: '过度解读，看到不存在的关联，把巧合当作命运',
    bestWhen: ['整合资源', '建立联盟', '看到关联', '系统思维'],
    pairWith: ['学习', '前瞻', '战略'],
    avoid: ['分析', '审慎', '排难'],
  },
  // 战略思维
  '分析': {
    whatItIs: '分析让你用数据和逻辑验证，寻找客观依据',
    yourStrength: '你会找到数据支撑的答案，用逻辑说服他人',
    watchOut: '过度分析，延迟行动，对"直觉"缺乏信任',
    bestWhen: ['严谨论证', '排除错误', '数据分析', '逻辑验证'],
    pairWith: ['学习', '战略', '搜集'],
    avoid: ['行动', '适应', '积极'],
  },
  '搜集': {
    whatItIs: '搜集让你收集信息，储备资源，建立知识库',
    yourStrength: '你会不断收集新信息，总觉得信息还不够',
    watchOut: '信息囤积，无法决策，用"再收集一下"拖延决策',
    bestWhen: ['整合资源', '建立知识库', '信息整理', '学习新领域'],
    pairWith: ['学习', '分析', '理念'],
    avoid: ['行动', '专注', '纪律'],
  },
  '前瞻': {
    whatItIs: '前瞻让你看到未来可能性，描绘令人兴奋的愿景',
    yourStrength: '你会看到"未来可能是怎样"，用愿景激励现在',
    watchOut: '忽略当下，活在幻想中，用"未来愿景"逃避"当下行动"',
    bestWhen: ['规划愿景', '激励长期目标', '战略规划', '方向指引'],
    pairWith: ['战略', '理念', '学习'],
    avoid: ['适应', '纪律', '责任'],
  },
  '战略': {
    whatItIs: '战略让你找到最优路径，在复杂局面中做选择',
    yourStrength: '你会不断寻找"更好的路"，很难在一条路上坚持',
    watchOut: '永远在找"更好的路"，无法坚持，用"战略"替代"行动"',
    bestWhen: ['复杂决策', '路径选择', '资源配置', '长期规划'],
    pairWith: ['分析', '前瞻', '学习'],
    avoid: ['行动', '纪律', '成就'],
  },
  '学习': {
    whatItIs: '学习让你不断学习新知识，享受掌握新技能的过程',
    yourStrength: '你会快速掌握新领域，但学而不用，永远在准备',
    watchOut: '学而不用，永远在准备，用"还要再学"逃避行动',
    bestWhen: ['快速学习', '掌握新领域', '知识更新', '技能提升'],
    pairWith: ['分析', '搜集', '战略'],
    avoid: ['行动', '成就', '责任'],
  },
  '理念': {
    whatItIs: '理念让你产生新想法，建立新的概念连接',
    yourStrength: '你会不断想出新点子，但想法太多，落地太少',
    watchOut: '想法太多，难以落地，用"有想法"当成"有进展"',
    bestWhen: ['创新思考', '头脑风暴', '概念创新', '寻找突破'],
    pairWith: ['前瞻', '战略', '搜集'],
    avoid: ['纪律', '专注', '成就'],
  },
  '思维': {
    whatItIs: '思维让你深度思考，进行内省和哲学思考',
    yourStrength: '你会喜欢独处时间深度思考，但过度内耗，与行动脱节',
    watchOut: '用"想清楚"拖延行动，把"思考"当成"做了"',
    bestWhen: ['深度分析', '独立思考', '策略规划', '内省反思'],
    pairWith: ['学习', '分析', '前瞻'],
    avoid: ['行动', '取悦', '适应'],
  },
  '回顾': {
    whatItIs: '回顾让你从过去中寻找答案，参考历史经验',
    yourStrength: '你会从"以前怎么做"中学习，抗拒没有先例的事',
    watchOut: '过度依赖历史，抗拒新事物，用"以前怎么做"替代"现在该怎么做"',
    bestWhen: ['总结经验', '避免错误', '参考历史', '传承知识'],
    pairWith: ['学习', '战略', '信仰'],
    avoid: ['行动', '适应', '理念'],
  },
};

/**
 * 生成完整的报告解读结果
 * @param strengths 识别到的优势 ID 列表
 * @param imageData OCR 图片数据（预留）
 * @returns 报告解读结果
 */
export function generateMockReportResult(strengths?: StrengthId[], _imageData?: string): ReportInterpretResult {
  // 如果没有提供优势，使用默认优势
  const top5Ids = strengths || ['focus', 'responsibility', 'communication', 'empathy', 'achiever'] as StrengthId[];
  
  // 获取优势详情
  const top5Strengths = top5Ids.slice(0, 5).map((id, index) => {
    const strength = ALL_STRENGTHS.find(s => s.id === id);
    if (!strength) return null;

    return {
      rank: index + 1,
      name: strength.name,
      domain: DOMAIN_NAMES[strength.domain],
    };
  }).filter((s) => s !== null) as Array<{ rank: number; name: string; domain: string }>;

  // 生成个人化标签
  const domainCounts: Record<string, number> = {};
  top5Strengths.forEach(s => {
    domainCounts[s.domain] = (domainCounts[s.domain] || 0) + 1;
  });

  let personalLabel = {
    label: '全能型优势者',
    description: '你的优势分布均衡，在各个领域都有突出表现',
    basedOn: top5Strengths.map(s => s.name),
  };

  if (domainCounts['执行力'] >= 3) {
    personalLabel = {
      label: '执行型优势者',
      description: '你的优势主要集中在执行力领域，擅长将想法变成行动和结果',
      basedOn: top5Strengths.map(s => s.name),
    };
  } else if (domainCounts['关系建立'] >= 3) {
    personalLabel = {
      label: '关系型优势者',
      description: '你的优势主要集中在关系建立领域，擅长建立和维持人际关系',
      basedOn: top5Strengths.map(s => s.name),
    };
  } else if (domainCounts['战略思维'] >= 3) {
    personalLabel = {
      label: '战略型优势者',
      description: '你的优势主要集中在战略思维领域，擅长分析和规划',
      basedOn: top5Strengths.map(s => s.name),
    };
  } else if (domainCounts['影响力'] >= 2) {
    personalLabel = {
      label: '影响型优势者',
      description: '你的优势中包含较多影响力领域，擅长说服和带动他人',
      basedOn: top5Strengths.map(s => s.name),
    };
  }

  // 生成每个优势的解读
  const strengthInterpretations = top5Strengths.map((s) => {
    const profile = STRENGTH_PROFILES[s.name] || {
      whatItIs: `这是${s.domain}领域的核心优势`,
      yourStrength: `你在${s.name}方面表现出色`,
      watchOut: '注意过度使用',
      bestWhen: [`使用${s.name}的场景`],
      pairWith: [],
      avoid: [],
    };

    return {
      name: s.name,
      domain: s.domain,
      ...profile,
    };
  });

  // 生成优势组合解读
  const comboInterpretation = {
    coreDrive: `你的核心驱动力来自 ${top5Strengths.slice(0, 2).map(s => s.name).join('×')} 的组合`,
    potentialTraps: [
      '过度使用优势导致能量耗竭',
      '优势使用方式不当陷入地下室状态',
      '多个优势同时激活导致方向发散',
    ],
    synergies: [
      '执行力与影响力的结合让你既能推动结果又能带动他人',
      '关系建立优势帮助你建立信任和团队凝聚力',
      '战略思维优势帮助你保持正确的长期方向',
    ],
  };

  // 生成领域分布分析
  const total = top5Strengths.length;
  const domainAnalysis = Object.entries(domainCounts).map(([domain, count]) => ({
    domain,
    count,
    percentage: Math.round((count / total) * 100),
    characteristics: {
      '执行力': ['执行力强', '结果导向', '推动行动'],
      '影响力': ['说服力强', '带动他人', '影响力大'],
      '关系建立': ['善于建立关系', '同理心强', '团队协作'],
      '战略思维': ['分析能力强', '长远眼光', '善于规划'],
    }[domain] || [],
  }));

  // 生成关键洞察
  const keyInsights = [
    `你的优势组合形成了强大的${Object.keys(domainCounts)[0]}基础`,
    ...top5Strengths.slice(0, 3).map(s => `"${s.name}"是你的核心优势之一`),
    '建议你在使用优势时注意避免进入"地下室状态"',
  ];

  // 生成建议路径
  const suggestedPaths = [
    {
      path: 'breakthrough' as const,
      title: '我遇到了具体问题',
      reason: '用你的优势组合解决当前遇到的具体困境',
    },
    {
      path: 'career-match' as const,
      title: '我想找到适合的职业方向',
      reason: '根据你的优势组合发现最匹配的职业',
    },
    {
      path: 'strength-guide' as const,
      title: '我想更好地发挥自己',
      reason: '深入了解每个优势的最佳发挥方式',
    },
  ];

  return {
    top5Strengths,
    personalLabel,
    summary: `你的 TOP5 优势形成了独特的组合：${top5Strengths.map(s => s.name).join('、')}。这个组合让你在${Object.keys(domainCounts)[0]}方面特别出色，同时具备${Object.keys(domainCounts)[0] === '执行力' ? '推动结果和' : ''}带动他人${Object.keys(domainCounts)[0] === '关系建立' ? '和建立关系' : ''}的能力。`,
    strengthInterpretations,
    comboInterpretation,
    domainAnalysis,
    keyInsights,
    suggestedPaths,
    personalizedAdvice: `基于你的优势组合，建议你在选择工作和角色时，优先考虑那些能让你发挥${top5Strengths[0]?.name}和${top5Strengths[1]?.name}优势的场景。同时，注意${top5Strengths.find(s => s.name === '责任' || s.name === '和谐')?.name}优势不要过度使用，避免承担过多责任或回避必要的冲突。`,
  };
}
