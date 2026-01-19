'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ALL_STRENGTHS, DOMAIN_COLORS, StrengthId, StrengthDomain } from '@/lib/gallup-strengths';
import { useTranslations } from 'next-intl';

interface StrengthsPageProps {
  selectedStrengths: StrengthId[];
  onSelectStrength: (_strengthId: StrengthId) => void;
  onMoveUp?: (_index: number) => void;
  onMoveDown?: (_index: number) => void;
  onNext: () => void;
  onBack?: () => void;
  path?: string; // 当前路径，用于显示不同的按钮文本
}

export default function StrengthsPage({
  selectedStrengths,
  onSelectStrength,
  onMoveUp,
  onMoveDown,
  onNext,
  onBack,
  path = 'breakthrough',
}: StrengthsPageProps) {
  const [activeTab, setActiveTab] = useState<StrengthDomain>('executing');
  const tCommon = useTranslations('common');
  const tStrengthsPage = useTranslations('strengthsPage');
  const tStrengths = useTranslations('strengths');
  const tDomains = useTranslations('domains');

  // 根据路径获取按钮文本
  const getButtonText = () => {
    switch (path) {
      case 'career-match':
        return tStrengthsPage('next.career');
      case 'strength-guide':
        return tStrengthsPage('next.guide');
      case 'breakthrough':
      default:
        return tStrengthsPage('next.breakthrough');
    }
  };

  const canProceed = selectedStrengths.length >= 3 && selectedStrengths.length <= 5;
  const selectedCount = selectedStrengths.length;

  // 按领域分组
  const strengthsByDomain = useMemo(() => ({
    executing: ALL_STRENGTHS.filter(s => s.domain === 'executing'),
    influencing: ALL_STRENGTHS.filter(s => s.domain === 'influencing'),
    relationship: ALL_STRENGTHS.filter(s => s.domain === 'relationship'),
    strategic: ALL_STRENGTHS.filter(s => s.domain === 'strategic'),
  }), []);

  const domains: StrengthDomain[] = ['executing', 'influencing', 'relationship', 'strategic'];

  const getRank = (strengthId: StrengthId) => {
    const index = selectedStrengths.indexOf(strengthId);
    return index >= 0 ? index + 1 : null;
  };
  return (
    <div className="min-h-screen bg-warm-gradient px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto">
        {/* 返回按钮 */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors duration-200 group bg-black/5 hover:bg-black/10 px-3 py-2 rounded-full mb-10"
          >
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{tCommon('back')}</span>
          </button>
        )}

        {/* 步骤指示器 */}
        <div className="flex items-center gap-2 mb-12 p-2 bg-white/60 backdrop-blur-md rounded-full border border-white/80 shadow-soft w-fit">
          <div className="w-3 h-3 rounded-full bg-brand" />
          <div className="w-3 h-3 rounded-full bg-brand" />
          <div className="w-3 h-3 rounded-full bg-border-light" />
          <span className="text-sm text-text-secondary ml-1">{tStrengthsPage('stepLabel')}</span>
        </div>

        {/* 标题区 */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-h2 font-serif text-text-primary mb-3 sm:mb-4">
            {tStrengthsPage('titlePrefix')}{' '}
            <span className="bg-gradient-to-r from-brand to-accent text-transparent bg-clip-text">
              {tStrengthsPage('titleHighlight')}
            </span>{' '}
            {tStrengthsPage('titleSuffix')}
          </h1>
          <p className="text-body-lg text-text-secondary mb-4 sm:mb-6 px-2 max-w-2xl mx-auto">
            {tStrengthsPage('subtitle')}
          </p>

          {/* 选择计数器 */}
          <div className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border
            ${canProceed
              ? 'bg-status-success/10 text-status-success border-status-success/20'
              : 'bg-bg-secondary text-text-tertiary border-border'
            }
          `}>
            <span>{tStrengthsPage('selectedLabel')}</span>
            <span className="font-bold">{selectedCount}</span>
            <span>/</span>
            <span>5</span>
          </div>
        </div>

        {/* 领域标签页 */}
        <div className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-8 px-2">
          {domains.map((domain) => {
            const isActive = activeTab === domain;
            const color = DOMAIN_COLORS[domain];
            const selectedInDomain = strengthsByDomain[domain].filter(
              s => selectedStrengths.includes(s.id)
            ).length;

            return (
              <button
                key={domain}
                onClick={() => setActiveTab(domain)}
                className={`
                  relative px-4 py-2 sm:px-5 sm:py-2.5 
                  min-h-[40px] sm:min-h-[44px]
                  rounded-full text-xs sm:text-sm font-medium 
                  transition-all duration-300 touch-manipulation
                  ${isActive
                    ? 'text-white shadow-card border border-transparent'
                    : 'bg-white/50 backdrop-blur-sm text-text-secondary border border-transparent hover:border-border hover:shadow-soft'
                  }
                `}
                style={{
                  backgroundColor: isActive ? color : undefined,
                  color: isActive ? 'white' : undefined, // 确保文字在有色背景上可见
                }}
              >
                {tDomains(domain)}
                {selectedInDomain > 0 && (
                  <span className={`
                    ml-2 px-1.5 py-0.5 text-xs rounded-full
                    ${isActive ? 'bg-white/20' : 'bg-bg-tertiary'}
                  `}>
                    {selectedInDomain}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 优势选择区 */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-card">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {strengthsByDomain[activeTab].map((strength) => {
              const isSelected = selectedStrengths.includes(strength.id);
              const rank = getRank(strength.id);
              const isDisabled = !isSelected && selectedStrengths.length >= 5;
              const color = DOMAIN_COLORS[strength.domain];

              return (
                <button
                  key={strength.id}
                  onClick={() => !isDisabled && onSelectStrength(strength.id)}
                  disabled={isDisabled}
                  className={`
                    relative px-4 py-2.5 sm:px-5 sm:py-3 
                    min-h-[44px] sm:min-h-[48px]
                    rounded-xl text-sm sm:text-base font-medium 
                    transition-all duration-300 touch-manipulation
                    border group
                    ${isSelected
                      ? `bg-bg-card text-text-primary border-[2px] border-[${color}] ring-2 ring-[${color}]/30 shadow-glow`
                      : isDisabled
                        ? 'bg-bg-secondary text-text-muted cursor-not-allowed opacity-50 border-border'
                        : 'bg-bg-card text-text-secondary border-transparent hover:border-[${color}]/50 hover:shadow-card hover:-translate-y-0.5 hover:bg-white/80 hover:text-text-primary active:scale-[0.98]'
                    }
                  `}
                >
                  {rank && (
                    <span 
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-soft transition-all duration-300 group-hover:scale-110"
                      style={{ backgroundColor: color }}
                    >
                      {rank}
                    </span>
                  )}
                  {tStrengths(strength.id)}
                </button>
              );
            })}
        </div>
      </div>

      {/* 已选优势列表 */}
      {selectedStrengths.length > 0 && (
        <div className="mb-8 sm:mb-12 px-2">
          <h3 className="text-h4 font-serif text-text-primary mb-3 sm:mb-4 text-center">
            {tStrengthsPage('selectedListTitle')}
          </h3>
          <motion.div layout className="space-y-2 max-w-2xl mx-auto">
            {selectedStrengths.map((strengthId, index) => {
              const strength = ALL_STRENGTHS.find(s => s.id === strengthId);
              if (!strength) return null;
              const color = DOMAIN_COLORS[strength.domain];
              const canMoveUp = index > 0 && onMoveUp;
              const canMoveDown = index < selectedStrengths.length - 1 && onMoveDown;

              return (
                <motion.div
                  layout
                  key={strengthId}
                  className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80 shadow-card"
                >
                  {/* 排名标识 */}
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white flex-shrink-0 shadow-soft"
                    style={{ backgroundColor: color }}
                  >
                    {index + 1}
                  </div>

                  {/* 优势名称 */}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                    <span className="text-body text-text-primary font-semibold truncate">{tStrengths(strength.id)}</span>
                    <span className="text-caption text-text-tertiary px-2 py-1 rounded-full bg-bg-secondary whitespace-nowrap">
                      {tDomains(strength.domain)}
                    </span>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {canMoveUp && (
                      <button
                        onClick={() => onMoveUp(index)}
                        className="p-2 sm:p-2.5 w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-brand-dark hover:bg-brand-subtle transition-colors touch-manipulation"
                        title={tStrengthsPage('moveUp')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    )}
                    {canMoveDown && (
                      <button
                        onClick={() => onMoveDown(index)}
                        className="p-2 sm:p-2.5 w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-brand-dark hover:bg-brand-subtle transition-colors touch-manipulation"
                        title={tStrengthsPage('moveDown')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => onSelectStrength(strengthId)}
                      className="p-2 sm:p-2.5 w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-status-error hover:bg-status-error/10 transition-colors touch-manipulation"
                      title={tStrengthsPage('remove')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}

      {/* 完成提示 */}
      {selectedStrengths.length === 5 && (
        <p className="text-center text-status-success font-medium text-body-lg mb-6">
          {tStrengthsPage('completed')}
        </p>
      )}

      {/* 底部操作区 */}
      <div className="flex justify-center px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 bg-white/60 backdrop-blur-md rounded-2xl shadow-elevated border border-white/80 w-full max-w-2xl">
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="w-full px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 shadow-lg disabled:shadow-none disabled:bg-gray-300 disabled:cursor-not-allowed bg-brand hover:bg-brand-dark flex items-center justify-center min-h-[48px]"
          >
            {getButtonText()}
            <svg className="w-4 h-4 ml-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
