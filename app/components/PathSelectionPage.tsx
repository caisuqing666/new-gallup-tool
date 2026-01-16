'use client';

import { motion } from 'framer-motion';
import { PathId, PATH_DESCRIPTIONS } from '@/lib/types';
import { isPathImplemented } from '@/lib/path-config';

interface PathSelectionPageProps {
  onSelectPath: (_pathId: PathId) => void;
  onBack: () => void;
}

// 路径卡片顺序（按照用户需求排列）
const PATH_ORDER: PathId[] = [
  'report-interpret',  // 我不太懂这份报告
  'career-match',      // 我想找到适合的职业方向
  'breakthrough',      // 我遇到了具体问题
  'strength-guide',    // 我想更好地发挥自己
];

export default function PathSelectionPage({ onSelectPath, onBack }: PathSelectionPageProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 顶部导航 */}
      <header className="px-4 sm:px-6 py-4 sm:py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">返回</span>
        </button>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto w-full">
          {/* 标题 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-8 sm:mb-12"
          >
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-3 sm:mb-4">
              选择你想要的帮助方式
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              根据你的需求，选择最合适的入口
            </p>
          </motion.div>

          {/* 4入口卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto"
          >
            {PATH_ORDER.map((pathId, index) => {
              const pathInfo = PATH_DESCRIPTIONS[pathId];
              const isImplemented = pathId === 'report-interpret' || isPathImplemented(pathId);

              return (
                <motion.button
                  key={pathId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  onClick={() => isImplemented && onSelectPath(pathId)}
                  disabled={!isImplemented}
                  className={`
                    relative p-6 sm:p-8 rounded-2xl text-left transition-all duration-300
                    ${isImplemented
                      ? 'bg-gray-50 hover:bg-white hover:shadow-lg hover:scale-[1.02] cursor-pointer border border-gray-100 hover:border-[#5D4037]/30'
                      : 'bg-gray-50/50 cursor-not-allowed border border-gray-100 opacity-60'
                    }
                  `}
                >
                  {/* 图标 */}
                  <div className="text-3xl sm:text-4xl mb-4">
                    {pathInfo.icon}
                  </div>

                  {/* 标题 */}
                  <h3 className={`
                    text-lg sm:text-xl font-bold mb-2
                    ${isImplemented ? 'text-black' : 'text-gray-400'}
                  `}>
                    {pathInfo.title}
                  </h3>

                  {/* 副标题 */}
                  <p className={`
                    text-sm sm:text-base
                    ${isImplemented ? 'text-gray-600' : 'text-gray-400'}
                  `}>
                    {pathInfo.subtitle}
                  </p>

                  {/* 未实现标记 */}
                  {!isImplemented && (
                    <div className="absolute top-4 right-4">
                      <span className="text-xs px-2 py-1 bg-gray-200 text-gray-500 rounded-full">
                        即将推出
                      </span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </main>

      {/* 底部装饰 */}
      <div className="pb-6 sm:pb-8 text-center">
        <p className="text-xs sm:text-sm text-gray-400">
          基于盖洛普优势理论 · 用 AI 解读你的独特天赋
        </p>
      </div>
    </div>
  );
}
