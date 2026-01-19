/**
 * 组合规则多语言版本 (Combo Rules - Internationalized)
 *
 * 定义优势组合的协同效应、盲区、冲突和纠偏建议
 * 支持中文和英文两种语言
 *
 * 每条规则的效应和纠偏建议都用 Record<Locale, string> 形式存储
 * 确保无论查询哪种语言，都能获得一致的数据结构
 */

import { StrengthId } from '@/lib/gallup-strengths';
import { Locale } from '@/i18n/config';

// ============================================================================
// 多语言类型定义
// ============================================================================

/**
 * 多语言字符串映射
 * 用于在combo rule中存储双语文本
 */
type I18nString = Record<Locale, string>;

/**
 * 组合规则类型
 */
export type ComboType =
  | 'amplify'   // 放大效应：优势组合产生 1+1>2 的效果
  | 'blindspot' // 盲区：组合导致的共同盲点
  | 'conflict'  // 冲突：优势之间的内在矛盾
  | 'trap';     // 陷阱：组合容易掉入的模式

/**
 * 多语言组合规则
 */
export interface I18nComboRule {
  id: string;
  trigger: {
    requires: StrengthId[];             // 必须包含的优势（AND 关系）
    requiresAny?: StrengthId[];         // 至少包含其一（OR 关系）
    excludes?: StrengthId[];            // 不能包含的优势
  };
  type: ComboType;
  weight: number;                       // 权重（1-10），用于排序

  // 效应描述（多语言）
  effectNameI18n: I18nString;           // 效应名称
  effectDescriptionI18n: I18nString;    // 效应描述
  symptomI18n: I18nString;              // 典型症状

  // 纠偏建议（多语言）
  insightI18n: I18nString;              // 洞察
  actionI18n: I18nString;               // 行动建议
  boundaryI18n: I18nString;             // 边界设定
}

/**
 * 多语言组合效应（匹配后的合并结果）
 */
export interface I18nComboEffect {
  amplifications: Array<{
    nameI18n: I18nString;
    descriptionI18n: I18nString;
    weight: number;
  }>;

  blindspots: Array<{
    nameI18n: I18nString;
    symptomI18n: I18nString;
    weight: number;
  }>;

  conflicts: Array<{
    nameI18n: I18nString;
    descriptionI18n: I18nString;
    weight: number;
  }>;

  traps: Array<{
    nameI18n: I18nString;
    symptomI18n: I18nString;
    weight: number;
  }>;

  corrections: Array<{
    insightI18n: I18nString;
    actionI18n: I18nString;
    boundaryI18n: I18nString;
    weight: number;
  }>;
}

// ============================================================================
// 多语言组合规则数据
// ============================================================================

