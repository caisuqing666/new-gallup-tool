'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SCENARIOS } from '@/lib/scenarios';
import { ScenarioId } from '@/lib/scenarios';
import { useTranslations } from 'next-intl';

interface ScenarioPageProps {
  selectedScenario?: ScenarioId;
  onSelectScenario: (_scenarioId: ScenarioId) => void;
  onNext: () => void;
  onBack?: () => void;
}

export default function ScenarioPage({
  selectedScenario,
  onSelectScenario,
  onNext,
  onBack,
}: ScenarioPageProps) {
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('scenarioPage');
  const tCommon = useTranslations('common');
  const tScenarios = useTranslations('scenarios');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="page-container"><div className="page-content" /></div>;
  }

  return (
    <div className="min-h-screen bg-warm-gradient px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
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
          className="step-indicator mb-12"
        >
          <div className="step-dot-active rounded-full" />
          <div className="step-dot-inactive" />
          <div className="step-dot-inactive" />
          <span className="text-sm text-text-muted ml-3">{t('stepLabel')}</span>
        </motion.div>

        {/* 标题区 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mb-8 sm:mb-12 text-center"
        >
          <h1 className="text-h2 font-serif text-text-primary mb-3 sm:mb-4">
            {t('title')}
          </h1>
          <p className="text-body-lg text-text-secondary max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* 场景卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {SCENARIOS.map((scenario, index) => {
            const isSelected = selectedScenario === scenario.id;

            return (
              <motion.button
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05, duration: 0.5 }}
                onClick={() => onSelectScenario(scenario.id)}
                className={`
                  text-left p-6 rounded-2xl border transition-all duration-300
                  group
                  ${isSelected
                    ? 'bg-white/80 backdrop-blur-sm shadow-elevated border-brand ring-2 ring-brand/50'
                    : 'bg-white/50 backdrop-blur-sm shadow-card border-transparent hover:shadow-elevated hover:-translate-y-1 hover:border-brand/50'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className={`text-label transition-colors duration-300 ${
                    isSelected ? 'text-brand' : 'text-text-muted'
                  }`}>
                    {t('scenarioLabel', { index: String(index + 1).padStart(2, '0') })}
                  </span>

                  {/* 选中指示器 */}
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                    ${isSelected
                      ? 'border-brand bg-brand'
                      : 'border-border-dark bg-transparent group-hover:border-brand'
                    }
                  `}>
                    {isSelected && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    )}
                  </div>
                </div>

                <h3 className="text-h4 font-serif text-text-primary">
                  {tScenarios(`${scenario.id}.title`)}
                </h3>
              </motion.button>
            );
          })}
        </div>

        {/* 底部操作区 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 bg-white/60 backdrop-blur-md rounded-2xl shadow-elevated border border-white/80"
        >
          <p className="text-sm text-text-secondary text-center sm:text-left">
            {selectedScenario
              ? <span className="font-medium text-text-primary">{t('selectedConfirm')}</span>
              : t('selectPrompt')
            }
          </p>

          <motion.button
            onClick={onNext}
            disabled={!selectedScenario}
            whileHover={selectedScenario ? { scale: 1.02, y: -1 } : {}}
            whileTap={selectedScenario ? { scale: 0.98 } : {}}
            className="w-full sm:w-auto px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 shadow-lg disabled:shadow-none disabled:bg-gray-300 disabled:cursor-not-allowed bg-brand hover:bg-brand-dark"
          >
            {t('next')}
            <svg className="w-4 h-4 ml-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
