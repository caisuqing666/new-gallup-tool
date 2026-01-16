'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_STRENGTHS } from '@/lib/gallup-strengths';

const LOADING_PHASES = [
  { text: '分析优势组合...', duration: 2000 },
  { text: '识别优势冲突...', duration: 2000 },
  { text: '生成行动方案...', duration: 2000 },
  { text: '优化建议输出...', duration: 1500 },
];

const ESTIMATED_TIME = LOADING_PHASES.reduce((acc, phase) => acc + phase.duration, 0);

interface LoadingPageProps {
  selectedStrengths: string[];
  confusion: string;
  onCancel?: () => void;
}

export default function LoadingPage({ selectedStrengths, confusion, onCancel }: LoadingPageProps) {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    // 进度动画
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 100 / (ESTIMATED_TIME / 100);
      });
    }, 100);
    
    // 阶段切换
    let delay = 0;
    LOADING_PHASES.forEach((_, index) => {
      setTimeout(() => {
        setCurrentPhase(index);
      }, delay);
      delay += 2000;
    });
    
    // 计时器
    const timer = setInterval(() => {
      setElapsed(prev => prev + 100);
    }, 100);
    
    return () => {
      clearInterval(progressInterval);
      clearInterval(timer);
    };
  }, []);
  
  // 格式化时间显示
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };
  
  const remainingTime = ESTIMATED_TIME - elapsed;

  // 获取前两个优势名称
  const strengthNames = selectedStrengths
    .slice(0, 2)
    .map(id => ALL_STRENGTHS.find(s => s.id === id)?.name)
    .filter(Boolean)
    .join('、') || '优势';

  // 提取困惑关键词（前15个字符）
  const confusionPreview = confusion.slice(0, 15) + (confusion.length > 15 ? '...' : '');

  if (!mounted) {
    return <div className="min-h-screen bg-bg-primary" />;
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-lg mx-auto text-center px-2">
        {/* 加载动画 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          {/* 圆环动画 */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            {/* 外圈 */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-border-light"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
            {/* 中圈 */}
            <motion.div
              className="absolute inset-2 rounded-full border-4 border-brand/30"
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
            {/* 内圈 - 进度指示 */}
            <motion.div
              className="absolute inset-4 rounded-full border-4 border-transparent border-t-brand"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
            {/* 中心点 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-4 h-4 rounded-full bg-brand"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </div>

          {/* 加载文字 */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-text-primary mb-3 sm:mb-4"
          >
            正在生成你的行动方案
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm sm:text-base text-text-tertiary leading-relaxed mb-4 sm:mb-6"
          >
            基于你的「<span className="text-brand font-medium">{strengthNames}</span>」优势
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            分析「{confusionPreview}」的根源...
          </motion.p>

          {/* 进度条 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="max-w-xs mx-auto mb-6"
          >
            <div className="h-2 bg-border-light rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-brand to-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-text-muted">
              <span>{Math.round(progress)}%</span>
              <span>预计剩余 {formatTime(Math.max(0, remainingTime))}</span>
            </div>
          </motion.div>

          {/* 当前阶段 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <span className="text-sm text-text-secondary">{LOADING_PHASES[currentPhase]?.text}</span>
            </motion.div>
          </AnimatePresence>

          {/* 进度点 */}
          <div className="flex justify-center gap-2 mb-6">
            {LOADING_PHASES.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i <= currentPhase ? 'bg-brand' : 'bg-border-light'
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* 提示文字 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-text-muted mb-6"
        >
          AI 正在深度解读你的优势组合，请稍候...
        </motion.p>

        {/* 取消按钮 */}
        {onCancel && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={onCancel}
            className="btn-ghost"
          >
            取消生成
          </motion.button>
        )}
      </div>
    </div>
  );
}
