'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_STRENGTHS } from '@/lib/gallup-strengths';
import { useTranslations, useLocale } from 'next-intl';

interface InputPageProps {
  selectedStrengths: string[];
  confusion: string;
  onConfusionChange: (_confusion: string) => void;
  onSubmit: () => void;
  onBack?: () => void;
}

export default function InputPage({
  selectedStrengths,
  confusion,
  onConfusionChange,
  onSubmit,
  onBack,
}: InputPageProps) {
  const tInput = useTranslations('inputPage');
  const tCommon = useTranslations('common');
  const tStrengths = useTranslations('strengths');
  const locale = useLocale();
  const tips = useMemo(() => tInput.raw('tips') as string[], [tInput]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [tips]);

  const canSubmit = confusion.trim().length >= 10;
  const charCount = confusion.length;
  const maxChars = 800;

  // 获取已选优势名称
  const selectedStrengthNames = selectedStrengths
    .slice(0, 3)
    .map(id => ALL_STRENGTHS.find(s => s.id === id)?.id)
    .filter(Boolean)
    .map(id => tStrengths(id as string))
    .join(locale === 'en' ? ', ' : '、');

  // 解决 hydration 问题
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-warm-gradient flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-gradient px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        {/* 返回按钮 */}
        {onBack && (
          <motion.button
            onClick={onBack}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors duration-200 group bg-black/5 hover:bg-black/10 px-3 py-2 rounded-full mb-10"
          >
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{tCommon('back')}</span>
          </motion.button>
        )}

        {/* 步骤指示器 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 mb-12 p-2 bg-white/60 backdrop-blur-md rounded-full border border-white/80 shadow-soft w-fit"
        >
          <div className="w-3 h-3 rounded-full bg-brand" />
          <div className="w-3 h-3 rounded-full bg-brand" />
          <div className="w-3 h-3 rounded-full bg-brand" />
          <span className="text-sm text-text-secondary ml-1">{tInput('stepLabel')}</span>
        </motion.div>

        {/* 标题区 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="text-center mb-10"
        >
          <h1 className="text-h2 font-serif text-text-primary mb-3 sm:mb-4 px-2">
            {tInput('title')}
          </h1>
          <p className="text-body-lg text-text-secondary px-2 max-w-2xl mx-auto">
            {tInput('description', {
              strengths: selectedStrengthNames || tInput('strengthsFallback'),
            })}
          </p>
        </motion.div>

        {/* 提示卡片 - mounted 后才渲染，避免 hydration 不匹配 */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl p-4 mb-6 shadow-card"
          >
            <div className="flex items-start gap-3">
              <span className="text-brand text-lg flex-shrink-0">💡</span>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentTipIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-body-sm text-text-secondary leading-relaxed"
                >
                  {tips[currentTipIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* 输入区域 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="relative mb-8"
        >
          <div className={`
            relative rounded-2xl transition-all duration-300 bg-white/60 backdrop-blur-md shadow-card border border-white/80
            ${isFocused ? 'ring-2 ring-brand/50 ring-offset-2 ring-offset-bg-warm-gradient' : ''}
          `}>
            <textarea
              value={confusion}
              onChange={(e) => {
                const value = e.target.value.slice(0, maxChars);
                onConfusionChange(value);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              maxLength={maxChars}
              placeholder={tInput('placeholder')}
              className="w-full min-h-[200px] sm:min-h-[240px] text-body bg-transparent outline-none resize-none px-4 py-3 sm:px-4 sm:py-3 text-text-primary placeholder-text-tertiary"
            />

            {/* 底部信息栏 */}
            <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-2 sm:p-0">
              <p className="text-caption text-text-secondary hidden sm:block">{tInput('helper')}</p>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span className={`text-sm font-medium transition-colors ${charCount > maxChars * 0.9
                  ? 'text-status-error'
                  : charCount > maxChars * 0.7
                    ? 'text-status-warning'
                    : 'text-text-muted'
                  }`}>
                  {charCount}/{maxChars}
                </span>
                <div className="w-20 sm:w-16 h-1.5 sm:h-2 bg-border-light rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full transition-colors ${charCount > maxChars * 0.9
                      ? 'bg-status-error'
                      : charCount > maxChars * 0.7
                        ? 'bg-status-warning'
                        : 'bg-brand'
                      }`}
                    animate={{ width: `${Math.min((charCount / maxChars) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 提交区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center flex flex-col items-center gap-6 p-4 sm:p-6 bg-white/60 backdrop-blur-md rounded-2xl shadow-elevated border border-white/80"
        >
          <motion.button
            onClick={onSubmit}
            disabled={!canSubmit}
            whileHover={canSubmit ? { scale: 1.02, y: -1 } : {}}
            whileTap={canSubmit ? { scale: 0.98 } : {}}
            className="w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 rounded-lg text-white font-semibold transition-all duration-300 shadow-glow hover:shadow-glow-lg disabled:shadow-none disabled:bg-gray-300 disabled:cursor-not-allowed bg-brand hover:bg-brand-dark flex items-center justify-center min-h-[48px]"
          >
            {tInput('submitCta')}
          </motion.button>

          <p className="text-body-sm text-text-secondary">
            {canSubmit
              ? tInput('submitHint')
              : <span className="text-status-warning">{tInput('validationHint')}</span>
            }
          </p>
        </motion.div>
      </div>
    </div>
  );
}