export const I18N_COMBO_RULES: I18nComboRule[] = [
  // ========== 责任相关组合 ==========

  {
    id: 'responsibility-harmony-trap',
    trigger: {
      requires: ['responsibility', 'harmony'],
    },
    type: 'trap',
    weight: 9,
    effectNameI18n: { zh: '无限承担循环', en: 'Infinite Assumption Cycle' },
    effectDescriptionI18n: { zh: '责任让你接住所有事，和谐让你无法拒绝', en: 'Responsibility makes you catch everything, harmony prevents you from saying no' },
    symptomI18n: { zh: '事情越来越多，但从来不说"不"', en: 'More and more tasks, but never say "no"' },
    insightI18n: { zh: '你的"责任+和谐"组合在制造一个陷阱：为了避免冲突而承担一切', en: 'Your "responsibility + harmony" creates a trap: assume everything to avoid conflict' },
    actionI18n: { zh: '用和谐的方式设计"温和拒绝"话术，而不是用责任接住所有', en: 'Design "gentle refusal" scripts using harmony, not catching everything with responsibility' },
    boundaryI18n: { zh: '负责你选定的事，不负责所有人的期待', en: 'Responsible for your chosen tasks, not everyone\'s expectations' },
  },

  {
    id: 'responsibility-empathy-trap',
    trigger: {
      requires: ['responsibility', 'empathy'],
    },
    type: 'trap',
    weight: 8,
    effectNameI18n: { zh: '情绪代偿模式', en: 'Emotional Compensation Pattern' },
    effectDescriptionI18n: { zh: '体谅让你感受到他人的需求，责任让你觉得必须承担', en: 'Empathy makes you sense others\' needs, responsibility makes you feel obligated' },
    symptomI18n: { zh: '看到别人的困难就觉得"我应该帮"', en: 'See others\' difficulties and think "I should help"' },
    insightI18n: { zh: '你的体谅在接收信号，责任在强制响应——但不是所有信号都需要你响应', en: 'Your empathy receives signals, responsibility forces response—but not all signals need your response' },
    actionI18n: { zh: '在感受到他人需求时，先问"这是我的责任吗"', en: 'When sensing others\' needs, first ask "is this my responsibility?"' },
    boundaryI18n: { zh: '负责自己的承诺，不负责他人的情绪', en: 'Responsible for your promises, not others\' emotions' },
  },

  {
    id: 'responsibility-achiever-amplify',
    trigger: {
      requires: ['responsibility', 'achiever'],
    },
    type: 'amplify',
    weight: 7,
    effectNameI18n: { zh: '可靠执行力', en: 'Reliable Execution Power' },
    effectDescriptionI18n: { zh: '责任让你承诺，成就让你完成，组合产生强大的执行力', en: 'Responsibility makes you commit, achiever makes you complete, combination creates powerful execution' },
    symptomI18n: { zh: '说到做到，产出稳定', en: 'Follow through on promises, consistent output' },
    insightI18n: { zh: '你的执行力很强，但要警惕"永不停歇"的陷阱', en: 'Your execution is strong, but beware the "never stop" trap' },
    actionI18n: { zh: '为自己设定"今日完成"的明确边界', en: 'Set clear "today\'s completion" boundaries for yourself' },
    boundaryI18n: { zh: '负责今天选定的任务，不负责"所有能做的事"', en: 'Responsible for today\'s chosen tasks, not "everything you could do"' },
  },

  {
    id: 'responsibility-focus-amplify',
    trigger: {
      requires: ['responsibility', 'focus'],
    },
    type: 'amplify',
    weight: 8,
    effectNameI18n: { zh: '深度承诺能力', en: 'Deep Commitment Ability' },
    effectDescriptionI18n: { zh: '责任让你承担，专注让你深入，组合产生强大的单点突破力', en: 'Responsibility makes you assume, focus makes you dive deep, combination creates powerful single-point breakthrough' },
    symptomI18n: { zh: '在一件事上做到极致', en: 'Take one thing to perfection' },
    insightI18n: { zh: '你的组合适合"少而精"，不适合"多而全"', en: 'Your combination suits "few and focused", not "many and broad"' },
    actionI18n: { zh: '主动收缩战场，只承担最重要的1-2件事', en: 'Actively shrink scope, assume only 1-2 most important things' },
    boundaryI18n: { zh: '负责你专注的事，不负责所有"看起来重要"的事', en: 'Responsible for your focused work, not everything that "looks important"' },
  },

  // ========== 和谐相关组合 ==========

  {
    id: 'harmony-empathy-blindspot',
    trigger: {
      requires: ['harmony', 'empathy'],
    },
    type: 'blindspot',
    weight: 8,
    effectNameI18n: { zh: '冲突回避盲区', en: 'Conflict Avoidance Blindspot' },
    effectDescriptionI18n: { zh: '体谅让你感受对方不适，和谐让你避免制造不适', en: 'Empathy makes you sense discomfort, harmony makes you avoid causing it' },
    symptomI18n: { zh: '明知道该说"不"，但总是说"好"', en: 'Know you should say "no", but always say "yes"' },
    insightI18n: { zh: '你的组合让你非常擅长感知氛围，但也让你无法"破坏"氛围', en: 'Your combination makes you great at sensing atmosphere, but unable to "disrupt" it' },
    actionI18n: { zh: '设计"温和但清晰"的拒绝方式', en: 'Design "gentle but clear" refusal methods' },
    boundaryI18n: { zh: '负责表达真实立场，不负责对方的情绪反应', en: 'Responsible for expressing true position, not others\' emotional reactions' },
  },

  {
    id: 'harmony-include-blindspot',
    trigger: {
      requires: ['harmony', 'include'],
    },
    type: 'blindspot',
    weight: 7,
    effectNameI18n: { zh: '无边界包容', en: 'Boundless Inclusion' },
    effectDescriptionI18n: { zh: '包容让你接纳所有人，和谐让你无法设立门槛', en: 'Includer makes you accept everyone, harmony prevents you from setting standards' },
    symptomI18n: { zh: '团队里混入不合适的人，但你无法开口', en: 'Unsuitable people enter team, but you can\'t speak up' },
    insightI18n: { zh: '你的组合让你成为很好的调解者，但也让你无法扮演"把关人"', en: 'Your combination makes you good at mediation, but unable to be a "gatekeeper"' },
    actionI18n: { zh: '区分"参与者"和"核心成员"，对后者设立标准', en: 'Distinguish "participants" from "core members", set standards for the latter' },
    boundaryI18n: { zh: '负责创造包容的氛围，不负责让所有人都进入核心圈', en: 'Responsible for creating inclusive atmosphere, not bringing everyone into core' },
  },

  {
    id: 'harmony-command-conflict',
    trigger: {
      requires: ['harmony', 'command'],
    },
    type: 'conflict',
    weight: 9,
    effectNameI18n: { zh: '控制与和谐的撕裂', en: 'Control-Harmony Tension' },
    effectDescriptionI18n: { zh: '统率想要掌控，和谐想要避免冲突，两者在决策时撕裂', en: 'Command wants control, harmony wants to avoid conflict, they tear apart during decisions' },
    symptomI18n: { zh: '内心想主导，但又怕破坏关系', en: 'Want to lead internally, but fear damaging relationships' },
    insightI18n: { zh: '你需要区分"需要统率的场景"和"需要和谐的场景"', en: 'You need to distinguish "scenarios needing command" from "scenarios needing harmony"' },
    actionI18n: { zh: '在危机/决策时用统率，在日常协作时用和谐', en: 'Use command in crisis/decisions, use harmony in daily collaboration' },
    boundaryI18n: { zh: '负责在关键时刻做决定，不负责让每个决定都让所有人舒服', en: 'Responsible for deciding at critical moments, not making every decision comfortable for everyone' },
  },

  // ========== 搜集/分析相关组合 ==========

  {
    id: 'input-analytical-trap',
    trigger: {
      requires: ['input', 'analytical'],
    },
    type: 'trap',
    weight: 9,
    effectNameI18n: { zh: '信息黑洞', en: 'Information Black Hole' },
    effectDescriptionI18n: { zh: '搜集让你不断收集，分析让你觉得"还不够"，永远无法决策', en: 'Input makes you collect continuously, analytical makes you feel "never enough", unable to decide' },
    symptomI18n: { zh: '收集了很多资料，但迟迟无法行动', en: 'Collected lots of materials, but unable to act' },
    insightI18n: { zh: '你的组合让你成为优秀的研究者，但也让你陷入"永远在准备"', en: 'Your combination makes you excellent researcher, but trapped in "always preparing"' },
    actionI18n: { zh: '设定明确的"信息截止点"：收集到X就必须决策', en: 'Set clear "information cutoff": must decide when reaching X' },
    boundaryI18n: { zh: '负责做出当前最优判断，不负责找到"完美答案"', en: 'Responsible for current best judgment, not finding "perfect answer"' },
  },

  {
    id: 'input-learner-trap',
    trigger: {
      requires: ['input', 'learner'],
    },
    type: 'trap',
    weight: 8,
    effectNameI18n: { zh: '知识囤积症', en: 'Knowledge Hoarding' },
    effectDescriptionI18n: { zh: '搜集让你收集，学习让你觉得"还要学"，永远在输入', en: 'Input makes you collect, learner makes you feel "need more", always inputting' },
    symptomI18n: { zh: '学了很多，但从来没有输出', en: 'Learned a lot, but never output' },
    insightI18n: { zh: '你的组合非常擅长输入，但需要强制设定"输出节点"', en: 'Your combination excellent at input, but need to force "output checkpoints"' },
    actionI18n: { zh: '用"学3用1"原则：每学3个单位，必须输出1个单位', en: 'Use "learn 3, output 1" rule: for every 3 units learned, output 1 unit' },
    boundaryI18n: { zh: '负责持续学习，但也负责定期输出', en: 'Responsible for continuous learning, also for regular output' },
  },

  {
    id: 'input-strategic-amplify',
    trigger: {
      requires: ['input', 'strategic'],
    },
    type: 'amplify',
    weight: 7,
    effectNameI18n: { zh: '信息战略家', en: 'Information Strategist' },
    effectDescriptionI18n: { zh: '搜集提供素材，战略找到路径，组合产生强大的规划能力', en: 'Input provides materials, strategic finds path, combination creates powerful planning' },
    symptomI18n: { zh: '能快速整合信息并找到最优路径', en: 'Quickly integrate information and find optimal path' },
    insightI18n: { zh: '你的规划能力很强，但要警惕"一直在规划"的陷阱', en: 'Your planning strong, but beware "always planning" trap' },
    actionI18n: { zh: '设定"规划截止点"：方案够用就开始执行', en: 'Set "planning deadline": start executing when plan is good enough' },
    boundaryI18n: { zh: '负责找到可行路径，不负责找到"完美路径"', en: 'Responsible for finding workable path, not "perfect path"' },
  },

  // ========== 专注相关组合 ==========

  {
    id: 'focus-achiever-trap',
    trigger: {
      requires: ['focus', 'achiever'],
    },
    type: 'trap',
    weight: 7,
    effectNameI18n: { zh: '隧道视野陷阱', en: 'Tunnel Vision Trap' },
    effectDescriptionI18n: { zh: '专注让你只看一件事，成就让你不断推进，可能错过全局', en: 'Focus makes you see one thing, achiever keeps pushing, may miss big picture' },
    symptomI18n: { zh: '在一件事上很努力，但发现方向错了', en: 'Work hard on one thing, then discover direction was wrong' },
    insightI18n: { zh: '你的组合适合执行明确的任务，但需要定期"抬头看路"', en: 'Your combination good for executing clear tasks, but need regular "look up"' },
    actionI18n: { zh: '每周设定一次"方向检查点"：这件事还值得专注吗？', en: 'Set weekly "direction checkpoint": is this still worth focusing on?' },
    boundaryI18n: { zh: '负责在选定的方向上深入，也负责定期验证方向', en: 'Responsible for going deep in chosen direction, also for validating it regularly' },
  },

  {
    id: 'focus-arranger-conflict',
    trigger: {
      requires: ['focus', 'arranger'],
    },
    type: 'conflict',
    weight: 8,
    effectNameI18n: { zh: '专注与统筹的撕裂', en: 'Focus-Coordination Tension' },
    effectDescriptionI18n: { zh: '专注想要锁定一件事，统筹想要协调多件事，两者冲突', en: 'Focus wants one thing locked, arranger wants many coordinated, conflict' },
    symptomI18n: { zh: '既想深入又想全局，两边都做不好', en: 'Want both depth and overview, neither works well' },
    insightI18n: { zh: '你需要区分"专注时段"和"统筹时段"', en: 'You need to distinguish "focus periods" from "coordination periods"' },
    actionI18n: { zh: '上午专注执行，下午统筹协调；不要混在一起', en: 'Morning focus on execution, afternoon on coordination; don\'t mix' },
    boundaryI18n: { zh: '负责在专注时排除干扰，在统筹时放开视野', en: 'Responsible for blocking distractions during focus, broadening during coordination' },
  },

  // ========== 战略相关组合 ==========

  {
    id: 'strategic-activator-amplify',
    trigger: {
      requires: ['strategic', 'activator'],
    },
    type: 'amplify',
    weight: 9,
    effectNameI18n: { zh: '快速决策执行力', en: 'Fast Decision-Execution Power' },
    effectDescriptionI18n: { zh: '战略找到路径，行动立即启动，组合产生强大的推进力', en: 'Strategic finds path, activator starts immediately, combination creates powerful momentum' },
    symptomI18n: { zh: '看到机会就能快速行动', en: 'See opportunity and quickly act' },
    insightI18n: { zh: '你的组合非常高效，但要警惕"方向错误的快速行动"', en: 'Your combination very efficient, but beware "fast action in wrong direction"' },
    actionI18n: { zh: '行动前用5分钟确认：这是战略最优路径吗？', en: 'Before acting, spend 5 minutes confirming: is this strategically optimal?' },
    boundaryI18n: { zh: '负责快速行动，也负责确保方向正确', en: 'Responsible for fast action, also for ensuring right direction' },
  },

  {
    id: 'strategic-deliberative-conflict',
    trigger: {
      requires: ['strategic', 'deliberative'],
    },
    type: 'conflict',
    weight: 7,
    effectNameI18n: { zh: '冒险与审慎的撕裂', en: 'Risk-Caution Tension' },
    effectDescriptionI18n: { zh: '战略想要选择最优路径（可能有风险），审慎想要规避风险', en: 'Strategic wants optimal path (maybe risky), deliberative wants to avoid risk' },
    symptomI18n: { zh: '看到机会但又担心风险，难以决策', en: 'See opportunity but worry about risk, hard to decide' },
    insightI18n: { zh: '用审慎排除"不可接受的风险"，用战略在"可接受风险"中选择最优', en: 'Use caution to exclude "unacceptable risks", use strategy to choose optimal within "acceptable risks"' },
    actionI18n: { zh: '先列出"绝对不能冒的风险"，然后在安全范围内用战略选择', en: 'First list "risks we cannot take", then use strategy to choose within safe range' },
    boundaryI18n: { zh: '负责做出有风险但可控的决策，不负责找到零风险方案', en: 'Responsible for risky but controlled decisions, not zero-risk solutions' },
  },

  {
    id: 'strategic-futuristic-amplify',
    trigger: {
      requires: ['strategic', 'futuristic'],
    },
    type: 'amplify',
    weight: 8,
    effectNameI18n: { zh: '愿景路径规划', en: 'Vision Path Planning' },
    effectDescriptionI18n: { zh: '前瞻看到终点，战略找到路径，组合产生强大的规划能力', en: 'Futuristic sees endpoint, strategic finds path, combination creates powerful planning' },
    symptomI18n: { zh: '能把远大愿景拆解成可执行的步骤', en: 'Can break down grand vision into executable steps' },
    insightI18n: { zh: '你的规划能力很强，但要警惕"只在规划，不在执行"', en: 'Your planning strong, but beware "only planning, not executing"' },
    actionI18n: { zh: '每个愿景必须落地为"今天的第一步"', en: 'Every vision must become "today\'s first step"' },
    boundaryI18n: { zh: '负责规划愿景路径，也负责启动第一步', en: 'Responsible for planning vision path, also for starting first step' },
  },

  // ========== 执行力组合 ==========

  {
    id: 'achiever-discipline-amplify',
    trigger: {
      requires: ['achiever', 'discipline'],
    },
    type: 'amplify',
    weight: 8,
    effectNameI18n: { zh: '稳定高产出', en: 'Stable High Output' },
    effectDescriptionI18n: { zh: '成就驱动产出，纪律保证稳定，组合产生持续的高效执行', en: 'Achiever drives output, discipline ensures stability, combination creates sustained high efficiency' },
    symptomI18n: { zh: '每天都能完成大量工作，且保持一致', en: 'Complete lots of work daily and maintain consistency' },
    insightI18n: { zh: '你的执行力非常稳定，但要警惕"没有休息"的陷阱', en: 'Your execution very stable, but beware "no rest" trap' },
    actionI18n: { zh: '在纪律中加入"休息时段"，把恢复当作任务的一部分', en: 'Add "rest periods" to discipline, treat recovery as part of work' },
    boundaryI18n: { zh: '负责高效执行，也负责可持续恢复', en: 'Responsible for efficient execution, also for sustainable recovery' },
  },

  {
    id: 'achiever-maximizer-trap',
    trigger: {
      requires: ['achiever', 'maximizer'],
    },
    type: 'trap',
    weight: 8,
    effectNameI18n: { zh: '永不满足循环', en: 'Never Satisfied Cycle' },
    effectDescriptionI18n: { zh: '成就让你想完成更多，完美让你觉得"还不够好"', en: 'Achiever wants more completion, maximizer feels "not good enough"' },
    symptomI18n: { zh: '做完了很多，但从来不觉得"够了"', en: 'Complete lots, but never feel "enough"' },
    insightI18n: { zh: '你的组合让你成为高产出者，但也让你永远不满足', en: 'Your combination makes you high producer, but always unsatisfied' },
    actionI18n: { zh: '每天设定"今日完成标准"，达到就停止', en: 'Set "today\'s completion standard" daily, stop when reached' },
    boundaryI18n: { zh: '负责今天的产出，不负责"做到完美"', en: 'Responsible for today\'s output, not for "perfect execution"' },
  },

  // ========== 影响力组合 ==========

  {
    id: 'command-competition-amplify',
    trigger: {
      requires: ['command', 'competition'],
    },
    type: 'amplify',
    weight: 7,
    effectNameI18n: { zh: '竞争型领导力', en: 'Competitive Leadership' },
    effectDescriptionI18n: { zh: '统率提供掌控力，竞争提供驱动力，组合产生强势领导风格', en: 'Command provides control, competition provides drive, combination creates forceful leadership' },
    symptomI18n: { zh: '在竞争环境中能带领团队赢', en: 'Can lead team to win in competitive environment' },
    insightI18n: { zh: '你的组合适合竞争环境，但在协作环境中可能显得过于强势', en: 'Your combination fits competitive, but may be too forceful in collaborative environment' },
    actionI18n: { zh: '区分"竞争场景"和"协作场景"，调整领导风格', en: 'Distinguish "competitive" from "collaborative" scenarios, adjust leadership style' },
    boundaryI18n: { zh: '负责在竞争中带领团队，不负责让每个人都舒服', en: 'Responsible for leading in competition, not making everyone comfortable' },
  },

  {
    id: 'woo-communication-amplify',
    trigger: {
      requires: ['woo', 'communication'],
    },
    type: 'amplify',
    weight: 7,
    effectNameI18n: { zh: '社交影响力', en: 'Social Influence' },
    effectDescriptionI18n: { zh: '取悦建立关系，沟通传递想法，组合产生强大的社交影响力', en: 'Woo builds relationships, communication conveys ideas, combination creates strong social influence' },
    symptomI18n: { zh: '能快速与人建立连接并影响他们', en: 'Quickly connect with people and influence them' },
    insightI18n: { zh: '你的社交能力很强，但要警惕"关系广而不深"', en: 'Your social strength strong, but beware "many but shallow relationships"' },
    actionI18n: { zh: '识别"关键关系"，在这些关系上投入更多深度', en: 'Identify "key relationships", invest more depth in them' },
    boundaryI18n: { zh: '负责建立影响力，也负责在关键关系上深耕', en: 'Responsible for building influence, also for deepening key relationships' },
  },

  {
    id: 'significance-maximizer-trap',
    trigger: {
      requires: ['significance', 'maximizer'],
    },
    type: 'trap',
    weight: 8,
    effectNameI18n: { zh: '认可饥渴症', en: 'Recognition Hunger' },
    effectDescriptionI18n: { zh: '追求让你需要认可，完美让你觉得"还不够好到被认可"', en: 'Significance makes you need recognition, maximizer makes you feel "not good enough"' },
    symptomI18n: { zh: '不断追求更大的成就来获得认可，但永远不满足', en: 'Pursue bigger achievements for recognition, but never satisfied' },
    insightI18n: { zh: '你的组合让你成为高成就者，但也让你依赖外部认可', en: 'Your combination makes you high achiever, but dependent on external recognition' },
    actionI18n: { zh: '建立"内在认可"标准：做到什么程度就是"够好"', en: 'Establish "internal recognition" standard: what level is "good enough"' },
    boundaryI18n: { zh: '负责追求卓越，但用内在标准而不是外部掌声来衡量', en: 'Responsible for pursuing excellence, but measure by internal standards not external applause' },
  },

  // ========== 关系建立组合 ==========

  {
    id: 'empathy-individualization-amplify',
    trigger: {
      requires: ['empathy', 'individualization'],
    },
    type: 'amplify',
    weight: 8,
    effectNameI18n: { zh: '个性化共情', en: 'Personalized Empathy' },
    effectDescriptionI18n: { zh: '体谅感受情绪，个别看到差异，组合产生深度的人际理解力', en: 'Empathy feels emotions, individualization sees differences, combination creates deep interpersonal understanding' },
    symptomI18n: { zh: '能精准理解每个人的独特需求', en: 'Precisely understand each person\'s unique needs' },
    insightI18n: { zh: '你的理解力很强，但要警惕"被每个人的需求淹没"', en: 'Your understanding strong, but beware "drowning in everyone\'s needs"' },
    actionI18n: { zh: '识别"必须响应"和"可以不响应"的需求', en: 'Distinguish "must respond to" from "can skip" needs' },
    boundaryI18n: { zh: '负责理解他人，不负责满足所有人的需求', en: 'Responsible for understanding others, not meeting everyone\'s needs' },
  },

  {
    id: 'relator-developer-amplify',
    trigger: {
      requires: ['relator', 'developer'],
    },
    type: 'amplify',
    weight: 7,
    effectNameI18n: { zh: '深度培养力', en: 'Deep Mentoring Power' },
    effectDescriptionI18n: { zh: '交往建立深度关系，伯乐看到潜力，组合产生强大的长期培养能力', en: 'Relator builds deep relationships, developer sees potential, combination creates powerful mentoring' },
    symptomI18n: { zh: '能与人建立深度连接并帮助他们成长', en: 'Build deep connections and help people grow' },
    insightI18n: { zh: '你的培养能力很强，但要选择"值得培养的人"', en: 'Your mentoring strong, but choose "people worth developing"' },
    actionI18n: { zh: '识别"有潜力且有意愿"的人，集中投入', en: 'Identify people with "potential and willingness", focus investment' },
    boundaryI18n: { zh: '负责深度培养，不负责让每个人都成长', en: 'Responsible for deep mentoring, not growing everyone' },
  },

  {
    id: 'positivity-harmony-blindspot',
    trigger: {
      requires: ['positivity', 'harmony'],
    },
    type: 'blindspot',
    weight: 7,
    effectNameI18n: { zh: '回避深度问题', en: 'Avoids Deep Issues' },
    effectDescriptionI18n: { zh: '积极想要保持正面，和谐想要避免冲突，组合让你难以面对真正的问题', en: 'Positivity wants to stay positive, harmony wants to avoid conflict, combination makes facing real problems hard' },
    symptomI18n: { zh: '用"积极态度"掩盖实际问题', en: 'Use "positive attitude" to mask actual problems' },
    insightI18n: { zh: '你的组合让你成为氛围制造者，但也让你难以面对负面现实', en: 'Your combination makes you atmosphere creator, but hard to face negative reality' },
    actionI18n: { zh: '允许自己和团队"暂时不积极"，面对真实问题', en: 'Allow yourself and team to be "temporarily unpositively", face real issues' },
    boundaryI18n: { zh: '负责营造积极氛围，也负责在必要时面对现实', en: 'Responsible for positive atmosphere, also for facing reality when needed' },
  },

  // ========== 三优势组合 ==========

  {
    id: 'responsibility-harmony-empathy-trap',
    trigger: {
      requires: ['responsibility', 'harmony', 'empathy'],
    },
    type: 'trap',
    weight: 10,
    effectNameI18n: { zh: '无边界照顾者', en: 'Boundless Caregiver' },
    effectDescriptionI18n: { zh: '体谅让你感受需求，和谐让你无法拒绝，责任让你必须承担——完美的自我消耗循环', en: 'Empathy senses needs, harmony prevents refusal, responsibility forces assumption—perfect self-depletion cycle' },
    symptomI18n: { zh: '所有人都来找你，你从来不说"不"，最后累垮自己', en: 'Everyone comes to you, you never say "no", finally burn yourself out' },
    insightI18n: { zh: '你的三个优势在共同制造一个"完美陷阱"：你太擅长感知和响应他人需求了', en: 'Your three strengths create "perfect trap": you\'re too good at sensing and responding to others\' needs' },
    actionI18n: { zh: '为自己设计"请求筛选器"：这是我必须承担的吗？', en: 'Design "request filter" for yourself: is this something I must assume?' },
    boundaryI18n: { zh: '负责你选定要帮助的人，不负责所有找到你的人', en: 'Responsible for people you choose to help, not everyone who finds you' },
  },

  {
    id: 'input-analytical-deliberative-trap',
    trigger: {
      requires: ['input', 'analytical', 'deliberative'],
    },
    type: 'trap',
    weight: 10,
    effectNameI18n: { zh: '决策瘫痪症', en: 'Decision Paralysis' },
    effectDescriptionI18n: { zh: '搜集让你继续收集，分析让你继续分析，审慎让你害怕风险——永远无法决策', en: 'Input keeps collecting, analytical keeps analyzing, deliberative fears risk—never decide' },
    symptomI18n: { zh: '准备了很久，分析了很多，但就是无法做决定', en: 'Prepared long, analyzed much, but just can\'t decide' },
    insightI18n: { zh: '你的三个优势都在"准备"，没有一个在"行动"', en: 'Your three strengths all in "preparation", none in "action"' },
    actionI18n: { zh: '设定"强制决策点"：到这个时间必须决定，不管信息是否完美', en: 'Set "forced decision point": must decide by this time, regardless of information quality' },
    boundaryI18n: { zh: '负责做出当前最优决策，不负责找到"零风险的完美决策"', en: 'Responsible for current best decision, not finding "zero-risk perfect decision"' },
  },

  {
    id: 'strategic-futuristic-ideation-trap',
    trigger: {
      requires: ['strategic', 'futuristic', 'ideation'],
    },
    type: 'trap',
    weight: 9,
    effectNameI18n: { zh: '永远在规划', en: 'Always Planning' },
    effectDescriptionI18n: { zh: '理念产生想法，前瞻看到愿景，战略规划路径——但没有一个在执行', en: 'Ideation generates ideas, futuristic sees vision, strategic plans path—but none executing' },
    symptomI18n: { zh: '有很多精彩的想法和规划，但实际产出很少', en: 'Many great ideas and plans, but little actual output' },
    insightI18n: { zh: '你的三个优势都在"想"，需要借力于行动类优势', en: 'Your three strengths all in "thinking", need help from action strengths' },
    actionI18n: { zh: '每个想法必须在24小时内落地为一个最小行动', en: 'Every idea must become minimum action within 24 hours' },
    boundaryI18n: { zh: '负责产生想法，也负责让想法变成行动', en: 'Responsible for generating ideas, also for turning them to action' },
  },

  {
    id: 'achiever-focus-discipline-amplify',
    trigger: {
      requires: ['achiever', 'focus', 'discipline'],
    },
    type: 'amplify',
    weight: 9,
    effectNameI18n: { zh: '执行机器', en: 'Execution Machine' },
    effectDescriptionI18n: { zh: '专注锁定目标，纪律保证稳定，成就驱动完成——强大的执行力组合', en: 'Focus locks target, discipline ensures stability, achiever drives completion—powerful execution' },
    symptomI18n: { zh: '在选定的方向上能持续稳定地产出', en: 'Sustain stable output in chosen direction' },
    insightI18n: { zh: '你的执行力非常强，但要确保"执行的方向是对的"', en: 'Your execution very strong, but ensure "executing in right direction"' },
    actionI18n: { zh: '每周设定"方向检查点"：我在做的事还是最重要的吗？', en: 'Set weekly "direction checkpoint": is what I\'m doing still most important?' },
    boundaryI18n: { zh: '负责高效执行，也负责定期验证方向', en: 'Responsible for efficient execution, also for regularly validating direction' },
  },
];

