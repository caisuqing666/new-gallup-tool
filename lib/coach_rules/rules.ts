export interface CoachRule {
  id: string;
  when: {
    trigger: string;
    patterns: string[];
    strengths: string[];
  };
  because: {
    diagnosis: string;
    evidence: string[];
    strengths: string[];
  };
  conclude: string;
  do_more: string[];
  do_less: string[];
  boundary: string[];
  check_rule: string;
  anti_misjudge: string[];
}

export const COACH_RULES: CoachRule[] = [
  {
    id: 'R1-overanalysis-procrastination',
    when: {
      trigger: '过度分析导致迟迟不行动',
      patterns: ['过度分析', '一直在想', '迟迟不行动', '信息越多越焦虑', '怕选错', '决策拖延'],
      strengths: ['分析', '思维', '学习', '审慎', 'analytical', 'intellection', 'learner', 'deliberative'],
    },
    because: {
      diagnosis: '安全感建立在“理解完成”，而不是“行动验证”。',
      evidence: ['把分析当成行动替代', '将不确定性等同于风险'],
      strengths: ['分析/思维/学习容易把探索当成完结标准'],
    },
    conclude: '优先判定为“理解驱动的停滞”，而非时间管理或执行力不足。',
    do_more: ['设定决策截止时间', '以最小行动验证假设', '先做可逆选择再评估'],
    do_less: ['扩大信息收集范围', '反复推演所有分支', '以完美理解作为出发条件'],
    boundary: ['当新增信息不改变路径时立即行动', '每次分析只允许一个结论'],
    check_rule: '信息增加≠决策改变时，立即进入行动。',
    anti_misjudge: ['不是懒惰', '不是时间管理差', '不是执行力不足'],
  },
  {
    id: 'R2-perfection-paralysis',
    when: {
      trigger: '过度求完美导致卡死',
      patterns: ['完美', '不够好不敢交付', '一再修改', '无法定稿', '担心瑕疵'],
      strengths: ['完美', '审慎', '纪律', 'maximizer', 'deliberative', 'discipline'],
    },
    because: {
      diagnosis: '把风险控制等同于质量最大化，导致迟滞。',
      evidence: ['推迟交付以消除瑕疵', '把“好”误认成“安全”'],
      strengths: ['完美倾向追求极致，审慎放大风险'],
    },
    conclude: '优先判定为“风险控制过度”，而非能力不足。',
    do_more: ['定义最低可接受标准', '先交付可用版本', '区分必须项与可选项'],
    do_less: ['无限迭代', '为了完美推迟上线', '把细节当成关键路径'],
    boundary: ['达到关键标准即收手', '每轮修改限定次数'],
    check_rule: '符合关键标准即发布，不为边际提升拖延。',
    anti_misjudge: ['不是水平不够', '不是缺乏专业度'],
  },
  {
    id: 'R3-people-pleasing-boundary',
    when: {
      trigger: '讨好或回避冲突导致边界缺失',
      patterns: ['不敢拒绝', '避免冲突', '总是答应', '边界不清', '怕别人不高兴'],
      strengths: ['取悦', '和谐', '体谅', '包容', 'woo', 'harmony', 'empathy', 'include'],
    },
    because: {
      diagnosis: '关系安全被置于自我边界之上。',
      evidence: ['承诺过多', '用顺从换取短期和谐'],
      strengths: ['和谐/取悦会倾向维持关系氛围'],
    },
    conclude: '优先判定为“关系优先导致边界失守”，而非沟通能力差。',
    do_more: ['明确不可协商事项', '提出替代方案而非直接答应', '提前说明资源限制'],
    do_less: ['自动答应', '用暗示代替明确表达', '用牺牲换和谐'],
    boundary: ['每个承诺必须匹配时间与资源', '无法承诺时当场说明'],
    check_rule: '承诺前必须回答：我是否有资源兑现？',
    anti_misjudge: ['不是不够会沟通', '不是不够友善'],
  },
  {
    id: 'R4-responsibility-overload',
    when: {
      trigger: '责任感过载把一切扛在自己身上',
      patterns: ['都我来', '责任在我', '无法放手', '接盘', '不敢交出去'],
      strengths: ['责任', '成就', 'responsibility', 'achiever'],
    },
    because: {
      diagnosis: '把可靠性等同于全权承担。',
      evidence: ['超出职责范围接手', '把团队问题个人化'],
      strengths: ['责任会把承诺扩大化'],
    },
    conclude: '优先判定为“责任过度扩张”，而非效率不足。',
    do_more: ['明确职责边界', '推动任务归属清晰', '请求资源与支持'],
    do_less: ['替别人收尾', '不分层级地接所有问题'],
    boundary: ['只对明确承诺负责', '不接手未授权事项'],
    check_rule: '不在职责或承诺范围内的任务一律退回。',
    anti_misjudge: ['不是不够努力', '不是效率不高'],
  },
  {
    id: 'R5-empathy-burnout',
    when: {
      trigger: '过度共情导致耗竭',
      patterns: ['情绪被拖走', '总在照顾别人', '精力被耗尽', '共情过度', '疲惫'],
      strengths: ['体谅', '伯乐', '关联', 'empathy', 'developer', 'connectedness'],
    },
    because: {
      diagnosis: '把理解他人等同于承担他人情绪。',
      evidence: ['长期吸收他人情绪', '忽略自我恢复'],
      strengths: ['体谅/伯乐容易把支持当成责任'],
    },
    conclude: '优先判定为“情绪承载过度”，而非情绪管理差。',
    do_more: ['设置支持时间窗口', '完成帮助后立即恢复', '区分理解与承担'],
    do_less: ['长期情绪陪伴', '把对方问题当作自己责任'],
    boundary: ['帮助不等于承载', '支持后必须自我恢复'],
    check_rule: '每次支持后必须安排恢复动作。',
    anti_misjudge: ['不是冷漠', '不是不够有同理心'],
  },
  {
    id: 'R6-goal-switching',
    when: {
      trigger: '目标很多切换频繁无法推进',
      patterns: ['目标太多', '频繁切换', '没有推进', '今天换方向', '同时做很多事'],
      strengths: ['统筹', '战略', '理念', 'arranger', 'strategic', 'ideation'],
    },
    because: {
      diagnosis: '把“可能性拓展”误当成“推进”。',
      evidence: ['不断新增目标', '缺少收敛机制'],
      strengths: ['统筹/战略/理念容易扩张战场'],
    },
    conclude: '优先判定为“过度扩张导致推进断裂”，而非能力不足。',
    do_more: ['设定本周期唯一主目标', '限制在制任务数量', '设定停止新增规则'],
    do_less: ['并行新增目标', '为新想法立刻换轨'],
    boundary: ['同一周期最多 3 个目标', '未完成不新增'],
    check_rule: '未完成主目标前，不新增新目标。',
    anti_misjudge: ['不是缺乏创意', '不是不够努力'],
  },
  {
    id: 'R7-control-anxiety',
    when: {
      trigger: '想掌控结果导致焦虑失眠',
      patterns: ['必须掌控', '结果不可控就焦虑', '反复确认', '失眠', '担心出错'],
      strengths: ['追求', '统率', '审慎', 'significance', 'command', 'deliberative'],
    },
    because: {
      diagnosis: '把“可控结果”作为安全前提。',
      evidence: ['反复监控结果', '无法承受不确定性'],
      strengths: ['统率/追求倾向主导结果'],
    },
    conclude: '优先判定为“控制偏好过度”，而非简单压力管理问题。',
    do_more: ['把注意力放在可控过程', '设定过程指标而非结果指标', '建立止损条件'],
    do_less: ['高频监控结果', '在夜间反复推演结果'],
    boundary: ['写出可控/不可控清单', '超过边界停止投入'],
    check_rule: '若无法控制，就不再用结果衡量自己。',
    anti_misjudge: ['不是不够努力', '不是抗压差'],
  },
  {
    id: 'R8-external-validation',
    when: {
      trigger: '外界评价驱动导致自我否定',
      patterns: ['别人怎么看', '怕被否定', '自我否定', '需要认可', '比较'],
      strengths: ['追求', '取悦', '自信', 'significance', 'woo', 'self-assurance'],
    },
    because: {
      diagnosis: '把外界认可当成自我价值判断的唯一来源。',
      evidence: ['决策依赖反馈', '情绪随评价波动'],
      strengths: ['追求/取悦放大外界反馈的重要性'],
    },
    conclude: '优先判定为“外部评价主导”，而非能力不足。',
    do_more: ['设定内部标准', '用过程证据校准自我评价', '缩小反馈来源范围'],
    do_less: ['频繁刷新评价', '把否定当成全面评价'],
    boundary: ['设定反馈窗口与频率', '将评价限定在关键人'],
    check_rule: '以内部标准完成决策后再看反馈。',
    anti_misjudge: ['不是自尊低', '不是没有能力'],
  },
];
