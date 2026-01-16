'use client';

import { motion } from 'framer-motion';
import { ResultData } from '@/lib/types';

interface BlindspotSectionProps {
  data: ResultData;
}

export default function BlindspotSection({ data }: BlindspotSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="bg-bg-card rounded-2xl border border-border-light p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-8 rounded-full bg-status-warning/10 text-status-warning flex items-center justify-center text-sm font-bold">2</span>
          <h2 className="text-lg font-semibold text-text-primary">盲区提醒</h2>
          <span className="text-xs text-text-muted bg-bg-secondary px-2 py-1 rounded-full">反直觉视角</span>
        </div>
        <p className="text-text-secondary leading-relaxed">{data.blindspot}</p>
      </div>
    </motion.section>
  );
}