// ============================================================================
// 多语言匹配和合并逻辑
// ============================================================================

/**
 * 检查一条规则是否匹配用户的优势组合
 */
function matchRule(rule: I18nComboRule, userStrengths: StrengthId[]): boolean {
  const { requires, requiresAny, excludes } = rule.trigger;

  // 检查必须包含的优势（AND 关系）
  const hasAllRequired = requires.every(s => userStrengths.includes(s));
  if (!hasAllRequired) return false;

  // 检查至少包含其一的优势（OR 关系）
  if (requiresAny && requiresAny.length > 0) {
    const hasAnyRequired = requiresAny.some(s => userStrengths.includes(s));
    if (!hasAnyRequired) return false;
  }

  // 检查排除的优势
  if (excludes && excludes.length > 0) {
    const hasExcluded = excludes.some(s => userStrengths.includes(s));
    if (hasExcluded) return false;
  }

  return true;
}

/**
 * 获取用户优势组合匹配的所有规则
 */
export function getMatchedI18nRules(userStrengths: StrengthId[]): I18nComboRule[] {
  return I18N_COMBO_RULES
    .filter(rule => matchRule(rule, userStrengths))
    .sort((a, b) => b.weight - a.weight);
}

/**
 * 合并匹配规则为多语言 ComboEffect
 */
