// 优势发挥指南 Mock 数据生成器
// 根据用户选择的 TOP5 优势，生成个性化的发挥指南

import { StrengthGuideResult, StrengthGuide, ComboGuide, WeeklyAction } from './types';
import { StrengthId, getStrengthById } from './gallup-strengths';

// ============================================================
// 优势发挥指南内容库
// ============================================================

/**
 * 单个优势的发挥指南内容
 */
interface StrengthGuideContent {
  whatItMeans: string;
  bestScenarios: string[];
  dailyPractice: {
    morning: string;
    working: string;
    evening: string;
  };
  energyTips: {
    chargeWhen: string;
    restWhen: string;
  };
}

/**
 * 优势指南内容数据库
 */
const STRENGTH_GUIDE_CONTENT: Record<string, StrengthGuideContent> = {
  // ========== 执行力 ==========
  focus: {
    whatItMeans: '你会聚焦于目标，排除干扰，直到任务完成。你的能量来自于深入一件事情的沉浸感。',
    bestScenarios: [
      '需要深度工作的项目',
      '有明确截止日期的任务',
      '复杂问题需要持续跟进的场合',
    ],
    dailyPractice: {
      morning: '每天第一件事：确定今天唯一的"最重要的事"，把它写在便签上贴在显眼位置',
      working: '开启"勿扰模式"，每次专注 90 分钟，中间不切换任务',
      evening: '回顾今天的专注时长，如果被打断太多，明天调整环境',
    },
    energyTips: {
      chargeWhen: '当你能心无旁骛地做一件事时',
      restWhen: '当你被多个任务同时拉扯时',
    },
  },
  achiever: {
    whatItMeans: '你有着持续不断的内在驱动力，每天都需要感受到"有所成就"才会满足。',
    bestScenarios: [
      '有明确可量化目标的工作',
      '需要持续推进的长期项目',
      '自我驱动的创业环境',
    ],
    dailyPractice: {
      morning: '起床后先完成一件小事（比如整理床铺），给自己一个"今日首胜"',
      working: '每完成一个任务就划掉待办事项，享受划掉时的成就感',
      evening: '睡前写下今天的 3 个成就，哪怕很小也要写下来',
    },
    energyTips: {
      chargeWhen: '当你看到任务被勾选完成时',
      restWhen: '当你觉得自己"做得还不够多"时',
    },
  },
  responsibility: {
    whatItMeans: '你会对他人的期待负责，说到做到是你的底线。你害怕让人失望。',
    bestScenarios: [
      '需要高度信任的角色',
      '项目负责人的位置',
      '承诺导向的合作关系',
    ],
    dailyPractice: {
      morning: '检查今天的承诺清单，确认哪些是"必须完成的"',
      working: '在接新任务前，先问自己"我真的能做到吗"',
      evening: '回顾今天的承诺是否都兑现了，如果没有，明天重新评估',
    },
    energyTips: {
      chargeWhen: '当你说到做到，别人因此信任你时',
      restWhen: '当你发现自己在为别人的期待过度承担时',
    },
  },
  discipline: {
    whatItMeans: '你喜欢结构和秩序，例行公事让你感到安全。你的能量来自于可预测的节奏。',
    bestScenarios: [
      '需要长期坚持的工作',
      '流程化的项目管理',
      '建立系统化运营的场景',
    ],
    dailyPractice: {
      morning: '保持固定的起床时间，按既定流程开始一天',
      working: '为重复性任务建立清单和模板，减少决策消耗',
      evening: '为明天做好计划，让明天的启动更顺畅',
    },
    energyTips: {
      chargeWhen: '当你按计划推进，一切井然有序时',
      restWhen: '当计划被打乱，你感到失控时',
    },
  },
  restorative: {
    whatItMeans: '你擅长解决问题，看到问题就有修复的冲动。你的能量来自于"从坏变好"的过程。',
    bestScenarios: [
      '问题诊断和解决',
      '故障排查和修复',
      '优化改进项目',
    ],
    dailyPractice: {
      morning: '列出今天的"问题清单"，按影响程度排序',
      working: '每解决一个问题就记录下来，积累你的修复案例库',
      evening: '回顾今天解决了什么，哪怕是很小的问题',
    },
    energyTips: {
      chargeWhen: '当你成功修复一个问题，看到情况变好时',
      restWhen: '当你面对无法修复的问题，感到无力时',
    },
  },
  arranger: {
    whatItMeans: '你擅长协调多方资源，让所有元素各就各位。你的能量来自于把复杂变有序。',
    bestScenarios: [
      '多线程项目管理',
      '活动组织和协调',
      '资源优化配置',
    ],
    dailyPractice: {
      morning: '查看所有进行中的项目，确认各自的状态和优先级',
      working: '每天至少调整一次资源分配，让每个人都在最适合的位置',
      evening: '复盘今天的资源协调，是否有更好的安排方式',
    },
    energyTips: {
      chargeWhen: '当你成功协调所有人，事情顺利推进时',
      restWhen: '当你被太多事拉着走，无法总览全局时',
    },
  },
  belief: {
    whatItMeans: '你有坚定的核心价值观，这些信念指引着你的方向。你需要做有意义的事。',
    bestScenarios: [
      '使命驱动的工作',
      '需要长期价值观坚守的场合',
      '帮助他人的角色',
    ],
    dailyPractice: {
      morning: '花 5 分钟回顾自己的核心价值观，问自己"今天做的事符合它吗"',
      working: '在做决策时，问自己"这件事的长期意义是什么"',
      evening: '写下今天做的哪件事让你感到有意义',
    },
    energyTips: {
      chargeWhen: '当你做的事情与自己的价值观一致时',
      restWhen: '当你做的事情违背内心时',
    },
  },
  consistency: {
    whatItMeans: '你重视公平和规则，希望每个人都被平等对待。稳定的行为让你感到安心。',
    bestScenarios: [
      '需要建立标准流程的工作',
      '公平性相关的仲裁或评判',
      '制度设计和执行',
    ],
    dailyPractice: {
      morning: '回顾今天的任务是否有清晰的规则和标准',
      working: '在团队中建立可预期的行为模式，让他人知道可以期待什么',
      evening: '检查今天是否对所有人都一视同仁',
    },
    energyTips: {
      chargeWhen: '当规则被遵守，公平时',
      restWhen: '当不公平发生，你感到无力时',
    },
  },
  deliberative: {
    whatItMeans: '你会谨慎地识别风险和隐患，在做决定前需要充分评估。你不打无准备之仗。',
    bestScenarios: [
      '风险控制和合规',
      '需要谨慎决策的场景',
      '长期规划',
    ],
    dailyPractice: {
      morning: '花 10 分钟思考今天任务中可能的风险点',
      working: '在做重要决定前，列出"可能出什么问题"清单',
      evening: '回顾今天的谨慎是否帮助你避免了问题',
    },
    energyTips: {
      chargeWhen: '当你的谨慎帮助团队避免了风险时',
      restWhen: '当你过度谨慎，导致无法行动时',
    },
  },

  // ========== 影响力 ==========
  woo: {
    whatItMeans: '你喜欢结识陌生人，从与人建立联系中获得能量。陌生不是障碍，是机会。',
    bestScenarios: [
      '商务拓展和市场开拓',
      '需要建立广泛人脉的活动',
      '对外沟通和推广',
    ],
    dailyPractice: {
      morning: '列出今天要联系的 3 个人，至少包含 1 个陌生人',
      working: '主动参与社交场合，给自己设定"认识 3 个新朋友"的小目标',
      evening: '记录今天认识的人，和每个人的一条有趣信息',
    },
    energyTips: {
      chargeWhen: '当你认识新朋友，建立新联系时',
      restWhen: '当你需要深度处理一对一关系时',
    },
  },
  command: {
    whatItMeans: '你有强烈的存在感和掌控欲，不怕面对压力。危机时刻，你会站出来掌舵。',
    bestScenarios: [
      '需要快速决策的危机处理',
      '团队领导和指挥',
      '推动变革和转型',
    ],
    dailyPractice: {
      morning: '问自己"今天需要由我来推动什么"',
      working: '在会议中主动发言，提出明确的方向和要求',
      evening: '反思今天是否在关键时刻站出来了',
    },
    energyTips: {
      chargeWhen: '当你掌控局面，推动事情时',
      restWhen: '当你需要配合他人，无法主导时',
    },
  },
  communication: {
    whatItMeans: '你擅长把想法变成语言，让别人理解你的观点。表达让你感到释放。',
    bestScenarios: [
      '演讲和演示',
      '需要清晰沟通的协调工作',
      '内容创作和表达',
    ],
    dailyPractice: {
      morning: '花 5 分钟整理今天要传达的核心信息',
      working: '在工作中主动承担沟通角色，确保信息被准确理解',
      evening: '回顾今天的沟通，是否有更好的表达方式',
    },
    energyTips: {
      chargeWhen: '当你的话被人理解并产生共鸣时',
      restWhen: '当你需要沉默和内省时',
    },
  },
  competition: {
    whatItMeans: '你需要比较才能知道自己有多好。他人的成就是你的标尺，也是你的动力。',
    bestScenarios: [
      '有明确排名和指标的竞争环境',
      '销售和业绩导向的工作',
      '需要突破个人极限的挑战',
    ],
    dailyPractice: {
      morning: '设定今天的"个人纪录"目标，要超过昨天的自己',
      working: '找到你的对标对象，问自己"怎么才能超过他"',
      evening: '记录今天的胜绩，哪怕是很小的一件事',
    },
    energyTips: {
      chargeWhen: '当你赢得比赛或打破纪录时',
      restWhen: '当你无法找到比较的对象时',
    },
  },
  maximizer: {
    whatItMeans: '你不满足于"还可以"，而是追求"卓越"。你有把好东西变成精品的天赋。',
    bestScenarios: [
      '需要高质量输出的工作',
      '产品优化和改进',
      '打造标杆和示范',
    ],
    dailyPractice: {
      morning: '问自己"今天哪件事值得做到卓越"',
      working: '选择一件重要的事，不满足于"完成"，而要做到"惊艳"',
      evening: '回顾今天的工作，哪件事可以做得更好',
    },
    energyTips: {
      chargeWhen: '当你把一件事从好变成卓越时',
      restWhen: '当你需要在"足够好"的事情上妥协时',
    },
  },
  selfAssurance: {
    whatItMeans: '你对自己的判断有信心，不受外界质疑影响。你知道自己是对的，这让你敢于冒险。',
    bestScenarios: [
      '需要独立决策的领导角色',
      '创新和创业',
      '在压力下坚守立场',
    ],
    dailyPractice: {
      morning: '问自己"今天我需要相信自己的什么决定"',
      working: '在质疑声中坚持你的判断，但保持开放倾听',
      evening: '记录今天你坚持了自己判断的时刻',
    },
    energyTips: {
      chargeWhen: '当你的判断被证明正确时',
      restWhen: '当你对自己的判断失去信心时',
    },
  },
  activator: {
    whatItMeans: '你没有耐心等待，只想立刻行动。你的能量来自于"开始"本身。',
    bestScenarios: [
      '新项目启动',
      '打破僵局的行动',
      '快速迭代和试错',
    ],
    dailyPractice: {
      morning: '起床后 30 分钟内开始做第一件重要的事',
      working: '给自己设定"5 分钟启动规则"：再犹豫的事，先做 5 分钟',
      evening: '记录今天启动了什么，哪怕是很小的行动',
    },
    energyTips: {
      chargeWhen: '当你开始行动，看到事情动起来时',
      restWhen: '当你被迫等待，无法行动时',
    },
  },
  significance: {
    whatItMeans: '你希望被认可，你的价值来自于他人的认可和尊重。你想成为重要的人。',
    bestScenarios: [
      '有影响力、能被看到的角色',
      '需要个人品牌的领域',
      '能够获得认可的工作',
    ],
    dailyPractice: {
      morning: '问自己"今天做什么能让我感到自豪"',
      working: '主动承担能被看到的工作，让他人知道你的贡献',
      evening: '写下今天获得的认可，哪怕是很小的反馈',
    },
    energyTips: {
      chargeWhen: '当你的贡献被看到和认可时',
      restWhen: '当你默默无闻，付出不被看到时',
    },
  },

  // ========== 关系建立 ==========
  relator: {
    whatItMeans: '你享受亲密的一对一关系，深度比广度更重要。你会在小圈子里建立信任。',
    bestScenarios: [
      '需要深度信任的合作关系',
      '一对一的辅导或咨询',
      '小团队的紧密协作',
    ],
    dailyPractice: {
      morning: '选择一个重要的人，今天花时间加深和 Ta 的关系',
      working: '在工作中，主动和某人进行一次真诚的对话',
      evening: '反思今天和谁建立了更深的连接',
    },
    energyTips: {
      chargeWhen: '当你和重要的人建立深度连接时',
      restWhen: '当你被迫在太多人之间周旋时',
    },
  },
  empathy: {
    whatItMeans: '你能感知他人的情绪，好像感同身受。你的天线时刻捕捉着身边的情感信号。',
    bestScenarios: [
      '需要理解用户需求的工作',
      '团队情绪润滑剂的角色',
      '心理咨询和服务',
    ],
    dailyPractice: {
      morning: '问自己"今天谁可能需要我的理解和关注"',
      working: '在会议中观察他人的情绪，用合适的方式回应',
      evening: '反思今天是否正确理解了他人的感受',
    },
    energyTips: {
      chargeWhen: '当你成功理解并支持他人时',
      restWhen: '当你被太多负面情绪淹没时',
    },
  },
  harmony: {
    whatItMeans: '你不喜欢冲突，希望大家都达成共识。你会寻找共同点，推动和谐前进。',
    bestScenarios: [
      '需要团队协作的环境',
      '调解和协调冲突',
      '建立共识的过程',
    ],
    dailyPractice: {
      morning: '问自己"今天如何让团队更和谐"',
      working: '在冲突中，主动寻找共同点，提出双方都能接受的方案',
      evening: '反思今天是否减少了不必要的摩擦',
    },
    energyTips: {
      chargeWhen: '当你促成共识，大家达成一致时',
      restWhen: '当你面对无法调和的冲突时',
    },
  },
  include: {
    whatItMeans: '你不希望任何人被落下，你会主动拉别人进来。你的圈子里"一个都不能少"。',
    bestScenarios: [
      '团队建设和包容性文化',
      '需要广泛参与的活动',
      '确保不遗漏任何人的协调工作',
    ],
    dailyPractice: {
      morning: '问自己"今天谁需要被邀请"',
      working: '主动邀请安静的人发言，确保所有人都有机会参与',
      evening: '反思今天是否有人被忽略了',
    },
    energyTips: {
      chargeWhen: '当你成功让每个人都参与进来时',
      restWhen: '当你需要排除某些人时',
    },
  },
  individualization: {
    whatItMeans: '你对每个人的独特性敏感，你不喜欢一视同仁，而是因材施教、因人定制。',
    bestScenarios: [
      '个性化服务或定制化工作',
      '人才发展和辅导',
      '需要精准匹配的场景',
    ],
    dailyPractice: {
      morning: '选择一个团队成员，思考 Ta 的独特之处',
      working: '根据每个人的特点分配任务，而不是"一刀切"',
      evening: '记录今天发现的某人的独特之处',
    },
    energyTips: {
      chargeWhen: '当你准确识别并利用某人的独特之处时',
      restWhen: '当你被迫对所有人一视同仁时',
    },
  },
  developer: {
    whatItMeans: '你看到别人的潜力，享受见证成长的过程。别人的进步就是你的成就。',
    bestScenarios: [
      '人才培养和教练',
      '教育和培训',
      '帮助他人成长的角色',
    ],
    dailyPractice: {
      morning: '选择一个你可以帮助的人，今天给他一个成长建议',
      working: '在工作中，发现并指出他人的进步，哪怕很小',
      evening: '记录今天见证的他人成长',
    },
    energyTips: {
      chargeWhen: '当你看到他人因为你的帮助而进步时',
      restWhen: '当你面对无法帮助的人时',
    },
  },
  positivity: {
    whatItMeans: '你天生乐观，能从任何情况中看到光明面。你的热情会传染给周围的人。',
    bestScenarios: [
      '需要提振士气的团队',
      '高压环境的情绪支持',
      '销售和客户服务',
    ],
    dailyPractice: {
      morning: '花 5 分钟想象今天美好的可能性',
      working: '在团队低落时，主动分享一个积极的视角',
      evening: '写下今天发生的 3 件好事',
    },
    energyTips: {
      chargeWhen: '当你的乐观感染了他人时',
      restWhen: '当你被迫长时间处于负面情绪中时',
    },
  },
  adaptability: {
    whatItMeans: '你喜欢活在当下，灵活应对变化。计划不如变化，而你总是能顺势而为。',
    bestScenarios: [
      '快速变化的环境',
      '需要即时响应的工作',
      '突发事件处理',
    ],
    dailyPractice: {
      morning: '对今天保持开放，不预设"应该怎样"',
      working: '当变化发生时，第一时间调整心态，问"现在怎么办"',
      evening: '记录今天你如何灵活应对了变化',
    },
    energyTips: {
      chargeWhen: '当你成功适应变化，找到新路径时',
      restWhen: '当你被要求长期坚持固定计划时',
    },
  },
  connectedness: {
    whatItMeans: '你相信万物相连，每个人都是更大图景的一部分。你寻找意义和连接。',
    bestScenarios: [
      '需要整合资源的工作',
      '寻找宏观意义的场合',
      '跨界协调和合作',
    ],
    dailyPractice: {
      morning: '问自己"今天做的事如何与更大的图景相连"',
      working: '在工作中寻找看似无关事物之间的联系',
      evening: '反思今天的行动如何服务于更大的意义',
    },
    energyTips: {
      chargeWhen: '当你感受到万物相连的意义时',
      restWhen: '当你面对割裂和孤立的局面时',
    },
  },

  // ========== 战略思维 ==========
  strategic: {
    whatItMeans: '你擅长从多个角度审视问题，能预见未来。你的能量来自于"找到更好的路径"。',
    bestScenarios: [
      '长期规划和战略制定',
      '复杂问题的多角度分析',
      '寻找创新方案',
    ],
    dailyPractice: {
      morning: '花 10 分钟思考手头任务的"不同做法"',
      working: '在讨论中，主动提出"有没有更好的方式"',
      evening: '记录今天发现的任何更优路径',
    },
    energyTips: {
      chargeWhen: '当你找到"更好的路径"时',
      restWhen: '当你被迫执行既定的低效方案时',
    },
  },
  analytical: {
    whatItMeans: '你追求证明和理由，不接受表面结论。你的大脑在问"为什么"和"如何证明"。',
    bestScenarios: [
      '数据分析和研究',
      '需要逻辑论证的场合',
      '问题诊断和根因分析',
    ],
    dailyPractice: {
      morning: '问自己"今天的任务需要什么证据支持"',
      working: '在做决定前，列出支持或反对的理由',
      evening: '反思今天的判断是否有足够的证据',
    },
    energyTips: {
      chargeWhen: '当你找到充分证据支持结论时',
      restWhen: '当你被迫在没有证据的情况下行动时',
    },
  },
  futuristic: {
    whatItMeans: '你是一个未来派，总能看到"可能是怎样"。你的梦想在明天，不在今天。',
    bestScenarios: [
      '长远规划和愿景设计',
      '创新和前瞻性项目',
      '趋势预判和战略布局',
    ],
    dailyPractice: {
      morning: '花 5 分钟想象"一年后这件事会怎样"',
      working: '在日常工作中，问"这个决定对长期意味着什么"',
      evening: '记录今天你想到的任何未来可能性',
    },
    energyTips: {
      chargeWhen: '当你能够为未来描绘图景时',
      restWhen: '当你被迫只关注眼前琐事时',
    },
  },
  learner: {
    whatItMeans: '你热爱学习的过程，比起结果，你更享受"从不懂到懂"的旅程。',
    bestScenarios: [
      '需要持续学习新知识的工作',
      '研究和探索性项目',
      '技能培训和知识传播',
    ],
    dailyPractice: {
      morning: '问自己"今天我想学到什么"',
      working: '在工作中，主动承担需要学习新技能的任务',
      evening: '记录今天学到的一件事，哪怕很小',
    },
    energyTips: {
      chargeWhen: '当你学习新东西，感到"我又懂了"时',
      restWhen: '当你重复做同样的事，没有新东西时',
    },
  },
  ideation: {
    whatItMeans: '你被想法吸引，总是在寻找新的可能性。创新是你的燃料，常规是毒药。',
    bestScenarios: [
      '创意和内容生产',
      '产品创新和设计',
      '头脑风暴和方案生成',
    ],
    dailyPractice: {
      morning: '花 5 分钟记录任何冒出来的想法',
      working: '在会议中，主动提出"有没有其他可能性"',
      evening: '回顾今天产生的想法，记录有趣的',
    },
    energyTips: {
      chargeWhen: '当你产生新想法时',
      restWhen: '当你被迫做重复性工作时',
    },
  },
  input: {
    whatItMeans: '你喜欢收集和整理信息，你的世界是由有趣的输入构成的。知识就是安全感。',
    bestScenarios: [
      '信息收集和知识管理',
      '研究和调研工作',
      '需要广泛知识库的咨询',
    ],
    dailyPractice: {
      morning: '花 15 分钟阅读或收集与你今天任务相关的信息',
      working: '在工作中，建立你的知识库，把信息整理好',
      evening: '记录今天收集到的有趣信息',
    },
    energyTips: {
      chargeWhen: '当你收集到新信息并整理好时',
      restWhen: '当你需要在信息不足的情况下做决定时',
    },
  },
  intellection: {
    whatItMeans: '你享受深度思考，喜欢和自己的思想对话。独处是你的充电时间。',
    bestScenarios: [
      '需要深度思考的复杂问题',
      '独立研究和分析',
      '概念设计和理论构建',
    ],
    dailyPractice: {
      morning: '留出 30 分钟独处和思考，不受打扰',
      working: '在工作中，给自己留出"思考时间"，不是所有时间都在做',
      evening: '花 15 分钟回顾今天的想法，整理思绪',
    },
    energyTips: {
      chargeWhen: '当你有充足时间深度思考时',
      restWhen: '当你被迫不断社交，没有独处时间时',
    },
  },
  context: {
    whatItMeans: '你通过回顾历史来理解当下，过去的故事能告诉你未来的方向。',
    bestScenarios: [
      '需要历史视角的决策',
      '经验教训总结',
      '基于过往模式预测未来',
    ],
    dailyPractice: {
      morning: '问自己"过去有没有类似的情况"',
      working: '在做决定前，研究过去的相关案例',
      evening: '记录今天从过去学到的经验',
    },
    energyTips: {
      chargeWhen: '当历史经验帮助你理解当下时',
      restWhen: '当你被迫在没有历史参考的情况下行动时',
    },
  },
};

