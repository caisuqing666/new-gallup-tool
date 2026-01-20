'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExplainData, DecideData, GallupResult, PathDecision } from '@/lib/types';
import Toast, { type ToastType } from './Toast';
import { exportToImage } from '@/lib/export';
import { useTranslations } from 'next-intl';

// 解释页组件
function ExplainPage({ data }: { data: ExplainData }) {
  const tResult = useTranslations('resultPage');
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-h2 font-serif text-text-primary mb-2">
          {tResult('explain.title')}
        </h1>
        <p className="text-body-lg text-text-secondary text-sm">
          {tResult('explain.subtitle')}
        </p>
      </div>

      {/* 单优势行为表现 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 p-6 shadow-card"
      >
        <h2 className="text-h4 font-serif text-text-primary mb-4">{tResult('explain.sections.strengths')}</h2>
        <div className="space-y-4">
          {data.strengthManifestations.map((item, index) => (
            <div key={index} className="bg-bg-secondary rounded-xl p-4">
              <div className="text-brand font-medium text-body mb-2">{item.strengthId}</div>
              <p className="text-text-secondary leading-relaxed text-body-sm">{item.behaviors}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* 优势组合互动 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 p-6 shadow-card"
      >
        <h2 className="text-h4 font-serif text-text-primary mb-4">{tResult('explain.sections.interactions')}</h2>
        <p className="text-text-secondary leading-relaxed text-body-sm">{data.strengthInteractions}</p>
      </motion.section>

      {/* 认知盲区 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/60 backdrop-blur-md rounded-2xl border border-status-warning/60 p-6 shadow-card"
      >
        <h2 className="text-h4 font-serif text-status-warning mb-4">{tResult('explain.sections.blindspots')}</h2>
        <p className="text-text-secondary leading-relaxed text-body-sm">{data.blindspots}</p>
      </motion.section>

      {/* 总结性说明 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-brand/10 backdrop-blur-sm border-l-4 border-brand rounded-r-2xl p-6 shadow-card"
      >
        <p className="text-text-primary font-medium text-body leading-relaxed">{data.summary}</p>
      </motion.section>
    </motion.div>
  );
}

// 判定页组件 - 新中式赛博风格
function DecidePage({ data }: { data: DecideData }) {
  const tResult = useTranslations('resultPage');
  // 拆分 pathLogic 为步骤
  const logicSteps = data.pathLogic
    .split(/[。；，\n]/)
    .map(step => step.trim())
    .filter(step => step.length > 0)
    .slice(0, 4);

  // 限制行动建议最多 2 条
  const limitedDoMore = data.doMore.slice(0, 2);
  const limitedDoLess = data.doLess.slice(0, 2);
  const limitedBoundaries = data.boundaries.slice(0, 2);

  // 根据路径判定决定光效颜色
  const getGlowColor = () => {
    const glowColors = {
      [PathDecision.DOUBLE_DOWN]: 'rgba(91, 138, 114, 0.4)',  // 绿色 - 高能量
      [PathDecision.REFRAME]: 'rgba(184, 149, 107, 0.5)',   // 金棕色 - 调整中
      [PathDecision.NARROW]: 'rgba(107, 123, 140, 0.35)',    // 柔和蓝色 - 收敛中
      [PathDecision.EXIT]: 'rgba(184, 90, 90, 0.4)',        // 红色 - 低能量
    };
    return glowColors[data.pathDecision] || glowColors[PathDecision.NARROW];
  };

  // 生成系统签名时间戳
  const systemTimestamp = `SYSTEM_CHECK // ${new Date().toISOString().split('T')[0].replace(/-/g, '.')}`;

  // 获取路径判定对应的汉字（用于水印）
  const getVerdictChar = () => {
    const key = data.pathDecision;
    return tResult(`verdictChars.${key}`) || tResult('verdictChars.default');
  };

  const reframedInsight = data.reframedInsight;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* 页面标题 */}
      <div className="text-center mb-6">
        <h1 className="text-h2 font-serif text-text-primary mb-2">
          {tResult('decide.title')}
        </h1>
        <p className="text-body-lg text-text-secondary text-sm">
          {tResult('decide.subtitle')}
        </p>
      </div>

      {/* 复述式理解（高亮） */}
      {reframedInsight && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand/10 backdrop-blur-sm border-l-4 border-brand rounded-2xl p-6 shadow-card mb-6"
        >
          <p className="text-text-primary text-body-lg font-semibold leading-relaxed">
            {reframedInsight}
          </p>
        </motion.section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          判定核心区 - 两列布局（桌面端）
      ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左列：判定卡片 + 判断规则（占 2/3） */}
        <div className="lg:col-span-2 space-y-6">
          {/* 判定卡片 - 金缮黑盒风格 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative text-white rounded-2xl p-6 sm:p-8 shadow-elevated overflow-hidden border border-brand-dark/80 ring-1 ring-black/30"
            style={{
              backgroundImage: `linear-gradient(135deg, #4A3F35 0%, #3B332B 45%, #221E19 100%),
                url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
            }}
          >
            {/* 巨大水印 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <span className="text-[12rem] sm:text-[15rem] font-serif font-bold select-none text-white/50 animate-pulse-soft">
                {getVerdictChar()}
              </span>
            </div>

            {/* 呼吸光效边框 */}
            <div className="absolute inset-0 rounded-2xl animate-glow-pulse" style={{
              boxShadow: `inset 0 0 60px ${getGlowColor()}`,
            }} />

            {/* 判定对象标签 */}
            <div className="mb-6 relative z-10">
              <span className="inline-block px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-medium text-white/90 font-mono">
                {tResult('decide.decisionFor', { focus: data.problemFocus || tResult('decide.defaultFocus') })}
              </span>
            </div>

            {/* 主标题：超大衬线体 */}
            <h2 className="text-h1 font-serif leading-tight mb-4 relative z-10 text-white tracking-tight drop-shadow-[0_3px_8px_rgba(0,0,0,0.5)]">
              {tResult(`pathDecisionLabels.${data.pathDecision}`)}
            </h2>

            {/* 副标题：能量态说明 */}
            <p className="text-white/80 text-body-sm mb-6 relative z-10 font-mono">
              {tResult(`pathDecisionEnergy.${data.pathDecision}`)}
            </p>

            {/* 判断规则 */}
            <div className="border-t border-white/20 pt-4 mt-4 relative z-10">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-white/90 text-sm font-medium mb-1">{tResult('decide.checkToday')}</p>
                  <p className="text-white/85 text-body-sm">{data.checkRule}</p>
                </div>
              </div>
            </div>

            {/* 系统签名时间戳 */}
            <div className="absolute bottom-4 right-6 text-xs font-mono text-white/30">
              {systemTimestamp}
            </div>
          </motion.section>

          {/* 路径推导链条 - 数据流脉络图风格 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white/85 backdrop-blur-md border border-white/70 rounded-2xl p-6 relative overflow-hidden shadow-card"
          >
            {/* 背景磨砂玻璃效果 */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 pointer-events-none" />

            <h3 className="text-h4 font-serif text-text-primary mb-6 flex items-center gap-2 relative z-10">
              <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {tResult('decide.pathLogic')}
            </h3>

            {/* 脉络图：垂直连线 + 节点 */}
            <div className="space-y-0 relative z-10">
              {logicSteps.map((step, index) => (
                <div key={index} className="relative">
                  {/* 垂直连线（除了最后一个） */}
                  {index < logicSteps.length - 1 && (
                    <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-brand/30" />
                  )}

                  {/* 节点 + 内容 */}
                  <div className="flex items-start gap-4 pb-6">
                    {/* 节点：空心圆圈 */}
                    <div className="relative flex-shrink-0">
                      <div className="w-6 h-6 rounded-full border-2 border-brand bg-white flex items-center justify-center animate-circuit-power" style={{ animationDelay: `${index * 0.15}s` }}>
                        <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                      </div>
                    </div>

                    {/* 步骤内容 */}
                    <p className="text-text-primary text-body-sm leading-relaxed flex-1 pt-0.5">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* 补充证据 - 弱化样式 */}
          {data.pathReason && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/70 p-5 shadow-inner-soft"
          >
              <h3 className="text-sm font-medium text-text-secondary mb-2">{tResult('decide.extraEvidence')}</h3>
              <p className="text-text-primary text-body-sm leading-relaxed">{data.pathReason}</p>
            </motion.section>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            右列：行动执行区（占 1/3）
        ═══════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          {/* 更应该做 - 处方签/增益芯片风格 */}
          {limitedDoMore.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative bg-white/85 backdrop-blur-md rounded-2xl p-5 border border-accent/60 overflow-hidden shadow-card"
            >
              {/* 渐变边框光效 */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/20 via-transparent to-accent/20 opacity-50 pointer-events-none" />

              <h3 className="text-h4 font-serif text-text-primary mb-4 flex items-center gap-2 relative z-10">
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                {tResult('decide.mustDo')}
              </h3>
              <div className="space-y-3 relative z-10">
                {limitedDoMore.map((item, index) => (
                  <div key={index} className="bg-bg-secondary rounded-lg p-4 border border-accent/20 shadow-soft">
                    <p className="text-text-primary font-medium text-body-sm mb-2">{item.action}</p>
                    <p className="text-text-secondary text-caption mb-1 font-mono">⏰ {item.timing}</p>
                    <p className="text-text-secondary text-caption">✓ {item.criteria}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* 更应该少做 - 封条/禁令卡风格 */}
          {limitedDoLess.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative bg-white/85 backdrop-blur-md rounded-2xl p-5 border border-status-error/60 overflow-hidden shadow-card"
            >
              {/* 渐变边框光效 */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-status-error/20 via-transparent to-status-error/20 opacity-50 pointer-events-none" />

              <h3 className="text-h4 font-serif text-text-primary mb-4 flex items-center gap-2 relative z-10">
                <svg className="w-5 h-5 text-status-error" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                </svg>
                {tResult('decide.mustStop')}
              </h3>
              <div className="space-y-3 relative z-10">
                {limitedDoLess.map((item, index) => (
                  <div key={index} className="bg-bg-secondary rounded-lg p-4 border border-status-error/20 shadow-soft relative overflow-hidden">
                    {/* 删除线动效 */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-status-error/50 animate-strike-through" style={{ animationDelay: `${index * 0.1}s` }} />

                    <p className="text-text-primary font-medium text-body-sm mb-1 line-through decoration-status-error/50 decoration-2">{item.action}</p>
                    <p className="text-text-secondary text-caption relative z-10">→ {item.replacement}</p>
                    <p className="text-text-muted text-caption mt-1 font-mono">
                      {tResult('decide.fromTiming', { timing: item.timing })}
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ═══════════════════════════════════════════════════════════
              责任边界 - 天平对照表风格（不折叠、左右对照）
          ═══════════════════════════════════════════════════════════ */}
          {limitedBoundaries.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/85 backdrop-blur-md rounded-2xl border border-white/70 p-6 shadow-card"
            >
              <h3 className="text-h4 font-serif text-text-primary mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
                {tResult('decide.responsibilityBoundary')}
              </h3>

              {/* 天平对照表：左右布局 */}
              <div className="space-y-4">
                {limitedBoundaries.map((item, index) => (
                  <div key={index} className="relative">
                    {/* 中心分隔线 */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />

                    {/* 左右对照 */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* 左侧：负责 */}
                      <div className="bg-bg-secondary rounded-lg p-4 text-right pr-6 shadow-inner-soft">
                        <p className="text-caption text-text-secondary mb-2 font-mono uppercase tracking-wide">
                          {tResult('decide.responsible')}
                        </p>
                        <p className="text-text-primary text-body-sm font-medium">{item.responsibleFor}</p>
                      </div>

                      {/* 右侧：不负责 */}
                      <div className="bg-bg-secondary rounded-lg p-4 text-left pl-6 shadow-inner-soft">
                        <p className="text-caption text-text-secondary mb-2 font-mono uppercase tracking-wide">
                          {tResult('decide.notResponsible')}
                        </p>
                        <p className="text-text-primary text-body-sm font-medium">{item.notResponsibleFor}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// 主页面组件
interface ResultPageProps {
  explainData: ExplainData;
  decideData: DecideData;
  onSave?: (_savedData: GallupResult) => void;
  onRegenerate?: () => void;
  onBack?: () => void;
}

export default function ResultPage({
  explainData,
  decideData,
  onSave,
  onRegenerate,
  onBack,
}: ResultPageProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'explain' | 'decide'>('explain');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const tResult = useTranslations('resultPage');

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 保存当前页面为图片
  const handleSaveAsImage = async () => {
    if (isSaving || !contentRef.current) return;

    setIsSaving(true);
    try {
      await exportToImage(contentRef.current, {
        filename: `gallup_${activeTab}_${Date.now()}`,
        format: 'png',
        scale: 2,
      });

      setToast({ message: tResult('toasts.saved'), type: 'success' });
      if (onSave) {
        onSave({ explain: explainData, decide: decideData });
      }
    } catch {
      setToast({ message: tResult('toasts.saveFailed'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-warm-gradient flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="min-h-screen bg-warm-gradient px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {/* 返回按钮 */}
          {onBack && (
            <motion.button
              onClick={onBack}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors duration-200 group bg-black/5 hover:bg-black/10 px-3 py-2 rounded-full mb-6"
            >
              <svg className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>{tResult('actions.back')}</span>
            </motion.button>
          )}

          {/* 页面切换标签 */}
          <div className="relative flex gap-2 mb-8 bg-white/60 backdrop-blur-md rounded-xl p-1.5 border border-white/80 shadow-soft">
            {['explain', 'decide'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'explain' | 'decide')}
                className={`relative flex-1 py-3 px-4 rounded-lg font-medium transition-colors duration-300
                  ${activeTab === tab ? 'text-white' : 'text-text-secondary hover:text-text-primary'}
                `}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute inset-0 bg-brand rounded-lg shadow-md"
                    style={{ zIndex: -1 }}
                  />
                )}
                <span className="relative z-10">
                  {tab === 'explain' ? tResult('tabs.explain') : tResult('tabs.decide')}
                </span>
              </button>
            ))}
          </div>

          {/* 内容区域 - 添加 ref 用于导出 */}
          <div ref={contentRef}>
            <AnimatePresence mode="wait">
              {activeTab === 'explain' ? (
                <motion.div
                  key="explain"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ExplainPage data={explainData} />
                </motion.div>
              ) : (
                <motion.div
                  key="decide"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <DecidePage data={decideData} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 底部操作按钮 */}
          <div className="mt-8 flex gap-4 justify-center p-4 bg-white/60 backdrop-blur-md rounded-2xl shadow-elevated border border-white/80">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="w-full px-6 py-3 border-2 border-border-light rounded-xl text-text-primary font-semibold hover:bg-bg-card transition-colors"
              >
                {tResult('actions.regenerate')}
              </button>
            )}
            <button
              onClick={handleSaveAsImage}
              disabled={isSaving}
              className="w-full px-6 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 shadow-glow hover:shadow-glow-lg"
            >
              {isSaving
                ? tResult('actions.saving')
                : activeTab === 'explain'
                  ? tResult('actions.saveExplain')
                  : tResult('actions.saveDecide')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
