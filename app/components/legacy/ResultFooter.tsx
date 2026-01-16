'use client';

import { motion } from 'framer-motion';
import { ResultData } from '@/lib/types';

interface ResultFooterProps {
  data: ResultData;
  isSaving: boolean;
  onSave?: (_data: ResultData) => void;
  onRegenerate?: () => void;
  onHandleSaveClick: () => void;
  onExportPDF?: () => void;
}

export default function ResultFooter({ isSaving, onSave, onRegenerate, onHandleSaveClick, onExportPDF }: ResultFooterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex flex-col gap-3 mt-8 sm:mt-12 px-4"
    >
      {/* 主要操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onSave && (
          <motion.button
            onClick={onHandleSaveClick}
            disabled={isSaving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary w-full sm:w-auto min-h-[48px] touch-manipulation"
          >
            {isSaving ? '保存中...' : '保存为图片'}
          </motion.button>
        )}
        {onExportPDF && (
          <motion.button
            onClick={onExportPDF}
            disabled={isSaving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-secondary w-full sm:w-auto min-h-[48px] touch-manipulation"
          >
            导出 PDF
          </motion.button>
        )}
        {onRegenerate && (
          <motion.button
            onClick={onRegenerate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-ghost w-full sm:w-auto min-h-[48px] touch-manipulation"
          >
            看看别的卡点
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
