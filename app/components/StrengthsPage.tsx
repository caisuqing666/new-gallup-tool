'use client';

import { useState, useMemo } from 'react';
import { ALL_STRENGTHS, DOMAIN_COLORS, DOMAIN_NAMES, StrengthId, StrengthDomain } from '@/lib/gallup-strengths';

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

  // 根据路径获取按钮文本
  const getButtonText = () => {
    switch (path) {
      case 'career-match':
        return '生成适合你的职业方向';
      case 'strength-guide':
        return '生成优势发挥指南';
      case 'breakthrough':
      default:
        return '下一步：描述困惑';
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
    <div className="min-h-screen bg-bg-primary px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto">
        {/* 返回按钮 */}
        {onBack && (
          <button
            onClick={onBack}
            className="back-button mb-10"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>返回</span>
          </button>
        )}

        {/* 步骤指示器 */}
        <div className="step-indicator mb-12">
          <div className="step-dot-completed" />
          <div className="step-dot-active rounded-full" />
          <div className="step-dot-inactive" />
          <span className="text-sm text-text-muted ml-3">步骤 2 / 3</span>
        </div>

        {/* 标题区 */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-text-primary mb-3 sm:mb-4">
            选择你的 <span className="text-gradient">Top 5</span> 优势
          </h1>
          <p className="text-base sm:text-lg text-text-tertiary mb-4 sm:mb-6 px-2">
            按报告顺序选择你最突出的 3-5 项优势
          </p>

          {/* 选择计数器 */}
          <div className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
            ${canProceed
              ? 'bg-status-success/10 text-status-success border border-status-success/20'
              : 'bg-bg-secondary text-text-tertiary border border-border'
            }
          `}>
            <span>已选择</span>
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
                    ? 'text-white shadow-card'
                    : 'bg-bg-card text-text-secondary border border-border hover:border-border-dark'
                  }
                `}
                style={{
                  backgroundColor: isActive ? color : undefined,
                }}
              >
                {DOMAIN_NAMES[domain]}
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
        <div className="bg-bg-card rounded-2xl border border-border-light p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
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
                    border border-border-light shadow-card
                    ${isSelected
                      ? 'bg-bg-card text-text-primary'
                      : isDisabled
                        ? 'bg-bg-secondary text-text-muted cursor-not-allowed opacity-50 border-border'
                        : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary hover:text-text-primary hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.98]'
                    }
                  `}
                  style={{
                    borderLeft: isSelected ? `4px solid ${color}` : undefined,
                    boxShadow: isSelected 
                      ? `0 0 0 4px ${color}33, 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)` 
                      : undefined,
                  }}
                >
                  {rank && (
                    <span 
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-soft"
                      style={{ backgroundColor: color }}
                    >
                      {rank}
                    </span>
                  )}
                  {strength.name}
                </button>
              );
            })}
        </div>
      </div>

      {/* 已选优势列表 */}
      {selectedStrengths.length > 0 && (
        <div className="mb-8 sm:mb-12 px-2">
          <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4 text-center">
            已选优势排序
          </h3>
          <div className="space-y-2 max-w-2xl mx-auto">
            {selectedStrengths.map((strengthId, index) => {
              const strength = ALL_STRENGTHS.find(s => s.id === strengthId);
              if (!strength) return null;
              const color = DOMAIN_COLORS[strength.domain];
              const canMoveUp = index > 0 && onMoveUp;
              const canMoveDown = index < selectedStrengths.length - 1 && onMoveDown;

              return (
                <div
                  key={strengthId}
                  className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-bg-card rounded-xl border border-border-light"
                >
                  {/* 排名标识 */}
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {index + 1}
                  </div>

                  {/* 优势名称 */}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                    <span className="text-sm sm:text-base text-text-primary font-medium truncate">{strength.name}</span>
                    <span className="text-xs text-text-muted px-2 py-1 rounded-full bg-bg-secondary whitespace-nowrap">
                      {DOMAIN_NAMES[strength.domain]}
                    </span>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {canMoveUp && (
                      <button
                        onClick={() => onMoveUp(index)}
                        className="p-2 sm:p-2.5 min-w-[44px] min-h-[44px] rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors touch-manipulation"
                        title="上移"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    )}
                    {canMoveDown && (
                      <button
                        onClick={() => onMoveDown(index)}
                        className="p-2 sm:p-2.5 min-w-[44px] min-h-[44px] rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary active:bg-bg-tertiary transition-colors touch-manipulation"
                        title="下移"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => onSelectStrength(strengthId)}
                      className="p-2 sm:p-2.5 min-w-[44px] min-h-[44px] rounded-lg text-text-muted hover:text-status-error hover:bg-status-error/10 active:bg-status-error/20 transition-colors touch-manipulation"
                      title="移除"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 完成提示 */}
      {selectedStrengths.length === 5 && (
        <p className="text-center text-status-success font-medium mb-6">
          已捕捉到你的核心优势组合
        </p>
      )}

      {/* 底部操作区 */}
      <div className="flex justify-center px-4">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="btn-primary w-full sm:w-auto text-base sm:text-lg px-8 sm:px-12 py-3 sm:py-4 min-h-[48px] touch-manipulation"
        >
          {getButtonText()}
          <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      </div>
    </div>
  );
}