/**
 * 获取单个优势的指南内容
 */
function getStrengthGuideContent(strengthId: string): StrengthGuideContent {
  return (
    STRENGTH_GUIDE_CONTENT[strengthId] || {
      whatItMeans: '这个优势帮助你以独特的方式看待世界，让你在某些场景下格外出色。',
      bestScenarios: [
        '需要这种优势特长的场合',
        '能够发挥你独特视角的场景',
        '与这个优势高度匹配的工作',
      ],
      dailyPractice: {
        morning: '每天开始时，问自己如何用这个优势做好今天的事',
        working: '在工作中主动寻找使用这个优势的机会',
        evening: '反思今天你是如何用到这个优势的',
      },
      energyTips: {
        chargeWhen: '当你能够充分发挥这个优势时',
        restWhen: '当环境不允许你使用这个优势时',
      },
    }
  );
}

// ============================================================
// 个人化标签生成器
// ============================================================

/**
 * 优势组合标签库
 */
const PERSONAL_LABELS = {
  '执行力主导': [
    '坚定执行者',
    '高效推动者',
    '可靠落实者',
    '持续达成者',
  ],
  '影响力主导': [
    '能量传播者',
    '观点引领者',
    '改变推动者',
    '共识凝聚者',
  ],
  '关系建立主导': [
    '深度连接者',
    '信任构建者',
    '和谐共创者',
    '成长见证者',
  ],
  '战略思维主导': [
    '前瞻规划者',
    '洞察分析者',
    '创新构想者',
    '智慧导航者',
  ],
  '执行+影响': [
    '果敢推进者',
    '能量领袖',
    '有力推动者',
    '目标达成者',
  ],
  '执行+关系': [
    '稳健支撑者',
    '团队磐石',
    '可靠伙伴',
    '温暖执行者',
  ],
  '执行+战略': [
    '战略执行者',
    '系统构建者',
    '规划落地者',
    '远见实干家',
  ],
  '影响+关系': [
    '感召连接者',
    '共鸣领导者',
    '魅力协调者',
    '温度影响力',
  ],
  '影响+战略': [
    '愿景引领者',
    '前瞻说服者',
    '战略布道者',
    '方向导航者',
  ],
  '关系+战略': [
    '智慧洞察者',
    '深度理解者',
    '共情分析师',
    '意义探索者',
  ],
  '四域均衡': [
    '整合推动者',
    '全面协作者',
    '多维实现者',
    '平衡发展者',
  ],
};

