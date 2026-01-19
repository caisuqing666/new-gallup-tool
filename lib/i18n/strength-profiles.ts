/**
 * 优势画像多语言版本 (Strength Profiles - Internationalized)
 *
 * 为每个优势定义：驱动力、代价区、地下室状态、最佳使用、调整建议、能量信号
 * 支持中文和英文两种语言
 *
 * 每个优势的7个维度都用 Record<Locale, string> 形式存储
 * 确保无论查询哪种语言，都能获得一致的数据结构
 */

import { StrengthId } from '@/lib/gallup-strengths';
import { Locale } from '@/i18n/config';

// ============================================================================
// 多语言类型定义
// ============================================================================

/**
 * 多语言字符串映射
 * 用于在profile中存储双语文本
 */
type I18nString = Record<Locale, string>;

/**
 * 多语言优势画像
 * 每个字段都支持中英双语
 */
export interface I18nStrengthProfile {
  id: StrengthId;
  nameI18n: I18nString;                    // 优势名称
  domain: 'executing' | 'influencing' | 'relationship' | 'strategic';
  
  // 核心能量特性（双语）
  driveI18n: I18nString;                   // 主驱动力
  costI18n: I18nString;                    // 代价区
  basementI18n: I18nString;                // 地下室状态
  
  // 使用指导（双语）
  bestUseI18n: I18nString;                 // 最佳使用
  reframeI18n: I18nString;                 // 调整建议
  
  // 能量信号（双语）
  chargingI18n: I18nString;                // 充能信号
  drainingI18n: I18nString;                // 耗能信号
}

// ============================================================================
// 34个优势的多语言 Profile 数据
// ============================================================================