export function mergeToI18nComboEffect(rules: I18nComboRule[]): I18nComboEffect {
  const effect: I18nComboEffect = {
    amplifications: [],
    blindspots: [],
    conflicts: [],
    traps: [],
    corrections: [],
  };

  // 用于去重的 Set
  const seenEffects = new Set<string>();
  const seenCorrections = new Set<string>();

  for (const rule of rules) {
    const effectKey = `${rule.type}:${rule.effectNameI18n.zh}`;

    // 去重
    if (seenEffects.has(effectKey)) continue;
    seenEffects.add(effectKey);

    // 按类型分类
    switch (rule.type) {
      case 'amplify':
        effect.amplifications.push({
          nameI18n: rule.effectNameI18n,
          descriptionI18n: rule.effectDescriptionI18n,
          weight: rule.weight,
        });
        break;
      case 'blindspot':
        effect.blindspots.push({
          nameI18n: rule.effectNameI18n,
          symptomI18n: rule.symptomI18n,
          weight: rule.weight,
        });
        break;
      case 'conflict':
        effect.conflicts.push({
          nameI18n: rule.effectNameI18n,
          descriptionI18n: rule.effectDescriptionI18n,
          weight: rule.weight,
        });
        break;
      case 'trap':
        effect.traps.push({
          nameI18n: rule.effectNameI18n,
          symptomI18n: rule.symptomI18n,
          weight: rule.weight,
        });
        break;
    }

    // 收集纠偏建议（去重）
    const correctionKey = rule.actionI18n.zh;
    if (!seenCorrections.has(correctionKey)) {
      seenCorrections.add(correctionKey);
      effect.corrections.push({
        insightI18n: rule.insightI18n,
        actionI18n: rule.actionI18n,
        boundaryI18n: rule.boundaryI18n,
        weight: rule.weight,
      });
    }
  }

  // 按权重排序
  effect.amplifications.sort((a, b) => b.weight - a.weight);
  effect.blindspots.sort((a, b) => b.weight - a.weight);
  effect.conflicts.sort((a, b) => b.weight - a.weight);
  effect.traps.sort((a, b) => b.weight - a.weight);
  effect.corrections.sort((a, b) => b.weight - a.weight);

  // corrections 只保留 Top 3
  effect.corrections = effect.corrections.slice(0, 3);

  return effect;
}