/**
 * 根据优势组合生成个人化标签
 */
function generatePersonalLabel(strengthIds: string[]): { label: string; basedOn: string[]; meaning: string } {
  const strengths = strengthIds
    .map((id) => getStrengthById(id as StrengthId))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  if (strengths.length === 0) {
    return {
      label: '待探索者',
      basedOn: [],
      meaning: '你的优势组合正在等待被发现',
    };
  }

  // 统计各领域分布
  const domainCount = {
    executing: 0,
    influencing: 0,
    relationship: 0,
    strategic: 0,
  };

  strengths.forEach((s) => {
    domainCount[s.domain]++;
  });

  // 判断主导领域
  const maxCount = Math.max(...Object.values(domainCount));
  const dominantDomains = Object.entries(domainCount)
    .filter(([_, count]) => count === maxCount)
    .map(([domain, _]) => domain);

  let labelKey: keyof typeof PERSONAL_LABELS = '四域均衡';
  if (dominantDomains.length === 1) {
    const domain = dominantDomains[0];
    const domainNames: Record<string, string> = {
      executing: '执行力',
      influencing: '影响力',
      relationship: '关系建立',
      strategic: '战略思维',
    };
    const tempKey = domainNames[domain] + '主导';
    labelKey = (tempKey in PERSONAL_LABELS ? tempKey : '四域均衡') as keyof typeof PERSONAL_LABELS;
  } else if (dominantDomains.length === 2) {
    const domainNames: Record<string, string> = {
      executing: '执行',
      influencing: '影响',
      relationship: '关系',
      strategic: '战略',
    };
    const tempKey = dominantDomains
      .sort()
      .map((d) => domainNames[d])
      .join('+');
    labelKey = (tempKey in PERSONAL_LABELS ? tempKey : '四域均衡') as keyof typeof PERSONAL_LABELS;
  }

  const labels = PERSONAL_LABELS[labelKey] || PERSONAL_LABELS['四域均衡'];
  const label = labels[Math.floor(Math.random() * labels.length)];

  return {
    label,
    basedOn: strengths.map((s) => s.name),
    meaning: generateLabelMeaning(strengths, domainCount),
  };
}

