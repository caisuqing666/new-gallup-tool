'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const t = useTranslations('landing');
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
    <div className="min-h-screen bg-warm-gradient flex flex-col relative">
      {/* 顶部导航栏 - 语言切换 */}
      <header className="absolute top-0 right-0 p-4 sm:p-6 z-20">
        <LanguageSwitcher />
      </header>

      {/* 右侧浮动图标 */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10">
        {/* 上方图标 - 网格/菜单 */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="w-10 h-10 bg-bg-card rounded-full flex items-center justify-center hover:bg-brand-subtle hover:shadow-card transition-all duration-200"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </motion.button>

        {/* 下方图标 - 聊天 */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="w-10 h-10 bg-bg-card rounded-full flex items-center justify-center hover:bg-brand-subtle hover:shadow-card transition-all duration-200"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </motion.button>
      </div>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* 品牌标签 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 sm:mb-8"
          >
            <span className="inline-block px-4 py-2 bg-gray-100 text-gray-500 text-xs sm:text-sm rounded-full tracking-wider">
              {t('brand')}
            </span>
          </motion.div>

          {/* 主标题 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 sm:mb-6 tracking-tight leading-[1.1] px-2"
          >
            {t('title')}
            <br />
            <span className="text-brand">{t('subtitle')}</span>
          </motion.h1>

          {/* 副标题 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg md:text-xl text-gray-700 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4"
          >
            {t.rich('description', {
              highlight: (chunks) => <span className="font-bold">{chunks}</span>
            })}
          </motion.p>

          {/* CTA + 支付按钮 */}
          <div className="flex flex-col sm:flex-row items-start justify-center gap-4 mb-16 sm:mb-20">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={onStart}
              className="bg-brand hover:bg-brand-dark text-white px-8 h-12 inline-flex items-center justify-center rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
            >
              {t('cta')}
            </motion.button>
            <div className="flex flex-col items-center gap-2">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
                onClick={async () => {
                  const res = await fetch('/api/payment/checkout', { method: 'POST' });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                }}
                className="bg-brand hover:bg-brand-dark text-white px-7 h-12 inline-flex items-center justify-center rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-glow gap-3"
              >
                <span>{t('payCta')}</span>
                <span className="text-sm tracking-wide bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
                  $5.99
                </span>
              </motion.button>
              <span className="text-[11px] text-text-tertiary tracking-wide">
                One-time payment. No subscription.
              </span>
            </div>
          </div>

          {/* 特征数据统计 */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  delayChildren: 0.4, // 父容器出现后，子元素开始交错出现
                  staggerChildren: 0.1, // 每个子元素延迟 0.1s
                },
              },
              hidden: { opacity: 0, y: 20 },
            }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16"
          >
            {/* 34 项优势 */}
            <motion.div
              variants={{
                visible: { opacity: 1, y: 0 },
                hidden: { opacity: 0, y: 20 },
              }}
              className="text-center p-4 rounded-lg hover:bg-bg-secondary hover:shadow-card transition-all duration-200 cursor-default"
            >
              <div className="text-3xl sm:text-4xl font-bold text-black mb-1">34</div>
              <div className="text-sm text-gray-500">{t('stats.strengths')}</div>
            </motion.div>

            {/* AI 智能驱动 */}
            <motion.div
              variants={{
                visible: { opacity: 1, y: 0 },
                hidden: { opacity: 0, y: 20 },
              }}
              className="text-center p-4 rounded-lg hover:bg-bg-secondary hover:shadow-card transition-all duration-200 cursor-default"
            >
              <div className="text-3xl sm:text-4xl font-bold text-black mb-1">AI</div>
              <div className="text-sm text-gray-500">{t('stats.ai')}</div>
            </motion.div>

            {/* 4 大领域 */}
            <motion.div
              variants={{
                visible: { opacity: 1, y: 0 },
                hidden: { opacity: 0, y: 20 },
              }}
              className="text-center p-4 rounded-lg hover:bg-bg-secondary hover:shadow-card transition-all duration-200 cursor-default"
            >
              <div className="text-3xl sm:text-4xl font-bold text-black mb-1">4</div>
              <div className="text-sm text-gray-500">{t('stats.domains')}</div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* 底部装饰 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="pb-8 text-center"
      >
        <p className="text-sm text-gray-400">
          {t('footer')}
        </p>
      </motion.div>
    </div>
  );
}