export const I18N_STRENGTH_PROFILES: Record<StrengthId, I18nStrengthProfile> = {
  // ========== 执行力领域 (Executing) ==========
  
  focus: {
    id: 'focus',
    nameI18n: { zh: '专注', en: 'Focus' },
    domain: 'executing',
    driveI18n: { zh: '锁定目标，排除干扰', en: 'Lock onto target, eliminate distractions' },
    costI18n: { zh: '错过周边机会，显得固执', en: 'Miss peripheral opportunities, appear stubborn' },
    basementI18n: { zh: '只盯着一件事，无法处理突发状况；对"不相关"的事缺乏耐心', en: 'Fixate on one thing, unable to handle emergencies; lack patience for "irrelevant" tasks' },
    bestUseI18n: { zh: '需要深度工作、长期坚持的任务', en: 'Tasks requiring deep work and sustained commitment' },
    reframeI18n: { zh: '不是放弃专注，而是重新定义"什么值得专注"', en: 'Not abandoning focus, but redefining "what deserves focus"' },
    chargingI18n: { zh: '在一件事上持续推进，感到心流状态', en: 'Sustained progress on one thing, feeling flow state' },
    drainingI18n: { zh: '被迫同时处理多件事，感到烦躁和分裂', en: 'Forced to handle multiple things simultaneously, feeling restless and fragmented' },
  },
  
  belief: {
    id: 'belief',
    nameI18n: { zh: '信仰', en: 'Belief' },
    domain: 'executing',
    driveI18n: { zh: '为意义而行动', en: 'Act for purpose and meaning' },
    costI18n: { zh: '难以接受与价值观冲突的任务', en: 'Difficult to accept tasks conflicting with values' },
    basementI18n: { zh: '用价值观评判他人；拒绝"不够有意义"的工作', en: 'Judge others by own values; refuse "insufficiently meaningful" work' },
    bestUseI18n: { zh: '需要内在动力、长期坚持的事业', en: 'Work requiring intrinsic motivation and sustained commitment' },
    reframeI18n: { zh: '不是降低标准，而是找到当前任务与信仰的连接点', en: 'Not lowering standards, but finding connection between current task and values' },
    chargingI18n: { zh: '做的事与内心价值一致，感到充实', en: 'Work aligned with inner values, feeling fulfilled' },
    drainingI18n: { zh: '做违背价值观的事，感到空虚和抗拒', en: 'Work violating values, feeling empty and resistant' },
  },
  
  consistency: {
    id: 'consistency',
    nameI18n: { zh: '公平', en: 'Consistency' },
    domain: 'executing',
    driveI18n: { zh: '确保规则对所有人一致', en: 'Ensure rules apply consistently to everyone' },
    costI18n: { zh: '缺乏灵活性，难以处理例外', en: 'Lack flexibility, difficult to handle exceptions' },
    basementI18n: { zh: '过度追求"一视同仁"，忽略个体差异；用规则压制创新', en: 'Excessively pursue "treating all equally", ignore individual differences; suppress innovation with rules' },
    bestUseI18n: { zh: '需要建立标准、确保公平的场景', en: 'Scenarios requiring establishing standards and ensuring fairness' },
    reframeI18n: { zh: '不是放弃公平，而是区分"原则"和"规则"', en: 'Not abandoning fairness, but distinguishing "principles" from "rules"' },
    chargingI18n: { zh: '看到规则被公正执行，感到安心', en: 'Seeing rules executed fairly, feeling secure' },
    drainingI18n: { zh: '被迫破例或看到不公平，感到不适', en: 'Forced exceptions or witnessing unfairness, feeling uncomfortable' },
  },
  
  deliberative: {
    id: 'deliberative',
    nameI18n: { zh: '审慎', en: 'Deliberative' },
    domain: 'executing',
    driveI18n: { zh: '降低风险，确保安全', en: 'Reduce risk, ensure safety' },
    costI18n: { zh: '决策缓慢，错过时机', en: 'Slow decision-making, miss timing' },
    basementI18n: { zh: '过度分析导致行动瘫痪；用"还没想清楚"逃避决策', en: 'Over-analysis leads to paralysis; use "not thought it through" to avoid decisions' },
    bestUseI18n: { zh: '高风险决策、需要周全考虑的场景', en: 'High-risk decisions, scenarios requiring thorough consideration' },
    reframeI18n: { zh: '不是放弃审慎，而是设定"足够好"的决策标准', en: 'Not abandoning caution, but setting "good enough" decision criteria' },
    chargingI18n: { zh: '有充足时间评估风险，感到安全', en: 'Adequate time to assess risks, feeling safe' },
    drainingI18n: { zh: '被迫快速决策，感到焦虑和不安', en: 'Forced rapid decisions, feeling anxious and uneasy' },
  },
  
  achiever: {
    id: 'achiever',
    nameI18n: { zh: '成就', en: 'Achiever' },
    domain: 'executing',
    driveI18n: { zh: '完成任务，获得成就感', en: 'Complete tasks, gain sense of accomplishment' },
    costI18n: { zh: '永不满足，过度工作', en: 'Never satisfied, overwork' },
    basementI18n: { zh: '用"忙碌"证明价值；无法享受已完成的成果', en: 'Use "busyness" to prove worth; unable to enjoy completed results' },
    bestUseI18n: { zh: '需要高产出、多任务并行的场景', en: 'Scenarios requiring high output, parallel task management' },
    reframeI18n: { zh: '不是降低标准，而是重新定义"今天的完成"', en: 'Not lowering standards, but redefining "today\'s completion"' },
    chargingI18n: { zh: '每天完成任务清单，感到满足', en: 'Complete daily task lists, feeling satisfied' },
    drainingI18n: { zh: '一天结束时清单未完成，感到焦虑', en: 'Day ends with incomplete lists, feeling anxious' },
  },
  
  restorative: {
    id: 'restorative',
    nameI18n: { zh: '排难', en: 'Restorative' },
    domain: 'executing',
    driveI18n: { zh: '发现问题，解决问题', en: 'Find problems, solve problems' },
    costI18n: { zh: '只看到问题，忽略已有的好', en: 'See only problems, ignore existing strengths' },
    basementI18n: { zh: '过度关注缺陷；把"没问题"当作"不够好"', en: 'Over-focus on defects; treat "no problems" as "not good enough"' },
    bestUseI18n: { zh: '需要诊断问题、修复系统的场景', en: 'Scenarios requiring problem diagnosis and system repair' },
    reframeI18n: { zh: '不是忽略问题，而是区分"必须解决"和"可以接受"', en: 'Not ignoring problems, but distinguishing "must solve" from "acceptable"' },
    chargingI18n: { zh: '找到问题根源并修复，感到成就感', en: 'Find root cause and fix, feeling accomplished' },
    drainingI18n: { zh: '问题无法解决或被忽视，感到挫败', en: 'Unsolvable or ignored problems, feeling defeated' },
  },
  
  discipline: {
    id: 'discipline',
    nameI18n: { zh: '纪律', en: 'Discipline' },
    domain: 'executing',
    driveI18n: { zh: '建立秩序，按计划执行', en: 'Establish order, execute according to plan' },
    costI18n: { zh: '难以适应变化，显得刻板', en: 'Difficulty adapting to change, appear rigid' },
    basementI18n: { zh: '用流程控制一切；当计划被打乱时崩溃', en: 'Control everything through process; collapse when plan disrupted' },
    bestUseI18n: { zh: '需要稳定执行、长期坚持的任务', en: 'Tasks requiring stable execution and sustained commitment' },
    reframeI18n: { zh: '不是放弃纪律，而是为变化预留"弹性空间"', en: 'Not abandoning discipline, but building in "flexibility buffer" for change' },
    chargingI18n: { zh: '按计划推进，一切井然有序', en: 'Progress according to plan, everything orderly' },
    drainingI18n: { zh: '计划被打乱，感到混乱和失控', en: 'Plan disrupted, feeling chaotic and out of control' },
  },
  
  arranger: {
    id: 'arranger',
    nameI18n: { zh: '统筹', en: 'Arranger' },
    domain: 'executing',
    driveI18n: { zh: '优化配置，协调资源', en: 'Optimize configuration, coordinate resources' },
    costI18n: { zh: '过度调整，不断重新安排', en: 'Excessive adjustment, constant rearrangement' },
    basementI18n: { zh: '把"调整"当作"进展"；无法接受"够好了"', en: 'Treat "adjustment" as "progress"; unable to accept "good enough"' },
    bestUseI18n: { zh: '需要协调多方资源、灵活调配的场景', en: 'Scenarios requiring coordinating resources and flexible allocation' },
    reframeI18n: { zh: '不是停止统筹，而是设定"调整截止点"', en: 'Not stopping coordination, but setting "adjustment deadline"' },
    chargingI18n: { zh: '找到最优配置方案，感到掌控感', en: 'Find optimal configuration, feeling in control' },
    drainingI18n: { zh: '资源混乱或无法调配，感到沮丧', en: 'Chaotic resources or unable to allocate, feeling discouraged' },
  },
  
  responsibility: {
    id: 'responsibility',
    nameI18n: { zh: '责任', en: 'Responsibility' },
    domain: 'executing',
    driveI18n: { zh: '承担承诺，说到做到', en: 'Assume commitment, follow through' },
    costI18n: { zh: '过度承担，无法拒绝', en: 'Over-assume, unable to refuse' },
    basementI18n: { zh: '把所有人的期待都接住；用"责任"绑架自己', en: 'Catch all expectations; use "responsibility" as self-coercion' },
    bestUseI18n: { zh: '需要可靠执行、建立信任的场景', en: 'Scenarios requiring reliable execution and trust-building' },
    reframeI18n: { zh: '不是逃避责任，而是重新定义"我的责任边界"', en: 'Not avoiding responsibility, but redefining "my responsibility boundary"' },
    chargingI18n: { zh: '兑现承诺，感到踏实和被信任', en: 'Fulfill promises, feeling solid and trusted' },
    drainingI18n: { zh: '承诺太多无法兑现，感到愧疚和压力', en: 'Too many promises to fulfill, feeling guilty and pressured' },
  },

  // ========== 影响力领域 (Influencing) ==========
  
  woo: {
    id: 'woo',
    nameI18n: { zh: '取悦', en: 'Woo' },
    domain: 'influencing',
    driveI18n: { zh: '赢得他人好感，建立新关系', en: 'Win approval, establish new relationships' },
    costI18n: { zh: '关系广而不深，难以维持', en: 'Many relationships but shallow, difficult to maintain' },
    basementI18n: { zh: '把"被喜欢"当作目标；无法接受有人不喜欢自己', en: 'Treat "being liked" as goal; unable to accept being disliked' },
    bestUseI18n: { zh: '需要破冰、拓展人脉的场景', en: 'Scenarios requiring breaking ice and expanding network' },
    reframeI18n: { zh: '不是停止取悦，而是选择"值得取悦的人"', en: 'Not stopping approval-seeking, but choosing "worthy people"' },
    chargingI18n: { zh: '成功赢得新朋友，感到社交满足', en: 'Successfully win new friends, feeling socially fulfilled' },
    drainingI18n: { zh: '被拒绝或冷落，感到受伤', en: 'Rejection or coldness, feeling hurt' },
  },
  
  maximizer: {
    id: 'maximizer',
    nameI18n: { zh: '完美', en: 'Maximizer' },
    domain: 'influencing',
    driveI18n: { zh: '追求卓越，从好到更好', en: 'Pursue excellence, from good to great' },
    costI18n: { zh: '无法接受"够好"，永不满足', en: 'Unable to accept "good enough", never satisfied' },
    basementI18n: { zh: '用"还不够好"拖延交付；对平庸的人/事缺乏耐心', en: 'Use "not good enough" to delay delivery; impatient with mediocrity' },
    bestUseI18n: { zh: '需要精益求精、打磨细节的场景', en: 'Scenarios requiring polish and attention to detail' },
    reframeI18n: { zh: '不是降低标准，而是区分"必须完美"和"可以够好"', en: 'Not lowering standards, but distinguishing "must be perfect" from "can be good enough"' },
    chargingI18n: { zh: '把事情从好变成卓越，感到满足', en: 'Make things great, feeling satisfied' },
    drainingI18n: { zh: '被迫接受平庸的结果，感到不适', en: 'Forced to accept mediocre results, feeling uncomfortable' },
  },
  
  communication: {
    id: 'communication',
    nameI18n: { zh: '沟通', en: 'Communication' },
    domain: 'influencing',
    driveI18n: { zh: '用语言传递想法，影响他人', en: 'Use language to convey ideas, influence others' },
    costI18n: { zh: '说得太多，听得太少', en: 'Talk too much, listen too little' },
    basementI18n: { zh: '把"说清楚"当作"对方理解了"；用表达替代倾听', en: 'Treat "explaining clearly" as "other understood"; replace listening with talking' },
    bestUseI18n: { zh: '需要演讲、写作、说服的场景', en: 'Scenarios requiring speaking, writing, persuading' },
    reframeI18n: { zh: '不是减少沟通，而是增加"确认对方理解"的环节', en: 'Not reducing communication, but adding "confirm understanding" step' },
    chargingI18n: { zh: '把复杂的事说清楚，感到成就感', en: 'Explain complex things clearly, feeling accomplished' },
    drainingI18n: { zh: '无法表达或被误解，感到憋屈', en: 'Unable to express or being misunderstood, feeling frustrated' },
  },
  
  competition: {
    id: 'competition',
    nameI18n: { zh: '竞争', en: 'Competition' },
    domain: 'influencing',
    driveI18n: { zh: '比较、超越、赢', en: 'Compare, surpass, win' },
    costI18n: { zh: '把一切变成比赛，难以合作', en: 'Turn everything into competition, difficult to cooperate' },
    basementI18n: { zh: '输不起；把队友当对手；用"赢"定义自我价值', en: 'Cannot lose; treat teammates as opponents; define self-worth by winning' },
    bestUseI18n: { zh: '需要明确输赢、有排名的场景', en: 'Scenarios with clear winners/losers and rankings' },
    reframeI18n: { zh: '不是放弃竞争，而是选择"值得赢的赛道"', en: 'Not giving up competition, but choosing "worthy contests"' },
    chargingI18n: { zh: '在竞争中获胜，感到兴奋', en: 'Win competitions, feeling excited' },
    drainingI18n: { zh: '输掉比赛或没有对手，感到沮丧', en: 'Lose competitions or no competition, feeling discouraged' },
  },
  
  command: {
    id: 'command',
    nameI18n: { zh: '统率', en: 'Command' },
    domain: 'influencing',
    driveI18n: { zh: '掌控局面，带领他人', en: 'Take charge, lead others' },
    costI18n: { zh: '显得强势，压制他人', en: 'Appear dominant, suppress others' },
    basementI18n: { zh: '控制一切；无法接受不同意见；用权力替代影响力', en: 'Control everything; unable to accept disagreement; use power instead of influence' },
    bestUseI18n: { zh: '需要快速决策、危机处理的场景', en: 'Scenarios requiring quick decisions and crisis management' },
    reframeI18n: { zh: '不是放弃掌控，而是区分"必须控制"和"可以放手"', en: 'Not giving up control, but distinguishing "must control" from "can let go"' },
    chargingI18n: { zh: '带领团队完成挑战，感到掌控感', en: 'Lead team through challenges, feeling in control' },
    drainingI18n: { zh: '失去控制或被忽视，感到无力', en: 'Lose control or be ignored, feeling powerless' },
  },
  
  'self-assurance': {
    id: 'self-assurance',
    nameI18n: { zh: '自信', en: 'Self-Assurance' },
    domain: 'influencing',
    driveI18n: { zh: '相信自己的判断和能力', en: 'Trust own judgment and ability' },
    costI18n: { zh: '显得自大，难以接受反馈', en: 'Appear arrogant, difficult to accept feedback' },
    basementI18n: { zh: '拒绝质疑；把"我觉得"当作"事实"', en: 'Reject questioning; treat "I feel" as "fact"' },
    bestUseI18n: { zh: '需要在不确定中做决策的场景', en: 'Scenarios requiring decisions in uncertainty' },
    reframeI18n: { zh: '不是怀疑自己，而是区分"自信"和"确认偏误"', en: 'Not self-doubt, but distinguishing "confidence" from "confirmation bias"' },
    chargingI18n: { zh: '按自己的判断行动并成功，感到确信', en: 'Act on own judgment and succeed, feeling assured' },
    drainingI18n: { zh: '被迫听从他人的判断，感到不适', en: 'Forced to follow others\' judgment, feeling uncomfortable' },
  },
  
  activator: {
    id: 'activator',
    nameI18n: { zh: '行动', en: 'Activator' },
    domain: 'influencing',
    driveI18n: { zh: '立即开始，用行动推动', en: 'Start immediately, drive through action' },
    costI18n: { zh: '冲动行事，缺乏计划', en: 'Act impulsively, lack planning' },
    basementI18n: { zh: '用"先动起来"逃避思考；把"在做"当作"在进展"', en: 'Use "just start" to avoid thinking; treat "doing" as "making progress"' },
    bestUseI18n: { zh: '需要打破僵局、快速启动的场景', en: 'Scenarios requiring breaking deadlock and quick launch' },
    reframeI18n: { zh: '不是停止行动，而是增加"行动前的5分钟思考"', en: 'Not stopping action, but adding "5-minute thinking before action"' },
    chargingI18n: { zh: '把想法变成行动，感到推进感', en: 'Turn ideas into action, feeling momentum' },
    drainingI18n: { zh: '被迫等待或反复讨论，感到焦躁', en: 'Forced to wait or endless discussion, feeling impatient' },
  },
  
  significance: {
    id: 'significance',
    nameI18n: { zh: '追求', en: 'Significance' },
    domain: 'influencing',
    driveI18n: { zh: '被认可，产生影响', en: 'Be recognized, make impact' },
    costI18n: { zh: '过度在意他人评价', en: 'Over-concern with others\' opinions' },
    basementI18n: { zh: '把"被认可"当作"有价值"；没有掌声就没有动力', en: 'Treat "being recognized" as "being valuable"; no applause, no motivation' },
    bestUseI18n: { zh: '需要展示成果、获得认可的场景', en: 'Scenarios requiring showcasing results and recognition' },
    reframeI18n: { zh: '不是放弃追求，而是建立"内在认可"标准', en: 'Not abandoning pursuit, but establishing "internal recognition" standards' },
    chargingI18n: { zh: '工作被认可、产生影响，感到有价值', en: 'Work recognized and making impact, feeling valuable' },
    drainingI18n: { zh: '被忽视或成果不被认可，感到沮丧', en: 'Ignored or results unrecognized, feeling discouraged' },
  },

  // ========== 关系建立领域 (Relationship Building) ==========
  
  individualization: {
    id: 'individualization',
    nameI18n: { zh: '个别', en: 'Individualization' },
    domain: 'relationship',
    driveI18n: { zh: '看到每个人的独特之处', en: 'See each person\'s uniqueness' },
    costI18n: { zh: '难以标准化，效率低', en: 'Difficult to standardize, low efficiency' },
    basementI18n: { zh: '过度定制化；无法接受"一刀切"的效率', en: 'Over-customize; unable to accept "one-size-fits-all" efficiency' },
    bestUseI18n: { zh: '需要因人施策、个性化服务的场景', en: 'Scenarios requiring personalized approach and service' },
    reframeI18n: { zh: '不是忽略差异，而是区分"必须个别"和"可以标准"', en: 'Not ignoring differences, but distinguishing "must personalize" from "can standardize"' },
    chargingI18n: { zh: '为不同的人提供定制方案，感到满足', en: 'Provide customized solutions for different people, feeling satisfied' },
    drainingI18n: { zh: '被迫用同一套方法对待所有人，感到不适', en: 'Forced to treat everyone the same way, feeling uncomfortable' },
  },
  
  relator: {
    id: 'relator',
    nameI18n: { zh: '交往', en: 'Relator' },
    domain: 'relationship',
    driveI18n: { zh: '深化关系，建立亲密连接', en: 'Deepen relationships, establish intimate connections' },
    costI18n: { zh: '圈子小，难以拓展', en: 'Small circle, difficult to expand' },
    basementI18n: { zh: '只在舒适圈里；用"深度"逃避"广度"', en: 'Stay in comfort zone; use "depth" to avoid "breadth"' },
    bestUseI18n: { zh: '需要建立长期信任、深度合作的场景', en: 'Scenarios requiring long-term trust and deep collaboration' },
    reframeI18n: { zh: '不是放弃深度，而是为"新关系"预留入口', en: 'Not abandoning depth, but creating entry points for new relationships' },
    chargingI18n: { zh: '与亲密的人深度交流，感到连接', en: 'Deep interaction with close people, feeling connected' },
    drainingI18n: { zh: '被迫应酬陌生人，感到疲惫', en: 'Forced socializing with strangers, feeling tired' },
  },
  
  developer: {
    id: 'developer',
    nameI18n: { zh: '伯乐', en: 'Developer' },
    domain: 'relationship',
    driveI18n: { zh: '看到他人潜力，帮助成长', en: 'See others\' potential, help them grow' },
    costI18n: { zh: '过度投入他人，忽略自己', en: 'Over-invest in others, neglect self' },
    basementI18n: { zh: '用"帮助别人"逃避自己的成长；被"烂泥扶不上墙"消耗', en: 'Use "helping others" to avoid own growth; be drained by those unwilling to grow' },
    bestUseI18n: { zh: '需要培养人才、辅导他人的场景', en: 'Scenarios requiring developing talent and mentoring' },
    reframeI18n: { zh: '不是停止帮助，而是选择"值得培养的人"', en: 'Not stopping help, but choosing "people worth developing"' },
    chargingI18n: { zh: '看到他人成长，感到成就感', en: 'See others grow, feeling accomplished' },
    drainingI18n: { zh: '培养的人没有进步，感到挫败', en: 'Those you develop make no progress, feeling defeated' },
  },
  
  empathy: {
    id: 'empathy',
    nameI18n: { zh: '体谅', en: 'Empathy' },
    domain: 'relationship',
    driveI18n: { zh: '感受他人情绪，理解处境', en: 'Feel others\' emotions, understand their situation' },
    costI18n: { zh: '被他人情绪淹没，边界模糊', en: 'Overwhelmed by others\' emotions, blurred boundaries' },
    basementI18n: { zh: '把别人的情绪当作自己的；无法拒绝情绪求助', en: 'Take on others\' emotions as own; unable to refuse emotional requests' },
    bestUseI18n: { zh: '需要理解他人、提供情感支持的场景', en: 'Scenarios requiring understanding and emotional support' },
    reframeI18n: { zh: '不是关闭共情，而是建立"情绪边界"', en: 'Not closing empathy, but establishing "emotional boundaries"' },
    chargingI18n: { zh: '帮助他人感到被理解，感到连接', en: 'Help others feel understood, feeling connected' },
    drainingI18n: { zh: '被负面情绪淹没，感到疲惫', en: 'Overwhelmed by negative emotions, feeling exhausted' },
  },
  
  connectedness: {
    id: 'connectedness',
    nameI18n: { zh: '关联', en: 'Connectedness' },
    domain: 'relationship',
    driveI18n: { zh: '看到事物之间的联系', en: 'See connections between things' },
    costI18n: { zh: '过度解读，看到不存在的关联', en: 'Over-interpret, see connections that don\'t exist' },
    basementI18n: { zh: '把巧合当作命运；用"相信"替代"验证"', en: 'Treat coincidence as fate; use "belief" instead of "verification"' },
    bestUseI18n: { zh: '需要整合资源、建立联盟的场景', en: 'Scenarios requiring integrating resources and building alliances' },
    reframeI18n: { zh: '不是否定关联，而是区分"真实联系"和"想象联系"', en: 'Not denying connections, but distinguishing "real connections" from "imagined ones"' },
    chargingI18n: { zh: '发现意外的联系，感到意义感', en: 'Discover unexpected connections, feeling meaningful' },
    drainingI18n: { zh: '感到孤立或断裂，感到空虚', en: 'Feel isolated or disconnected, feeling empty' },
  },
  
  include: {
    id: 'include',
    nameI18n: { zh: '包容', en: 'Includer' },
    domain: 'relationship',
    driveI18n: { zh: '让每个人都被接纳', en: 'Ensure everyone is included' },
    costI18n: { zh: '无法排除不合适的人', en: 'Unable to exclude unsuitable people' },
    basementI18n: { zh: '把"包容"变成"没有标准"；无法说"你不适合"', en: 'Turn "inclusion" into "no standards"; unable to say "you don\'t fit"' },
    bestUseI18n: { zh: '需要建立归属感、整合多元的场景', en: 'Scenarios requiring building belonging and integrating diversity' },
    reframeI18n: { zh: '不是排斥任何人，而是区分"邀请参与"和"核心成员"', en: 'Not excluding anyone, but distinguishing "invited to participate" from "core member"' },
    chargingI18n: { zh: '让被忽视的人感到被接纳，感到温暖', en: 'Make overlooked people feel accepted, feeling warm' },
    drainingI18n: { zh: '看到有人被排斥，感到不适', en: 'See someone excluded, feeling uncomfortable' },
  },
  
  harmony: {
    id: 'harmony',
    nameI18n: { zh: '和谐', en: 'Harmony' },
    domain: 'relationship',
    driveI18n: { zh: '避免冲突，寻求共识', en: 'Avoid conflict, seek consensus' },
    costI18n: { zh: '逃避必要的冲突，无法坚持立场', en: 'Avoid necessary conflict, unable to take stands' },
    basementI18n: { zh: '把"没有冲突"当作"关系好"；用妥协换取和平', en: 'Treat "no conflict" as "good relationship"; use compromise for peace' },
    bestUseI18n: { zh: '需要调解矛盾、建立共识的场景', en: 'Scenarios requiring mediating conflicts and building consensus' },
    reframeI18n: { zh: '不是制造冲突，而是区分"必要的冲突"和"可以避免的冲突"', en: 'Not creating conflict, but distinguishing "necessary conflict" from "avoidable conflict"' },
    chargingI18n: { zh: '化解矛盾，达成共识，感到平静', en: 'Resolve conflicts, reach consensus, feeling at peace' },
    drainingI18n: { zh: '身处冲突中或被迫选边站，感到痛苦', en: 'In conflict or forced to take sides, feeling painful' },
  },
  
  positivity: {
    id: 'positivity',
    nameI18n: { zh: '积极', en: 'Positivity' },
    domain: 'relationship',
    driveI18n: { zh: '传递正能量，激励他人', en: 'Transmit positive energy, inspire others' },
    costI18n: { zh: '回避负面情绪，显得不够深刻', en: 'Avoid negative emotions, appear shallow' },
    basementI18n: { zh: '用"积极"压制真实感受；无法处理悲伤和失望', en: 'Use "positivity" to suppress true feelings; unable to handle grief and disappointment' },
    bestUseI18n: { zh: '需要激励团队、营造氛围的场景', en: 'Scenarios requiring inspiring teams and creating atmosphere' },
    reframeI18n: { zh: '不是变得消极，而是允许"暂时的低落"', en: 'Not becoming negative, but allowing "temporary lows"' },
    chargingI18n: { zh: '让氛围变好，感到快乐', en: 'Improve atmosphere, feeling happy' },
    drainingI18n: { zh: '身处负面环境，感到被拖累', en: 'In negative environment, feeling dragged down' },
  },
  
  adaptability: {
    id: 'adaptability',
    nameI18n: { zh: '适应', en: 'Adaptability' },
    domain: 'relationship',
    driveI18n: { zh: '顺应变化，活在当下', en: 'Go with change, live in present' },
    costI18n: { zh: '缺乏长期规划，被动应对', en: 'Lack long-term planning, reactive' },
    basementI18n: { zh: '用"随机应变"逃避规划；把"没计划"当作"灵活"', en: 'Use "improvise" to avoid planning; treat "no plan" as "flexible"' },
    bestUseI18n: { zh: '需要应对变化、处理突发的场景', en: 'Scenarios requiring handling change and emergencies' },
    reframeI18n: { zh: '不是变得死板，而是为"不变的目标"设定锚点', en: 'Not becoming rigid, but anchoring unchanging goals' },
    chargingI18n: { zh: '灵活应对变化，感到自如', en: 'Flexibly handle change, feeling at ease' },
    drainingI18n: { zh: '被迫按死板计划执行，感到束缚', en: 'Forced to follow rigid plans, feeling constrained' },
  },

  // ========== 战略思维领域 (Strategic Thinking) ==========
  
  analytical: {
    id: 'analytical',
    nameI18n: { zh: '分析', en: 'Analytical' },
    domain: 'strategic',
    driveI18n: { zh: '用数据和逻辑验证', en: 'Verify with data and logic' },
    costI18n: { zh: '过度分析，延迟行动', en: 'Over-analyze, delay action' },
    basementI18n: { zh: '用"数据不够"拖延决策；对"直觉"缺乏信任', en: 'Use "insufficient data" to delay decisions; distrust intuition' },
    bestUseI18n: { zh: '需要严谨论证、排除错误的场景', en: 'Scenarios requiring rigorous argumentation and error elimination' },
    reframeI18n: { zh: '不是放弃分析，而是设定"分析截止点"', en: 'Not abandoning analysis, but setting "analysis deadline"' },
    chargingI18n: { zh: '找到数据支撑的答案，感到确定', en: 'Find data-backed answers, feeling certain' },
    drainingI18n: { zh: '被迫在没有数据时做决策，感到不安', en: 'Forced to decide without data, feeling uneasy' },
  },
  
  futuristic: {
    id: 'futuristic',
    nameI18n: { zh: '前瞻', en: 'Futuristic' },
    domain: 'strategic',
    driveI18n: { zh: '看到未来可能性', en: 'See future possibilities' },
    costI18n: { zh: '忽略当下，活在幻想中', en: 'Ignore present, live in imagination' },
    basementI18n: { zh: '用"未来愿景"逃避当下行动；无法接受"现实的限制"', en: 'Use "future vision" to avoid present action; unable to accept "reality\'s constraints"' },
    bestUseI18n: { zh: '需要规划愿景、激励长期目标的场景', en: 'Scenarios requiring vision planning and long-term motivation' },
    reframeI18n: { zh: '不是放弃愿景，而是为愿景设定"今天的第一步"', en: 'Not abandoning vision, but setting "today\'s first step"' },
    chargingI18n: { zh: '描绘令人兴奋的未来，感到希望', en: 'Paint exciting future, feeling hopeful' },
    drainingI18n: { zh: '被困在琐碎的当下，感到窒息', en: 'Trapped in petty present, feeling suffocated' },
  },
  
  context: {
    id: 'context',
    nameI18n: { zh: '回顾', en: 'Context' },
    domain: 'strategic',
    driveI18n: { zh: '从过去中寻找答案', en: 'Find answers in the past' },
    costI18n: { zh: '过度依赖历史，抗拒新事物', en: 'Over-rely on history, resist novelty' },
    basementI18n: { zh: '用"以前怎么做"替代"现在该怎么做"；无法接受没有先例的事', en: 'Replace "what to do now" with "how we did it before"; unable to accept unprecedented situations' },
    bestUseI18n: { zh: '需要总结经验、避免重复错误的场景', en: 'Scenarios requiring summarizing experience and avoiding repeat mistakes' },
    reframeI18n: { zh: '不是忽略历史，而是区分"值得参考"和"已经过时"', en: 'Not ignoring history, but distinguishing "worth referencing" from "already outdated"' },
    chargingI18n: { zh: '从历史中找到解决方案，感到踏实', en: 'Find solutions in history, feeling grounded' },
    drainingI18n: { zh: '面对全新的问题没有参考，感到不安', en: 'No reference for novel problems, feeling uneasy' },
  },
  
  learner: {
    id: 'learner',
    nameI18n: { zh: '学习', en: 'Learner' },
    domain: 'strategic',
    driveI18n: { zh: '不断学习新知识', en: 'Constantly learn new knowledge' },
    costI18n: { zh: '学而不用，永远在准备', en: 'Learn but don\'t apply, always preparing' },
    basementI18n: { zh: '用"还要再学"逃避行动；把"学习"当作"进步"', en: 'Use "need to learn more" to avoid action; treat "learning" as "progress"' },
    bestUseI18n: { zh: '需要快速掌握新领域的场景', en: 'Scenarios requiring quickly mastering new domains' },
    reframeI18n: { zh: '不是停止学习，而是设定"学够了就行动"的标准', en: 'Not stopping learning, but setting "learned enough, time to act" standard' },
    chargingI18n: { zh: '学到新东西，感到成长', en: 'Learn something new, feeling grown' },
    drainingI18n: { zh: '重复已经会的事，感到无聊', en: 'Repeat what you already know, feeling bored' },
  },
  
  intellection: {
    id: 'intellection',
    nameI18n: { zh: '思维', en: 'Intellection' },
    domain: 'strategic',
    driveI18n: { zh: '深度思考，内省', en: 'Deep thinking, introspection' },
    costI18n: { zh: '过度内耗，与行动脱节', en: 'Excessive internal conflict, disconnected from action' },
    basementI18n: { zh: '用"想清楚"拖延行动；把"思考"当作"做了"', en: 'Use "need to think it through" to delay action; treat "thinking" as "doing"' },
    bestUseI18n: { zh: '需要深度分析、独立思考的场景', en: 'Scenarios requiring deep analysis and independent thought' },
    reframeI18n: { zh: '不是停止思考，而是为思考设定"输出节点"', en: 'Not stopping thinking, but setting "output checkpoints"' },
    chargingI18n: { zh: '有独处时间深度思考，感到清晰', en: 'Alone time for deep thinking, feeling clear' },
    drainingI18n: { zh: '被打断或无法独处，感到混乱', en: 'Interrupted or unable to be alone, feeling confused' },
  },
  
  strategic: {
    id: 'strategic',
    nameI18n: { zh: '战略', en: 'Strategic' },
    domain: 'strategic',
    driveI18n: { zh: '找到最优路径', en: 'Find optimal path' },
    costI18n: { zh: '过度规划，忽略执行', en: 'Over-plan, neglect execution' },
    basementI18n: { zh: '永远在找"更好的路"，无法在一条路上坚持；用"战略"替代"行动"', en: 'Always looking for "better path", unable to commit; use "strategy" instead of "action"' },
    bestUseI18n: { zh: '需要在复杂局面中做选择的场景', en: 'Scenarios requiring making choices in complex situations' },
    reframeI18n: { zh: '不是放弃战略，而是设定"选定后不再换路"的节点', en: 'Not abandoning strategy, but setting "committed path" checkpoint' },
    chargingI18n: { zh: '找到清晰的路径，感到确定', en: 'Find clear path, feeling certain' },
    drainingI18n: { zh: '被困在没有选择的执行中，感到窒息', en: 'Stuck in execution without choice, feeling suffocated' },
  },
  
  input: {
    id: 'input',
    nameI18n: { zh: '搜集', en: 'Input' },
    domain: 'strategic',
    driveI18n: { zh: '收集信息，储备资源', en: 'Collect information, stockpile resources' },
    costI18n: { zh: '信息囤积，无法决策', en: 'Information hoarding, unable to decide' },
    basementI18n: { zh: '用"再收集一下"拖延决策；把"收集"当作"行动"', en: 'Use "collect a bit more" to delay decisions; treat "collecting" as "acting"' },
    bestUseI18n: { zh: '需要整合资源、建立知识库的场景', en: 'Scenarios requiring integrating resources and building knowledge base' },
    reframeI18n: { zh: '不是停止搜集，而是设定"信息够用"的标准', en: 'Not stopping collection, but setting "enough information" standard' },
    chargingI18n: { zh: '发现有用的信息并收藏，感到充实', en: 'Find useful information and collect, feeling fulfilled' },
    drainingI18n: { zh: '被迫在信息不足时决策，感到不安', en: 'Forced to decide with insufficient information, feeling uneasy' },
  },
  
  ideation: {
    id: 'ideation',
    nameI18n: { zh: '理念', en: 'Ideation' },
    domain: 'strategic',
    driveI18n: { zh: '产生新想法，建立新连接', en: 'Generate new ideas, make new connections' },
    costI18n: { zh: '想法太多，落地太少', en: 'Too many ideas, too little execution' },
    basementI18n: { zh: '用"新想法"逃避"旧任务"；把"有想法"当作"有进展"', en: 'Use "new ideas" to escape old tasks; treat "have ideas" as "making progress"' },
    bestUseI18n: { zh: '需要创新、头脑风暴的场景', en: 'Scenarios requiring innovation and brainstorming' },
    reframeI18n: { zh: '不是压制想法，而是为想法设定"落地检验"标准', en: 'Not suppressing ideas, but setting "implementation verification" standard' },
    chargingI18n: { zh: '产生新想法，感到兴奋', en: 'Generate new ideas, feeling excited' },
    drainingI18n: { zh: '被困在重复的执行中，感到无聊', en: 'Stuck in repetitive execution, feeling bored' },
  },
};

