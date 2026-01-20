/**
 * 阶段 1：文本预处理与切片
 */

import type { RawReport, Chunk, SectionType, Stage1Output } from './types';

// 章节识别规则
const SECTION_PATTERNS: Record<SectionType, RegExp[]> = {
  executive_summary: [
    /executive\s+summary/i,
    /概述|总结/i,
    /your\s+dominant\s+themes/i,
  ],
  domain_analysis: [
    /leading\s+with|leading\s+from/i,
    /四大领域|domain/i,
  ],
  theme_details: [
    /your\s+top\s+5\s+themes/i,
    /主题.*?分析|talent\s+theme/i,
  ],
  action_planning: [
    /action\s+planning/i,
    /行动.*?建议|recommendation/i,
  ],
  blind_spots: [
    /blind\s+spot/i,
    /盲点|弱点/i,
  ],
  unknown: [/.*/],
};

function detectSection(text: string): SectionType {
  const lines = text.split('\n').slice(0, 5); // 只检查前5行
  
  for (const [section, patterns] of Object.entries(SECTION_PATTERNS)) {
    if (section === 'unknown') continue;
    
    for (const line of lines) {
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          return section as SectionType;
        }
      }
    }
  }
  
  return 'unknown';
}

function extractHeading(text: string): string {
  const lines = text.split('\n');
  for (const line of lines.slice(0, 3)) {
    const trimmed = line.trim();
    if (trimmed.length > 0 && trimmed.length < 100) {
      return trimmed.replace(/^[#*=\s]+/, '').trim();
    }
  }
  return '';
}

export function sliceIntoChunks(
  fullText: string,
  maxChunkSize: number = 800,
  overlapSize: number = 100
): Chunk[] {
  const chunks: Chunk[] = [];
  const paragraphs = fullText.split(/\n\s*\n/);
  
  let currentChunk = '';
  let chunkIndex = 0;
  let position = 0;
  
  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;
    
    // 如果单个段落超过最大长度，强制分割
    if (trimmedPara.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(createChunk(currentChunk, chunkIndex, position));
        chunkIndex++;
        position += currentChunk.length;
        currentChunk = '';
      }
      
      let start = 0;
      while (start < trimmedPara.length) {
        const end = Math.min(start + maxChunkSize, trimmedPara.length);
        const segment = trimmedPara.slice(start, end);
        chunks.push(createChunk(segment, chunkIndex, position));
        chunkIndex++;
        position += segment.length;
        start = end;
      }
      continue;
    }
    
    // 检查添加此段落是否会超过限制
    if (currentChunk.length + trimmedPara.length > maxChunkSize && currentChunk) {
      chunks.push(createChunk(currentChunk, chunkIndex, position));
      chunkIndex++;
      position += currentChunk.length;
      
      // 保留 overlap
      const overlap = extractOverlap(currentChunk, overlapSize);
      currentChunk = overlap ? `${overlap}\n\n${trimmedPara}` : trimmedPara;
    } else {
      if (currentChunk) {
        currentChunk += `\n\n${trimmedPara}`;
      } else {
        currentChunk = trimmedPara;
      }
    }
  }
  
  // 添加最后一个 chunk
  if (currentChunk) {
    chunks.push(createChunk(currentChunk, chunkIndex, position));
  }
  
  return chunks;
}

function createChunk(content: string, index: number, position: number): Chunk {
  const section = detectSection(content);
  const heading = extractHeading(content);
  const wordCount = content.split(/\s+/).length;
  
  return {
    chunk_id: `chunk_${String(index + 1).padStart(3, '0')}`,
    section,
    content,
    metadata: {
      position,
      word_count: wordCount,
      heading: heading || undefined,
    },
  };
}

function extractOverlap(text: string, size: number): string | null {
  const paragraphs = text.split(/\n\s*\n/).reverse();
  let overlap = '';
  
  for (const para of paragraphs) {
    if (overlap.length + para.length > size) {
      break;
    }
    overlap = para + (overlap ? '\n\n' + overlap : '');
  }
  
  return overlap || null;
}

export async function stage1_preprocess(input: RawReport): Promise<Stage1Output> {
  const chunks = sliceIntoChunks(
    input.fullText,
    800,  // max_chunk_size
    100   // overlap_size
  );
  
  return {
    chunks,
    total_chunks: chunks.length,
  };
}
