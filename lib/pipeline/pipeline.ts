/**
 * 流水线编排器
 * 协调四个阶段的执行
 */

import type { RawReport, Stage1Output, Stage2Output, Stage3Output, Stage4Output, PipelineConfig } from './types';
import { stage1_preprocess } from './stage1-preprocess';
import { stage2_extractAllChunks } from './stage2-extract';
import { stage3_mergeDiagnosis } from './stage3-merge';
import { stage4_render } from './stage4-render';

export interface PipelineProgress {
  stage: number;
  stage_name: string;
  current: number;
  total: number;
  message: string;
}

export interface PipelineResult {
  stage1: Stage1Output;
  stage2: Stage2Output[];
  stage3: Stage3Output;
  stage4: Stage4Output;
  metadata: {
    started_at: string;
    completed_at: string;
    total_duration_ms: number;
    stage_durations: Record<string, number>;
  };
}

export class PipelineError extends Error {
  public stage: number;
  public stageName: string;
  public cause?: Error;

  constructor(stage: number, stageName: string, message: string, cause?: Error) {
    super(`[Stage ${stage}] ${stageName}: ${message}`);
    this.name = 'PipelineError';
    this.stage = stage;
    this.stageName = stageName;
    this.cause = cause;
  }
}

async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export async function executePipeline(
  input: RawReport,
  config: PipelineConfig,
  onProgress?: (_progress: PipelineProgress) => void
): Promise<PipelineResult> {
  const startedAt = Date.now();
  const stageDurations: Record<string, number> = {};
  
  try {
    onProgress?.({
      stage: 1,
      stage_name: '文本预处理',
      current: 0,
      total: 1,
      message: '正在切片文本...',
    });
    
    const stage1Start = Date.now();
    const stage1Result = await stage1_preprocess(input);
    stageDurations.stage1 = Date.now() - stage1Start;
    
    onProgress?.({
      stage: 1,
      stage_name: '文本预处理',
      current: 1,
      total: 1,
      message: `完成，生成 ${stage1Result.total_chunks} 个片段`,
    });
    
    onProgress?.({
      stage: 2,
      stage_name: '内容抽取',
      current: 0,
      total: stage1Result.chunks.length,
      message: '正在从片段中提取信息...',
    });
    
    const stage2Start = Date.now();
    const stage2Result = await executeWithRetry(
      () => stage2_extractAllChunks(
        stage1Result.chunks,
        config.stage2.provider,
        (current, total) => {
          onProgress?.({
            stage: 2,
            stage_name: '内容抽取',
            current,
            total,
            message: `处理片段 ${current}/${total}`,
          });
        }
      ),
      config.retry_config.max_retries,
      config.retry_config.base_delay_ms
    );
    stageDurations.stage2 = Date.now() - stage2Start;
    
    onProgress?.({
      stage: 3,
      stage_name: '诊断归并',
      current: 0,
      total: 1,
      message: '正在合并诊断结果...',
    });
    
    const stage3Start = Date.now();
    const stage3Result = await executeWithRetry(
      () => stage3_mergeDiagnosis(stage2Result, config.stage3.provider),
      config.retry_config.max_retries,
      config.retry_config.base_delay_ms
    );
    stageDurations.stage3 = Date.now() - stage3Start;
    
    onProgress?.({
      stage: 3,
      stage_name: '诊断归并',
      current: 1,
      total: 1,
      message: '诊断完成',
    });
    
    onProgress?.({
      stage: 4,
      stage_name: '内容渲染',
      current: 0,
      total: 1,
      message: '正在生成最终内容...',
    });
    
    const stage4Start = Date.now();
    const stage4Result = await executeWithRetry(
      () => stage4_render(
        stage3Result,
        config.stage4.provider,
        config.stage4.tone,
        config.stage4.temperature
      ),
      config.retry_config.max_retries,
      config.retry_config.base_delay_ms
    );
    stageDurations.stage4 = Date.now() - stage4Start;
    
    onProgress?.({
      stage: 4,
      stage_name: '内容渲染',
      current: 1,
      total: 1,
      message: '渲染完成',
    });
    
    const completedAt = Date.now();
    
    return {
      stage1: stage1Result,
      stage2: stage2Result,
      stage3: stage3Result,
      stage4: stage4Result,
      metadata: {
        started_at: new Date(startedAt).toISOString(),
        completed_at: new Date(completedAt).toISOString(),
        total_duration_ms: completedAt - startedAt,
        stage_durations: stageDurations,
      },
    };
    
  } catch (error) {
    if (error instanceof PipelineError) {
      throw error;
    }
    
    const stage = stageDurations.stage4 ? 4 : stageDurations.stage3 ? 3 : stageDurations.stage2 ? 2 : 1;
    const stageNames = ['', '文本预处理', '内容抽取', '诊断归并', '内容渲染'];
    
    throw new PipelineError(
      stage,
      stageNames[stage],
      (error as Error).message,
      error as Error
    );
  }
}