// ============================================================================
// 多语言辅助函数
// ============================================================================

/**
 * 根据优势ID和语言获取多语言Profile
 */
export function getI18nStrengthProfile(id: StrengthId, locale: Locale = 'zh'): I18nStrengthProfile | undefined {
  return I18N_STRENGTH_PROFILES[id];
}

/**
 * 获取优势在指定语言中的名称
 */
export function getProfileName(id: StrengthId, locale: Locale = 'zh'): string | undefined {
  const profile = I18N_STRENGTH_PROFILES[id];
  return profile?.nameI18n[locale];
}

/**
 * 批量获取多语言 Profile
 */
export function getI18nStrengthProfiles(ids: StrengthId[]): I18nStrengthProfile[] {
  return ids
    .map(id => I18N_STRENGTH_PROFILES[id])
    .filter((p): p is I18nStrengthProfile => p !== undefined);
}

/**
 * 格式化为 prompt 友好的文本（指定语言）
 */
export function formatI18nProfileForPrompt(profile: I18nStrengthProfile, locale: Locale = 'zh'): string {
  const name = profile.nameI18n[locale];
  const drive = profile.driveI18n[locale];
  const cost = profile.costI18n[locale];
  const basement = profile.basementI18n[locale];
  const bestUse = profile.bestUseI18n[locale];
  const reframe = profile.reframeI18n[locale];
  const charging = profile.chargingI18n[locale];
  const draining = profile.drainingI18n[locale];
  
  return locale === 'zh'
    ? `【${name}】\n- 驱动力：${drive}\n- 代价区：${cost}\n- 地下室：${basement}\n- 最佳使用：${bestUse}\n- 调整建议：${reframe}\n- 充能信号：${charging}\n- 耗能信号：${draining}`
    : `【${name}】\n- Drive: ${drive}\n- Cost: ${cost}\n- Basement: ${basement}\n- Best Use: ${bestUse}\n- Reframe: ${reframe}\n- Charging Signal: ${charging}\n- Draining Signal: ${draining}`;
}