/**
 * 生成标签含义说明
 */
function generateLabelMeaning(
  strengths: NonNullable<ReturnType<typeof getStrengthById>>[],
  domainCount: Record<string, number>
): string {
  const topStrengths = strengths.slice(0, 3).map((s) => s.name);
  const domains = Object.entries(domainCount)
    .filter(([_, count]) => count > 0)
    .map(([domain, _count]) => {
      const domainNames: Record<string, string> = {
        executing: '执行力',
        influencing: '影响力',
        relationship: '关系建立',
        strategic: '战略思维',
      };
      return domainNames[domain];
    });

  if (domains.length === 1) {
    return `你拥有强大的${domains[0]}优势，特别是${topStrengths.join('、')}，这让你在相关领域如鱼得水。`;
  } else if (domains.length === 2) {
    return `你的${domains[0]}和${domains[1]}优势都很突出，${topStrengths.join('、')}的结合让你能够用独特的方式推动事情。`;
  } else {
    return `你的优势分布较为均衡，${topStrengths.join('、')}等多个优势共同作用，形成了一个多面且协调的整体。`;
  }
}

// ============================================================
// 一句话总结生成器
// ============================================================

/**
 * 生成一句话总结
 */
function generateOneLiner(strengthIds: string[]): string {
  const strengths = strengthIds
    .map((id) => getStrengthById(id as StrengthId))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  if (strengths.length === 0) {
    return '你的优势组合正在等待被发现。';
  }

  const topStrength = strengths[0];
  const templates = [
    `你是一个用${topStrength.name}来定义和推动目标的人。`,
    `你的核心能量来自于${topStrength.name}，这让你在关键时刻能够挺身而出。`,
    `本质上，你是一个依靠${topStrength.name}来创造价值的人。`,
    `你用${topStrength.name}看待世界，用它来解决问题和建立连接。`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

// ============================================================
// 优势组合建议生成器
// ============================================================

/**
 * 生成协同组合建议
 */
function generateSynergyPairs(strengthIds: string[]): Array<{ strengths: [string, string]; howToUse: string }> {
  const pairs: Array<{ strengths: [string, string]; howToUse: string }> = [];
  const names: string[] = strengthIds
    .map((id) => getStrengthById(id as StrengthId)?.name)
    .filter((n): n is NonNullable<typeof n> => n !== undefined);

  if (names.length < 2) return pairs;

  const baseTemplates = [
    '当${first}推动方向、${second}负责落地时，你会更快看到结果。',
    '把${first}当作引擎，用${second}把想法落地。',
    '先用${first}厘清目标，再用${second}推进执行。',
    '让${first}负责洞察，让${second}负责连接与扩散。',
    '用${first}打底，${second}负责把成果呈现出来。',
    '在关键节点先启动${first}，再用${second}把节奏稳住。',
    '当${first}与${second}同频时，你能同时兼顾方向与推进。',
    '用${first}设定优先级，让${second}成为推进器。',
  ];
  const tailTemplates = [
    '建议用“${first} → ${second}”的顺序启动任务。',
    '可以在开局用${first}定方向，落地环节交给${second}。',
    '试着把${second}放在最后一步，帮助你把${first}的想法转成行动。',
    '把${first}当作问题定义器，${second}当作解决推进器。',
    '在团队协作里，让${first}输出框架，${second}推动共识。',
    '日常节奏上，先用${first}做判断，再让${second}把事情推进。',
  ];

  const hashString = (value: string): number => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
  };

  // 生成所有可能的组合（最多 3 对）
  for (let i = 0; i < Math.min(names.length - 1, 3); i++) {
    const first = names[i];
    const second = names[i + 1];
    if (!first || !second) continue;

    const seed = `${first}:${second}:${i}`;
    const baseIndex = hashString(`${seed}:base`) % baseTemplates.length;
    const tailIndex = hashString(`${seed}:tail`) % tailTemplates.length;
    const template = `${baseTemplates[baseIndex]}${tailTemplates[tailIndex]}`;
    pairs.push({
      strengths: [first, second],
      howToUse: template.replace(/\$\{first\}/g, first).replace(/\$\{second\}/g, second),
    });
  }

  return pairs;
}

/**
 * 生成需要平衡的组合建议
 */
function generateTensionPairs(strengthIds: string[]): Array<{ strengths: [string, string]; howToBalance: string }> {
  const pairs: Array<{ strengths: [string, string]; howToBalance: string }> = [];
  const strengths = strengthIds
    .map((id) => getStrengthById(id as StrengthId))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  if (strengths.length < 2) return pairs;

  // 找出可能存在张力的跨领域组合
  const executing = strengths.filter((s) => s.domain === 'executing').map((s) => s.name);
  const strategic = strengths.filter((s) => s.domain === 'strategic').map((s) => s.name);
  const influencing = strengths.filter((s) => s.domain === 'influencing').map((s) => s.name);
  const relationship = strengths.filter((s) => s.domain === 'relationship').map((s) => s.name);

  // 执行力 vs 战略思维
  if (executing.length > 0 && strategic.length > 0) {
    pairs.push({
      strengths: [executing[0], strategic[0]],
      howToBalance: `${executing[0]}让你想立刻行动，${strategic[0]}让你想充分思考。平衡的关键是：用${strategic[0]}做好规划，然后用${executing[0]}坚定执行。`,
    });
  }

  // 影响力 vs 关系建立
  if (influencing.length > 0 && relationship.length > 0) {
    pairs.push({
      strengths: [influencing[0], relationship[0]],
      howToBalance: `${influencing[0]}让你想要被看到，${relationship[0]}让你想要深度连接。平衡的关键是：用${relationship[0]}建立信任，然后用${influencing[0]}扩大影响。`,
    });
  }

  return pairs;
}

// ============================================================
// 本周行动建议生成器
// ============================================================

/**
 * 生成本周行动建议
 */
function generateWeeklyActions(strengthIds: string[]): WeeklyAction[] {
  const actions: WeeklyAction[] = [];
  const strengths = strengthIds
    .map((id) => getStrengthById(id as StrengthId))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  if (strengths.length === 0) return actions;

  const actionTemplates = [
    { day: '周一', action: '用 {strength} 开启一周，制定一个本周目标', strengthUsed: '' },
    { day: '周二', action: '在工作中找一个机会使用 {strength}', strengthUsed: '' },
    { day: '周三', action: '用 {strength} 解决一个问题', strengthUsed: '' },
    { day: '周四', action: '和同事分享你的 {strength} 带来的洞察', strengthUsed: '' },
    { day: '周五', action: '用 {strength} 回顾本周的进展', strengthUsed: '' },
    { day: '周六', action: '在生活中发挥你的 {strength}', strengthUsed: '' },
    { day: '周日', action: '休息时思考如何让 {strength} 下周用得更好', strengthUsed: '' },
  ];

  // 循环使用优势填入模板
  actionTemplates.forEach((template, index) => {
    const strength = strengths[index % strengths.length];
    actions.push({
      day: template.day,
      action: template.action.replace('{strength}', strength.name),
      strengthUsed: strength.name,
    });
  });

  return actions;
}

// ============================================================
// 主函数：生成优势发挥指南
// ============================================================

/**
 * 生成优势发挥指南 Mock 数据
 * @param strengthIds 用户选择的 TOP5 优势 ID 列表
 * @returns 优势发挥指南结果
 */
export function generateMockGuideResult(strengthIds: string[]): StrengthGuideResult {
  // 生成单个优势指南
  const strengthGuides: StrengthGuide[] = strengthIds.map((id) => {
    const strength = getStrengthById(id as StrengthId);
    const content = getStrengthGuideContent(id);

    return {
      strengthId: id,
      strengthName: strength?.name ?? id,
      domain: strength?.domain ?? 'executing',
      whatItMeans: content.whatItMeans,
      bestScenarios: content.bestScenarios,
      dailyPractice: content.dailyPractice,
      energyTips: content.energyTips,
    };
  });

  // 生成组合建议
  const comboGuide: ComboGuide = {
    synergyPairs: generateSynergyPairs(strengthIds),
    tensionPairs: generateTensionPairs(strengthIds),
  };

  // 生成个人化标签
  const personalLabel = generatePersonalLabel(strengthIds);

  // 生成一句话总结
  const oneLiner = generateOneLiner(strengthIds);

  // 生成本周行动
  const weeklyActions = generateWeeklyActions(strengthIds);

  return {
    personalLabel,
    oneLiner,
    strengthGuides,
    comboGuide,
    weeklyActions,
  };
}