/**
 * 一步获取多语言 ComboEffect
 */
export function getI18nComboEffect(userStrengths: StrengthId[]): I18nComboEffect {
  const matchedRules = getMatchedI18nRules(userStrengths);
  return mergeToI18nComboEffect(matchedRules);
}

// ============================================================================
// 多语言 Prompt 格式化
// ============================================================================

/**
 * 格式化多语言 ComboEffect 为 prompt 友好的文本
 */
export function formatI18nComboEffectForPrompt(effect: I18nComboEffect, locale: Locale = 'zh'): string {
  const sections: string[] = [];

  if (effect.amplifications.length > 0) {
    const title = locale === 'zh' ? '【组合放大效应】' : '【Amplification Effects】';
    sections.push(
      title +
        '\n' +
        effect.amplifications
          .map(a => `- ${a.nameI18n[locale]}：${a.descriptionI18n[locale]}`)
          .join('\n')
    );
  }

  if (effect.traps.length > 0) {
    const title = locale === 'zh' ? '【组合陷阱】' : '【Traps】';
    sections.push(
      title +
        '\n' +
        effect.traps.map(t => `- ${t.nameI18n[locale]}：${t.symptomI18n[locale]}`).join('\n')
    );
  }

  if (effect.blindspots.length > 0) {
    const title = locale === 'zh' ? '【组合盲区】' : '【Blindspots】';
    sections.push(
      title +
        '\n' +
        effect.blindspots
          .map(b => `- ${b.nameI18n[locale]}：${b.symptomI18n[locale]}`)
          .join('\n')
    );
  }

  if (effect.conflicts.length > 0) {
    const title = locale === 'zh' ? '【组合冲突】' : '【Conflicts】';
    sections.push(
      title +
        '\n' +
        effect.conflicts
          .map(c => `- ${c.nameI18n[locale]}：${c.descriptionI18n[locale]}`)
          .join('\n')
    );
  }

  if (effect.corrections.length > 0) {
    const title = locale === 'zh' ? '【纠偏建议】' : '【Corrections】';
    const correctionLabel1 = locale === 'zh' ? '洞察' : 'Insight';
    const correctionLabel2 = locale === 'zh' ? '行动' : 'Action';
    const correctionLabel3 = locale === 'zh' ? '边界' : 'Boundary';

    sections.push(
      title +
        '\n' +
        effect.corrections
          .map(
            (c, i) =>
              `${i + 1}. ${correctionLabel1}：${c.insightI18n[locale]}\n   ${correctionLabel2}：${c.actionI18n[locale]}\n   ${correctionLabel3}：${c.boundaryI18n[locale]}`
          )
          .join('\n')
    );
  }

  return sections.join('\n\n');
}
