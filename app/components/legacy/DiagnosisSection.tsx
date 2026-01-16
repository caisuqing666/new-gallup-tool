'use client';

/**
 * @deprecated 此组件已废弃，请使用 ResultPage.tsx 替代
 *
 * 此组件使用旧的数据结构（ResultData），已被新的结果页（ResultPage）替代。
 * 新的结果页使用 ExplainData 和 DecideData 分别展示"理解发生了什么"和"现在该怎么做"。
 *
 * @deprecated 请直接使用 ResultPage 组件，它提供了更好的用户体验和更清晰的数据结构
 *
 * @example
 * // 旧用法（已废弃）
 * import DiagnosisSection from './components/DiagnosisSection';
 * <DiagnosisSection data={resultData} />
 *
 * @example
 * // 新用法（推荐）
 * import ResultPage from './components/ResultPage';
 * <ResultPage explainData={explainData} decideData={decideData} />
 */

import { motion } from 'framer-motion';
import { ResultData } from '@/lib/types';
import { getScenarioConclusion } from '@/lib/scenario-conclusions';
import { ScenarioId } from '@/lib/scenarios';
import { getDiagnosisLabel } from '../result-helpers';

interface DiagnosisSectionProps {
  data: ResultData;
  scenario?: ScenarioId;
}

export default function DiagnosisSection({ data, scenario }: DiagnosisSectionProps) {
  // 获取场景对应的三段式结论
  const scenarioConclusion = scenario ? getScenarioConclusion(scenario) : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="bg-bg-card rounded-2xl border border-border-light p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-8 h-8 rounded-full bg-domain-strategic/10 text-domain-strategic flex items-center justify-center text-sm font-bold">1</span>
          <h2 className="text-lg font-semibold text-text-primary">系统诊断</h2>
        </div>

        {/* 三段式结论结构 */}
        {scenarioConclusion ? (
          <DiagnosisContent scenarioConclusion={scenarioConclusion} scenario={scenario} />
        ) : (
          // 如果没有场景结论，显示原来的 judgment
          <p className="text-text-secondary leading-relaxed">{data.judgment}</p>
        )}

        {/* 系统诊断补充说明（有内耗 / Basement 时统一用人话总结） */}
        {/* Legacy code commented out - unused component with deprecated types */}
        {/* (data.strengthConflicts || data.strengthBasement) && (
          <DiagnosisSupplement />
        ) */}
      </div>
    </motion.section>
  );
}

// 三段式诊断内容
function DiagnosisContent({ scenarioConclusion, scenario }: { scenarioConclusion: ReturnType<typeof getScenarioConclusion>; scenario?: ScenarioId }) {
  if (!scenarioConclusion) return null;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. 核心判词（The Verdict）- 反白效果，占据约1/3面积，字号最大（H1），加粗 */}
      <VerdictCard verdict={scenarioConclusion.verdict} scenario={scenario} />

      {/* 分隔线 */}
      <div className="border-t border-border-light my-6 sm:my-8">
        <div className="text-center text-text-muted text-xs mt-2">——</div>
      </div>

      {/* 2. 证据记录（Evidence）- 技术性列表，低权重 */}
      {scenarioConclusion.evidence && scenarioConclusion.evidence.length > 0 && (
        <EvidenceList evidence={scenarioConclusion.evidence} />
      )}

      {/* 分隔线 */}
      {scenarioConclusion.evidence && scenarioConclusion.evidence.length > 0 && (
        <div className="border-t border-border-light my-6 sm:my-8">
          <div className="text-center text-text-muted text-xs mt-2">——</div>
        </div>
      )}

      {/* 3. 纠偏指令 - 治疗方向，权重仅次于黑盒子 */}
      <PivotCard pivot={scenarioConclusion.pivot} execution={scenarioConclusion.execution} />
    </div>
  );
}

// 核心判词卡片
function VerdictCard({ verdict, scenario }: { verdict: string; scenario?: ScenarioId }) {
  return (
    <div className="bg-text-primary text-white rounded-xl p-6 sm:p-8 md:p-10 lg:p-12 min-h-[180px] sm:min-h-[200px] md:min-h-[220px] lg:min-h-[240px] shadow-lg relative">
      {/* 身份标签：系统判断 - 金色 */}
      <span className="absolute top-3 left-3 sm:top-4 sm:left-4 text-[10px] sm:text-xs text-accent uppercase tracking-wider font-medium">
        系统判断
      </span>
      
      {/* 诊断结论标签 - 金色 */}
      <div className="mb-5 sm:mb-7 pt-6 sm:pt-0">
        <span className="inline-block px-3 py-1.5 bg-accent/20 border border-accent/40 rounded-md text-xs sm:text-sm font-medium text-accent tracking-wide">
          [ 诊断结论：{getDiagnosisLabel(scenario)} ]
        </span>
      </div>
      
      {/* 核心断言：一句话最终裁决 - 最突出，白色 */}
      <div className="flex items-center">
        <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white whitespace-pre-line">
          {verdict}
        </h3>
      </div>
    </div>
  );
}

// 证据记录列表
function EvidenceList({ evidence }: { evidence: Array<{ label: string; content: string }> }) {
  return (
    <div className="mb-6 sm:mb-8">
      <h4 className="text-xs sm:text-sm text-text-muted uppercase tracking-wider font-medium mb-4">
        证据记录
      </h4>
      <ul className="space-y-2.5 text-sm sm:text-base text-text-secondary">
        {evidence.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-text-muted font-medium flex-shrink-0 min-w-[3rem]">
              {item.label}：
            </span>
            <span className="text-text-secondary">{item.content}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 纠偏指令卡片
function PivotCard({ pivot, execution }: { pivot: string; execution?: string }) {
  return (
    <div className="bg-brand-subtle/40 border-l-[5px] border-brand rounded-xl p-6 sm:p-7 md:p-9">
      <div className="flex items-start gap-4 sm:gap-5">
        {/* 实心箭头图标 */}
        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand/20 flex items-center justify-center">
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7 text-brand"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" />
          </svg>
        </div>
        <div className="flex-1 space-y-3">
          {/* 纠偏指令文案 */}
          <div>
            <p className="text-text-primary font-semibold text-lg sm:text-xl md:text-2xl leading-relaxed whitespace-pre-line">
              {pivot}
            </p>
            {execution && (
              <p className="text-sm sm:text-base text-text-secondary mt-3 font-medium">
                执行方式：{execution}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
