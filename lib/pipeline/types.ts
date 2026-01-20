/**
 * 流水线类型定义
 */

// ========== 阶段 1：文本预处理 ==========

export interface RawReport {
  fullText: string;
  metadata?: {
    reportDate?: string;
    language?: string;
  };
}

export type SectionType =
  | 'executive_summary'
  | 'domain_analysis'
  | 'theme_details'
  | 'action_planning'
  | 'blind_spots'
  | 'unknown';

export interface Chunk {
  chunk_id: string;
  section: SectionType;
  content: string;
  metadata: {
    position: number;
    word_count: number;
    heading?: string;
  };
}

export interface Stage1Output {
  chunks: Chunk[];
  total_chunks: number;
}

// ========== 阶段 2：Chunk 抽取 ==========

export interface ExtractedTheme {
  theme_id: string;
  name: string;
  domain: string;
  confidence: number; // 0-1
}

export interface ExtractedClaim {
  claim_id: string;
  theme_ref: string;
  statement: string;
  evidence_quote?: string;
}

export interface ExtractedRecommendation {
  rec_id: string;
  theme_ref: string;
  action: string;
  category: 'start' | 'stop' | 'continue';
}

export interface Stage2Output {
  chunk_id: string;
  themes: ExtractedTheme[];
  claims: ExtractedClaim[];
  recommendations: ExtractedRecommendation[];
  raw_quotes: string[];
}

// ========== 阶段 3：全局诊断归并 ==========

export interface TopStrength {
  name: string;
  core_value: string;
  overuse_pattern: string;
  blind_spot: string;
}

export interface Stage3Output {
  profile_summary: string;
  top_strengths: TopStrength[];
  current_pattern: string;
  leverage_plan: string[];
  anti_pattern: string[];
  micro_habits_7d: string[];
  proof_points: string[];
}

// ========== 阶段 4：最终渲染 ==========

export interface RenderTone {
  style: 'professional' | 'conversational' | 'direct' | 'encouraging';
  detail_level: 'concise' | 'balanced' | 'detailed';
  language: 'zh-CN' | 'en-US';
}

export interface PageSection {
  type: 'highlight' | 'diagnosis' | 'blindspot' | 'action_increase' | 'action_decrease' | 'micro_habits' | 'footer';
  content: unknown; // 具体结构根据类型定义
}

export interface Stage4Output {
  meta: {
    generated_at: string;
    tone: RenderTone;
    word_count: number;
  };
  sections: PageSection[];
}

// ========== 通用配置 ==========

export interface AIProviderConfig {
  provider: 'anthropic' | 'openai' | 'zhipu' | 'mock';
  model: string;
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
}

export interface PipelineConfig {
  stage1: {
    max_chunk_size: number;
    overlap_size: number;
  };
  stage2: {
    provider: AIProviderConfig;
    temperature?: number;
  };
  stage3: {
    provider: AIProviderConfig;
    temperature?: number;
  };
  stage4: {
    provider: AIProviderConfig;
    temperature?: number;
    tone: RenderTone;
  };
  retry_config: {
    max_retries: number;
    base_delay_ms: number;
  };
}
