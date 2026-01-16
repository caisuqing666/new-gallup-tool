'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ReportInterpretResult } from '@/lib/types';
import { DOMAIN_COLORS } from '@/lib/gallup-strengths';

interface ReportResultPlaceholderProps {
  reportData: ReportInterpretResult;
  onBack: () => void;
}

export default function ReportResultPlaceholder({
  reportData,
  onBack,
}: ReportResultPlaceholderProps) {
  const [mounted, setMounted] = useState(false);

  useState(() => {
    setMounted(true);
  });

  if (!mounted) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary px-4 sm:px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <motion.button
          onClick={onBack}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 text-text-secondary hover:text-text-primary flex items-center gap-2 transition-colors"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>返回</span>
        </motion.button>

        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2 font-serif">
            报告解读
          </h1>
          <p className="text-text-secondary text-sm">基于识别的 TOP5 优势生成</p>
        </motion.div>

        {/* 个人标签 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-gradient-to-br from-brand/15 to-accent/10 rounded-2xl p-6 border border-brand/20 text-center">
            <div className="text-4xl mb-3">✨</div>
            <h2 className="text-xl font-bold text-text-primary mb-2 font-serif">
              {reportData.personalLabel.label}
            </h2>
            <p className="text-sm text-text-secondary">{reportData.personalLabel.description}</p>
          </div>
        </motion.section>

        {/* TOP5 优势列表 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-4 font-serif">
            你的 TOP5 优势
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reportData.top5Strengths.map((strength) => (
              <motion.div
                key={strength.rank}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: strength.rank * 0.1 }}
                className="bg-bg-card rounded-xl p-4 border border-border-light"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-brand">{strength.rank}</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{strength.name}</p>
                    <p className="text-xs text-text-tertiary">{strength.domain}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 总结 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-4 font-serif">
            一句话解读
          </h2>
          <div className="bg-gradient-to-br from-brand/10 to-accent/5 rounded-xl p-6 border border-brand/20">
            <p className="text-text-secondary leading-relaxed">{reportData.summary}</p>
          </div>
        </motion.section>

        {/* 领域分析 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-4 font-serif">
            领域分布
          </h2>
          <div className="bg-bg-card rounded-xl p-6 border border-border-light">
            <div className="space-y-4">
              {reportData.domainAnalysis.map((domain) => (
                <div key={domain.domain}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-text-primary">{domain.domain}</span>
                    <span className="text-sm text-text-secondary">{domain.count}项 ({domain.percentage}%)</span>
                  </div>
                  <div className="w-full bg-bg-primary rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${domain.percentage}%`,
                        backgroundColor: DOMAIN_COLORS[domain.domain.toLowerCase() as keyof typeof DOMAIN_COLORS] || '#6366f1',
                      }}
                    />
                  </div>
                  {domain.characteristics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {domain.characteristics.map((char, idx) => (
                        <span key={idx} className="text-xs bg-bg-primary text-text-secondary px-2 py-1 rounded-md">
                          {char}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* 优势解读 - 展开式 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-4 font-serif">
            优势详解
          </h2>
          <div className="space-y-4">
            {reportData.strengthInterpretations.map((interpretation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-bg-card rounded-xl border border-border-light overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-text-primary text-lg">{interpretation.name}</h3>
                      <p className="text-xs text-text-tertiary">{interpretation.domain}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-brand">{index + 1}</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-text-primary">这是什么：</span>
                      <p className="text-text-secondary mt-1">{interpretation.whatItIs}</p>
                    </div>

                    <div>
                      <span className="font-medium text-text-primary">你的表现：</span>
                      <p className="text-text-secondary mt-1">{interpretation.yourStrength}</p>
                    </div>

                    <div className="bg-status-warning/5 rounded-lg p-3 border border-status-warning/10">
                      <span className="font-medium text-status-warning">注意：</span>
                      <p className="text-text-secondary mt-1">{interpretation.watchOut}</p>
                    </div>

                    {interpretation.bestWhen.length > 0 && (
                      <div>
                        <span className="font-medium text-text-primary">最佳场景：</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {interpretation.bestWhen.map((scenario, idx) => (
                            <span key={idx} className="text-xs bg-brand/10 text-brand px-2 py-1 rounded-md">
                              {scenario}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {interpretation.pairWith.length > 0 && (
                      <div>
                        <span className="font-medium text-text-primary">搭配优势：</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {interpretation.pairWith.map((strength, idx) => (
                            <span key={idx} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-md">
                              +{strength}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 组合解读 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-4 font-serif">
            优势组合分析
          </h2>
          <div className="bg-bg-card rounded-xl p-6 border border-border-light space-y-4">
            <div>
              <h3 className="font-medium text-brand mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                核心驱动力
              </h3>
              <p className="text-text-secondary text-sm">{reportData.comboInterpretation.coreDrive}</p>
            </div>

            {reportData.comboInterpretation.potentialTraps.length > 0 && (
              <div className="bg-status-warning/5 rounded-lg p-4 border border-status-warning/10">
                <h3 className="font-medium text-status-warning mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  潜在陷阱
                </h3>
                <ul className="space-y-1">
                  {reportData.comboInterpretation.potentialTraps.map((trap, idx) => (
                    <li key={idx} className="text-text-secondary text-sm flex items-start gap-2">
                      <span className="text-status-warning mt-1">•</span>
                      {trap}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {reportData.comboInterpretation.synergies.length > 0 && (
              <div>
                <h3 className="font-medium text-accent mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  协同效应
                </h3>
                <ul className="space-y-1">
                  {reportData.comboInterpretation.synergies.map((synergy, idx) => (
                    <li key={idx} className="text-text-secondary text-sm flex items-start gap-2">
                      <span className="text-accent mt-1">✦</span>
                      {synergy}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.section>

        {/* 关键洞察 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-4 font-serif">
            关键洞察
          </h2>
          <div className="space-y-3">
            {reportData.keyInsights.map((insight, index) => (
              <div key={index} className="bg-bg-card rounded-lg p-4 border border-border-light flex items-start gap-3">
                <div
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{
                    backgroundColor: DOMAIN_COLORS['strategic' as keyof typeof DOMAIN_COLORS],
                  }}
                />
                <p className="text-text-secondary text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* 建议路径 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-4 font-serif">
            建议的下一步
          </h2>
          <div className="space-y-3">
            {reportData.suggestedPaths.map((path) => (
              <div key={path.path} className="bg-accent/5 rounded-lg p-4 border border-accent/20">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h3 className="font-medium text-text-primary text-sm mb-1">{path.title}</h3>
                    <p className="text-text-secondary text-xs">{path.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* 个性化建议 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-4 font-serif">
            给你的建议
          </h2>
          <div className="bg-gradient-to-br from-brand/5 to-accent/5 rounded-xl p-6 border border-brand/10">
            <p className="text-text-secondary leading-relaxed whitespace-pre-line">{reportData.personalizedAdvice}</p>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
