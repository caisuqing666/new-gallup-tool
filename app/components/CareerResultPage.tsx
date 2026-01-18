'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CareerMatchResult } from '@/lib/types';
import { DOMAIN_COLORS } from '@/lib/gallup-strengths';
import Toast, { type ToastType } from './Toast';
import { exportToImage } from '@/lib/export';

interface CareerResultPageProps {
  careerData: CareerMatchResult;
  strengths: string[];
  onRegenerate?: () => void;
  onBack?: () => void;
}

// 单个职业匹配卡片
function CareerMatchCard({
  match,
  index,
}: {
  match: CareerMatchResult['topMatches'][number];
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 根据匹配分数获取颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-status-success';
    if (score >= 60) return 'text-status-warning';
    return 'text-status-error';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-status-success/10 border-status-success/20';
    if (score >= 60) return 'bg-status-warning/10 border-status-warning/20';
    return 'bg-status-error/10 border-status-error/20';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 overflow-hidden shadow-card"
    >
      {/* 标题栏 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/70 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 text-left">
            <div className="flex items-center gap-3">
              <h3 className="text-h4 font-serif text-text-primary">
                {match.careerName}
              </h3>
              <div
                className={`px-3 py-1 rounded-lg text-sm font-bold ${getScoreBg(
                  match.matchScore
                )} ${getScoreColor(match.matchScore)}`}
              >
                {match.matchScore}% 匹配
              </div>
            </div>
            <p className="text-body-sm text-text-secondary mt-1 line-clamp-2">
              {match.matchReason}
            </p>
          </div>
        </div>
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="w-5 h-5 text-text-secondary flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-4">
              {/* 优势使用方式 */}
              {match.strengthUsage.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text-muted mb-3">
                    你的优势如何发挥作用
                  </h4>
                  <div className="space-y-2">
                    {match.strengthUsage.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-bg-secondary rounded-lg p-3 flex items-start gap-3 shadow-inner-soft border border-border-light"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 shadow-soft"
                          style={{
                            backgroundColor:
                              DOMAIN_COLORS[item.strengthId as keyof typeof DOMAIN_COLORS] || DOMAIN_COLORS['strategic'],
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-primary mb-1">
                            {item.strengthId}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {item.usage}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 需要注意 */}
              {match.watchOut && (
                <div>
                  <h4 className="text-sm font-medium text-text-muted mb-2">
                    需要注意
                  </h4>
                  <div className="bg-bg-secondary rounded-lg p-3 border border-status-warning/20 shadow-inner-soft">
                    <p className="text-sm text-status-warning leading-relaxed">{match.watchOut}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// 通用职业建议组件
function GeneralAdviceSection({
  advice,
}: {
  advice: CareerMatchResult['generalAdvice'];
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/80 shadow-card"
    >
      <h3 className="text-h4 font-serif text-text-primary mb-4">
        通用职业建议
      </h3>
      <div className="space-y-4">
        {/* 核心优势 */}
        <div className="bg-bg-secondary rounded-lg p-4 shadow-inner-soft border border-border-light">
          <p className="text-caption text-text-muted mb-2">💡 核心优势</p>
          <p className="text-body-sm text-text-primary leading-relaxed">
            {advice.coreStrengthToUse}
          </p>
        </div>

        {/* 能量管理 */}
        <div className="bg-bg-secondary rounded-lg p-4 shadow-inner-soft border border-border-light">
          <p className="text-caption text-text-muted mb-2">⚡ 能量管理</p>
          <p className="text-body-sm text-text-primary leading-relaxed">
            {advice.energyManagement}
          </p>
        </div>

        {/* 成长方向 */}
        <div className="bg-bg-secondary rounded-lg p-4 shadow-inner-soft border border-border-light">
          <p className="text-caption text-text-muted mb-2">🚀 成长方向</p>
          <p className="text-body-sm text-text-primary leading-relaxed">
            {advice.growthDirection}
          </p>
        </div>
      </div>
    </motion.section>
  );
}

// 主组件
export default function CareerResultPage({
  careerData,
  strengths: _strengths,
  onRegenerate,
  onBack,
}: CareerResultPageProps) {
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
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
        filename: `career_match_${Date.now()}`,
        format: 'png',
        scale: 2,
      });

      setToast({ message: '已保存到本地', type: 'success' });
    } catch {
      setToast({ message: '保存失败', type: 'error' });
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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

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
              <span>返回修改</span>
            </motion.button>
          )}

          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-h2 font-serif text-text-primary mb-2">
              职业匹配分析
            </h1>
            <p className="text-body-lg text-text-secondary">
              基于你的 TOP5 优势生成
            </p>
          </motion.div>

          {/* 内容区域 - 添加 ref 用于导出 */}
          <div ref={contentRef} className="space-y-6">
            {/* TOP 匹配职业 */}
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4 font-serif">
                最佳匹配职业 TOP{careerData.topMatches.length}
              </h2>
              <div className="space-y-3">
                {careerData.topMatches.map((match, index) => (
                  <CareerMatchCard key={match.careerId} match={match} index={index} />
                ))}
              </div>
            </div>

            {/* 通用职业建议 */}
            <GeneralAdviceSection advice={careerData.generalAdvice} />
          </div>

          {/* 底部操作按钮 */}
          <div className="mt-8 flex gap-4 justify-center p-4 bg-white/60 backdrop-blur-md rounded-2xl shadow-elevated border border-white/80">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="w-full px-6 py-3 border-2 border-border-light rounded-xl text-text-primary font-semibold hover:bg-bg-card transition-colors"
              >
                重新生成
              </button>
            )}
            <button
              onClick={handleSaveAsImage}
              disabled={isSaving}
              className="w-full px-6 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 shadow-glow hover:shadow-glow-lg"
            >
              {isSaving ? '保存中...' : '保存报告'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
